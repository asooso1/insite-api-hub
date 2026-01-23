import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import type { JSONSchema7 } from 'json-schema';

// ============================================
// Type Definitions
// ============================================

export interface AssertionDetail {
  type: 'schema' | 'status' | 'timing' | 'field';
  passed: boolean;
  message: string;
  expected?: any;
  actual?: any;
  path?: string;
  errors?: ErrorObject[];
}

export interface AssertionResult {
  passed: boolean;
  assertions: AssertionDetail[];
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
}

export interface FieldAssertion {
  path: string; // JSONPath-like: "data.user.email"
  rule: 'required' | 'type' | 'pattern' | 'equals' | 'contains' | 'minLength' | 'maxLength' | 'min' | 'max';
  expected: any;
  description?: string;
}

export interface AssertionConfig {
  validateSchema?: boolean; // Enable JSON Schema validation
  schemaStrict?: boolean; // Reject additional properties
  maxResponseTime?: number; // Maximum response time in ms
  expectedStatus?: number[]; // Expected HTTP status codes
  fieldAssertions?: FieldAssertion[]; // Custom field-level assertions
}

// ============================================
// Ajv Instance (singleton)
// ============================================

let ajvInstance: Ajv | null = null;

function getAjvInstance(): Ajv {
  if (!ajvInstance) {
    ajvInstance = new Ajv({
      allErrors: true, // Collect all errors
      verbose: true, // Include schema and data in errors
      strict: false, // Don't fail on unknown keywords
      validateFormats: true, // Validate format keywords
    });
    addFormats(ajvInstance); // Add format validators (email, date-time, uri, uuid, etc.)
  }
  return ajvInstance;
}

// ============================================
// Field Value Extraction
// ============================================

/**
 * Get value from nested object using dot notation path
 * Example: getFieldValue({data: {user: {name: "John"}}}, "data.user.name") => "John"
 */
export function getFieldValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Handle array indices like "users[0]"
    const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      current = current[arrayName];
      if (Array.isArray(current)) {
        current = current[parseInt(index, 10)];
      } else {
        return undefined;
      }
    } else {
      current = current[key];
    }
  }

  return current;
}

// ============================================
// Field Assertions
// ============================================

function validateFieldAssertion(
  response: any,
  assertion: FieldAssertion
): AssertionDetail {
  const value = getFieldValue(response, assertion.path);

  switch (assertion.rule) {
    case 'required':
      return {
        type: 'field',
        passed: value !== undefined && value !== null,
        message: assertion.description || `Field '${assertion.path}' is required`,
        expected: 'defined value',
        actual: value,
        path: assertion.path,
      };

    case 'type':
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      const passed = actualType === assertion.expected;
      return {
        type: 'field',
        passed,
        message: assertion.description || `Field '${assertion.path}' should be of type '${assertion.expected}'`,
        expected: assertion.expected,
        actual: actualType,
        path: assertion.path,
      };

    case 'equals':
      const isEqual = value === assertion.expected;
      return {
        type: 'field',
        passed: isEqual,
        message: assertion.description || `Field '${assertion.path}' should equal '${assertion.expected}'`,
        expected: assertion.expected,
        actual: value,
        path: assertion.path,
      };

    case 'contains':
      const contains = typeof value === 'string' && value.includes(assertion.expected);
      return {
        type: 'field',
        passed: contains,
        message: assertion.description || `Field '${assertion.path}' should contain '${assertion.expected}'`,
        expected: `contains "${assertion.expected}"`,
        actual: value,
        path: assertion.path,
      };

    case 'pattern':
      let matchesPattern = false;
      try {
        const regex = new RegExp(assertion.expected);
        matchesPattern = typeof value === 'string' && regex.test(value);
      } catch (e) {
        // Invalid regex
      }
      return {
        type: 'field',
        passed: matchesPattern,
        message: assertion.description || `Field '${assertion.path}' should match pattern '${assertion.expected}'`,
        expected: assertion.expected,
        actual: value,
        path: assertion.path,
      };

    case 'minLength':
      const hasMinLength = typeof value === 'string' && value.length >= assertion.expected;
      return {
        type: 'field',
        passed: hasMinLength,
        message: assertion.description || `Field '${assertion.path}' should have minimum length ${assertion.expected}`,
        expected: `>= ${assertion.expected}`,
        actual: typeof value === 'string' ? value.length : 'N/A',
        path: assertion.path,
      };

    case 'maxLength':
      const hasMaxLength = typeof value === 'string' && value.length <= assertion.expected;
      return {
        type: 'field',
        passed: hasMaxLength,
        message: assertion.description || `Field '${assertion.path}' should have maximum length ${assertion.expected}`,
        expected: `<= ${assertion.expected}`,
        actual: typeof value === 'string' ? value.length : 'N/A',
        path: assertion.path,
      };

    case 'min':
      const meetsMin = typeof value === 'number' && value >= assertion.expected;
      return {
        type: 'field',
        passed: meetsMin,
        message: assertion.description || `Field '${assertion.path}' should be >= ${assertion.expected}`,
        expected: `>= ${assertion.expected}`,
        actual: value,
        path: assertion.path,
      };

    case 'max':
      const meetsMax = typeof value === 'number' && value <= assertion.expected;
      return {
        type: 'field',
        passed: meetsMax,
        message: assertion.description || `Field '${assertion.path}' should be <= ${assertion.expected}`,
        expected: `<= ${assertion.expected}`,
        actual: value,
        path: assertion.path,
      };

    default:
      return {
        type: 'field',
        passed: false,
        message: `Unknown assertion rule: ${assertion.rule}`,
        path: assertion.path,
      };
  }
}

// ============================================
// Main Validation Function
// ============================================

/**
 * Validate API response against configured assertions
 */
export function validateResponse(
  response: any,
  statusCode: number,
  responseTime: number,
  schema?: JSONSchema7,
  config: AssertionConfig = {}
): AssertionResult {
  const assertions: AssertionDetail[] = [];

  // 1. Status Code Assertion
  if (config.expectedStatus && config.expectedStatus.length > 0) {
    const statusPassed = config.expectedStatus.includes(statusCode);
    assertions.push({
      type: 'status',
      passed: statusPassed,
      message: statusPassed
        ? `Status code ${statusCode} is expected`
        : `Status code ${statusCode} is not in expected range`,
      expected: config.expectedStatus.length === 1
        ? config.expectedStatus[0]
        : config.expectedStatus.join(', '),
      actual: statusCode,
    });
  }

  // 2. Response Time Assertion
  if (config.maxResponseTime && config.maxResponseTime > 0) {
    const timingPassed = responseTime <= config.maxResponseTime;
    assertions.push({
      type: 'timing',
      passed: timingPassed,
      message: timingPassed
        ? `Response time ${responseTime}ms is within limit`
        : `Response time ${responseTime}ms exceeds limit of ${config.maxResponseTime}ms`,
      expected: `<= ${config.maxResponseTime}ms`,
      actual: `${responseTime}ms`,
    });
  }

  // 3. JSON Schema Validation
  if (config.validateSchema && schema) {
    const ajv = getAjvInstance();

    // Modify schema based on strictness setting
    const schemaToUse = { ...schema };
    if (config.schemaStrict !== undefined) {
      schemaToUse.additionalProperties = !config.schemaStrict;
    }

    const validate = ajv.compile(schemaToUse);
    const valid = validate(response);

    if (valid) {
      assertions.push({
        type: 'schema',
        passed: true,
        message: 'Response matches JSON Schema',
      });
    } else {
      const errors = validate.errors || [];
      assertions.push({
        type: 'schema',
        passed: false,
        message: `Schema validation failed: ${errors.length} error(s)`,
        errors: errors,
      });

      // Add detailed error for each schema violation
      for (const error of errors.slice(0, 5)) { // Limit to 5 errors
        let errorMessage = '';
        if (error.keyword === 'required') {
          errorMessage = `Missing required field: ${error.params.missingProperty}`;
        } else if (error.keyword === 'type') {
          errorMessage = `Field '${error.instancePath}' has wrong type. Expected ${error.params.type}`;
        } else if (error.keyword === 'format') {
          errorMessage = `Field '${error.instancePath}' has invalid format. Expected ${error.params.format}`;
        } else if (error.keyword === 'additionalProperties') {
          errorMessage = `Unexpected field: ${error.params.additionalProperty}`;
        } else {
          errorMessage = `${error.instancePath || 'root'}: ${error.message}`;
        }

        assertions.push({
          type: 'schema',
          passed: false,
          message: errorMessage,
          path: error.instancePath,
          expected: error.params,
          actual: error.data,
        });
      }
    }
  }

  // 4. Custom Field Assertions
  if (config.fieldAssertions && config.fieldAssertions.length > 0) {
    for (const fieldAssertion of config.fieldAssertions) {
      const assertionResult = validateFieldAssertion(response, fieldAssertion);
      assertions.push(assertionResult);
    }
  }

  // Calculate summary
  const passedAssertions = assertions.filter(a => a.passed).length;
  const failedAssertions = assertions.filter(a => !a.passed).length;
  const totalAssertions = assertions.length;
  const passed = failedAssertions === 0 && totalAssertions > 0;

  return {
    passed,
    assertions,
    totalAssertions,
    passedAssertions,
    failedAssertions,
  };
}

// ============================================
// Error Formatting
// ============================================

/**
 * Format assertion result as human-readable string
 */
export function formatAssertionError(result: AssertionResult): string {
  if (result.passed) {
    return `✓ All ${result.totalAssertions} assertion(s) passed`;
  }

  const lines: string[] = [
    `✗ ${result.failedAssertions} of ${result.totalAssertions} assertion(s) failed:`,
    '',
  ];

  for (const assertion of result.assertions) {
    if (!assertion.passed) {
      lines.push(`  • [${assertion.type.toUpperCase()}] ${assertion.message}`);
      if (assertion.expected !== undefined) {
        lines.push(`    Expected: ${JSON.stringify(assertion.expected)}`);
      }
      if (assertion.actual !== undefined) {
        lines.push(`    Actual: ${JSON.stringify(assertion.actual)}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Format assertion result as compact summary
 */
export function formatAssertionSummary(result: AssertionResult): string {
  if (result.passed) {
    return `✓ ${result.passedAssertions}/${result.totalAssertions}`;
  }
  return `✗ ${result.passedAssertions}/${result.totalAssertions}`;
}

/**
 * Get assertion pass rate as percentage
 */
export function getAssertionPassRate(result: AssertionResult): number {
  if (result.totalAssertions === 0) return 0;
  return Math.round((result.passedAssertions / result.totalAssertions) * 100);
}

// ============================================
// Preset Configs
// ============================================

/**
 * Get predefined assertion configurations
 */
export const ASSERTION_PRESETS = {
  basic: {
    validateSchema: true,
    schemaStrict: false,
    expectedStatus: [200],
  } as AssertionConfig,

  strict: {
    validateSchema: true,
    schemaStrict: true,
    expectedStatus: [200],
    maxResponseTime: 1000,
  } as AssertionConfig,

  performance: {
    validateSchema: false,
    expectedStatus: [200],
    maxResponseTime: 500,
  } as AssertionConfig,

  minimal: {
    validateSchema: false,
    expectedStatus: [200, 201, 204],
  } as AssertionConfig,
};
