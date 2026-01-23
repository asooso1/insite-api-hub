/**
 * Code Snippet Generator
 *
 * Generates code snippets for API calls in various languages
 */

import { ApiEndpoint, ApiModel } from './api-types';

// Alias for clarity
type DtoModel = ApiModel;

export type SnippetLanguage = 'curl' | 'javascript' | 'typescript' | 'python' | 'java' | 'go';

export interface CodeSnippet {
    language: SnippetLanguage;
    label: string;
    code: string;
}

interface SnippetOptions {
    baseUrl: string;
    headers?: Record<string, string>;
    authToken?: string;
    samplePayload?: Record<string, unknown>;
}

/**
 * Generate code snippets for an endpoint
 */
export function generateSnippets(
    endpoint: ApiEndpoint,
    options: SnippetOptions
): CodeSnippet[] {
    return [
        { language: 'curl', label: 'cURL', code: generateCurl(endpoint, options) },
        { language: 'javascript', label: 'JavaScript', code: generateJavaScript(endpoint, options) },
        { language: 'typescript', label: 'TypeScript', code: generateTypeScript(endpoint, options) },
        { language: 'python', label: 'Python', code: generatePython(endpoint, options) }
    ];
}

/**
 * Generate cURL command
 */
export function generateCurl(endpoint: ApiEndpoint, options: SnippetOptions): string {
    const { baseUrl, headers = {}, authToken, samplePayload } = options;
    const url = baseUrl + endpoint.path;
    const method = endpoint.method.toUpperCase();

    let cmd = 'curl';

    // Method
    if (method !== 'GET') {
        cmd += ' -X ' + method;
    }

    // URL
    cmd += ' "' + url + '"';

    // Headers
    const allHeaders = { ...headers };
    if (authToken) {
        allHeaders['Authorization'] = 'Bearer ' + authToken;
    }
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        allHeaders['Content-Type'] = 'application/json';
    }

    Object.entries(allHeaders).forEach(([key, value]) => {
        cmd += ' \\\n  -H "' + key + ': ' + value + '"';
    });

    // Body
    if (['POST', 'PUT', 'PATCH'].includes(method) && samplePayload) {
        cmd += ' \\\n  -d \'' + JSON.stringify(samplePayload, null, 2) + '\'';
    }

    return cmd;
}

/**
 * Generate JavaScript fetch code
 */
export function generateJavaScript(endpoint: ApiEndpoint, options: SnippetOptions): string {
    const { baseUrl, headers = {}, authToken, samplePayload } = options;
    const url = baseUrl + endpoint.path;
    const method = endpoint.method.toUpperCase();

    const allHeaders: Record<string, string> = { ...headers };
    if (authToken) {
        allHeaders['Authorization'] = 'Bearer ' + authToken;
    }
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        allHeaders['Content-Type'] = 'application/json';
    }

    let code = 'const response = await fetch("' + url + '", {\n';
    code += '  method: "' + method + '"';

    if (Object.keys(allHeaders).length > 0) {
        code += ',\n  headers: ' + JSON.stringify(allHeaders, null, 4).replace(/\n/g, '\n  ');
    }

    if (['POST', 'PUT', 'PATCH'].includes(method) && samplePayload) {
        code += ',\n  body: JSON.stringify(' + JSON.stringify(samplePayload, null, 4).replace(/\n/g, '\n  ') + ')';
    }

    code += '\n});\n\nconst data = await response.json();\nconsole.log(data);';

    return code;
}

/**
 * Generate TypeScript fetch code with types
 */
export function generateTypeScript(endpoint: ApiEndpoint, options: SnippetOptions): string {
    const { baseUrl, headers = {}, authToken, samplePayload } = options;
    const url = baseUrl + endpoint.path;
    const method = endpoint.method.toUpperCase();
    const responseType = endpoint.responseType || 'unknown';
    const requestType = endpoint.requestBody;

    const allHeaders: Record<string, string> = { ...headers };
    if (authToken) {
        allHeaders['Authorization'] = 'Bearer ' + authToken;
    }
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        allHeaders['Content-Type'] = 'application/json';
    }

    let code = '';

    // Type definitions
    if (requestType) {
        code += '// Request type\n';
        code += 'interface ' + requestType + ' {\n';
        if (samplePayload) {
            Object.keys(samplePayload).forEach(key => {
                code += '  ' + key + ': string | number | boolean;\n';
            });
        }
        code += '}\n\n';
    }

    code += '// Response type\n';
    code += 'interface ' + responseType + ' {\n  // Define response properties\n}\n\n';

    // Function
    code += 'async function ' + generateFunctionName(endpoint) + '(';
    if (requestType && samplePayload) {
        code += 'payload: ' + requestType;
    }
    code += '): Promise<' + responseType + '> {\n';
    code += '  const response = await fetch("' + url + '", {\n';
    code += '    method: "' + method + '"';

    if (Object.keys(allHeaders).length > 0) {
        code += ',\n    headers: ' + JSON.stringify(allHeaders, null, 6).replace(/\n/g, '\n    ');
    }

    if (['POST', 'PUT', 'PATCH'].includes(method) && samplePayload) {
        code += ',\n    body: JSON.stringify(payload)';
    }

    code += '\n  });\n\n';
    code += '  if (!response.ok) {\n';
    code += '    throw new Error("HTTP error! status: " + response.status);\n';
    code += '  }\n\n';
    code += '  return response.json();\n';
    code += '}';

    return code;
}

/**
 * Generate Python requests code
 */
export function generatePython(endpoint: ApiEndpoint, options: SnippetOptions): string {
    const { baseUrl, headers = {}, authToken, samplePayload } = options;
    const url = baseUrl + endpoint.path;
    const method = endpoint.method.toLowerCase();

    const allHeaders: Record<string, string> = { ...headers };
    if (authToken) {
        allHeaders['Authorization'] = 'Bearer ' + authToken;
    }
    if (['post', 'put', 'patch'].includes(method)) {
        allHeaders['Content-Type'] = 'application/json';
    }

    let code = 'import requests\n\n';
    code += 'url = "' + url + '"\n';

    if (Object.keys(allHeaders).length > 0) {
        code += 'headers = ' + pythonDict(allHeaders) + '\n';
    }

    if (['post', 'put', 'patch'].includes(method) && samplePayload) {
        code += 'payload = ' + pythonDict(samplePayload) + '\n';
    }

    code += '\nresponse = requests.' + method + '(\n';
    code += '    url';

    if (Object.keys(allHeaders).length > 0) {
        code += ',\n    headers=headers';
    }

    if (['post', 'put', 'patch'].includes(method) && samplePayload) {
        code += ',\n    json=payload';
    }

    code += '\n)\n\n';
    code += 'print(response.status_code)\n';
    code += 'print(response.json())';

    return code;
}

function generateFunctionName(endpoint: ApiEndpoint): string {
    const method = endpoint.method.toLowerCase();
    const pathParts = endpoint.path
        .split('/')
        .filter(Boolean)
        .map(p => p.replace(/[:{}\-]/g, ''));

    return method + pathParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}

function pythonDict(obj: Record<string, unknown>): string {
    const entries = Object.entries(obj)
        .map(([key, value]) => {
            const valueStr = typeof value === 'string' ? '"' + value + '"' : JSON.stringify(value);
            return '    "' + key + '": ' + valueStr;
        })
        .join(',\n');

    return '{\n' + entries + '\n}';
}

/**
 * Get language display info
 */
export function getLanguageInfo(language: SnippetLanguage): { name: string; icon: string; prism: string } {
    const info: Record<SnippetLanguage, { name: string; icon: string; prism: string }> = {
        curl: { name: 'cURL', icon: 'terminal', prism: 'bash' },
        javascript: { name: 'JavaScript', icon: 'js', prism: 'javascript' },
        typescript: { name: 'TypeScript', icon: 'ts', prism: 'typescript' },
        python: { name: 'Python', icon: 'python', prism: 'python' },
        java: { name: 'Java', icon: 'java', prism: 'java' },
        go: { name: 'Go', icon: 'go', prism: 'go' }
    };

    return info[language] || { name: language, icon: 'code', prism: language };
}
