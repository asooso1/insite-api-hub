-- Migration: Add mock_configs table for Sprint 11
-- Run this on existing databases to add mock server configuration support

CREATE TABLE IF NOT EXISTS mock_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    endpoint_id UUID REFERENCES endpoints(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Default',
    enabled BOOLEAN DEFAULT TRUE,
    -- Response configuration
    status_code INTEGER DEFAULT 200,
    response_template JSONB,
    use_dynamic_generation BOOLEAN DEFAULT TRUE,
    -- Network simulation
    delay_ms INTEGER DEFAULT 0,
    delay_random_min INTEGER DEFAULT 0,
    delay_random_max INTEGER DEFAULT 0,
    use_random_delay BOOLEAN DEFAULT FALSE,
    simulate_timeout BOOLEAN DEFAULT FALSE,
    timeout_ms INTEGER DEFAULT 30000,
    simulate_network_error BOOLEAN DEFAULT FALSE,
    network_error_type TEXT DEFAULT 'CONNECTION_REFUSED',
    network_error_probability REAL DEFAULT 0.5,
    -- Scenario
    scenario_enabled BOOLEAN DEFAULT FALSE,
    scenario_config JSONB,
    sequence_enabled BOOLEAN DEFAULT FALSE,
    sequence_responses JSONB,
    -- Conditional rules
    conditional_rules JSONB,
    -- Error scenarios
    error_scenarios JSONB,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mock_configs_project_id ON mock_configs(project_id);
CREATE INDEX IF NOT EXISTS idx_mock_configs_endpoint_id ON mock_configs(endpoint_id);
