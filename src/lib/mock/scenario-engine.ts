/**
 * Stateful scenario engine for mock API responses.
 * Manages state machines and call counts to determine which response to return.
 */

// State machine for stateful mocking
export interface ScenarioState {
  name: string;
  response: {
    statusCode: number;
    body: Record<string, any>;
    headers?: Record<string, string>;
  };
}

export interface StateTransition {
  from: string;
  to: string;
  trigger: 'auto' | 'on_call' | 'condition';
  condition?: {
    field: string; // request body field path
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'exists';
    value?: any;
  };
}

export interface ScenarioConfig {
  states: ScenarioState[];
  transitions: StateTransition[];
  initialState: string;
}

// Sequence responses based on call count
export interface SequenceResponse {
  callNumber: number; // which call number triggers this (1-indexed)
  statusCode: number;
  body: Record<string, any>;
  headers?: Record<string, string>;
}

// Conditional response rules
export interface ConditionalRule {
  condition: {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'exists' | 'matches';
    value?: any;
  };
  response: {
    statusCode: number;
    body: Record<string, any>;
    headers?: Record<string, string>;
  };
}

export interface MockResponse {
  statusCode: number;
  body: Record<string, any>;
  headers?: Record<string, string>;
}

// Error scenarios
export type ErrorScenarioType =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMITED';

export interface ErrorScenario {
  type: ErrorScenarioType;
  probability: number; // 0-1, chance of this error occurring
  response?: Partial<MockResponse>;
}

/**
 * Evaluate a condition against a request body.
 * Supports deep field access with dot notation (e.g., "user.name").
 */
export function evaluateCondition(
  condition: ConditionalRule['condition'],
  requestBody: Record<string, any>
): boolean {
  const { field, operator, value } = condition;

  // Get value from request body using dot notation
  const fieldValue = field.split('.').reduce((obj, key) => {
    return obj?.[key];
  }, requestBody as any);

  switch (operator) {
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;

    case 'eq':
      return fieldValue === value;

    case 'neq':
      return fieldValue !== value;

    case 'gt':
      return typeof fieldValue === 'number' && fieldValue > value;

    case 'lt':
      return typeof fieldValue === 'number' && fieldValue < value;

    case 'contains':
      if (typeof fieldValue === 'string') {
        return fieldValue.includes(value);
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(value);
      }
      return false;

    case 'matches':
      if (typeof fieldValue === 'string' && typeof value === 'string') {
        const regex = new RegExp(value);
        return regex.test(fieldValue);
      }
      return false;

    default:
      return false;
  }
}

/**
 * Get standard error response for a given error type.
 */
export function getErrorResponse(type: ErrorScenarioType): MockResponse {
  const errorResponses: Record<ErrorScenarioType, MockResponse> = {
    BAD_REQUEST: {
      statusCode: 400,
      body: {
        error: 'Bad Request',
        message: 'The request was invalid or cannot be processed.',
      },
    },
    UNAUTHORIZED: {
      statusCode: 401,
      body: {
        error: 'Unauthorized',
        message: 'Authentication is required to access this resource.',
      },
    },
    FORBIDDEN: {
      statusCode: 403,
      body: {
        error: 'Forbidden',
        message: 'You do not have permission to access this resource.',
      },
    },
    NOT_FOUND: {
      statusCode: 404,
      body: {
        error: 'Not Found',
        message: 'The requested resource was not found.',
      },
    },
    INTERNAL_SERVER_ERROR: {
      statusCode: 500,
      body: {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred on the server.',
      },
    },
    SERVICE_UNAVAILABLE: {
      statusCode: 503,
      body: {
        error: 'Service Unavailable',
        message: 'The service is temporarily unavailable. Please try again later.',
      },
    },
    RATE_LIMITED: {
      statusCode: 429,
      body: {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      },
      headers: {
        'Retry-After': '60',
      },
    },
  };

  return errorResponses[type];
}

/**
 * ScenarioEngine manages stateful mock API responses.
 * Handles state machines, sequences, conditional rules, and error scenarios.
 */
export class ScenarioEngine {
  // Map of endpoint ID to current state name
  private states = new Map<string, string>();

  // Map of endpoint ID to call count
  private callCounts = new Map<string, number>();

  /**
   * Process a scenario state machine.
   * Returns the response for the current state and advances state if needed.
   */
  processScenario(
    endpointId: string,
    config: ScenarioConfig,
    requestBody?: Record<string, any>
  ): MockResponse {
    // Get current state or use initial state
    let currentStateName = this.states.get(endpointId) || config.initialState;

    // Find current state config
    const currentState = config.states.find((s) => s.name === currentStateName);
    if (!currentState) {
      throw new Error(`State '${currentStateName}' not found in scenario config`);
    }

    // Check for state transitions
    const matchingTransition = config.transitions.find((transition) => {
      if (transition.from !== currentStateName) {
        return false;
      }

      if (transition.trigger === 'auto') {
        return true;
      }

      if (transition.trigger === 'on_call') {
        return true;
      }

      if (transition.trigger === 'condition' && transition.condition && requestBody) {
        return evaluateCondition(transition.condition, requestBody);
      }

      return false;
    });

    // Advance state if transition found
    if (matchingTransition) {
      this.states.set(endpointId, matchingTransition.to);
    } else {
      // Update state even if no transition (to initialize on first call)
      this.states.set(endpointId, currentStateName);
    }

    return {
      statusCode: currentState.response.statusCode,
      body: currentState.response.body,
      headers: currentState.response.headers,
    };
  }

  /**
   * Process sequence responses based on call count.
   * Returns matching sequence response or default.
   */
  processSequence(
    endpointId: string,
    sequences: SequenceResponse[],
    defaultResponse: MockResponse
  ): MockResponse {
    // Increment call count
    const currentCount = (this.callCounts.get(endpointId) || 0) + 1;
    this.callCounts.set(endpointId, currentCount);

    // Find matching sequence
    const matchingSequence = sequences.find((seq) => seq.callNumber === currentCount);

    if (matchingSequence) {
      return {
        statusCode: matchingSequence.statusCode,
        body: matchingSequence.body,
        headers: matchingSequence.headers,
      };
    }

    return defaultResponse;
  }

  /**
   * Process conditional rules.
   * Returns first matching rule's response or default.
   */
  processConditionalRules(
    rules: ConditionalRule[],
    requestBody: Record<string, any>,
    defaultResponse: MockResponse
  ): MockResponse {
    for (const rule of rules) {
      if (evaluateCondition(rule.condition, requestBody)) {
        return {
          statusCode: rule.response.statusCode,
          body: rule.response.body,
          headers: rule.response.headers,
        };
      }
    }

    return defaultResponse;
  }

  /**
   * Process error scenarios based on probability.
   * Returns error response if triggered, null otherwise.
   */
  processErrorScenario(errors: ErrorScenario[]): MockResponse | null {
    for (const errorScenario of errors) {
      if (Math.random() < errorScenario.probability) {
        const baseResponse = getErrorResponse(errorScenario.type);

        if (errorScenario.response) {
          return {
            statusCode: errorScenario.response.statusCode ?? baseResponse.statusCode,
            body: errorScenario.response.body ?? baseResponse.body,
            headers: errorScenario.response.headers ?? baseResponse.headers,
          };
        }

        return baseResponse;
      }
    }

    return null;
  }

  /**
   * Get current call count for an endpoint.
   */
  getCallCount(endpointId: string): number {
    return this.callCounts.get(endpointId) || 0;
  }

  /**
   * Get current state for an endpoint.
   */
  getCurrentState(endpointId: string): string | null {
    return this.states.get(endpointId) || null;
  }

  /**
   * Reset state and call count for a specific endpoint.
   */
  resetEndpoint(endpointId: string): void {
    this.states.delete(endpointId);
    this.callCounts.delete(endpointId);
  }

  /**
   * Reset all states and call counts.
   */
  resetAll(): void {
    this.states.clear();
    this.callCounts.clear();
  }
}

// Singleton instance
export const scenarioEngine = new ScenarioEngine();
