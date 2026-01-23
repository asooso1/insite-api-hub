'use client';

/**
 * AssertionDemo.tsx
 *
 * Demonstration component showing how to use the Auto Assertion Generation feature.
 * This component can be used as a reference implementation.
 */

import { useState } from 'react';
import { AssertionBuilder } from './AssertionBuilder';
import { AssertionConfig, ApiModel } from '@/lib/api-types';
import { dtoToJsonSchema } from '@/lib/schema-generator';
import { validateResponse } from '@/lib/assertion-validator';

// Example API Model (DTO)
const exampleUserModel: ApiModel = {
  name: 'UserResponse',
  fields: [
    {
      name: 'id',
      type: 'UUID',
      description: 'User unique identifier',
      isRequired: true,
    },
    {
      name: 'email',
      type: 'String',
      description: 'User email address',
      isRequired: true,
    },
    {
      name: 'name',
      type: 'String',
      description: 'User full name',
      isRequired: true,
    },
    {
      name: 'age',
      type: 'Integer',
      description: 'User age',
      isRequired: false,
    },
    {
      name: 'createdAt',
      type: 'LocalDateTime',
      description: 'Account creation timestamp',
      isRequired: true,
    },
    {
      name: 'isActive',
      type: 'Boolean',
      description: 'Account status',
      isRequired: true,
    },
  ],
};

const exampleUserListModel: ApiModel = {
  name: 'UserListResponse',
  fields: [
    {
      name: 'users',
      type: 'User[]',
      description: 'List of users',
      isRequired: true,
      isComplex: true,
    },
    {
      name: 'total',
      type: 'Integer',
      description: 'Total count',
      isRequired: true,
    },
  ],
};

// Example response data (valid)
const validResponse = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'john.doe@example.com',
  name: 'John Doe',
  age: 30,
  createdAt: '2024-01-15T10:30:00Z',
  isActive: true,
};

// Example response data (invalid)
const invalidResponse = {
  id: 'not-a-uuid',
  email: 'invalid-email', // Invalid email format
  // name is missing (required field)
  age: 'thirty', // Wrong type (should be number)
  createdAt: '2024-01-15', // Invalid date-time format
  isActive: true,
  extraField: 'This should not be here', // Additional property (in strict mode)
};

export function AssertionDemo() {
  const [config, setConfig] = useState<AssertionConfig>({
    validateSchema: true,
    schemaStrict: true,
    expectedStatus: [200],
    maxResponseTime: 1000,
    fieldAssertions: [
      {
        path: 'email',
        rule: 'pattern',
        expected: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        description: 'Email must be valid format',
      },
      {
        path: 'age',
        rule: 'min',
        expected: 18,
        description: 'User must be at least 18 years old',
      },
    ],
  });

  const [testResult, setTestResult] = useState<any>(null);

  const handleSaveConfig = (newConfig: AssertionConfig) => {
    setConfig(newConfig);
    console.log('Assertion config saved:', newConfig);
  };

  const handleTestValidResponse = () => {
    const schema = dtoToJsonSchema(exampleUserModel, []);
    const result = validateResponse(validResponse, 200, 350, schema, config);
    setTestResult(result);
    console.log('Validation result (valid):', result);
  };

  const handleTestInvalidResponse = () => {
    const schema = dtoToJsonSchema(exampleUserModel, []);
    const result = validateResponse(invalidResponse, 200, 350, schema, config);
    setTestResult(result);
    console.log('Validation result (invalid):', result);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black mb-2">Auto Assertion Generation Demo</h1>
        <p className="text-muted-foreground">
          Complete demonstration of the assertion validation system
        </p>
      </div>

      {/* Assertion Builder */}
      <div className="border border-border rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">1. Configure Assertions</h2>
        <AssertionBuilder
          responseModel={exampleUserModel}
          allModels={[exampleUserModel, exampleUserListModel]}
          initialConfig={config}
          onSave={handleSaveConfig}
        />
      </div>

      {/* Test Buttons */}
      <div className="border border-border rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">2. Test Validation</h2>
        <div className="flex gap-4">
          <button
            onClick={handleTestValidResponse}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all"
          >
            Test Valid Response
          </button>
          <button
            onClick={handleTestInvalidResponse}
            className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all"
          >
            Test Invalid Response
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResult && (
        <div className="border border-border rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4">3. Validation Results</h2>
          <pre className="bg-muted p-4 rounded-xl overflow-x-auto text-sm">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Code Examples */}
      <div className="border border-border rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">4. Integration Example</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Step 1: Generate JSON Schema from DTO
            </h3>
            <pre className="bg-muted p-4 rounded-xl overflow-x-auto text-xs">
              {`import { dtoToJsonSchema } from '@/lib/schema-generator';

const schema = dtoToJsonSchema(responseModel, allModels);`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              Step 2: Configure Assertions
            </h3>
            <pre className="bg-muted p-4 rounded-xl overflow-x-auto text-xs">
              {`const assertionConfig = {
  validateSchema: true,
  schemaStrict: true,
  expectedStatus: [200, 201],
  maxResponseTime: 1000,
  fieldAssertions: [
    {
      path: 'data.user.email',
      rule: 'pattern',
      expected: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$'
    }
  ]
};`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              Step 3: Run Validation
            </h3>
            <pre className="bg-muted p-4 rounded-xl overflow-x-auto text-xs">
              {`import { validateResponse } from '@/lib/assertion-validator';

const result = validateResponse(
  response,
  statusCode,
  responseTime,
  schema,
  assertionConfig
);

if (result.passed) {
  console.log('✓ All assertions passed');
} else {
  console.error(\`✗ \${result.failedAssertions} assertion(s) failed\`);
  result.assertions
    .filter(a => !a.passed)
    .forEach(a => console.error(a.message));
}`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              Step 4: Integrate with Batch Testing
            </h3>
            <pre className="bg-muted p-4 rounded-xl overflow-x-auto text-xs">
              {`import { runBatchTest } from '@/app/actions/batch-test';

const batchResults = await runBatchTest(
  projectId,
  apiId,
  env,
  environments,
  endpoint,
  testCaseIds,
  assertionConfig,    // Pass assertion config
  responseSchema      // Pass JSON Schema
);

// Results include assertion data
batchResults.results.forEach(result => {
  if (result.assertionResult) {
    console.log(\`Assertions: \${result.assertionResult.passedAssertions}/\${result.assertionResult.totalAssertions}\`);
  }
});`}
            </pre>
          </div>
        </div>
      </div>

      {/* Feature Summary */}
      <div className="border border-border rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">Feature Summary</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>
              <strong>Automatic JSON Schema Generation</strong> from DTO models
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>
              <strong>Smart Field Format Detection</strong> (email, uuid, date-time, etc.)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>
              <strong>Comprehensive Validation</strong> with Ajv (JSON Schema validator)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>
              <strong>Custom Field Assertions</strong> (required, type, pattern, equals, etc.)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>
              <strong>Performance Validation</strong> (response time thresholds)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>
              <strong>Status Code Validation</strong> (multiple expected codes)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>
              <strong>Visual Assertion Builder UI</strong> with preset templates
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>
              <strong>Detailed Results Display</strong> in TestDashboard
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>
              <strong>Excel Export</strong> with assertion results
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">✓</span>
            <span>
              <strong>Dark Mode Support</strong> throughout
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
