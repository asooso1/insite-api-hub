/**
 * API 의존성 그래프 분석 모듈
 * 모델 간, 엔드포인트-모델 간 의존 관계를 분석하여 그래프 데이터 생성
 */

import { ApiModel, ApiField, ApiEndpoint } from './api-types';

// 그래프 노드 타입
export type NodeType = 'model' | 'endpoint';

// 그래프 노드 정의
export interface DependencyNode {
    id: string;
    type: NodeType;
    label: string;
    data: {
        name: string;
        fieldCount?: number;
        method?: string;
        path?: string;
        // Breaking Change 영향 분석용
        isAffected?: boolean;
        affectedBy?: string[];
    };
}

// 그래프 엣지 정의
export interface DependencyEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    data: {
        fieldName?: string;
        relationType: 'request' | 'response' | 'reference' | 'nested';
        isRequired?: boolean;
    };
}

// 전체 의존성 그래프
export interface DependencyGraph {
    nodes: DependencyNode[];
    edges: DependencyEdge[];
    stats: {
        totalModels: number;
        totalEndpoints: number;
        totalEdges: number;
        isolatedNodes: number; // 연결 없는 노드
    };
    // 내부 캐시 (순환 참조 탐지 등에서 재사용)
    _modelDeps?: Map<string, string[]>;
}

// 영향 분석 결과
export interface ImpactAnalysis {
    sourceModel: string;
    affectedModels: string[];
    affectedEndpoints: string[];
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
    details: {
        directDependents: string[];
        indirectDependents: string[];
        endpointCount: number;
    };
}

// 기본 타입 목록 (참조로 처리하지 않음)
const PRIMITIVE_TYPES = new Set([
    'String', 'string', 'int', 'Integer', 'long', 'Long',
    'double', 'Double', 'float', 'Float', 'boolean', 'Boolean',
    'Date', 'LocalDate', 'LocalDateTime', 'Instant', 'ZonedDateTime',
    'UUID', 'BigDecimal', 'BigInteger', 'byte', 'Byte',
    'short', 'Short', 'char', 'Character', 'Object', 'void',
    'number', 'any', 'unknown', 'null', 'undefined'
]);

/**
 * 타입 문자열에서 기본 타입 추출
 * List<UserDTO> -> UserDTO
 * UserDTO[] -> UserDTO
 * Map<String, AddressDTO> -> AddressDTO
 */
export function extractBaseType(type: string): string {
    if (!type) return '';

    // 배열 표기 제거
    let baseType = type.replace(/\[\]$/, '').trim();

    // 제네릭 타입 처리
    const genericMatch = baseType.match(/<(.+)>/);
    if (genericMatch) {
        const innerTypes = genericMatch[1].split(',').map(t => t.trim());
        // Map의 경우 두 번째 타입 (value)을 반환
        // List, Set 등은 첫 번째 타입을 반환
        const relevantType = innerTypes.length > 1 ? innerTypes[1] : innerTypes[0];
        return relevantType.replace(/<.*>/, '').trim();
    }

    return baseType;
}

/**
 * 타입이 기본 타입인지 확인
 */
export function isPrimitiveType(type: string): boolean {
    const baseType = extractBaseType(type);
    return PRIMITIVE_TYPES.has(baseType);
}

/**
 * 필드에서 참조하는 모델 이름 추출
 */
export function extractReferencedModels(fields: ApiField[]): string[] {
    const references = new Set<string>();

    function processField(field: ApiField) {
        if (!field.type) return;

        const baseType = extractBaseType(field.type);
        if (baseType && !isPrimitiveType(baseType)) {
            references.add(baseType);
        }

        // 중첩 필드 처리
        if (field.refFields && field.refFields.length > 0) {
            field.refFields.forEach(processField);
        }
    }

    fields.forEach(processField);
    return Array.from(references);
}

/**
 * 모델 목록에서 의존성 맵 생성
 * { 모델명: [의존하는 모델명들] }
 */
export function buildModelDependencyMap(models: ApiModel[]): Map<string, string[]> {
    const dependencyMap = new Map<string, string[]>();
    const modelNames = new Set(models.map(m => m.name));

    for (const model of models) {
        const refs = extractReferencedModels(model.fields || []);
        // 실제 존재하는 모델만 필터링
        const validRefs = refs.filter(ref => modelNames.has(ref));
        dependencyMap.set(model.name, validRefs);
    }

    return dependencyMap;
}

/**
 * 엔드포인트-모델 의존성 맵 생성
 * { 엔드포인트ID: { request: 모델명, response: 모델명 } }
 */
export function buildEndpointDependencyMap(endpoints: ApiEndpoint[]): Map<string, { request?: string; response?: string }> {
    const dependencyMap = new Map<string, { request?: string; response?: string }>();

    for (const endpoint of endpoints) {
        const deps: { request?: string; response?: string } = {};

        if (endpoint.requestBody) {
            deps.request = extractBaseType(endpoint.requestBody);
        }
        if (endpoint.responseType) {
            deps.response = extractBaseType(endpoint.responseType);
        }

        if (deps.request || deps.response) {
            dependencyMap.set(endpoint.id || `${endpoint.method}-${endpoint.path}`, deps);
        }
    }

    return dependencyMap;
}

/**
 * 전체 의존성 그래프 생성
 */
export function buildDependencyGraph(
    models: ApiModel[],
    endpoints: ApiEndpoint[]
): DependencyGraph {
    const nodes: DependencyNode[] = [];
    const edges: DependencyEdge[] = [];
    const connectedNodes = new Set<string>();

    // 모델 노드 생성
    for (const model of models) {
        const nodeId = `model-${model.name}`;
        nodes.push({
            id: nodeId,
            type: 'model',
            label: model.name,
            data: {
                name: model.name,
                fieldCount: model.fields?.length || model.fieldCount || 0
            }
        });
    }

    // 엔드포인트 노드 생성
    for (const endpoint of endpoints) {
        const nodeId = `endpoint-${endpoint.id || `${endpoint.method}-${endpoint.path}`}`;
        nodes.push({
            id: nodeId,
            type: 'endpoint',
            label: `${endpoint.method} ${endpoint.path}`,
            data: {
                name: endpoint.methodName || endpoint.path,
                method: endpoint.method,
                path: endpoint.path
            }
        });
    }

    // 모델 간 엣지 생성
    const modelDeps = buildModelDependencyMap(models);
    for (const [modelName, deps] of modelDeps) {
        for (const depModel of deps) {
            const sourceId = `model-${modelName}`;
            const targetId = `model-${depModel}`;
            const edgeId = `${sourceId}->${targetId}`;

            edges.push({
                id: edgeId,
                source: sourceId,
                target: targetId,
                label: 'references',
                data: {
                    relationType: 'reference'
                }
            });

            connectedNodes.add(sourceId);
            connectedNodes.add(targetId);
        }
    }

    // 엔드포인트-모델 엣지 생성
    const modelNames = new Set(models.map(m => m.name));
    for (const endpoint of endpoints) {
        const endpointId = `endpoint-${endpoint.id || `${endpoint.method}-${endpoint.path}`}`;

        // Request Body 연결
        if (endpoint.requestBody) {
            const reqModel = extractBaseType(endpoint.requestBody);
            if (modelNames.has(reqModel)) {
                const targetId = `model-${reqModel}`;
                edges.push({
                    id: `${endpointId}->req-${targetId}`,
                    source: endpointId,
                    target: targetId,
                    label: 'request',
                    data: {
                        relationType: 'request',
                        isRequired: true
                    }
                });
                connectedNodes.add(endpointId);
                connectedNodes.add(targetId);
            }
        }

        // Response Type 연결
        if (endpoint.responseType) {
            const resModel = extractBaseType(endpoint.responseType);
            if (modelNames.has(resModel)) {
                const targetId = `model-${resModel}`;
                edges.push({
                    id: `${endpointId}->res-${targetId}`,
                    source: endpointId,
                    target: targetId,
                    label: 'response',
                    data: {
                        relationType: 'response',
                        isRequired: true
                    }
                });
                connectedNodes.add(endpointId);
                connectedNodes.add(targetId);
            }
        }
    }

    // 통계 계산
    const isolatedNodes = nodes.filter(n => !connectedNodes.has(n.id)).length;

    return {
        nodes,
        edges,
        stats: {
            totalModels: models.length,
            totalEndpoints: endpoints.length,
            totalEdges: edges.length,
            isolatedNodes
        },
        // 내부 캐시 (순환 참조 탐지에서 재사용)
        _modelDeps: modelDeps
    };
}

/**
 * 특정 모델 변경 시 영향 분석
 * BFS로 의존하는 모든 모델과 엔드포인트 탐색
 */
export function analyzeImpact(
    targetModel: string,
    models: ApiModel[],
    endpoints: ApiEndpoint[]
): ImpactAnalysis {
    // 역방향 의존성 맵 (누가 이 모델을 참조하는가)
    const reverseDeps = new Map<string, Set<string>>();
    const modelDeps = buildModelDependencyMap(models);

    for (const [modelName, deps] of modelDeps) {
        for (const dep of deps) {
            if (!reverseDeps.has(dep)) {
                reverseDeps.set(dep, new Set());
            }
            reverseDeps.get(dep)!.add(modelName);
        }
    }

    // BFS로 영향받는 모델 탐색
    const affectedModels = new Set<string>();
    const directDependents: string[] = [];
    const indirectDependents: string[] = [];
    const queue: { model: string; depth: number }[] = [{ model: targetModel, depth: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const { model, depth } = queue.shift()!;

        if (visited.has(model)) continue;
        visited.add(model);

        const dependents = reverseDeps.get(model);
        if (dependents) {
            for (const dep of dependents) {
                if (!visited.has(dep)) {
                    affectedModels.add(dep);
                    if (depth === 0) {
                        directDependents.push(dep);
                    } else {
                        indirectDependents.push(dep);
                    }
                    queue.push({ model: dep, depth: depth + 1 });
                }
            }
        }
    }

    // 영향받는 엔드포인트 탐색
    const affectedEndpoints: string[] = [];
    const allAffectedModels = new Set([targetModel, ...affectedModels]);

    for (const endpoint of endpoints) {
        const reqModel = endpoint.requestBody ? extractBaseType(endpoint.requestBody) : null;
        const resModel = endpoint.responseType ? extractBaseType(endpoint.responseType) : null;

        if ((reqModel && allAffectedModels.has(reqModel)) ||
            (resModel && allAffectedModels.has(resModel))) {
            affectedEndpoints.push(`${endpoint.method} ${endpoint.path}`);
        }
    }

    // 영향 수준 계산
    let impactLevel: ImpactAnalysis['impactLevel'] = 'low';
    const totalAffected = affectedModels.size + affectedEndpoints.length;

    if (totalAffected >= 10 || affectedEndpoints.length >= 5) {
        impactLevel = 'critical';
    } else if (totalAffected >= 5 || affectedEndpoints.length >= 3) {
        impactLevel = 'high';
    } else if (totalAffected >= 2) {
        impactLevel = 'medium';
    }

    return {
        sourceModel: targetModel,
        affectedModels: Array.from(affectedModels),
        affectedEndpoints,
        impactLevel,
        details: {
            directDependents,
            indirectDependents,
            endpointCount: affectedEndpoints.length
        }
    };
}

/**
 * 순환 참조 감지 (최적화 버전)
 * - 배열 복사 대신 Map 기반 경로 추적으로 O(1) 접근
 * - 중복 순환 자동 필터링
 * @param models 모델 목록
 * @param existingModelDeps 이미 계산된 의존성 맵 (재사용 시)
 */
export function detectCircularDependencies(
    models: ApiModel[],
    existingModelDeps?: Map<string, string[]>
): string[][] {
    const modelDeps = existingModelDeps || buildModelDependencyMap(models);
    const visited = new Set<string>();
    const cycleSet = new Set<string>(); // 중복 순환 방지용

    function dfs(
        model: string,
        pathSet: Set<string>,      // O(1) 조회용
        pathArray: string[]        // 순서 유지용 (참조만 전달)
    ): void {
        if (visited.has(model) && !pathSet.has(model)) return;

        if (pathSet.has(model)) {
            // 순환 발견 - 정규화하여 중복 방지
            const cycleStart = pathArray.indexOf(model);
            const cycle = pathArray.slice(cycleStart);
            // 순환을 정규화 (가장 작은 값부터 시작하도록 회전)
            const normalizedCycle = normalizeCycle(cycle);
            const cycleKey = normalizedCycle.join('->');
            if (!cycleSet.has(cycleKey)) {
                cycleSet.add(cycleKey);
            }
            return;
        }

        visited.add(model);
        pathSet.add(model);
        pathArray.push(model);

        const deps = modelDeps.get(model);
        if (deps) {
            for (const dep of deps) {
                dfs(dep, pathSet, pathArray);
            }
        }

        pathSet.delete(model);
        pathArray.pop();
    }

    for (const model of models) {
        dfs(model.name, new Set(), []);
    }

    // cycleSet에서 실제 순환 배열로 변환
    return Array.from(cycleSet).map(key => key.split('->'));
}

/**
 * 순환을 정규화 (가장 작은 값부터 시작하도록 회전)
 * 예: [B, C, A] -> [A, B, C]
 */
function normalizeCycle(cycle: string[]): string[] {
    if (cycle.length === 0) return cycle;

    let minIdx = 0;
    for (let i = 1; i < cycle.length; i++) {
        if (cycle[i] < cycle[minIdx]) {
            minIdx = i;
        }
    }

    return [...cycle.slice(minIdx), ...cycle.slice(0, minIdx)];
}

/**
 * 그래프를 React Flow 형식으로 변환
 */
export function toReactFlowFormat(graph: DependencyGraph) {
    const nodePositions = calculateNodePositions(graph.nodes, graph.edges);

    const flowNodes = graph.nodes.map((node, index) => ({
        id: node.id,
        type: node.type === 'model' ? 'modelNode' : 'endpointNode',
        position: nodePositions.get(node.id) || { x: (index % 5) * 250, y: Math.floor(index / 5) * 150 },
        data: {
            label: node.label,
            ...node.data
        }
    }));

    const flowEdges = graph.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'smoothstep',
        animated: edge.data.relationType === 'request' || edge.data.relationType === 'response',
        style: getEdgeStyle(edge.data.relationType),
        markerEnd: { type: 'arrowclosed' as const }
    }));

    return { nodes: flowNodes, edges: flowEdges };
}

/**
 * 노드 위치 계산 (간단한 계층적 레이아웃)
 */
function calculateNodePositions(
    nodes: DependencyNode[],
    edges: DependencyEdge[]
): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();

    // 엔드포인트와 모델 분리
    const endpointNodes = nodes.filter(n => n.type === 'endpoint');
    const modelNodes = nodes.filter(n => n.type === 'model');

    // 입력 엣지 수로 정렬 (많이 참조되는 것이 아래로)
    const inDegree = new Map<string, number>();
    for (const edge of edges) {
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    modelNodes.sort((a, b) => (inDegree.get(a.id) || 0) - (inDegree.get(b.id) || 0));

    // 엔드포인트는 상단에 배치
    endpointNodes.forEach((node, i) => {
        positions.set(node.id, {
            x: i * 280 + 50,
            y: 50
        });
    });

    // 모델은 하단에 그리드 형태로 배치
    const cols = Math.max(3, Math.ceil(Math.sqrt(modelNodes.length)));
    modelNodes.forEach((node, i) => {
        positions.set(node.id, {
            x: (i % cols) * 280 + 50,
            y: 250 + Math.floor(i / cols) * 180
        });
    });

    return positions;
}

/**
 * 엣지 스타일 반환
 */
function getEdgeStyle(relationType: string): React.CSSProperties {
    switch (relationType) {
        case 'request':
            return { stroke: '#10b981', strokeWidth: 2 };
        case 'response':
            return { stroke: '#3b82f6', strokeWidth: 2 };
        case 'reference':
            return { stroke: '#8b5cf6', strokeWidth: 1.5 };
        case 'nested':
            return { stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '5,5' };
        default:
            return { stroke: '#6b7280', strokeWidth: 1 };
    }
}
