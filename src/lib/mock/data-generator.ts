import { faker } from '@faker-js/faker';
import type { ApiModel, ApiField } from '@/lib/api-types';

export interface MockDataGeneratorOptions {
  locale?: string;
  seed?: number;
  includeOptional?: boolean;
  maxDepth?: number;
  arrayLength?: number;
}

const DEFAULT_OPTIONS: Required<MockDataGeneratorOptions> = {
  locale: 'en',
  seed: Date.now(),
  includeOptional: true,
  maxDepth: 3,
  arrayLength: 3,
};

/**
 * Smart field name detection - maps common field name patterns to appropriate faker methods
 */
export function getSmartFakerValue(fieldName: string, fieldType: string): any {
  const lowerName = fieldName.toLowerCase();

  // Email patterns
  if (lowerName.includes('email')) {
    return faker.internet.email();
  }

  // Phone patterns
  if (lowerName.includes('phone') || lowerName.includes('tel')) {
    return faker.phone.number();
  }

  // Name patterns (excluding username)
  if (lowerName === 'name' || lowerName === 'fullname') {
    return faker.person.fullName();
  }
  if (lowerName.includes('firstname')) {
    return faker.person.firstName();
  }
  if (lowerName.includes('lastname')) {
    return faker.person.lastName();
  }
  if (lowerName.includes('username')) {
    return faker.internet.username();
  }

  // Password patterns
  if (lowerName.includes('password') || lowerName.includes('pwd')) {
    return faker.internet.password();
  }

  // URL patterns
  if (lowerName.includes('url') || lowerName.includes('link') || lowerName.includes('website')) {
    return faker.internet.url();
  }

  // Image patterns
  if (lowerName.includes('avatar') || lowerName.includes('profileimage')) {
    return faker.image.avatar();
  }

  // ID patterns
  if (lowerName === 'id' && (fieldType.toLowerCase().includes('uuid') || fieldType.toLowerCase() === 'string')) {
    return faker.string.uuid();
  }

  // Count/Quantity patterns
  if (lowerName.includes('count') || lowerName.includes('quantity') || lowerName === 'qty') {
    return faker.number.int({ min: 1, max: 100 });
  }

  // Price/Amount patterns
  if (lowerName.includes('price') || lowerName.includes('amount') || lowerName.includes('cost')) {
    return faker.number.float({ min: 10, max: 10000, fractionDigits: 2 });
  }

  // Age pattern
  if (lowerName === 'age') {
    return faker.number.int({ min: 18, max: 80 });
  }

  // Description patterns
  if (lowerName.includes('description') || lowerName === 'desc') {
    return faker.lorem.paragraph();
  }

  // Title pattern
  if (lowerName === 'title') {
    return faker.lorem.sentence();
  }

  // Status pattern
  if (lowerName === 'status') {
    return faker.helpers.arrayElement(['ACTIVE', 'INACTIVE', 'PENDING', 'COMPLETED']);
  }

  // Code pattern
  if (lowerName === 'code') {
    return faker.string.alphanumeric(6).toUpperCase();
  }

  // Address patterns
  if (lowerName.includes('address')) {
    return faker.location.streetAddress();
  }
  if (lowerName === 'city') {
    return faker.location.city();
  }
  if (lowerName === 'country') {
    return faker.location.country();
  }
  if (lowerName.includes('zipcode') || lowerName.includes('postalcode')) {
    return faker.location.zipCode();
  }

  // Location patterns
  if (lowerName === 'latitude' || lowerName === 'lat') {
    return faker.location.latitude();
  }
  if (lowerName === 'longitude' || lowerName === 'lng' || lowerName === 'lon') {
    return faker.location.longitude();
  }

  // Color pattern
  if (lowerName === 'color') {
    return faker.color.rgb();
  }

  // IP pattern
  if (lowerName === 'ip' || lowerName.includes('ipaddress')) {
    return faker.internet.ip();
  }

  // Date patterns (createdAt, updatedAt, etc.)
  if (lowerName.includes('date') || lowerName.endsWith('at')) {
    return faker.date.recent().toISOString();
  }

  // Company pattern
  if (lowerName.includes('company') || lowerName === 'companyname') {
    return faker.company.name();
  }

  // Content/Body/Text patterns
  if (lowerName === 'content' || lowerName === 'body' || lowerName === 'text') {
    return faker.lorem.paragraphs(2);
  }

  // Comment pattern
  if (lowerName === 'comment') {
    return faker.lorem.sentence();
  }

  // Tag/Category pattern
  if (lowerName === 'tag' || lowerName === 'category') {
    return faker.word.noun();
  }

  // Fall back to type-based generation
  return getTypeBasedValue(fieldType);
}

/**
 * Type-based default value generation
 */
function getTypeBasedValue(fieldType: string): any {
  const lowerType = fieldType.toLowerCase();

  // Boolean types
  if (lowerType === 'boolean' || lowerType === 'bool') {
    return faker.datatype.boolean();
  }

  // Integer types
  if (lowerType === 'int' || lowerType === 'long' || lowerType === 'integer' || lowerType === 'number') {
    return faker.number.int({ min: 1, max: 9999 });
  }

  // Float types
  if (lowerType === 'double' || lowerType === 'float' || lowerType === 'decimal') {
    return faker.number.float({ min: 0, max: 1000, fractionDigits: 2 });
  }

  // Date types
  if (lowerType.includes('date') || lowerType.includes('time') || lowerType === 'instant') {
    return faker.date.recent().toISOString();
  }

  // UUID type
  if (lowerType === 'uuid') {
    return faker.string.uuid();
  }

  // Default to string
  return faker.lorem.word();
}

/**
 * Extract element type from array type notation
 */
function extractArrayElementType(fieldType: string): string | null {
  // Handle List<T>, Set<T>
  const genericMatch = fieldType.match(/^(?:List|Set)<(.+)>$/);
  if (genericMatch) {
    return genericMatch[1];
  }

  // Handle T[]
  const arrayMatch = fieldType.match(/^(.+)\[\]$/);
  if (arrayMatch) {
    return arrayMatch[1];
  }

  return null;
}

/**
 * Check if a type is an array type
 */
function isArrayType(fieldType: string): boolean {
  return extractArrayElementType(fieldType) !== null;
}

/**
 * Find model by name in allModels
 */
function findModelByName(modelName: string, allModels: ApiModel[]): ApiModel | null {
  return allModels.find(m => m.name === modelName) || null;
}

/**
 * Generate mock value for a single field
 */
function generateFieldValue(
  field: ApiField,
  allModels: ApiModel[],
  options: Required<MockDataGeneratorOptions>,
  currentDepth: number
): any {
  // Check if field is required
  if (!options.includeOptional && !field.isRequired) {
    return undefined;
  }

  // Handle array types
  if (isArrayType(field.type)) {
    const elementType = extractArrayElementType(field.type);
    if (!elementType) {
      return [];
    }

    const arrayLength = options.arrayLength;
    const items = [];

    for (let i = 0; i < arrayLength; i++) {
      const elementField: ApiField = {
        name: field.name,
        type: elementType,
        isComplex: field.isComplex,
        refFields: field.refFields,
      };

      const value = generateFieldValue(elementField, allModels, options, currentDepth);
      items.push(value);
    }

    return items;
  }

  // Handle complex/nested types
  if (field.isComplex) {
    if (currentDepth >= options.maxDepth) {
      return null; // Prevent infinite recursion
    }

    // Try to use refFields first
    if (field.refFields && field.refFields.length > 0) {
      const nestedData: Record<string, any> = {};
      for (const refField of field.refFields) {
        const value = generateFieldValue(refField, allModels, options, currentDepth + 1);
        if (value !== undefined) {
          nestedData[refField.name] = value;
        }
      }
      return nestedData;
    }

    // Try to find model definition
    const referencedModel = findModelByName(field.type, allModels);
    if (referencedModel && referencedModel.fields) {
      const nestedData: Record<string, any> = {};
      for (const refField of referencedModel.fields) {
        const value = generateFieldValue(refField, allModels, options, currentDepth + 1);
        if (value !== undefined) {
          nestedData[refField.name] = value;
        }
      }
      return nestedData;
    }

    // Fallback to empty object
    return {};
  }

  // Generate primitive value using smart detection
  return getSmartFakerValue(field.name, field.type);
}

/**
 * Generate mock data from API model definition
 */
export function generateMockData(
  model: ApiModel,
  allModels: ApiModel[],
  options?: MockDataGeneratorOptions
): Record<string, any> {
  const mergedOptions: Required<MockDataGeneratorOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  // Set faker locale and seed
  faker.setDefaultRefDate(new Date());
  faker.seed(mergedOptions.seed);

  const mockData: Record<string, any> = {};

  if (!model.fields || model.fields.length === 0) {
    return mockData;
  }

  for (const field of model.fields) {
    const value = generateFieldValue(field, allModels, mergedOptions, 0);
    if (value !== undefined) {
      mockData[field.name] = value;
    }
  }

  return mockData;
}

/**
 * Generate mock data from template, merging template values with generated data
 * Template values take priority over generated values
 */
export function generateMockDataFromTemplate(
  template: Record<string, any>,
  model: ApiModel,
  allModels: ApiModel[],
  options?: MockDataGeneratorOptions
): Record<string, any> {
  const generatedData = generateMockData(model, allModels, options);

  // Merge with template taking priority
  return {
    ...generatedData,
    ...template,
  };
}

/**
 * Generate multiple mock data instances
 */
export function generateMultipleMockData(
  model: ApiModel,
  allModels: ApiModel[],
  count: number,
  options?: MockDataGeneratorOptions
): Record<string, any>[] {
  const items: Record<string, any>[] = [];

  for (let i = 0; i < count; i++) {
    // Use different seed for each item to ensure variety
    const itemOptions = {
      ...options,
      seed: (options?.seed || Date.now()) + i,
    };

    items.push(generateMockData(model, allModels, itemOptions));
  }

  return items;
}
