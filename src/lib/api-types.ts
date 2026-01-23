export interface Project {
    id: string;
    name: string;
    description?: string;
    gitUrl?: string;
    doorayWebhookUrl?: string;
    createdAt: string;
}

export interface ApiEndpoint {
    id?: string;
    path: string;
    method: string;
    className: string;
    methodName: string;
    summary: string;
    requestBody?: string;
    responseType?: string;
    syncedAt?: string;
    version?: string;
}

export interface ApiModel {
    id?: string;
    name: string;
    fields?: ApiField[];
    fieldCount?: number;
}

export interface ApiField {
    name: string;
    type: string;
    description?: string;
    isRequired?: boolean;
    isComplex?: boolean;
    refFields?: ApiField[];
}

export interface EnvConfig {
    baseUrl: string;
    token: string;
    doorayWebhookUrl?: string;
}

export interface ApiTestCase {
    id: string;
    apiId: string;
    name: string;
    requestPayload: string;
    expectedResponse?: string;
    createdAt: string;
}

export interface MockDB {
    projects: Project[];
    endpoints: ApiEndpoint[];
    models: ApiModel[];
    environments: Record<'DEV' | 'STG' | 'PRD', EnvConfig>;
    testCases: ApiTestCase[];
}

// Added for Test Case Management
export interface TestCase {
    id: string;
    api_id: string;
    name: string;
    payload: string;
    headers: string; // JSON string
    expected_status?: number;
    created_at: Date;
}

export interface TestHistory {
    id: string;
    api_id: string;
    test_case_id?: string;
    env: string;
    status: number;
    response_time: number;
    success: boolean;
    executed_at: Date;
}

export interface BatchTestResult {
    testCaseId: string;
    testCaseName: string;
    success: boolean;
    status: number;
    responseTime: number;
    error?: string;
    assertionResult?: import('./assertion-validator').AssertionResult;
}

export interface BatchTestSummary {
    total: number;
    successCount: number;
    failCount: number;
    results: BatchTestResult[];
}

export interface ScenarioStep {
    id: string;
    testCaseId: string;
    testCaseName: string;
    order: number;
    variableMappings: Record<string, string>; // { "jsonPath": "variableName" }
}

export interface TestScenario {
    id: string;
    projectId: string;
    name: string;
    description?: string;
    steps: ScenarioStep[];
    createdAt: string;
    updatedAt: string;
}

export interface ApiVersion {
    id: string;
    projectId: string;
    versionTag: string;
    description?: string;
    endpointsSnapshot: ApiEndpoint[];
    modelsSnapshot: ApiModel[];
    createdAt: string;
}

// ApiChange types are defined in change-detection.ts
// Re-export for convenience
export type { ApiChange, FieldChange, ModelChange, ChangeStats } from './change-detection';

// DTO Diff types are defined in dto-diff.ts
// Re-export for convenience
export type { FieldDiff, DtoDiff, BreakingChangeSummary } from './dto-diff';

// Assertion types - re-export from assertion-validator
export type {
    AssertionDetail,
    AssertionResult,
    FieldAssertion,
    AssertionConfig
} from './assertion-validator';
