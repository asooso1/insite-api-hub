export interface Project {
    id: string;
    name: string;
    description?: string;
    gitUrl?: string;
    createdAt?: Date;
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
    name: string;
    fields: ApiField[];
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
