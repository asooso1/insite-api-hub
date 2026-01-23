'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Book,
    Search,
    ChevronDown,
    ChevronRight,
    Copy,
    Check,
    ExternalLink,
    Download,
    Code2,
    FileJson,
    FileText,
    Play,
    Lock,
    Unlock
} from 'lucide-react';
import { OpenAPISpec, generateOpenAPISpec, exportToJSON, exportToYAML } from '@/lib/openapi-generator';
import { generateSnippets, CodeSnippet, SnippetLanguage, getLanguageInfo } from '@/lib/code-snippet-generator';
import { ApiEndpoint, ApiModel, Project } from '@/lib/api-types';

type DtoModel = ApiModel;

interface ApiDocViewerProps {
    project: Project;
    endpoints: ApiEndpoint[];
    models: DtoModel[];
    baseUrl?: string;
}

const methodColors: Record<string, { bg: string; text: string; border: string }> = {
    GET: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    POST: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    PUT: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    PATCH: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    DELETE: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' }
};

export function ApiDocViewer({ project, endpoints, models, baseUrl = '' }: ApiDocViewerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
    const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
    const [activeSnippetLang, setActiveSnippetLang] = useState<SnippetLanguage>('curl');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Generate OpenAPI spec
    const openApiSpec = useMemo(() => {
        return generateOpenAPISpec(project, endpoints, models, { serverUrl: baseUrl });
    }, [project, endpoints, models, baseUrl]);

    // Group endpoints by tag
    const groupedEndpoints = useMemo(() => {
        const groups: Record<string, ApiEndpoint[]> = {};
        endpoints.forEach(ep => {
            const tag = ep.path.split('/').filter(Boolean)[0] || 'default';
            if (!groups[tag]) groups[tag] = [];
            groups[tag].push(ep);
        });
        return groups;
    }, [endpoints]);

    // Filter endpoints
    const filteredGroups = useMemo(() => {
        if (!searchQuery) return groupedEndpoints;

        const filtered: Record<string, ApiEndpoint[]> = {};
        Object.entries(groupedEndpoints).forEach(([tag, eps]) => {
            const matchedEps = eps.filter(ep =>
                ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ep.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ep.summary?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (matchedEps.length > 0) {
                filtered[tag] = matchedEps;
            }
        });
        return filtered;
    }, [groupedEndpoints, searchQuery]);

    const toggleEndpoint = (id: string) => {
        setExpandedEndpoints(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const copyToClipboard = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const exportSpec = (format: 'json' | 'yaml') => {
        const content = format === 'json' ? exportToJSON(openApiSpec) : exportToYAML(openApiSpec);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = project.name + '-openapi.' + format;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Book className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-black text-slate-900">API 문서</h2>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="엔드포인트 검색..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Endpoint List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {Object.entries(filteredGroups).map(([tag, eps]) => (
                        <div key={tag} className="mb-2">
                            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {tag}
                            </div>
                            {eps.map(ep => {
                                const colors = methodColors[ep.method.toUpperCase()] || methodColors.GET;
                                return (
                                    <button
                                        key={ep.id}
                                        onClick={() => setSelectedEndpoint(ep)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                            selectedEndpoint?.id === ep.id
                                                ? 'bg-blue-50 border border-blue-200'
                                                : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${colors.bg} ${colors.text}`}>
                                            {ep.method}
                                        </span>
                                        <span className="text-xs text-slate-700 truncate flex-1">
                                            {ep.path}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Export Buttons */}
                <div className="p-4 border-t border-slate-200">
                    <div className="flex gap-2">
                        <button
                            onClick={() => exportSpec('json')}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors"
                        >
                            <FileJson className="w-3.5 h-3.5" />
                            JSON
                        </button>
                        <button
                            onClick={() => exportSpec('yaml')}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            YAML
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50">
                {selectedEndpoint ? (
                    <EndpointDetail
                        endpoint={selectedEndpoint}
                        models={models}
                        baseUrl={baseUrl}
                        activeSnippetLang={activeSnippetLang}
                        onSnippetLangChange={setActiveSnippetLang}
                        copiedId={copiedId}
                        onCopy={copyToClipboard}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Book className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-400">왼쪽에서 엔드포인트를 선택하세요</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function EndpointDetail({
    endpoint,
    models,
    baseUrl,
    activeSnippetLang,
    onSnippetLangChange,
    copiedId,
    onCopy
}: {
    endpoint: ApiEndpoint;
    models: DtoModel[];
    baseUrl: string;
    activeSnippetLang: SnippetLanguage;
    onSnippetLangChange: (lang: SnippetLanguage) => void;
    copiedId: string | null;
    onCopy: (text: string, id: string) => void;
}) {
    const colors = methodColors[endpoint.method.toUpperCase()] || methodColors.GET;

    // Find related models
    const requestModel = models.find(m => m.name === endpoint.requestBody);
    const responseModel = models.find(m => m.name === endpoint.responseType);

    // Generate sample payload
    const samplePayload = requestModel?.fields?.reduce((acc, field) => {
        acc[field.name] = generateSampleValue(field.name, field.type);
        return acc;
    }, {} as Record<string, unknown>);

    // Generate code snippets
    const snippets = generateSnippets(endpoint, {
        baseUrl,
        samplePayload,
        authToken: 'YOUR_API_TOKEN'
    });

    const activeSnippet = snippets.find(s => s.language === activeSnippetLang) || snippets[0];

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1.5 text-sm font-bold rounded-lg ${colors.bg} ${colors.text} ${colors.border} border`}>
                        {endpoint.method}
                    </span>
                    <code className="text-lg font-mono text-slate-800">{endpoint.path}</code>
                </div>
                {endpoint.summary && (
                    <p className="text-slate-600">{endpoint.summary}</p>
                )}
            </div>

            {/* URL */}
            <div className="mb-8 p-4 bg-slate-800 rounded-xl">
                <div className="flex items-center justify-between">
                    <code className="text-emerald-400 text-sm">
                        <span className="text-slate-400">{baseUrl}</span>
                        {endpoint.path}
                    </code>
                    <button
                        onClick={() => onCopy(baseUrl + endpoint.path, 'url')}
                        className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        {copiedId === 'url' ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                        )}
                    </button>
                </div>
            </div>

            {/* Request Body */}
            {requestModel && (
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Code2 className="w-4 h-4" />
                        Request Body
                    </h3>
                    <ModelSchema model={requestModel} />
                </div>
            )}

            {/* Response */}
            {responseModel && (
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Code2 className="w-4 h-4" />
                        Response
                    </h3>
                    <ModelSchema model={responseModel} />
                </div>
            )}

            {/* Code Snippets */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-900 mb-4">코드 예제</h3>

                {/* Language Tabs */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-4">
                    {snippets.map(snippet => (
                        <button
                            key={snippet.language}
                            onClick={() => onSnippetLangChange(snippet.language)}
                            className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                                activeSnippetLang === snippet.language
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {snippet.label}
                        </button>
                    ))}
                </div>

                {/* Code Block */}
                <div className="relative bg-slate-800 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-700">
                        <span className="text-xs text-slate-400">{activeSnippet.label}</span>
                        <button
                            onClick={() => onCopy(activeSnippet.code, 'snippet')}
                            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            {copiedId === 'snippet' ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <Copy className="w-4 h-4 text-slate-400" />
                            )}
                        </button>
                    </div>
                    <pre className="p-4 overflow-x-auto text-sm">
                        <code className="text-slate-300">{activeSnippet.code}</code>
                    </pre>
                </div>
            </div>
        </div>
    );
}

function ModelSchema({ model }: { model: DtoModel }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <span className="text-sm font-bold text-slate-800">{model.name}</span>
            </div>
            <div className="divide-y divide-slate-100">
                {model.fields?.map(field => (
                    <div key={field.name} className="px-4 py-3 flex items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <code className="text-sm font-semibold text-slate-800">{field.name}</code>
                                {field.isRequired && (
                                    <span className="text-[10px] font-bold text-red-500">필수</span>
                                )}
                            </div>
                            {field.description && (
                                <p className="text-xs text-slate-500 mt-1">{field.description}</p>
                            )}
                        </div>
                        <code className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {field.type}
                        </code>
                    </div>
                ))}
            </div>
        </div>
    );
}

function generateSampleValue(name: string, type: string): unknown {
    const n = name.toLowerCase();
    if (n.includes('email')) return 'user@example.com';
    if (n.includes('name')) return '홍길동';
    if (n.includes('phone')) return '010-1234-5678';
    if (n.includes('id')) return 1;
    if (n.includes('date')) return '2026-01-23';
    if (n.includes('url')) return 'https://example.com';

    switch (type.toLowerCase()) {
        case 'string': return 'string';
        case 'number':
        case 'int':
        case 'integer': return 0;
        case 'boolean': return true;
        default: return null;
    }
}
