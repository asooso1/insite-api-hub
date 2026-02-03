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

// 프로젝트 데이터 캐시 (짧은 TTL로 중복 쿼리 방지)
interface CachedData {
    models: ApiModel[];
    endpoints: ApiEndpoint[];
    timestamp: number;
}
const projectDataCache = new Map<string, CachedData>();
const CACHE_TTL = 5000; // 5초 캐시

// 순환 참조 캐시 (모델 수 기준으로 무효화)
interface CircularDepsCache {
    modelCount: number;
    result: string[][];
    timestamp: number;
}
const circularDepsCache = new Map<string, CircularDepsCache>();
const CIRCULAR_CACHE_TTL = 30000; // 30초 캐시

/**
 * 프로젝트 데이터 조회 (캐싱 적용)
 */
async function getProjectData(projectId: string): Promise<{ models: ApiModel[]; endpoints: ApiEndpoint[] }> {
    const cached = projectDataCache.get(projectId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return { models: cached.models, endpoints: cached.endpoints };
    }

    // 병렬 쿼리로 모델과 엔드포인트 동시 조회
    const [modelsResult, endpointsResult] = await Promise.all([
        db.query(
            `SELECT id, name, fields FROM api_models WHERE project_id = $1`,
            [projectId]
        ),
        db.query(
            `SELECT id, path, method, class_name as "className", method_name as "methodName",
                    summary, request_body_model as "requestBody", response_type as "responseType"
             FROM endpoints WHERE project_id = $1`,
            [projectId]
        )
    ]);

    const models: ApiModel[] = modelsResult.rows.map(row => ({
        id: row.id as string,
        name: row.name as string,
        fields: (row.fields as ApiModel['fields']) || []
    }));

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

    // 캐시 저장
    projectDataCache.set(projectId, { models, endpoints, timestamp: Date.now() });

    return { models, endpoints };
}

/**
 * 프로젝트의 의존성 그래프 + 통계 통합 조회 (단일 DB 호출)
 */
export async function getDependencyGraphWithStats(projectId: string): Promise<{
    graph: DependencyGraph;
    reactFlow: ReturnType<typeof toReactFlowFormat>;
    circularDeps: string[][];
    stats: {
        totalModels: number;
        totalEndpoints: number;
        totalRelations: number;
        circularDeps: number;
        isolatedModels: number;
        mostReferencedModels: { name: string; referenceCount: number }[];
    };
}> {
    try {
        const { models, endpoints } = await getProjectData(projectId);

        // 의존성 그래프 생성
        const graph = buildDependencyGraph(models, endpoints);

        // React Flow 형식 변환
        const reactFlow = toReactFlowFormat(graph);

        // 순환 참조 감지 (캐싱 적용)
        let circularDeps: string[][];
        const cachedCircular = circularDepsCache.get(projectId);
        const now = Date.now();

        if (cachedCircular &&
            cachedCircular.modelCount === models.length &&
            now - cachedCircular.timestamp < CIRCULAR_CACHE_TTL) {
            // 캐시 히트
            circularDeps = cachedCircular.result;
        } else {
            // 캐시 미스 - 새로 계산 (그래프에서 이미 계산된 modelDeps 재사용)
            circularDeps = detectCircularDependencies(models, graph._modelDeps);
            circularDepsCache.set(projectId, {
                modelCount: models.length,
                result: circularDeps,
                timestamp: now
            });
        }

        // 모델별 참조 횟수 계산 (통계용)
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

        const stats = {
            totalModels: graph.stats.totalModels,
            totalEndpoints: graph.stats.totalEndpoints,
            totalRelations: graph.stats.totalEdges,
            circularDeps: circularDeps.length,
            isolatedModels: graph.stats.isolatedNodes,
            mostReferencedModels
        };

        return { graph, reactFlow, circularDeps, stats };
    } catch (error) {
        console.error('Failed to get dependency graph:', error);
        throw new Error('의존성 그래프 조회 실패');
    }
}

/**
 * 프로젝트의 의존성 그래프 조회 (기존 호환성 유지)
 */
export async function getDependencyGraph(projectId: string): Promise<{
    graph: DependencyGraph;
    reactFlow: ReturnType<typeof toReactFlowFormat>;
    circularDeps: string[][];
}> {
    const result = await getDependencyGraphWithStats(projectId);
    return {
        graph: result.graph,
        reactFlow: result.reactFlow,
        circularDeps: result.circularDeps
    };
}

/**
 * 특정 모델의 변경 영향 분석 (캐싱된 데이터 사용)
 */
export async function getModelImpact(
    projectId: string,
    modelName: string
): Promise<ImpactAnalysis> {
    try {
        // 캐싱된 데이터 사용 (중복 DB 쿼리 방지)
        const { models, endpoints } = await getProjectData(projectId);

        // 영향 분석 실행
        return analyzeImpact(modelName, models, endpoints);
    } catch (error) {
        console.error('Failed to analyze model impact:', error);
        throw new Error('모델 영향 분석 실패');
    }
}

/**
 * 의존성 통계 조회 (대시보드용)
 * @deprecated getDependencyGraphWithStats 사용 권장 (중복 쿼리 방지)
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
        // 통합 함수 사용하여 중복 쿼리 방지
        const result = await getDependencyGraphWithStats(projectId);
        return result.stats;
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
