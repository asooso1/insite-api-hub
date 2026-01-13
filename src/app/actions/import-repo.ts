"use server";

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { SpringParser } from "@/lib/parser/spring-parser";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ApiEndpoint, ApiModel, ApiField } from "@/lib/api-types";

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
        // 1. Git Clone with authentication if token provided
        let cloneUrl = gitUrl;
        if (gitToken) {
            // Insert token into URL (works for GitHub, GitLab, etc.)
            // https://github.com/user/repo.git -> https://token@github.com/user/repo.git
            cloneUrl = gitUrl.replace(/^(https?:\/\/)/, `$1${gitToken}@`);
        }

        console.log(`Cloning ${gitUrl} (${branch}) to ${tempDir}...`);

        // Add timeout to prevent hanging on large repositories (5 minutes)
        try {
            execSync(`git clone --depth 1 --branch ${branch} ${cloneUrl} ${tempDir}`, {
                stdio: 'inherit',
                timeout: 300000 // 5 minutes in milliseconds
            });
        } catch (error) {
            throw new Error(`Git clone failed or timed out after 5 minutes. The repository might be too large. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        const endpoints: ApiEndpoint[] = [];
        const models: Record<string, ApiModel> = {};

        // 2. 파일 스캔 함수
        const scanDir = (dir: string) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    scanDir(fullPath);
                } else if (file.endsWith(".java")) {
                    const content = fs.readFileSync(fullPath, "utf-8");

                    // API 추출
                    const parsedEndpoints = SpringParser.parseController(content);
                    endpoints.push(...parsedEndpoints);

                    // DTO/VO 추출
                    if (content.includes("class ") && (file.endsWith("DTO.java") || file.endsWith("VO.java") || content.includes("@Data") || content.includes("@Getter"))) {
                        const classNameMatch = content.match(/class\s+(\w+)/);
                        if (classNameMatch) {
                            const className = classNameMatch[1];
                            const fields = SpringParser.parseDtoFields(content);
                            if (fields.length > 0) {
                                models[className] = {
                                    name: className,
                                    fields: fields
                                };
                            }
                        }
                    }
                }
            }
        };

        scanDir(tempDir);

        // 3. 계층 구조 재귀적 매핑 (Recursive Mapping with Memoization)
        const resolvedCache = new Map<string, ApiField[]>();
        const processingStack = new Set<string>(); // 순환 참조 감지

        const resolveFields = (fields: ApiField[], modelName: string, currentDepth: number = 0): ApiField[] => {
            if (currentDepth > 5) return fields; // 깊이 제한 (10 -> 5로 축소)

            return fields.map(field => {
                const baseType = SpringParser.extractBaseType(field.type);

                // 복잡한 타입이 아니거나 모델이 없으면 그대로 반환
                if (!field.isComplex || !models[baseType]) {
                    return field;
                }

                // 순환 참조 감지
                if (processingStack.has(baseType)) {
                    console.warn(`Circular reference detected: ${modelName} -> ${baseType}`);
                    return field;
                }

                // 캐시 확인
                if (resolvedCache.has(baseType)) {
                    return {
                        ...field,
                        refFields: resolvedCache.get(baseType)
                    };
                }

                // 처리 중 표시
                processingStack.add(baseType);

                // 재귀 처리
                const resolvedFields = resolveFields(models[baseType].fields, baseType, currentDepth + 1);

                // 캐시에 저장
                resolvedCache.set(baseType, resolvedFields);

                // 처리 완료 표시
                processingStack.delete(baseType);

                return {
                    ...field,
                    refFields: resolvedFields
                };
            });
        };

        // 각 모델에 대해 한 번만 처리
        console.log(`Processing ${Object.keys(models).length} models...`);
        Object.keys(models).forEach(name => {
            if (!resolvedCache.has(name)) {
                models[name].fields = resolveFields(models[name].fields, name);
                resolvedCache.set(name, models[name].fields);
            }
        });
        console.log(`Model processing completed.`);

        const finalEndpoints = endpoints.map(e => ({
            ...e,
            id: Math.random().toString(36).substring(7),
            syncedAt: new Date().toISOString()
        }));

        // 4. Save to PostgreSQL
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // 기존 데이터 초기화 (특정 프로젝트의 데이터만 삭제)
            await client.query('DELETE FROM endpoints WHERE project_id = $1', [projectId]);
            await client.query('DELETE FROM api_models WHERE project_id = $1', [projectId]);

            // 모델 저장
            for (const model of Object.values(models)) {
                await client.query(
                    'INSERT INTO api_models (project_id, name, fields) VALUES ($1, $2, $3)',
                    [projectId, model.name, JSON.stringify(model.fields)]
                );
            }

            // 엔드포인트 저장
            for (const ep of finalEndpoints) {
                await client.query(
                    `INSERT INTO endpoints (project_id, path, method, class_name, method_name, summary, request_body_model, response_type, version, synced_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [projectId, ep.path, ep.method, ep.className, ep.methodName, ep.summary, ep.requestBody, ep.responseType, ep.version, ep.syncedAt]
                );
            }

            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

        revalidatePath("/");
        console.log(`Parsed and saved ${endpoints.length} endpoints and ${Object.keys(models).length} models to DB.`);

        return {
            success: true,
            message: "Import and DB save completed successfully.",
            data: {
                endpoints: finalEndpoints,
                models: Object.values(models)
            }
        };

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Import failed:", error);
        return {
            success: false,
            message: `Failed to import: ${message}`
        };
    } finally {
        // 4. Cleanup
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
}
