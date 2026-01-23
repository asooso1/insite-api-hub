import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { ApiModel, ApiField } from './api-types';

/**
 * Infer JSON Schema format from field name and type
 * Returns format strings like 'email', 'date-time', 'uri', 'uuid', etc.
 */
export function inferFieldFormat(fieldName: string, fieldType: string): string | undefined {
  const lowerName = fieldName.toLowerCase();
  const lowerType = fieldType.toLowerCase();

  // Email format
  if (lowerName.includes('email')) {
    return 'email';
  }

  // Date/Time formats
  if (lowerName.includes('date') || lowerName.includes('createdat') ||
      lowerName.includes('updatedat') || lowerName.includes('deletedat') ||
      lowerType.includes('date') || lowerType.includes('instant') ||
      lowerType.includes('localdatetime') || lowerType.includes('zoneddatetime')) {
    return 'date-time';
  }

  // UUID format
  if (lowerName.endsWith('id') || lowerName === 'id' || lowerType.includes('uuid')) {
    return 'uuid';
  }

  // URI/URL format
  if (lowerName.includes('url') || lowerName.includes('uri') || lowerName.includes('link')) {
    return 'uri';
  }

  // Phone format
  if (lowerName.includes('phone') || lowerName.includes('tel') || lowerName.includes('mobile')) {
    return undefined; // Use pattern instead
  }

  // IPv4 format
  if (lowerName.includes('ip') || lowerName.includes('ipaddress')) {
    return 'ipv4';
  }

  // Hostname format
  if (lowerName.includes('hostname') || lowerName.includes('host')) {
    return 'hostname';
  }

  return undefined;
}

/**
 * Get JSON Schema pattern for specific field types
 */
function inferFieldPattern(fieldName: string, fieldType: string): string | undefined {
  const lowerName = fieldName.toLowerCase();

  // Phone number pattern (Korean style)
  if (lowerName.includes('phone') || lowerName.includes('tel') || lowerName.includes('mobile')) {
    return '^\\d{2,3}-\\d{3,4}-\\d{4}$';
  }

  // Code/ID pattern (alphanumeric with possible dashes/underscores)
  if (lowerName.includes('code') && !lowerName.includes('postal')) {
    return '^[A-Z0-9_-]+$';
  }

  return undefined;
}

/**
 * Map Java/TS types to JSON Schema types
 */
function mapTypeToJsonSchemaType(fieldType: string): JSONSchema7['type'] {
  const lowerType = fieldType.toLowerCase();

  // Boolean
  if (lowerType === 'boolean' || lowerType === 'bool') {
    return 'boolean';
  }

  // Number types
  if (lowerType.includes('int') || lowerType.includes('long') ||
      lowerType.includes('short') || lowerType.includes('byte')) {
    return 'integer';
  }

  if (lowerType.includes('double') || lowerType.includes('float') ||
      lowerType.includes('decimal') || lowerType === 'number') {
    return 'number';
  }

  // Array types
  if (lowerType.includes('[]') || lowerType.startsWith('list<') ||
      lowerType.startsWith('set<') || lowerType.startsWith('array<')) {
    return 'array';
  }

  // Object types
  if (lowerType === 'object' || lowerType.includes('map<')) {
    return 'object';
  }

  // Default to string
  return 'string';
}

/**
 * Check if type is an array type
 */
function isArrayType(fieldType: string): boolean {
  return fieldType.includes('[]') ||
         fieldType.toLowerCase().startsWith('list<') ||
         fieldType.toLowerCase().startsWith('set<') ||
         fieldType.toLowerCase().startsWith('array<');
}

/**
 * Extract element type from array type
 */
function extractElementType(fieldType: string): string {
  // Remove [] suffix
  if (fieldType.includes('[]')) {
    return fieldType.replace('[]', '').trim();
  }

  // Extract from List<T>, Set<T>, Array<T>
  const match = fieldType.match(/<(.+)>/);
  if (match) {
    return match[1].trim();
  }

  return 'String';
}

/**
 * Generate JSON Schema for a single field
 */
export function generateFieldSchema(
  field: ApiField,
  allModels: ApiModel[] = []
): JSONSchema7 {
  const schema: JSONSchema7 = {};

  // Handle array types
  if (isArrayType(field.type)) {
    schema.type = 'array';
    const elementType = extractElementType(field.type);

    // Check if element is a reference model
    const refModel = allModels.find(m => m.name === elementType);
    if (refModel) {
      schema.items = dtoToJsonSchema(refModel, allModels);
    } else {
      // Primitive array
      const primitiveSchema: JSONSchema7 = {
        type: mapTypeToJsonSchemaType(elementType)
      };

      const format = inferFieldFormat(field.name, elementType);
      if (format) {
        primitiveSchema.format = format;
      }

      schema.items = primitiveSchema;
    }

    schema.minItems = field.isRequired ? 1 : 0;
  }
  // Handle complex/nested objects
  else if (field.isComplex && field.refFields && field.refFields.length > 0) {
    schema.type = 'object';
    schema.properties = {};
    const required: string[] = [];

    for (const refField of field.refFields) {
      schema.properties[refField.name] = generateFieldSchema(refField, allModels);
      if (refField.isRequired) {
        required.push(refField.name);
      }
    }

    if (required.length > 0) {
      schema.required = required;
    }
  }
  // Handle reference to another model
  else {
    const refModel = allModels.find(m => m.name === field.type);
    if (refModel) {
      return dtoToJsonSchema(refModel, allModels);
    }

    // Primitive type
    schema.type = mapTypeToJsonSchemaType(field.type);

    const format = inferFieldFormat(field.name, field.type);
    if (format) {
      schema.format = format;
    }

    const pattern = inferFieldPattern(field.name, field.type);
    if (pattern) {
      schema.pattern = pattern;
    }

    // Add constraints based on type
    if (schema.type === 'string') {
      schema.minLength = field.isRequired ? 1 : 0;
      schema.maxLength = 1000; // reasonable default
    }

    if (schema.type === 'integer' || schema.type === 'number') {
      // Add reasonable constraints for numbers
      if (field.name.toLowerCase().includes('age')) {
        schema.minimum = 0;
        schema.maximum = 150;
      } else if (field.name.toLowerCase().includes('price') ||
                 field.name.toLowerCase().includes('amount')) {
        schema.minimum = 0;
      }
    }
  }

  // Add description if available
  if (field.description) {
    schema.description = field.description;
  }

  return schema;
}

/**
 * Convert DTO/Model to JSON Schema
 * This is the main function that generates a complete JSON Schema from an ApiModel
 */
export function dtoToJsonSchema(
  dto: ApiModel,
  allModels: ApiModel[] = []
): JSONSchema7 {
  const schema: JSONSchema7 = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    title: dto.name,
    properties: {},
    required: [],
    additionalProperties: false, // Strict by default
  };

  if (!dto.fields || dto.fields.length === 0) {
    return schema;
  }

  // Generate schema for each field
  for (const field of dto.fields) {
    if (schema.properties) {
      schema.properties[field.name] = generateFieldSchema(field, allModels);
    }

    if (field.isRequired && schema.required) {
      (schema.required as string[]).push(field.name);
    }
  }

  // Remove empty required array
  if (schema.required && (schema.required as string[]).length === 0) {
    delete schema.required;
  }

  return schema;
}

/**
 * Generate a relaxed JSON Schema (allows additional properties)
 */
export function dtoToJsonSchemaRelaxed(
  dto: ApiModel,
  allModels: ApiModel[] = []
): JSONSchema7 {
  const schema = dtoToJsonSchema(dto, allModels);
  schema.additionalProperties = true;
  return schema;
}

/**
 * Generate example value for a JSON Schema (useful for documentation)
 */
export function generateSchemaExample(schema: JSONSchema7): any {
  if (schema.type === 'object' && schema.properties) {
    const example: Record<string, any> = {};
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (typeof propSchema !== 'boolean') {
        example[key] = generateSchemaExample(propSchema as JSONSchema7);
      }
    }
    return example;
  }

  if (schema.type === 'array' && schema.items) {
    const itemSchema = schema.items as JSONSchema7;
    return [generateSchemaExample(itemSchema)];
  }

  if (schema.type === 'string') {
    if (schema.format === 'email') return 'user@example.com';
    if (schema.format === 'date-time') return new Date().toISOString();
    if (schema.format === 'uuid') return '123e4567-e89b-12d3-a456-426614174000';
    if (schema.format === 'uri') return 'https://example.com';
    return 'string';
  }

  if (schema.type === 'number' || schema.type === 'integer') {
    return schema.minimum !== undefined ? schema.minimum : 0;
  }

  if (schema.type === 'boolean') {
    return true;
  }

  return null;
}

/**
 * Pretty print JSON Schema as formatted JSON string
 */
export function formatJsonSchema(schema: JSONSchema7): string {
  return JSON.stringify(schema, null, 2);
}
