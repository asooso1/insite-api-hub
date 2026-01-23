/**
 * OpenAPI 3.0 Specification Generator
 *
 * Converts analyzed API endpoints and DTO models to OpenAPI 3.0 specification
 */

import { ApiEndpoint, ApiModel, ApiField, Project } from './api-types';

// Alias for clarity
type DtoModel = ApiModel;
type DtoField = ApiField;

export interface OpenAPISpec {
    openapi: string;
    info: {
        title: string;
        description?: string;
        version: string;
        contact?: {
            name?: string;
            email?: string;
            url?: string;
        };
    };
    servers?: {
        url: string;
        description?: string;
    }[];
    paths: Record<string, PathItem>;
    components?: {
        schemas?: Record<string, SchemaObject>;
        securitySchemes?: Record<string, SecurityScheme>;
    };
    tags?: { name: string; description?: string }[];
}

interface PathItem {
    [method: string]: Operation;
}

interface Operation {
    summary?: string;
    description?: string;
    operationId?: string;
    tags?: string[];
    parameters?: Parameter[];
    requestBody?: RequestBody;
    responses: Record<string, Response>;
    security?: Record<string, string[]>[];
}

interface Parameter {
    name: string;
    in: 'query' | 'path' | 'header' | 'cookie';
    description?: string;
    required?: boolean;
    schema: SchemaObject;
}

interface RequestBody {
    description?: string;
    required?: boolean;
    content: Record<string, MediaType>;
}

interface Response {
    description: string;
    content?: Record<string, MediaType>;
}

interface MediaType {
    schema: SchemaObject | { $ref: string };
}

interface SchemaObject {
    type?: string;
    format?: string;
    description?: string;
    properties?: Record<string, SchemaObject | { $ref: string }>;
    items?: SchemaObject | { $ref: string };
    required?: string[];
    enum?: string[];
    example?: unknown;
    nullable?: boolean;
    allOf?: (SchemaObject | { $ref: string })[];
    oneOf?: (SchemaObject | { $ref: string })[];
    anyOf?: (SchemaObject | { $ref: string })[];
}

interface SecurityScheme {
    type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
    description?: string;
    name?: string;
    in?: 'query' | 'header' | 'cookie';
    scheme?: string;
    bearerFormat?: string;
}

/**
 * Generate OpenAPI 3.0 specification from project data
 */
export function generateOpenAPISpec(
    project: Project,
    endpoints: ApiEndpoint[],
    models: DtoModel[],
    options?: {
        serverUrl?: string;
        version?: string;
        includeExamples?: boolean;
    }
): OpenAPISpec {
    const { serverUrl, version = '1.0.0', includeExamples = true } = options || {};

    // Group endpoints by tag (first path segment)
    const tags = new Set<string>();
    endpoints.forEach(ep => {
        const tag = extractTag(ep.path);
        if (tag) tags.add(tag);
    });

    const spec: OpenAPISpec = {
        openapi: '3.0.3',
        info: {
            title: project.name + ' API',
            description: project.description || 'API documentation for ' + project.name,
            version
        },
        paths: {},
        components: {
            schemas: {},
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                },
                apiKey: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key'
                }
            }
        },
        tags: Array.from(tags).map(t => ({ name: t, description: t + ' operations' }))
    };

    if (serverUrl) {
        spec.servers = [{ url: serverUrl, description: 'API Server' }];
    }

    // Generate paths
    endpoints.forEach(endpoint => {
        const path = normalizePathForOpenAPI(endpoint.path);
        if (!spec.paths[path]) {
            spec.paths[path] = {};
        }

        const method = endpoint.method.toLowerCase();
        spec.paths[path][method] = generateOperation(endpoint, models, includeExamples);
    });

    // Generate schemas from DTO models
    models.forEach(model => {
        if (spec.components?.schemas) {
            spec.components.schemas[model.name] = generateSchema(model, includeExamples);
        }
    });

    return spec;
}

function extractTag(path: string): string | null {
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0) {
        const first = segments[0].replace(/\{.*\}/, '').replace(/:.*/, '');
        return first || null;
    }
    return null;
}

function normalizePathForOpenAPI(path: string): string {
    return path.replace(/:(\w+)/g, '{$1}');
}

function generateOperation(
    endpoint: ApiEndpoint,
    models: DtoModel[],
    includeExamples: boolean
): Operation {
    const tag = extractTag(endpoint.path);
    const operation: Operation = {
        summary: endpoint.summary || endpoint.method + ' ' + endpoint.path,
        operationId: generateOperationId(endpoint),
        tags: tag ? [tag] : undefined,
        responses: {
            '200': { description: 'Successful response' }
        }
    };

    const pathParams = extractPathParams(endpoint.path);
    if (pathParams.length > 0) {
        operation.parameters = pathParams.map(p => ({
            name: p,
            in: 'path',
            required: true,
            schema: { type: 'string' }
        }));
    }

    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase())) {
        const requestModel = findModelByName(models, endpoint.requestBody);
        if (requestModel) {
            operation.requestBody = {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/' + requestModel.name }
                    }
                }
            };
        }
    }

    const responseModel = findModelByName(models, endpoint.responseType);
    if (responseModel) {
        operation.responses['200'] = {
            description: 'Successful response',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/' + responseModel.name }
                }
            }
        };
    }

    operation.responses['400'] = { description: 'Bad Request' };
    operation.responses['401'] = { description: 'Unauthorized' };
    operation.responses['404'] = { description: 'Not Found' };
    operation.responses['500'] = { description: 'Internal Server Error' };

    return operation;
}

function generateOperationId(endpoint: ApiEndpoint): string {
    const method = endpoint.method.toLowerCase();
    const pathParts = endpoint.path
        .split('/')
        .filter(Boolean)
        .map(p => p.replace(/[:{}\-]/g, ''))
        .map((p, i) => i === 0 ? p : capitalize(p));

    return method + pathParts.map(capitalize).join('');
}

function extractPathParams(path: string): string[] {
    const params: string[] = [];
    const regex = /[:{](\w+)\}?/g;
    let match;
    while ((match = regex.exec(path)) !== null) {
        params.push(match[1]);
    }
    return params;
}

function findModelByName(models: DtoModel[], name?: string): DtoModel | undefined {
    if (!name) return undefined;
    return models.find(m =>
        m.name === name ||
        m.name.toLowerCase() === name.toLowerCase() ||
        m.name.endsWith(name) ||
        name.endsWith(m.name)
    );
}

function generateSchema(model: DtoModel, includeExamples: boolean): SchemaObject {
    const schema: SchemaObject = {
        type: 'object',
        properties: {},
        required: []
    };

    model.fields?.forEach(field => {
        if (schema.properties) {
            schema.properties[field.name] = generateFieldSchema(field, includeExamples);
        }
        if (field.isRequired && schema.required) {
            schema.required.push(field.name);
        }
    });

    if (schema.required?.length === 0) {
        delete schema.required;
    }

    return schema;
}

function generateFieldSchema(field: DtoField, includeExamples: boolean): SchemaObject {
    const schema: SchemaObject = {};

    if (field.description) {
        schema.description = field.description;
    }

    const { type, format } = mapFieldType(field.type);
    schema.type = type;
    if (format) schema.format = format;

    if (field.type.endsWith('[]') || field.type.startsWith('Array<') || field.type.startsWith('List<')) {
        schema.type = 'array';
        const itemType = field.type.replace('[]', '').replace('Array<', '').replace('List<', '').replace('>', '');
        const { type: itemSchemaType, format: itemFormat } = mapFieldType(itemType);
        schema.items = { type: itemSchemaType };
        if (itemFormat) (schema.items as SchemaObject).format = itemFormat;
    }

    if (includeExamples && !field.type.endsWith('[]')) {
        schema.example = generateExampleValue(field);
    }

    return schema;
}

function mapFieldType(type: string): { type: string; format?: string } {
    const normalized = type.toLowerCase().replace('[]', '').replace('array<', '').replace('>', '');

    switch (normalized) {
        case 'string': return { type: 'string' };
        case 'number':
        case 'int':
        case 'integer':
        case 'long': return { type: 'integer', format: 'int64' };
        case 'float':
        case 'double': return { type: 'number', format: 'double' };
        case 'boolean':
        case 'bool': return { type: 'boolean' };
        case 'date': return { type: 'string', format: 'date' };
        case 'datetime':
        case 'timestamp':
        case 'localdatetime':
        case 'zoneddatetime': return { type: 'string', format: 'date-time' };
        case 'uuid': return { type: 'string', format: 'uuid' };
        case 'email': return { type: 'string', format: 'email' };
        case 'uri':
        case 'url': return { type: 'string', format: 'uri' };
        case 'object':
        case 'any':
        case 'map': return { type: 'object' };
        default: return { type: 'string' };
    }
}

function generateExampleValue(field: DtoField): unknown {
    const name = field.name.toLowerCase();
    const type = field.type.toLowerCase();

    if (name.includes('email')) return 'user@example.com';
    if (name.includes('phone')) return '010-1234-5678';
    if (name.includes('name')) return '홍길동';
    if (name.includes('title')) return '제목 예시';
    if (name.includes('description')) return '설명 예시입니다.';
    if (name.includes('url') || name.includes('link')) return 'https://example.com';
    if (name.includes('id') && !name.includes('uuid')) return 1;
    if (name.includes('uuid')) return '550e8400-e29b-41d4-a716-446655440000';
    if (name.includes('date') || name.includes('time')) return '2026-01-23T12:00:00Z';
    if (name.includes('price') || name.includes('amount')) return 10000;
    if (name.includes('count') || name.includes('quantity')) return 5;
    if (name.includes('age')) return 25;
    if (name.includes('status')) return 'ACTIVE';
    if (name.includes('type')) return 'DEFAULT';
    if (name.includes('code')) return 'CODE001';

    switch (type) {
        case 'string': return 'string';
        case 'number':
        case 'int':
        case 'integer':
        case 'long': return 0;
        case 'float':
        case 'double': return 0.0;
        case 'boolean':
        case 'bool': return true;
        default: return null;
    }
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function exportToJSON(spec: OpenAPISpec): string {
    return JSON.stringify(spec, null, 2);
}

export function exportToYAML(spec: OpenAPISpec): string {
    return jsonToYaml(spec);
}

function jsonToYaml(obj: unknown, indent = 0): string {
    const spaces = '  '.repeat(indent);

    if (obj === null || obj === undefined) return 'null';
    if (typeof obj === 'string') {
        if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) {
            return '"' + obj.replace(/"/g, '\\"') + '"';
        }
        return obj;
    }
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

    if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        return obj.map(item => spaces + '- ' + jsonToYaml(item, indent + 1).trimStart()).join('\n');
    }

    if (typeof obj === 'object') {
        const entries = Object.entries(obj);
        if (entries.length === 0) return '{}';
        return entries
            .map(([key, value]) => {
                const valueStr = jsonToYaml(value, indent + 1);
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    return spaces + key + ':\n' + valueStr;
                }
                if (Array.isArray(value)) {
                    return spaces + key + ':\n' + valueStr;
                }
                return spaces + key + ': ' + valueStr;
            })
            .join('\n');
    }

    return String(obj);
}
