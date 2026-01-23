# Auto Assertion Generation

Comprehensive API response validation system with automatic JSON Schema generation from DTO models.

## Overview

The Auto Assertion Generation feature provides automated validation of API responses against expected schemas and custom assertions. It generates JSON Schemas from your DTO models and validates responses using industry-standard validation (Ajv).

## Features

### 1. Automatic JSON Schema Generation
- Converts DTO/Model definitions to JSON Schema (Draft 7)
- Smart field format detection (email, uuid, date-time, uri, etc.)
- Supports nested objects and arrays
- Handles complex type references
- Configurable strict/relaxed modes

### 2. Comprehensive Validation
- **Schema Validation**: Validates response structure against JSON Schema
- **Status Code Validation**: Checks HTTP status codes
- **Performance Validation**: Response time thresholds
- **Custom Field Assertions**: Granular field-level validation rules

### 3. User-Friendly UI
- Visual assertion builder with drag-and-drop
- Preset templates (Basic, Strict, Performance, Minimal)
- Real-time schema preview
- Assertion results visualization
- Excel export with assertion data

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Hub Application                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │  AssertionBuilder│──────│  TestDashboard   │           │
│  │  (UI Component)  │      │  (Results View)  │           │
│  └────────┬─────────┘      └──────────────────┘           │
│           │                                                 │
│           │ saves config                                    │
│           ▼                                                 │
│  ┌──────────────────┐                                      │
│  │  Batch Test      │──┐                                   │
│  │  (batch-test.ts) │  │                                   │
│  └──────────────────┘  │                                   │
│           │             │                                   │
│           │             │ generates                         │
│           ▼             ▼                                   │
│  ┌──────────────────────────────────────┐                 │
│  │     Assertion Validation System      │                 │
│  ├──────────────────────────────────────┤                 │
│  │  schema-generator.ts                 │                 │
│  │  - dtoToJsonSchema()                 │                 │
│  │  - generateFieldSchema()             │                 │
│  │  - inferFieldFormat()                │                 │
│  │                                      │                 │
│  │  assertion-validator.ts              │                 │
│  │  - validateResponse()                │                 │
│  │  - validateFieldAssertion()          │                 │
│  │  - formatAssertionError()            │                 │
│  └──────────────────────────────────────┘                 │
│           │                                                 │
│           │ uses                                           │
│           ▼                                                 │
│  ┌──────────────────┐                                      │
│  │   Ajv + Formats  │                                      │
│  │  (JSON Schema    │                                      │
│  │   Validator)     │                                      │
│  └──────────────────┘                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
src/
├── lib/
│   ├── schema-generator.ts        # DTO → JSON Schema conversion
│   ├── assertion-validator.ts     # Response validation engine
│   └── api-types.ts               # Type definitions
├── components/
│   ├── AssertionBuilder.tsx       # Configuration UI
│   ├── TestDashboard.tsx          # Results display (updated)
│   └── AssertionDemo.tsx          # Demo/documentation
└── app/actions/
    └── batch-test.ts              # Batch testing (updated)
```

## Usage

### 1. Generate JSON Schema

```typescript
import { dtoToJsonSchema } from '@/lib/schema-generator';
import { ApiModel } from '@/lib/api-types';

const userModel: ApiModel = {
  name: 'UserResponse',
  fields: [
    { name: 'id', type: 'UUID', isRequired: true },
    { name: 'email', type: 'String', isRequired: true },
    { name: 'name', type: 'String', isRequired: true },
    { name: 'age', type: 'Integer', isRequired: false },
  ]
};

const schema = dtoToJsonSchema(userModel, allModels);
```

**Generated Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "UserResponse",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "email": { "type": "string", "format": "email", "minLength": 1 },
    "name": { "type": "string", "minLength": 1 },
    "age": { "type": "integer" }
  },
  "required": ["id", "email", "name"],
  "additionalProperties": false
}
```

### 2. Configure Assertions

```typescript
import { AssertionConfig } from '@/lib/api-types';

const config: AssertionConfig = {
  // Enable schema validation
  validateSchema: true,

  // Strict mode (reject additional properties)
  schemaStrict: true,

  // Expected HTTP status codes
  expectedStatus: [200, 201],

  // Maximum response time (ms)
  maxResponseTime: 1000,

  // Custom field assertions
  fieldAssertions: [
    {
      path: 'email',
      rule: 'pattern',
      expected: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    },
    {
      path: 'age',
      rule: 'min',
      expected: 18
    }
  ]
};
```

### 3. Validate Response

```typescript
import { validateResponse } from '@/lib/assertion-validator';

const result = validateResponse(
  responseData,
  statusCode,
  responseTime,
  schema,
  config
);

console.log(result);
// {
//   passed: false,
//   totalAssertions: 5,
//   passedAssertions: 3,
//   failedAssertions: 2,
//   assertions: [
//     { type: 'status', passed: true, message: '...' },
//     { type: 'schema', passed: false, message: '...' },
//     ...
//   ]
// }
```

### 4. Integrate with Batch Testing

```typescript
import { runBatchTest } from '@/app/actions/batch-test';
import { dtoToJsonSchema } from '@/lib/schema-generator';

// Generate schema
const schema = dtoToJsonSchema(responseModel, allModels);

// Run batch test with assertions
const results = await runBatchTest(
  projectId,
  apiId,
  env,
  environments,
  endpoint,
  testCaseIds,
  assertionConfig,  // Pass config
  schema           // Pass schema
);

// Check results
results.results.forEach(result => {
  if (result.assertionResult) {
    console.log(`Assertions: ${result.assertionResult.passedAssertions}/${result.assertionResult.totalAssertions}`);

    if (!result.assertionResult.passed) {
      result.assertionResult.assertions
        .filter(a => !a.passed)
        .forEach(a => console.error(a.message));
    }
  }
});
```

## Assertion Types

### 1. Schema Assertions
Validates entire response structure against JSON Schema.

**Checks:**
- Required fields present
- Field types correct (string, number, boolean, array, object)
- Field formats valid (email, uuid, date-time, uri, etc.)
- No additional properties (in strict mode)
- Array constraints (minItems, maxItems)
- String constraints (minLength, maxLength, pattern)
- Number constraints (minimum, maximum)

### 2. Status Code Assertions
Validates HTTP status code.

```typescript
expectedStatus: [200, 201, 204]
```

### 3. Timing Assertions
Validates response time.

```typescript
maxResponseTime: 1000  // milliseconds
```

### 4. Field Assertions
Custom field-level validations.

**Available Rules:**

| Rule | Description | Example |
|------|-------------|---------|
| `required` | Field must exist | `{ path: 'email', rule: 'required' }` |
| `type` | Field type check | `{ path: 'age', rule: 'type', expected: 'number' }` |
| `equals` | Exact value match | `{ path: 'status', rule: 'equals', expected: 'ACTIVE' }` |
| `contains` | String contains substring | `{ path: 'message', rule: 'contains', expected: 'success' }` |
| `pattern` | Regex pattern match | `{ path: 'phone', rule: 'pattern', expected: '^\\d{3}-\\d{4}$' }` |
| `minLength` | String minimum length | `{ path: 'password', rule: 'minLength', expected: 8 }` |
| `maxLength` | String maximum length | `{ path: 'username', rule: 'maxLength', expected: 20 }` |
| `min` | Number minimum value | `{ path: 'age', rule: 'min', expected: 18 }` |
| `max` | Number maximum value | `{ path: 'quantity', rule: 'max', expected: 100 }` |

**Field Path Syntax:**
```typescript
'email'              // Root level
'data.user.email'    // Nested
'users[0].email'     // Array element
```

## Preset Templates

Pre-configured assertion templates for common scenarios:

### Basic
```typescript
{
  validateSchema: true,
  schemaStrict: false,
  expectedStatus: [200]
}
```

### Strict
```typescript
{
  validateSchema: true,
  schemaStrict: true,
  expectedStatus: [200],
  maxResponseTime: 1000
}
```

### Performance
```typescript
{
  validateSchema: false,
  expectedStatus: [200],
  maxResponseTime: 500
}
```

### Minimal
```typescript
{
  validateSchema: false,
  expectedStatus: [200, 201, 204]
}
```

## UI Components

### AssertionBuilder

Visual configuration interface for assertions.

**Features:**
- Preset template selection
- Schema validation toggle
- Strict mode toggle
- Generated schema preview
- Status code input
- Response time threshold
- Custom field assertion builder
- Save/Cancel actions

**Usage:**
```tsx
<AssertionBuilder
  responseModel={apiModel}
  allModels={[apiModel, ...]}
  initialConfig={existingConfig}
  onSave={(config) => handleSave(config)}
  onCancel={() => handleCancel()}
/>
```

### TestDashboard (Updated)

Displays test results with assertion details.

**New Features:**
- Assertions column with pass/fail badge
- Expandable rows showing assertion details
- Color-coded assertion results
- Excel export includes assertion data

**Assertion Badge:**
- Shows passed/total ratio
- Visual progress bar
- Pass rate percentage

**Assertion Details (Expanded):**
- Grouped by type (schema, status, timing, field)
- Pass/fail indicators
- Error messages
- Expected vs actual values
- Field paths

## API Reference

### schema-generator.ts

#### `dtoToJsonSchema(dto: ApiModel, allModels?: ApiModel[]): JSONSchema7`
Converts DTO model to JSON Schema.

#### `generateFieldSchema(field: ApiField, allModels?: ApiModel[]): JSONSchema7`
Generates schema for a single field.

#### `inferFieldFormat(fieldName: string, fieldType: string): string | undefined`
Infers JSON Schema format from field name/type.

**Returns:** `'email' | 'date-time' | 'uri' | 'uuid' | 'ipv4' | 'hostname' | undefined`

#### `formatJsonSchema(schema: JSONSchema7): string`
Pretty-prints JSON Schema as formatted string.

### assertion-validator.ts

#### `validateResponse(response: any, statusCode: number, responseTime: number, schema?: JSONSchema7, config?: AssertionConfig): AssertionResult`
Main validation function.

#### `getFieldValue(obj: any, path: string): any`
Extracts nested field value using dot notation.

#### `formatAssertionError(result: AssertionResult): string`
Formats assertion result as human-readable error message.

#### `formatAssertionSummary(result: AssertionResult): string`
Formats compact summary (e.g., "✓ 5/5" or "✗ 3/5").

#### `getAssertionPassRate(result: AssertionResult): number`
Calculates pass rate percentage.

## Type Definitions

### AssertionConfig
```typescript
interface AssertionConfig {
  validateSchema?: boolean;
  schemaStrict?: boolean;
  maxResponseTime?: number;
  expectedStatus?: number[];
  fieldAssertions?: FieldAssertion[];
}
```

### AssertionResult
```typescript
interface AssertionResult {
  passed: boolean;
  assertions: AssertionDetail[];
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
}
```

### AssertionDetail
```typescript
interface AssertionDetail {
  type: 'schema' | 'status' | 'timing' | 'field';
  passed: boolean;
  message: string;
  expected?: any;
  actual?: any;
  path?: string;
  errors?: ErrorObject[];
}
```

### FieldAssertion
```typescript
interface FieldAssertion {
  path: string;
  rule: 'required' | 'type' | 'pattern' | 'equals' | 'contains' | 'minLength' | 'maxLength' | 'min' | 'max';
  expected: any;
  description?: string;
}
```

## Error Handling

### Schema Validation Errors
```typescript
{
  type: 'schema',
  passed: false,
  message: 'Missing required field: email',
  path: '/email',
  expected: 'defined',
  actual: undefined
}
```

### Field Assertion Errors
```typescript
{
  type: 'field',
  passed: false,
  message: "Field 'age' should be >= 18",
  path: 'age',
  expected: '>= 18',
  actual: 15
}
```

### Timing Errors
```typescript
{
  type: 'timing',
  passed: false,
  message: 'Response time 1500ms exceeds limit of 1000ms',
  expected: '<= 1000ms',
  actual: '1500ms'
}
```

## Best Practices

### 1. Schema Generation
- Always provide the full model hierarchy (`allModels` parameter)
- Use descriptive field names that match conventions
- Set `isRequired` appropriately
- Add descriptions for better documentation

### 2. Assertion Configuration
- Start with a preset template
- Enable strict mode for critical APIs
- Set reasonable response time thresholds
- Use field assertions for business rules
- Test both valid and invalid scenarios

### 3. Performance
- Schema compilation is cached by Ajv
- Validation is fast (microseconds for typical responses)
- Use relaxed mode for large, dynamic responses
- Limit field assertions to critical fields

### 4. Testing
- Test assertion configs before batch runs
- Use the demo component for experimentation
- Verify schema generation matches expectations
- Check error messages are clear

## Examples

### Example 1: User Registration API
```typescript
const schema = dtoToJsonSchema({
  name: 'RegistrationResponse',
  fields: [
    { name: 'userId', type: 'UUID', isRequired: true },
    { name: 'email', type: 'String', isRequired: true },
    { name: 'token', type: 'String', isRequired: true },
  ]
}, []);

const config: AssertionConfig = {
  validateSchema: true,
  schemaStrict: true,
  expectedStatus: [201],
  maxResponseTime: 2000,
  fieldAssertions: [
    { path: 'token', rule: 'minLength', expected: 32 }
  ]
};
```

### Example 2: Product List API
```typescript
const config: AssertionConfig = {
  validateSchema: true,
  schemaStrict: false,  // Allow extra fields
  expectedStatus: [200],
  maxResponseTime: 500,
  fieldAssertions: [
    { path: 'products', rule: 'required' },
    { path: 'total', rule: 'min', expected: 0 }
  ]
};
```

### Example 3: Health Check API
```typescript
const config: AssertionConfig = {
  validateSchema: false,  // Simple response
  expectedStatus: [200],
  maxResponseTime: 100,
  fieldAssertions: [
    { path: 'status', rule: 'equals', expected: 'ok' }
  ]
};
```

## Troubleshooting

### Schema validation always fails
- Check if response structure matches DTO definition
- Verify field names match exactly (case-sensitive)
- Check if `schemaStrict` is too restrictive
- Review generated schema with `formatJsonSchema()`

### Field assertion not working
- Verify field path syntax (use dot notation)
- Check if field exists in response
- Ensure expected value type matches rule
- Test with simple assertions first

### Performance issues
- Reduce number of field assertions
- Use schema validation instead of field assertions
- Increase response time threshold
- Consider using 'performance' preset

## Future Enhancements

- [ ] Visual field path builder (point-and-click)
- [ ] Assertion templates library
- [ ] Historical assertion pass rates
- [ ] Auto-fix suggestions for common errors
- [ ] Integration with OpenAPI specs
- [ ] GraphQL schema support
- [ ] Response diff visualization
- [ ] Assertion test coverage metrics

## Dependencies

- **ajv** (^8.17.1): JSON Schema validator
- **ajv-formats** (^3.0.1): Format validators for Ajv
- **json-schema** (^0.4.0): JSON Schema type definitions
- **framer-motion** (^12.24.0): UI animations

## License

Part of API Hub project. See main LICENSE file.
