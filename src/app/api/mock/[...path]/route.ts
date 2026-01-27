import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateMockData, generateMockDataFromTemplate } from '@/lib/mock/data-generator';
import { scenarioEngine } from '@/lib/mock/scenario-engine';
import { simulateNetworkConditions } from '@/lib/mock/network-simulator';
import type { ApiModel, ApiField } from '@/lib/api-types';
import type { NetworkSimulationConfig } from '@/lib/mock/network-simulator';
import type { MockResponse } from '@/lib/mock/scenario-engine';

const RESERVED_PREFIXES = ['admin', 'auth', '_next', 'favicon.ico'];

interface MockConfigRow {
  id: string;
  endpoint_id: string;
  name: string;
  enabled: boolean;
  status_code: number;
  response_template: Record<string, any> | null;
  use_dynamic_generation: boolean;
  delay_ms: number;
  delay_random_min: number;
  delay_random_max: number;
  use_random_delay: boolean;
  simulate_timeout: boolean;
  timeout_ms: number;
  simulate_network_error: boolean;
  network_error_type: string;
  network_error_probability: number;
  scenario_enabled: boolean;
  scenario_config: any;
  sequence_enabled: boolean;
  sequence_responses: any;
  conditional_rules: any;
  error_scenarios: any;
}

interface EndpointRow {
  id: string;
  summary: string;
  response_type: string | null;
  project_id: string;
}

async function handleMockRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const segments = params.path;
    const firstSegment = segments[0];

    // Avoid hijacking internal routes
    if (RESERVED_PREFIXES.includes(firstSegment)) {
      return NextResponse.json(
        { error: 'Not Found' },
        { status: 404 }
      );
    }

    const pathWithSlash = '/' + segments.join('/');
    const pathWithoutSlash = segments.join('/');
    const method = request.method;

    // Query the endpoint
    const endpointResult = await db.query<EndpointRow>(
      "SELECT id, summary, response_type, project_id FROM endpoints WHERE (path = $1 OR path = $2) AND method = $3 LIMIT 1",
      [pathWithSlash, pathWithoutSlash, method]
    );

    if (endpointResult.rows.length === 0) {
      return NextResponse.json(
        { error: `API Hub: Endpoint [${pathWithSlash}] not registered` },
        { status: 404 }
      );
    }

    const endpoint = endpointResult.rows[0];
    let appliedDelayMs = 0;

    // Check for mock configuration
    const mockConfigResult = await db.query<MockConfigRow>(
      "SELECT * FROM mock_configs WHERE endpoint_id = $1 AND enabled = true LIMIT 1",
      [endpoint.id]
    );

    if (mockConfigResult.rows.length > 0) {
      const mockConfig = mockConfigResult.rows[0];

      // 1. Apply network simulation first
      const networkConfig: NetworkSimulationConfig = {
        delay: {
          enabled: mockConfig.delay_ms > 0 || mockConfig.use_random_delay,
          fixedMs: mockConfig.delay_ms,
          randomMin: mockConfig.delay_random_min,
          randomMax: mockConfig.delay_random_max,
          useRandom: mockConfig.use_random_delay,
        },
        timeout: {
          enabled: mockConfig.simulate_timeout,
          timeoutMs: mockConfig.timeout_ms,
        },
        networkError: {
          enabled: mockConfig.simulate_network_error,
          errorType: mockConfig.network_error_type as any,
          probability: mockConfig.network_error_probability,
        },
      };

      const simulationResult = await simulateNetworkConditions(networkConfig);
      appliedDelayMs = simulationResult.appliedDelayMs;

      if (simulationResult.shouldError && simulationResult.errorResponse) {
        const response = NextResponse.json(
          simulationResult.errorResponse.body,
          { status: simulationResult.errorResponse.status }
        );
        response.headers.set('X-Mock-Server', 'API-Hub');
        response.headers.set('X-Mock-Delay', String(appliedDelayMs));
        response.headers.set('X-Mock-Endpoint', endpoint.id);
        return response;
      }

      // 2. Check error scenarios
      if (mockConfig.error_scenarios) {
        const errorResponse = scenarioEngine.processErrorScenario(mockConfig.error_scenarios);
        if (errorResponse) {
          const response = NextResponse.json(
            errorResponse.body,
            { status: errorResponse.statusCode, headers: errorResponse.headers }
          );
          response.headers.set('X-Mock-Server', 'API-Hub');
          response.headers.set('X-Mock-Delay', String(appliedDelayMs));
          response.headers.set('X-Mock-Endpoint', endpoint.id);
          return response;
        }
      }

      // 3. Parse request body if present
      let requestBody: Record<string, any> = {};
      try {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const text = await request.text();
          if (text) {
            requestBody = JSON.parse(text);
          }
        }
      } catch (parseError) {
        console.warn('[Mock Server] Failed to parse request body:', parseError);
      }

      let finalResponse: MockResponse | null = null;

      // 4. Process scenario (state machine)
      if (mockConfig.scenario_enabled && mockConfig.scenario_config) {
        try {
          finalResponse = scenarioEngine.processScenario(
            endpoint.id,
            mockConfig.scenario_config,
            requestBody
          );
        } catch (scenarioError) {
          console.error('[Mock Server] Scenario processing error:', scenarioError);
        }
      }

      // 5. Process sequence (call count based)
      if (!finalResponse && mockConfig.sequence_enabled && mockConfig.sequence_responses) {
        const defaultResponse: MockResponse = {
          statusCode: mockConfig.status_code,
          body: mockConfig.response_template || { message: 'Default sequence response' },
        };

        finalResponse = scenarioEngine.processSequence(
          endpoint.id,
          mockConfig.sequence_responses,
          defaultResponse
        );
      }

      // 6. Process conditional rules
      if (!finalResponse && mockConfig.conditional_rules && Object.keys(requestBody).length > 0) {
        const defaultResponse: MockResponse = {
          statusCode: mockConfig.status_code,
          body: mockConfig.response_template || { message: 'Default conditional response' },
        };

        finalResponse = scenarioEngine.processConditionalRules(
          mockConfig.conditional_rules,
          requestBody,
          defaultResponse
        );
      }

      // 7. Generate dynamic response
      if (!finalResponse && mockConfig.use_dynamic_generation && endpoint.response_type) {
        try {
          // Fetch the response model
          const modelResult = await db.query<{ id: string; name: string; fields: ApiField[] }>(
            "SELECT id, name, fields FROM api_models WHERE project_id = $1 AND name = $2 LIMIT 1",
            [endpoint.project_id, endpoint.response_type]
          );

          if (modelResult.rows.length > 0) {
            const responseModel = modelResult.rows[0];

            // Fetch all models for nested references
            const allModelsResult = await db.query<{ id: string; name: string; fields: ApiField[] }>(
              "SELECT id, name, fields FROM api_models WHERE project_id = $1",
              [endpoint.project_id]
            );

            const allModels: ApiModel[] = allModelsResult.rows.map(row => ({
              id: row.id,
              name: row.name,
              fields: row.fields,
            }));

            let generatedBody: Record<string, any>;

            if (mockConfig.response_template) {
              // Use template with generated data as fallback
              generatedBody = generateMockDataFromTemplate(
                mockConfig.response_template,
                responseModel,
                allModels
              );
            } else {
              // Generate from scratch
              generatedBody = generateMockData(responseModel, allModels);
            }

            finalResponse = {
              statusCode: mockConfig.status_code,
              body: generatedBody,
            };
          }
        } catch (generationError) {
          console.error('[Mock Server] Dynamic generation error:', generationError);
        }
      }

      // 8. Fallback to response template if exists
      if (!finalResponse && mockConfig.response_template) {
        finalResponse = {
          statusCode: mockConfig.status_code,
          body: mockConfig.response_template,
        };
      }

      // 9. Return final response
      if (finalResponse) {
        const response = NextResponse.json(
          finalResponse.body,
          { status: finalResponse.statusCode, headers: finalResponse.headers }
        );
        response.headers.set('X-Mock-Server', 'API-Hub');
        response.headers.set('X-Mock-Delay', String(appliedDelayMs));
        response.headers.set('X-Mock-Endpoint', endpoint.id);
        return response;
      }
    }

    // No mock config or mock config didn't produce response
    // Try to generate dynamic response from endpoint's response_type
    if (endpoint.response_type) {
      try {
        const modelResult = await db.query<{ id: string; name: string; fields: ApiField[] }>(
          "SELECT id, name, fields FROM api_models WHERE project_id = $1 AND name = $2 LIMIT 1",
          [endpoint.project_id, endpoint.response_type]
        );

        if (modelResult.rows.length > 0) {
          const responseModel = modelResult.rows[0];

          const allModelsResult = await db.query<{ id: string; name: string; fields: ApiField[] }>(
            "SELECT id, name, fields FROM api_models WHERE project_id = $1",
            [endpoint.project_id]
          );

          const allModels: ApiModel[] = allModelsResult.rows.map(row => ({
            id: row.id,
            name: row.name,
            fields: row.fields,
          }));

          const generatedBody = generateMockData(responseModel, allModels);

          const response = NextResponse.json(generatedBody, { status: 200 });
          response.headers.set('X-Mock-Server', 'API-Hub');
          response.headers.set('X-Mock-Delay', '0');
          response.headers.set('X-Mock-Endpoint', endpoint.id);
          return response;
        }
      } catch (dynamicError) {
        console.error('[Mock Server] Fallback dynamic generation error:', dynamicError);
      }
    }

    // Final fallback: Return basic metadata response (backward compatible)
    const response = NextResponse.json({
      success: true,
      message: `Global Mock response for ${pathWithSlash}`,
      endpointId: endpoint.id,
      summary: endpoint.summary,
      timestamp: new Date().toISOString(),
    });
    response.headers.set('X-Mock-Server', 'API-Hub');
    response.headers.set('X-Mock-Delay', '0');
    response.headers.set('X-Mock-Endpoint', endpoint.id);
    return response;
  } catch (error) {
    console.error('[Mock Server] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleMockRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleMockRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleMockRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleMockRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handleMockRequest(request, context);
}
