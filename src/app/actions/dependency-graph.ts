'use server';

import 'server-only';
import { db } from '@/lib/db';
import { ApiModel, ApiEndpoint } from '@/lib/api-types';
import {
    buildDependencyGraph,
    analyzeImpact,
    detectCircularDependencies,
    toReactFlowFormat,
    DependencyGraph,
    ImpactAnalysis
} from '@/lib/dependency-graph';

/**
 * 프로젝트의 의존성 그래프 조회
 */
export async function getDependencyGraph(projectId: string): Promise<{
    graph: DependencyGraph;
    reactFlow: ReturnType<typeof toReactFlowFormat>;
    circularDeps: string[][];
}> {
    try {
        // 모델 조회
        const modelsResult = await db.query(
            `SELECT id, name, fields FROM api_models WHERE project_id = $1`,
            [projectId]
        );
        const models: ApiModel[] = modelsResult.rows.map(row => ({
            id: row.id as string,
            name: row.name as string,
            fields: (row.fields as ApiModel['fields']) || []
        }));

        // 엔드포인트 조회
        const endpointsResult = await db.query(
            `SELECT id, path, method, class_name as "className", method_name as "methodName",
                    summary, request_body_model as "requestBody", response_type as "responseType"
             FROM endpoints WHERE project_id = $1`,
            [projectId]
        );
        const endpoints: ApiEndpoint[] = endpointsResult.rows.map(row => ({
            id: row.id as string,
            path: row.path as string,
            method: row.method as string,
            className: row.className as string,
            methodName: row.methodName as string,
            summary: (row.summary as string) || '',
            requestBody: row.requestBody as string | undefined,
            responseType: row.responseType as string | undefined
        }));

        // 의존성 그래프 생성
        const graph = buildDependencyGraph(models, endpoints);

        // React Flow 형식 변환
        const reactFlow = toReactFlowFormat(graph);

        // 순환 참조 감지
        const circularDeps = detectCircularDependencies(models);

        return { graph, reactFlow, circularDeps };
    } catch (error) {
        console.error('Failed to get dependency graph:', error);
        throw new Error('의존성 그래프 조회 실패');
    }
}

/**
 * 특정 모델의 변경 영향 분석
 */
export async function getModelImpact(
    projectId: string,
    modelName: string
): Promise<ImpactAnalysis> {
    try {
        // 모델 조회
        const modelsResult = await db.query(
            `SELECT id, name, fields FROM api_models WHERE project_id = $1`,
            [projectId]
        );
        const models: ApiModel[] = modelsResult.rows.map(row => ({
            id: row.id as string,
            name: row.name as string,
            fields: (row.fields as ApiModel['fields']) || []
        }));

        // 엔드포인트 조회
        const endpointsResult = await db.query(
            `SELECT id, path, method, request_body_model as "requestBody", response_type as "responseType"
             FROM endpoints WHERE project_id = $1`,
            [projectId]
        );
        const endpoints: ApiEndpoint[] = endpointsResult.rows.map(row => ({
            id: row.id as string,
            path: row.path as string,
            method: row.method as string,
            className: '',
            methodName: '',
            summary: '',
            requestBody: row.requestBody as string | undefined,
            responseType: row.responseType as string | undefined
        }));

        // 영향 분석 실행
        return analyzeImpact(modelName, models, endpoints);
    } catch (error) {
        console.error('Failed to analyze model impact:', error);
        throw new Error('모델 영향 분석 실패');
    }
}

/**
 * 의존성 통계 조회 (대시보드용)
 */
export async function getDependencyStats(projectId: string): Promise<{
    totalModels: number;
    totalEndpoints: number;
    totalRelations: number;
    circularDeps: number;
    isolatedModels: number;
    mostReferencedModels: { name: string; referenceCount: number }[];
}> {
    try {
        // 모델 조회
        const modelsResult = await db.query(
            `SELECT id, name, fields FROM api_models WHERE project_id = $1`,
            [projectId]
        );
        const models: ApiModel[] = modelsResult.rows.map(row => ({
            id: row.id as string,
            name: row.name as string,
            fields: (row.fields as ApiModel['fields']) || []
        }));

        // 엔드포인트 조회
        const endpointsResult = await db.query(
            `SELECT id, path, method, request_body_model as "requestBody", response_type as "responseType"
             FROM endpoints WHERE project_id = $1`,
            [projectId]
        );
        const endpoints: ApiEndpoint[] = endpointsResult.rows.map(row => ({
            id: row.id as string,
            path: row.path as string,
            method: row.method as string,
            className: '',
            methodName: '',
            summary: '',
            requestBody: row.requestBody as string | undefined,
            responseType: row.responseType as string | undefined
        }));

        // 그래프 생성
        const graph = buildDependencyGraph(models, endpoints);
        const circularDeps = detectCircularDependencies(models);

        // 모델별 참조 횟수 계산
        const referenceCount = new Map<string, number>();
        for (const edge of graph.edges) {
            if (edge.data.relationType === 'reference' ||
                edge.data.relationType === 'request' ||
                edge.data.relationType === 'response') {
                const targetModel = edge.target.replace('model-', '');
                referenceCount.set(targetModel, (referenceCount.get(targetModel) || 0) + 1);
            }
        }

        // 가장 많이 참조되는 모델 상위 5개
        const mostReferencedModels = Array.from(referenceCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, referenceCount: count }));

        return {
            totalModels: graph.stats.totalModels,
            totalEndpoints: graph.stats.totalEndpoints,
            totalRelations: graph.stats.totalEdges,
            circularDeps: circularDeps.length,
            isolatedModels: graph.stats.isolatedNodes,
            mostReferencedModels
        };
    } catch (error) {
        console.error('Failed to get dependency stats:', error);
        return {
            totalModels: 0,
            totalEndpoints: 0,
            totalRelations: 0,
            circularDeps: 0,
            isolatedModels: 0,
            mostReferencedModels: []
        };
    }
}
