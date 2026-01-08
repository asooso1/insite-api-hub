"use client";

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CheckCircle2, XCircle, Clock, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { ApiTestResponse } from '@/app/actions/test-api';

interface ApiResponseViewerProps {
    response: ApiTestResponse;
}

export function ApiResponseViewer({ response }: ApiResponseViewerProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const text = JSON.stringify(response.data, null, 2);
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getStatusColor = (code?: number) => {
        if (!code) return 'text-muted-foreground';
        if (code >= 200 && code < 300) return 'text-green-500';
        if (code >= 300 && code < 400) return 'text-blue-500';
        if (code >= 400 && code < 500) return 'text-orange-500';
        return 'text-red-500';
    };

    const getStatusBg = (code?: number) => {
        if (!code) return 'bg-muted/30';
        if (code >= 200 && code < 300) return 'bg-green-500/10 border-green-500/30';
        if (code >= 300 && code < 400) return 'bg-blue-500/10 border-blue-500/30';
        if (code >= 400 && code < 500) return 'bg-orange-500/10 border-orange-500/30';
        return 'bg-red-500/10 border-red-500/30';
    };

    return (
        <div className="space-y-4">
            {/* Status Header */}
            <div className={`p-4 rounded-xl border ${getStatusBg(response.statusCode)} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    {response.success ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            {response.statusCode && (
                                <span className={`text-lg font-bold ${getStatusColor(response.statusCode)}`}>
                                    {response.statusCode}
                                </span>
                            )}
                            {response.statusText && (
                                <span className="text-sm text-muted-foreground">
                                    {response.statusText}
                                </span>
                            )}
                        </div>
                        {response.error && (
                            <p className="text-sm text-red-500 mt-1">{response.error}</p>
                        )}
                    </div>
                </div>
                {response.responseTime !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{response.responseTime}ms</span>
                    </div>
                )}
            </div>

            {/* Response Body */}
            {response.data && (
                <div className="glass-panel rounded-xl overflow-hidden">
                    <div className="bg-muted/30 px-4 py-2 border-b border-border/50 flex items-center justify-between">
                        <span className="text-sm font-bold">Response Body</span>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-3 h-3" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3 h-3" />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                    <div className="max-h-96 overflow-auto">
                        <SyntaxHighlighter
                            language="json"
                            style={vscDarkPlus}
                            customStyle={{
                                margin: 0,
                                padding: '1rem',
                                background: 'transparent',
                                fontSize: '0.875rem'
                            }}
                        >
                            {JSON.stringify(response.data, null, 2)}
                        </SyntaxHighlighter>
                    </div>
                </div>
            )}

            {/* Response Headers */}
            {response.headers && Object.keys(response.headers).length > 0 && (
                <details className="glass-panel rounded-xl overflow-hidden">
                    <summary className="bg-muted/30 px-4 py-2 border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors">
                        <span className="text-sm font-bold">Response Headers</span>
                    </summary>
                    <div className="p-4 space-y-2">
                        {Object.entries(response.headers).map(([key, value]) => (
                            <div key={key} className="flex gap-2 text-sm">
                                <span className="font-mono text-primary font-semibold min-w-[200px]">{key}:</span>
                                <span className="font-mono text-muted-foreground break-all">{value}</span>
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}
