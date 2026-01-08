"use server";

import axios, { AxiosError } from 'axios';

export interface ApiTestRequest {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
}

export interface ApiTestResponse {
    success: boolean;
    statusCode?: number;
    statusText?: string;
    data?: any;
    headers?: Record<string, string>;
    responseTime?: number;
    error?: string;
}

export async function testApi(request: ApiTestRequest): Promise<ApiTestResponse> {
    const startTime = Date.now();

    try {
        const response = await axios({
            url: request.url,
            method: request.method,
            headers: {
                'Content-Type': 'application/json',
                ...request.headers
            },
            data: request.body ? JSON.parse(request.body) : undefined,
            timeout: request.timeout || 30000, // 30 seconds default
            validateStatus: () => true // Accept all status codes
        });

        const responseTime = Date.now() - startTime;

        return {
            success: response.status >= 200 && response.status < 300,
            statusCode: response.status,
            statusText: response.statusText,
            data: response.data,
            headers: response.headers as Record<string, string>,
            responseTime
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;

        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;

            if (axiosError.code === 'ECONNABORTED') {
                return {
                    success: false,
                    error: `Request timed out after ${request.timeout || 30000}ms`,
                    responseTime
                };
            }

            if (axiosError.response) {
                return {
                    success: false,
                    statusCode: axiosError.response.status,
                    statusText: axiosError.response.statusText,
                    data: axiosError.response.data,
                    headers: axiosError.response.headers as Record<string, string>,
                    error: `HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`,
                    responseTime
                };
            }

            return {
                success: false,
                error: axiosError.message || 'Network error occurred',
                responseTime
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            responseTime
        };
    }
}
