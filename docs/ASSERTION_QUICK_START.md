# Auto Assertion Generation - Quick Start Guide

Get up and running with API response validation in 5 minutes.

## Installation

Dependencies are already installed:
```json
{
  "ajv": "^8.17.1",
  "ajv-formats": "^3.0.1",
  "json-schema": "^0.4.0"
}
```

## Basic Usage (3 Steps)

### Step 1: Import Required Functions

```typescript
import { dtoToJsonSchema } from '@/lib/schema-generator';
import { validateResponse, AssertionConfig } from '@/lib/assertion-validator';
import { ApiModel } from '@/lib/api-types';
```

### Step 2: Define Your API Model

```typescript
const userResponseModel: ApiModel = {
  name: 'UserResponse',
  fields: [
    { name: 'id', type: 'UUID', isRequired: true },
    { name: 'email', type: 'String', isRequired: true },
    { name: 'name', type: 'String', isRequired: true },
    { name: 'age', type: 'Integer', isRequired: false },
    { name: 'createdAt', type: 'LocalDateTime', isRequired: true },
  ]
};
```

### Step 3: Validate Response

```typescript
// Generate schema
const schema = dtoToJsonSchema(userResponseModel, []);

// Configure assertions
const config: AssertionConfig = {
  validateSchema: true,
  expectedStatus: [200]
};

// Validate
const result = validateResponse(
  responseData,
  statusCode,
  responseTime,
  schema,
  config
);

// Check result
if (result.passed) {
  console.log('✓ All validations passed');
} else {
  console.error(`✗ ${result.failedAssertions} failed`);
}
```

## Common Scenarios

### Scenario 1: Basic Schema Validation

```typescript
const config: AssertionConfig = {
  validateSchema: true,
  expectedStatus: [200]
};
```

**What it checks:**
- Response structure matches DTO
- All required fields present
- Field types correct
- Status code is 200

### Scenario 2: Strict Validation

```typescript
const config: AssertionConfig = {
  validateSchema: true,
  schemaStrict: true,  // Reject extra fields
  expectedStatus: [200],
  maxResponseTime: 1000  // Max 1 second
};
```

**What it checks:**
- Everything from Scenario 1
- No additional properties
- Response time under 1 second

### Scenario 3: Custom Field Rules

```typescript
const config: AssertionConfig = {
  validateSchema: true,
  expectedStatus: [200],
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

**What it checks:**
- Schema validation
- Email format is valid
- Age is at least 18

### Scenario 4: Performance Testing

```typescript
const config: AssertionConfig = {
  validateSchema: false,  // Skip schema (faster)
  expectedStatus: [200, 201, 204],
  maxResponseTime: 500  // Max 500ms
};
```

**What it checks:**
- Status code is success (200, 201, or 204)
- Response time under 500ms

## Using with Batch Tests

### Option 1: Simple Integration

```typescript
import { runBatchTest } from '@/app/actions/batch-test';

const schema = dtoToJsonSchema(responseModel, allModels);

const results = await runBatchTest(
  projectId,
  apiId,
  'DEV',
  environments,
  endpoint,
  testCaseIds,
  config,    // Add assertion config
  schema     // Add schema
);
```

### Option 2: Enhanced Batch Test

```typescript
import { runEnhancedBatchTest } from '@/app/actions/batch-test';

const results = await runEnhancedBatchTest(
  projectId,
  testCaseIds,
  'DEV',
  environments,
  {
    mode: 'parallel',
    assertionConfig: config,
    responseSchema: schema
  }
);
```

## Using the UI Component

### In Your Page/Component

```tsx
import { AssertionBuilder } from '@/components/AssertionBuilder';
import { useState } from 'react';

export default function TestConfigPage() {
  const [config, setConfig] = useState<AssertionConfig>();

  return (
    <AssertionBuilder
      responseModel={apiModel}
      allModels={allModels}
      onSave={(config) => setConfig(config)}
    />
  );
}
```

## Field Assertion Cheat Sheet

| Rule | Use Case | Example |
|------|----------|---------|
| `required` | Field must exist | `{ path: 'userId', rule: 'required' }` |
| `type` | Check field type | `{ path: 'age', rule: 'type', expected: 'number' }` |
| `equals` | Exact match | `{ path: 'status', rule: 'equals', expected: 'active' }` |
| `contains` | String contains | `{ path: 'message', rule: 'contains', expected: 'success' }` |
| `pattern` | Regex match | `{ path: 'phone', rule: 'pattern', expected: '^\\d{3}-\\d{4}$' }` |
| `minLength` | Min string length | `{ path: 'password', rule: 'minLength', expected: 8 }` |
| `maxLength` | Max string length | `{ path: 'username', rule: 'maxLength', expected: 20 }` |
| `min` | Min number value | `{ path: 'price', rule: 'min', expected: 0 }` |
| `max` | Max number value | `{ path: 'quantity', rule: 'max', expected: 999 }` |

## Field Path Examples

```typescript
// Root level field
'email'

// Nested field
'data.user.email'

// Array element
'users[0].email'

// Deep nesting
'response.data.results[0].user.profile.email'
```

## Preset Templates

Use pre-configured templates for common cases:

```typescript
import { ASSERTION_PRESETS } from '@/lib/assertion-validator';

// Basic validation
const config = ASSERTION_PRESETS.basic;

// Strict validation
const config = ASSERTION_PRESETS.strict;

// Performance testing
const config = ASSERTION_PRESETS.performance;

// Minimal (status only)
const config = ASSERTION_PRESETS.minimal;
```

## Reading Results

### Success Case

```typescript
{
  passed: true,
  totalAssertions: 3,
  passedAssertions: 3,
  failedAssertions: 0,
  assertions: [
    { type: 'status', passed: true, message: 'Status code 200 is expected' },
    { type: 'schema', passed: true, message: 'Response matches JSON Schema' },
    { type: 'timing', passed: true, message: 'Response time 350ms is within limit' }
  ]
}
```

### Failure Case

```typescript
{
  passed: false,
  totalAssertions: 5,
  passedAssertions: 3,
  failedAssertions: 2,
  assertions: [
    { type: 'status', passed: true, ... },
    {
      type: 'schema',
      passed: false,
      message: 'Missing required field: email',
      path: '/email',
      expected: 'defined',
      actual: undefined
    },
    {
      type: 'field',
      passed: false,
      message: "Field 'age' should be >= 18",
      path: 'age',
      expected: '>= 18',
      actual: 15
    }
  ]
}
```

## Utility Functions

### Format Error Message

```typescript
import { formatAssertionError } from '@/lib/assertion-validator';

const errorMessage = formatAssertionError(result);
console.error(errorMessage);
// ✗ 2 of 5 assertion(s) failed:
//   • [SCHEMA] Missing required field: email
//     Expected: defined
//     Actual: undefined
//   • [FIELD] Field 'age' should be >= 18
//     Expected: >= 18
//     Actual: 15
```

### Get Summary

```typescript
import { formatAssertionSummary } from '@/lib/assertion-validator';

const summary = formatAssertionSummary(result);
console.log(summary);
// ✓ 5/5  (if passed)
// ✗ 3/5  (if failed)
```

### Calculate Pass Rate

```typescript
import { getAssertionPassRate } from '@/lib/assertion-validator';

const passRate = getAssertionPassRate(result);
console.log(`Pass rate: ${passRate}%`);
// Pass rate: 60%
```

## Tips & Best Practices

### 1. Start Simple
Begin with basic schema validation, then add custom rules as needed.

```typescript
// Start here
{ validateSchema: true, expectedStatus: [200] }

// Then add
{ ...config, maxResponseTime: 1000 }

// Finally customize
{ ...config, fieldAssertions: [...] }
```

### 2. Use Presets
Don't reinvent the wheel - use presets as starting points.

```typescript
const config = {
  ...ASSERTION_PRESETS.strict,
  maxResponseTime: 2000  // Override specific values
};
```

### 3. Test Both Valid and Invalid
Always test with both passing and failing data to verify assertions work.

```typescript
// Test with valid data
const validResult = validateResponse(validData, 200, 300, schema, config);
console.assert(validResult.passed === true);

// Test with invalid data
const invalidResult = validateResponse(invalidData, 200, 300, schema, config);
console.assert(invalidResult.passed === false);
```

### 4. Organize Field Assertions
Group related assertions together with descriptions.

```typescript
fieldAssertions: [
  // Email validation
  { path: 'email', rule: 'required', description: 'Email is mandatory' },
  { path: 'email', rule: 'pattern', expected: '...', description: 'Valid email format' },

  // Age validation
  { path: 'age', rule: 'min', expected: 18, description: 'Must be adult' },
  { path: 'age', rule: 'max', expected: 120, description: 'Reasonable age limit' }
]
```

### 5. Handle Edge Cases
Consider null, undefined, and empty values.

```typescript
// Use 'required' rule first
{ path: 'email', rule: 'required' }

// Then validate format/value
{ path: 'email', rule: 'pattern', expected: '...' }
```

## Troubleshooting

### "Schema validation always fails"
- Check if field names match exactly (case-sensitive)
- Verify field types match (String vs string)
- Try `schemaStrict: false` to allow extra fields
- Print generated schema: `console.log(formatJsonSchema(schema))`

### "Field assertion not working"
- Verify field path syntax (use dot notation: `data.user.email`)
- Check if field exists: `console.log(getFieldValue(response, path))`
- Ensure expected value type matches rule (string for pattern, number for min/max)

### "Performance issues"
- Reduce number of field assertions
- Set `validateSchema: false` for simple checks
- Schema compilation is cached (fast after first use)

## Demo

Check out the full demo:
```tsx
import { AssertionDemo } from '@/components/AssertionDemo';

// In your page
<AssertionDemo />
```

## Next Steps

- Read [Full Documentation](./AUTO_ASSERTION_GENERATION.md)
- Explore [AssertionBuilder.tsx](../src/components/AssertionBuilder.tsx)
- Check [AssertionDemo.tsx](../src/components/AssertionDemo.tsx)
- Review [Implementation Summary](../IMPLEMENTATION_SUMMARY.md)

## Need Help?

Common questions:
1. **How do I validate nested objects?** - Use dot notation in field paths
2. **Can I validate arrays?** - Yes, use array indices: `users[0].email`
3. **What formats are auto-detected?** - email, uuid, date-time, uri, ipv4, hostname
4. **Is it compatible with existing tests?** - Yes, assertions are optional
5. **Can I save assertion configs?** - Yes, serialize `AssertionConfig` to JSON

Happy testing! 🎉
