/**
 * Network Simulation Utility
 *
 * Provides network condition simulation for mock server including:
 * - Configurable delays (fixed or random)
 * - Timeout simulation
 * - Network error simulation with configurable probability
 */

// ============================================================================
// Types
// ============================================================================

export interface DelayConfig {
  enabled: boolean;
  fixedMs?: number;            // Fixed delay in ms
  randomMin?: number;          // Random range min
  randomMax?: number;          // Random range max
  useRandom: boolean;
}

export interface TimeoutConfig {
  enabled: boolean;
  timeoutMs: number;           // Time before simulated timeout
}

export interface NetworkErrorConfig {
  enabled: boolean;
  errorType: NetworkErrorType;
  probability: number;          // 0-1, chance of error
}

export type NetworkErrorType =
  | 'CONNECTION_REFUSED'
  | 'CONNECTION_RESET'
  | 'DNS_RESOLUTION'
  | 'SSL_HANDSHAKE'
  | 'GATEWAY_TIMEOUT';

export interface NetworkSimulationConfig {
  delay?: DelayConfig;
  timeout?: TimeoutConfig;
  networkError?: NetworkErrorConfig;
}

export interface NetworkSimulationResult {
  shouldError: boolean;
  errorResponse?: {
    status: number;
    body: Record<string, any>;
  };
  appliedDelayMs: number;
}

// ============================================================================
// Core Simulation Function
// ============================================================================

/**
 * Simulates network conditions including delays, timeouts, and errors.
 *
 * @param config - Network simulation configuration
 * @returns Result indicating if error should occur and what delay was applied
 */
export async function simulateNetworkConditions(
  config: NetworkSimulationConfig
): Promise<NetworkSimulationResult> {
  const result: NetworkSimulationResult = {
    shouldError: false,
    appliedDelayMs: 0,
  };

  // Check if network error should be triggered
  if (config.networkError?.enabled) {
    const shouldTriggerError = Math.random() < config.networkError.probability;

    if (shouldTriggerError) {
      result.shouldError = true;
      result.errorResponse = getNetworkErrorResponse(config.networkError.errorType);
      return result;
    }
  }

  // Check if timeout should be triggered
  if (config.timeout?.enabled) {
    const timeoutDelay = config.timeout.timeoutMs;

    // Check if delay would exceed timeout
    const estimatedDelay = config.delay?.enabled
      ? (config.delay.useRandom
          ? ((config.delay.randomMin ?? 0) + (config.delay.randomMax ?? 0)) / 2
          : config.delay.fixedMs || 0)
      : 0;

    if (estimatedDelay >= timeoutDelay) {
      result.shouldError = true;
      result.errorResponse = getNetworkErrorResponse('GATEWAY_TIMEOUT');
      return result;
    }
  }

  // Apply delay if configured
  if (config.delay?.enabled) {
    result.appliedDelayMs = await applyDelay(config.delay);
  }

  return result;
}

// ============================================================================
// Delay Functions
// ============================================================================

/**
 * Applies delay based on configuration (fixed or random).
 *
 * @param config - Delay configuration
 * @returns Actual delay applied in milliseconds
 */
export async function applyDelay(config: DelayConfig): Promise<number> {
  if (!config.enabled) {
    return 0;
  }

  let delayMs: number;

  if (config.useRandom) {
    const min = config.randomMin || 0;
    const max = config.randomMax || 0;
    delayMs = Math.floor(Math.random() * (max - min + 1)) + min;
  } else {
    delayMs = config.fixedMs || 0;
  }

  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  return delayMs;
}

// ============================================================================
// Error Response Generation
// ============================================================================

/**
 * Generates appropriate HTTP error response for given network error type.
 *
 * @param errorType - Type of network error to simulate
 * @returns Object containing status code and error body
 */
export function getNetworkErrorResponse(
  errorType: NetworkErrorType
): { status: number; body: Record<string, any> } {
  const errorResponses = {
    CONNECTION_REFUSED: {
      status: 502,
      body: {
        error: 'Bad Gateway',
        message: 'Connection refused by target server',
        code: 'CONNECTION_REFUSED',
      },
    },
    CONNECTION_RESET: {
      status: 502,
      body: {
        error: 'Bad Gateway',
        message: 'Connection reset by peer',
        code: 'CONNECTION_RESET',
      },
    },
    DNS_RESOLUTION: {
      status: 502,
      body: {
        error: 'Bad Gateway',
        message: 'DNS resolution failed',
        code: 'DNS_RESOLUTION',
      },
    },
    SSL_HANDSHAKE: {
      status: 502,
      body: {
        error: 'Bad Gateway',
        message: 'SSL handshake failed',
        code: 'SSL_HANDSHAKE',
      },
    },
    GATEWAY_TIMEOUT: {
      status: 504,
      body: {
        error: 'Gateway Timeout',
        message: 'Gateway timeout',
        code: 'GATEWAY_TIMEOUT',
      },
    },
  };

  return errorResponses[errorType];
}

// ============================================================================
// Preset Latency Profiles
// ============================================================================

/**
 * Generates a complete network simulation configuration for common latency profiles.
 *
 * @param type - Latency profile type
 * @returns Network simulation configuration
 */
export function generateLatencyProfile(
  type: 'fast' | 'normal' | 'slow' | '3g' | 'offline'
): NetworkSimulationConfig {
  const profiles: Record<string, NetworkSimulationConfig> = {
    fast: {
      delay: {
        enabled: true,
        randomMin: 10,
        randomMax: 50,
        useRandom: true,
      },
    },
    normal: {
      delay: {
        enabled: true,
        randomMin: 50,
        randomMax: 200,
        useRandom: true,
      },
    },
    slow: {
      delay: {
        enabled: true,
        randomMin: 200,
        randomMax: 1000,
        useRandom: true,
      },
    },
    '3g': {
      delay: {
        enabled: true,
        randomMin: 500,
        randomMax: 3000,
        useRandom: true,
      },
      networkError: {
        enabled: true,
        errorType: 'GATEWAY_TIMEOUT',
        probability: 0.05, // 5% chance of timeout
      },
    },
    offline: {
      networkError: {
        enabled: true,
        errorType: 'CONNECTION_REFUSED',
        probability: 1.0, // Always fail
      },
    },
  };

  return profiles[type];
}
