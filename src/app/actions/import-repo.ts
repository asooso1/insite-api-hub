"use server";

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { SpringParser } from "@/lib/parser/spring-parser";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ApiEndpoint, ApiModel, ApiField } from "@/lib/api-types";
import { sendDoorayMessage } from "./notification";

interface ImportResult {
    success: boolean;
    message: string;
    data?: {
        endpoints: ApiEndpoint[];
        models: ApiModel[];
    };
}

export async function importRepository(projectId: string, gitUrl: string, branch: string = "main", gitToken?: string): Promise<ImportResult> {
    const tempId = Math.random().toString(36).substring(7);
    const tempDir = path.join("/tmp", `apihub-${tempId}`);

    try {
        // ... (Git Clone logic)
        let cloneUrl = gitUrl;
        if (gitToken) {
            cloneUrl = gitUrl.replace(/^(https?:\/\/)/, `$1${gitToken}@`);
        }

        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }

        try {
            execSync(`git clone --depth 1 --branch ${branch} ${cloneUrl} ${tempDir}`, {
                stdio: 'inherit',
                timeout: 300000
            });
        } catch (error) {
            throw new Error(`Git clone failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        const endpoints: ApiEndpoint[] = [];
        const models: Record<string, ApiModel> = {};

        const scanDir = (dir: string) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    scanDir(fullPath);
                } else if (file.endsWith(".java")) {
                    const content = fs.readFileSync(fullPath, "utf-8");
                    const parsedEndpoints = SpringParser.parseController(content);
                    endpoints.push(...parsedEndpoints);

                    if (content.includes("class ") && (file.endsWith("DTO.java") || file.endsWith("VO.java") || content.includes("@Data") || content.includes("@Getter"))) {
                        const classNameMatch = content.match(/class\s+(\w+)/);
                        if (classNameMatch) {
                            const className = classNameMatch[1];
                            const fields = SpringParser.parseDtoFields(content);
                            if (fields.length > 0) {
                                models[className] = { name: className, fields: fields };
                            }
                        }
                    }
                }
            }
        };

        scanDir(tempDir);

        // ... (Model Resolution logic)
        const resolvedCache = new Map<string, ApiField[]>();
        const processingStack = new Set<string>();

        const resolveFields = (fields: ApiField[], modelName: string, currentDepth: number = 0): ApiField[] => {
            if (currentDepth > 5) return fields;
            return fields.map(field => {
                const baseType = SpringParser.extractBaseType(field.type);
                if (!field.isComplex || !models[baseType]) return field;
                if (processingStack.has(baseType)) return field;
                if (resolvedCache.has(baseType)) return { ...field, refFields: resolvedCache.get(baseType) };

                processingStack.add(baseType);
                const resolvedFields = resolveFields(models[baseType].fields, baseType, currentDepth + 1);
                resolvedCache.set(baseType, resolvedFields);
                processingStack.delete(baseType);
                return { ...field, refFields: resolvedFields };
            });
        };

        Object.keys(models).forEach(name => {
            if (!resolvedCache.has(name)) {
                models[name].fields = resolveFields(models[name].fields, name);
                resolvedCache.set(name, models[name].fields);
            }
        });

        const finalEndpoints = endpoints.map(e => ({
            ...e,
            id: Math.random().toString(36).substring(7),
            syncedAt: new Date().toISOString()
        }));

        // 4. Save to PostgreSQL
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // 4a. Save existing data as a version snapshot before deleting
            const currentEndpoints = await client.query('SELECT * FROM endpoints WHERE project_id = $1', [projectId]);
            const currentModels = await client.query('SELECT * FROM api_models WHERE project_id = $1', [projectId]);

            if (currentEndpoints.rows.length > 0) {
                const versionTag = `v_${new Date().toISOString().replace(/[:.]/g, '-')}`;
                await client.query(
                    `INSERT INTO api_versions (project_id, version_tag, description, endpoints_snapshot, models_snapshot)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        projectId,
                        versionTag,
                        `Snapshot before import at ${new Date().toLocaleString()}`,
                        JSON.stringify(currentEndpoints.rows),
                        JSON.stringify(currentModels.rows)
                    ]
                );
                console.log(`[Snapshot] Saved ${currentEndpoints.rows.length} endpoints as version ${versionTag}`);
            }

            // Fetch existing endpoints to compare (for new API notification)
            const existingRes = await client.query('SELECT path, method FROM endpoints WHERE project_id = $1', [projectId]);
            const existingApis = new Set(existingRes.rows.map(r => `${r.method} ${r.path}`));

            // 기존 데이터 초기화 (특정 프로젝트의 데이터만 삭제)
            await client.query('DELETE FROM endpoints WHERE project_id = $1', [projectId]);
            await client.query('DELETE FROM api_models WHERE project_id = $1', [projectId]);

            for (const model of Object.values(models)) {
                await client.query(
                    'INSERT INTO api_models (project_id, name, fields) VALUES ($1, $2, $3)',
                    [projectId, model.name, JSON.stringify(model.fields)]
                );
            }

            const newApis: string[] = [];
            for (const ep of finalEndpoints) {
                await client.query(
                    `INSERT INTO endpoints (project_id, path, method, class_name, method_name, summary, request_body_model, response_type, version, synced_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [projectId, ep.path, ep.method, ep.className, ep.methodName, ep.summary, ep.requestBody, ep.responseType, ep.version, ep.syncedAt]
                );

                if (!existingApis.has(`${ep.method} ${ep.path}`)) {
                    newApis.push(`• [${ep.method}] ${ep.path} (${ep.summary || ep.methodName})`);
                }
            }

            await client.query('COMMIT');

            if (newApis.length > 0) {
                await sendDoorayMessage(projectId,
                    `📢 **새로운 API 엔드포인트 탐지**\n\n` +
                    `최근 저장소 업데이트를 통해 ${newApis.length}개의 새로운 API가 추가되었습니다.\n\n` +
                    `${newApis.slice(0, 10).join('\n')}` +
                    (newApis.length > 10 ? `\n...외 ${newApis.length - 10}개 더 있음` : "") +
                    `\n\n[API HUB에서 확인하기](http://localhost:3000)`
                );
            }
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

        revalidatePath("/");
        return {
            success: true,
            message: "Import and DB save completed successfully.",
            data: { endpoints: finalEndpoints, models: Object.values(models) }
        };

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Import failed:", error);
        return { success: false, message: `Failed to import: ${message}` };
    } finally {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
}
