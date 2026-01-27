'use server';

import { db } from '@/lib/db';
import { scenarioEngine } from '@/lib/mock/scenario-engine';

// Type definitions
export interface MockConfig {
  id: string;
  projectId: string;
  endpointId: string;
  name: string;
  enabled: boolean;
  statusCode: number;
  responseTemplate: Record<string, any> | null;
  useDynamicGeneration: boolean;
  delayMs: number;
  delayRandomMin: number;
  delayRandomMax: number;
  useRandomDelay: boolean;
  simulateTimeout: boolean;
  timeoutMs: number;
  simulateNetworkError: boolean;
  networkErrorType: string;
  networkErrorProbability: number;
  scenarioEnabled: boolean;
  scenarioConfig: any | null;
  sequenceEnabled: boolean;
  sequenceResponses: any[] | null;
  conditionalRules: any[] | null;
  errorScenarios: any[] | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get mock configuration for a specific endpoint
 */
export async function getMockConfig(endpointId: string): Promise<MockConfig | null> {
  const result = await db.query<MockConfig>(
    `SELECT
      id,
      project_id as "projectId",
      endpoint_id as "endpointId",
      name,
      enabled,
      status_code as "statusCode",
      response_template as "responseTemplate",
      use_dynamic_generation as "useDynamicGeneration",
      delay_ms as "delayMs",
      delay_random_min as "delayRandomMin",
      delay_random_max as "delayRandomMax",
      use_random_delay as "useRandomDelay",
      simulate_timeout as "simulateTimeout",
      timeout_ms as "timeoutMs",
      simulate_network_error as "simulateNetworkError",
      network_error_type as "networkErrorType",
      network_error_probability as "networkErrorProbability",
      scenario_enabled as "scenarioEnabled",
      scenario_config as "scenarioConfig",
      sequence_enabled as "sequenceEnabled",
      sequence_responses as "sequenceResponses",
      conditional_rules as "conditionalRules",
      error_scenarios as "errorScenarios",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM mock_configs
    WHERE endpoint_id = $1
    LIMIT 1`,
    [endpointId]
  );

  return result.rows[0] || null;
}

/**
 * Get all mock configurations for a project
 */
export async function getMockConfigsByProject(projectId: string): Promise<MockConfig[]> {
  const result = await db.query<MockConfig>(
    `SELECT
      id,
      project_id as "projectId",
      endpoint_id as "endpointId",
      name,
      enabled,
      status_code as "statusCode",
      response_template as "responseTemplate",
      use_dynamic_generation as "useDynamicGeneration",
      delay_ms as "delayMs",
      delay_random_min as "delayRandomMin",
      delay_random_max as "delayRandomMax",
      use_random_delay as "useRandomDelay",
      simulate_timeout as "simulateTimeout",
      timeout_ms as "timeoutMs",
      simulate_network_error as "simulateNetworkError",
      network_error_type as "networkErrorType",
      network_error_probability as "networkErrorProbability",
      scenario_enabled as "scenarioEnabled",
      scenario_config as "scenarioConfig",
      sequence_enabled as "sequenceEnabled",
      sequence_responses as "sequenceResponses",
      conditional_rules as "conditionalRules",
      error_scenarios as "errorScenarios",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM mock_configs
    WHERE project_id = $1
    ORDER BY created_at DESC`,
    [projectId]
  );

  return result.rows;
}

/**
 * Create a new mock configuration
 */
export async function createMockConfig(
  data: Partial<MockConfig> & { projectId: string; endpointId: string }
): Promise<MockConfig> {
  const result = await db.query<MockConfig>(
    `INSERT INTO mock_configs (
      project_id,
      endpoint_id,
      name,
      enabled,
      status_code,
      response_template,
      use_dynamic_generation,
      delay_ms,
      delay_random_min,
      delay_random_max,
      use_random_delay,
      simulate_timeout,
      timeout_ms,
      simulate_network_error,
      network_error_type,
      network_error_probability,
      scenario_enabled,
      scenario_config,
      sequence_enabled,
      sequence_responses,
      conditional_rules,
      error_scenarios
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
    )
    RETURNING
      id,
      project_id as "projectId",
      endpoint_id as "endpointId",
      name,
      enabled,
      status_code as "statusCode",
      response_template as "responseTemplate",
      use_dynamic_generation as "useDynamicGeneration",
      delay_ms as "delayMs",
      delay_random_min as "delayRandomMin",
      delay_random_max as "delayRandomMax",
      use_random_delay as "useRandomDelay",
      simulate_timeout as "simulateTimeout",
      timeout_ms as "timeoutMs",
      simulate_network_error as "simulateNetworkError",
      network_error_type as "networkErrorType",
      network_error_probability as "networkErrorProbability",
      scenario_enabled as "scenarioEnabled",
      scenario_config as "scenarioConfig",
      sequence_enabled as "sequenceEnabled",
      sequence_responses as "sequenceResponses",
      conditional_rules as "conditionalRules",
      error_scenarios as "errorScenarios",
      created_at as "createdAt",
      updated_at as "updatedAt"`,
    [
      data.projectId,
      data.endpointId,
      data.name ?? 'Default',
      data.enabled ?? true,
      data.statusCode ?? 200,
      data.responseTemplate ? JSON.stringify(data.responseTemplate) : null,
      data.useDynamicGeneration ?? true,
      data.delayMs ?? 0,
      data.delayRandomMin ?? 0,
      data.delayRandomMax ?? 0,
      data.useRandomDelay ?? false,
      data.simulateTimeout ?? false,
      data.timeoutMs ?? 30000,
      data.simulateNetworkError ?? false,
      data.networkErrorType ?? 'CONNECTION_REFUSED',
      data.networkErrorProbability ?? 0.5,
      data.scenarioEnabled ?? false,
      data.scenarioConfig ? JSON.stringify(data.scenarioConfig) : null,
      data.sequenceEnabled ?? false,
      data.sequenceResponses ? JSON.stringify(data.sequenceResponses) : null,
      data.conditionalRules ? JSON.stringify(data.conditionalRules) : null,
      data.errorScenarios ? JSON.stringify(data.errorScenarios) : null,
    ]
  );

  return result.rows[0];
}

/**
 * Update an existing mock configuration
 */
export async function updateMockConfig(
  id: string,
  data: Partial<MockConfig>
): Promise<MockConfig> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // Build dynamic SET clause
  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.enabled !== undefined) {
    fields.push(`enabled = $${paramIndex++}`);
    values.push(data.enabled);
  }
  if (data.statusCode !== undefined) {
    fields.push(`status_code = $${paramIndex++}`);
    values.push(data.statusCode);
  }
  if (data.responseTemplate !== undefined) {
    fields.push(`response_template = $${paramIndex++}`);
    values.push(data.responseTemplate ? JSON.stringify(data.responseTemplate) : null);
  }
  if (data.useDynamicGeneration !== undefined) {
    fields.push(`use_dynamic_generation = $${paramIndex++}`);
    values.push(data.useDynamicGeneration);
  }
  if (data.delayMs !== undefined) {
    fields.push(`delay_ms = $${paramIndex++}`);
    values.push(data.delayMs);
  }
  if (data.delayRandomMin !== undefined) {
    fields.push(`delay_random_min = $${paramIndex++}`);
    values.push(data.delayRandomMin);
  }
  if (data.delayRandomMax !== undefined) {
    fields.push(`delay_random_max = $${paramIndex++}`);
    values.push(data.delayRandomMax);
  }
  if (data.useRandomDelay !== undefined) {
    fields.push(`use_random_delay = $${paramIndex++}`);
    values.push(data.useRandomDelay);
  }
  if (data.simulateTimeout !== undefined) {
    fields.push(`simulate_timeout = $${paramIndex++}`);
    values.push(data.simulateTimeout);
  }
  if (data.timeoutMs !== undefined) {
    fields.push(`timeout_ms = $${paramIndex++}`);
    values.push(data.timeoutMs);
  }
  if (data.simulateNetworkError !== undefined) {
    fields.push(`simulate_network_error = $${paramIndex++}`);
    values.push(data.simulateNetworkError);
  }
  if (data.networkErrorType !== undefined) {
    fields.push(`network_error_type = $${paramIndex++}`);
    values.push(data.networkErrorType);
  }
  if (data.networkErrorProbability !== undefined) {
    fields.push(`network_error_probability = $${paramIndex++}`);
    values.push(data.networkErrorProbability);
  }
  if (data.scenarioEnabled !== undefined) {
    fields.push(`scenario_enabled = $${paramIndex++}`);
    values.push(data.scenarioEnabled);
  }
  if (data.scenarioConfig !== undefined) {
    fields.push(`scenario_config = $${paramIndex++}`);
    values.push(data.scenarioConfig ? JSON.stringify(data.scenarioConfig) : null);
  }
  if (data.sequenceEnabled !== undefined) {
    fields.push(`sequence_enabled = $${paramIndex++}`);
    values.push(data.sequenceEnabled);
  }
  if (data.sequenceResponses !== undefined) {
    fields.push(`sequence_responses = $${paramIndex++}`);
    values.push(data.sequenceResponses ? JSON.stringify(data.sequenceResponses) : null);
  }
  if (data.conditionalRules !== undefined) {
    fields.push(`conditional_rules = $${paramIndex++}`);
    values.push(data.conditionalRules ? JSON.stringify(data.conditionalRules) : null);
  }
  if (data.errorScenarios !== undefined) {
    fields.push(`error_scenarios = $${paramIndex++}`);
    values.push(data.errorScenarios ? JSON.stringify(data.errorScenarios) : null);
  }

  // Always update updated_at
  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  // Add id as the last parameter
  values.push(id);

  const result = await db.query<MockConfig>(
    `UPDATE mock_configs
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING
      id,
      project_id as "projectId",
      endpoint_id as "endpointId",
      name,
      enabled,
      status_code as "statusCode",
      response_template as "responseTemplate",
      use_dynamic_generation as "useDynamicGeneration",
      delay_ms as "delayMs",
      delay_random_min as "delayRandomMin",
      delay_random_max as "delayRandomMax",
      use_random_delay as "useRandomDelay",
      simulate_timeout as "simulateTimeout",
      timeout_ms as "timeoutMs",
      simulate_network_error as "simulateNetworkError",
      network_error_type as "networkErrorType",
      network_error_probability as "networkErrorProbability",
      scenario_enabled as "scenarioEnabled",
      scenario_config as "scenarioConfig",
      sequence_enabled as "sequenceEnabled",
      sequence_responses as "sequenceResponses",
      conditional_rules as "conditionalRules",
      error_scenarios as "errorScenarios",
      created_at as "createdAt",
      updated_at as "updatedAt"`,
    values
  );

  return result.rows[0];
}

/**
 * Delete a mock configuration
 */
export async function deleteMockConfig(id: string): Promise<void> {
  await db.query('DELETE FROM mock_configs WHERE id = $1', [id]);
}

/**
 * Toggle mock configuration enabled/disabled state
 */
export async function toggleMockConfig(id: string, enabled: boolean): Promise<void> {
  await db.query(
    'UPDATE mock_configs SET enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [enabled, id]
  );
}

/**
 * Reset scenario engine state for an endpoint
 */
export async function resetMockState(endpointId: string): Promise<void> {
  scenarioEngine.resetEndpoint(endpointId);
}
