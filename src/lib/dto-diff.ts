import { ApiModel, ApiField } from './api-types';

/**
 * Represents a change to a specific DTO field
 */
export interface FieldDiff {
  path: string[];           // Field path e.g., ["user", "address", "city"]
  fieldName: string;        // Last segment of path e.g., "city"
  type: 'ADD' | 'DELETE' | 'MODIFY' | 'TYPE_CHANGE';
  severity: 'BREAKING' | 'MINOR' | 'PATCH';
  before?: {
    type: string;
    required: boolean;
    description?: string;
  };
  after?: {
    type: string;
    required: boolean;
    description?: string;
  };
  message: string;          // Human readable description
}

/**
 * Represents all changes to a single DTO
 */
export interface DtoDiff {
  dtoName: string;
  fields: FieldDiff[];
  summary: {
    breaking: number;
    minor: number;
    patch: number;
    total: number;
  };
}

/**
 * Summary of breaking changes across all DTOs
 */
export interface BreakingChangeSummary {
  totalBreaking: number;
  totalMinor: number;
  totalPatch: number;
  affectedDtos: string[];
  breakingChanges: FieldDiff[];
}

const MAX_DEPTH = 10; // Prevent infinite recursion

/**
 * Normalizes field type strings for consistent comparison
 */
function normalizeType(type: string | undefined): string {
  if (!type) return 'unknown';

  // Remove whitespace and make lowercase
  let normalized = type.trim().toLowerCase();

  // Handle common type aliases
  const typeMap: Record<string, string> = {
    'int': 'integer',
    'bool': 'boolean',
    'str': 'string',
    'float': 'number',
    'double': 'number',
  };

  return typeMap[normalized] || normalized;
}

/**
 * Builds a field path string for display
 */
function buildFieldPath(path: string[]): string {
  return path.join('.');
}

/**
 * Determines if a type change is breaking (incompatible)
 */
function isTypeChangeBreaking(fromType: string, toType: string): boolean {
  const from = normalizeType(fromType);
  const to = normalizeType(toType);

  if (from === to) return false;

  // Compatible type changes (non-breaking)
  const compatibleChanges: Record<string, string[]> = {
    'integer': ['number', 'string'], // int can be widened to number or string
    'number': ['string'],
    'string': [], // string narrowing is breaking
  };

  const compatibleTargets = compatibleChanges[from] || [];
  return !compatibleTargets.includes(to);
}

/**
 * Creates a human-readable message for a field change
 */
function createChangeMessage(diff: FieldDiff): string {
  const pathStr = buildFieldPath(diff.path);

  switch (diff.type) {
    case 'ADD':
      if (diff.after?.required) {
        return `Required field '${pathStr}' was added (BREAKING: breaks existing clients)`;
      }
      return `Optional field '${pathStr}' was added`;

    case 'DELETE':
      if (diff.before?.required) {
        return `Required field '${pathStr}' was removed (BREAKING)`;
      }
      return `Optional field '${pathStr}' was removed`;

    case 'TYPE_CHANGE':
      return `Field '${pathStr}' type changed from ${diff.before?.type} to ${diff.after?.type}${diff.severity === 'BREAKING' ? ' (BREAKING: incompatible types)' : ''}`;

    case 'MODIFY':
      const changes: string[] = [];

      if (diff.before?.required !== diff.after?.required) {
        if (diff.after?.required) {
          changes.push('made required (BREAKING)');
        } else {
          changes.push('made optional');
        }
      }

      if (diff.before?.description !== diff.after?.description) {
        changes.push('description updated');
      }

      return `Field '${pathStr}' ${changes.join(', ')}`;

    default:
      return `Field '${pathStr}' changed`;
  }
}

/**
 * Determines the severity of a field change
 */
export function getChangeSeverity(change: FieldDiff): 'BREAKING' | 'MINOR' | 'PATCH' {
  switch (change.type) {
    case 'ADD':
      // Adding a required field breaks existing clients
      return change.after?.required ? 'BREAKING' : 'MINOR';

    case 'DELETE':
      // Removing a required field is breaking, optional is minor
      return change.before?.required ? 'BREAKING' : 'MINOR';

    case 'TYPE_CHANGE':
      // Type changes are breaking if incompatible
      if (change.before && change.after) {
        return isTypeChangeBreaking(change.before.type, change.after.type)
          ? 'BREAKING'
          : 'MINOR';
      }
      return 'BREAKING';

    case 'MODIFY':
      // Making a field required is breaking
      if (change.before?.required === false && change.after?.required === true) {
        return 'BREAKING';
      }
      // Making a field optional is minor
      if (change.before?.required === true && change.after?.required === false) {
        return 'MINOR';
      }
      // Description changes are patch-level
      if (change.before?.description !== change.after?.description) {
        return 'PATCH';
      }
      return 'PATCH';

    default:
      return 'PATCH';
  }
}

/**
 * Recursively compares nested field structures
 */
function compareFieldsRecursive(
  beforeFields: ApiField[] | undefined,
  afterFields: ApiField[] | undefined,
  path: string[] = [],
  depth: number = 0
): FieldDiff[] {
  if (depth > MAX_DEPTH) {
    console.warn(`Max recursion depth reached at path: ${path.join('.')}`);
    return [];
  }

  const diffs: FieldDiff[] = [];
  const before = beforeFields || [];
  const after = afterFields || [];

  // Create maps for efficient lookup
  const beforeMap = new Map<string, ApiField>();
  const afterMap = new Map<string, ApiField>();

  before.forEach(field => beforeMap.set(field.name, field));
  after.forEach(field => afterMap.set(field.name, field));

  // Get all unique field names
  const allFieldNames = new Set([...beforeMap.keys(), ...afterMap.keys()]);

  allFieldNames.forEach(fieldName => {
    const beforeField = beforeMap.get(fieldName);
    const afterField = afterMap.get(fieldName);
    const currentPath = [...path, fieldName];

    if (!beforeField && afterField) {
      // Field was added
      const diff: FieldDiff = {
        path: currentPath,
        fieldName,
        type: 'ADD',
        severity: 'MINOR', // Will be recalculated
        after: {
          type: afterField.type,
          required: afterField.isRequired || false,
          description: afterField.description,
        },
        message: '',
      };
      diff.severity = getChangeSeverity(diff);
      diff.message = createChangeMessage(diff);
      diffs.push(diff);

      // Recursively check nested fields if it's a complex type
      if (afterField.isComplex && afterField.refFields) {
        diffs.push(...compareFieldsRecursive([], afterField.refFields, currentPath, depth + 1));
      }
    } else if (beforeField && !afterField) {
      // Field was deleted
      const diff: FieldDiff = {
        path: currentPath,
        fieldName,
        type: 'DELETE',
        severity: 'MINOR', // Will be recalculated
        before: {
          type: beforeField.type,
          required: beforeField.isRequired || false,
          description: beforeField.description,
        },
        message: '',
      };
      diff.severity = getChangeSeverity(diff);
      diff.message = createChangeMessage(diff);
      diffs.push(diff);
    } else if (beforeField && afterField) {
      // Field exists in both - check for changes
      const beforeType = normalizeType(beforeField.type);
      const afterType = normalizeType(afterField.type);
      const beforeRequired = beforeField.isRequired || false;
      const afterRequired = afterField.isRequired || false;

      // Check for type change
      if (beforeType !== afterType) {
        const diff: FieldDiff = {
          path: currentPath,
          fieldName,
          type: 'TYPE_CHANGE',
          severity: 'BREAKING', // Will be recalculated
          before: {
            type: beforeField.type,
            required: beforeRequired,
            description: beforeField.description,
          },
          after: {
            type: afterField.type,
            required: afterRequired,
            description: afterField.description,
          },
          message: '',
        };
        diff.severity = getChangeSeverity(diff);
        diff.message = createChangeMessage(diff);
        diffs.push(diff);
      }
      // Check for other modifications
      else if (
        beforeRequired !== afterRequired ||
        beforeField.description !== afterField.description
      ) {
        const diff: FieldDiff = {
          path: currentPath,
          fieldName,
          type: 'MODIFY',
          severity: 'PATCH', // Will be recalculated
          before: {
            type: beforeField.type,
            required: beforeRequired,
            description: beforeField.description,
          },
          after: {
            type: afterField.type,
            required: afterRequired,
            description: afterField.description,
          },
          message: '',
        };
        diff.severity = getChangeSeverity(diff);
        diff.message = createChangeMessage(diff);
        diffs.push(diff);
      }

      // Recursively compare nested fields if both are complex types
      if (beforeField.isComplex && afterField.isComplex) {
        diffs.push(
          ...compareFieldsRecursive(
            beforeField.refFields,
            afterField.refFields,
            currentPath,
            depth + 1
          )
        );
      }
      // Handle case where field became complex or simple
      else if (beforeField.isComplex !== afterField.isComplex) {
        const diff: FieldDiff = {
          path: currentPath,
          fieldName,
          type: 'TYPE_CHANGE',
          severity: 'BREAKING',
          before: {
            type: beforeField.type,
            required: beforeRequired,
            description: beforeField.description,
          },
          after: {
            type: afterField.type,
            required: afterRequired,
            description: afterField.description,
          },
          message: `Field '${buildFieldPath(currentPath)}' structure changed (${beforeField.isComplex ? 'complex' : 'simple'} → ${afterField.isComplex ? 'complex' : 'simple'})`,
        };
        diffs.push(diff);
      }
    }
  });

  return diffs;
}

/**
 * Compares two DTO schemas and returns all field-level differences
 */
export function compareDtoFields(before: ApiModel, after: ApiModel): DtoDiff {
  const fields = compareFieldsRecursive(before.fields, after.fields);

  // Calculate summary statistics
  const breaking = fields.filter(f => f.severity === 'BREAKING').length;
  const minor = fields.filter(f => f.severity === 'MINOR').length;
  const patch = fields.filter(f => f.severity === 'PATCH').length;

  return {
    dtoName: after.name,
    fields,
    summary: {
      breaking,
      minor,
      patch,
      total: fields.length,
    },
  };
}

/**
 * Compares two sets of DTOs and returns all differences
 */
export function compareAllDtos(beforeDtos: ApiModel[], afterDtos: ApiModel[]): DtoDiff[] {
  const diffs: DtoDiff[] = [];

  // Create maps for efficient lookup
  const beforeMap = new Map<string, ApiModel>();
  const afterMap = new Map<string, ApiModel>();

  beforeDtos.forEach(dto => beforeMap.set(dto.name, dto));
  afterDtos.forEach(dto => afterMap.set(dto.name, dto));

  // Get all unique DTO names
  const allDtoNames = new Set([...beforeMap.keys(), ...afterMap.keys()]);

  allDtoNames.forEach(dtoName => {
    const before = beforeMap.get(dtoName);
    const after = afterMap.get(dtoName);

    if (before && after) {
      // Compare existing DTOs
      const diff = compareDtoFields(before, after);

      // Only include DTOs that have changes
      if (diff.fields.length > 0) {
        diffs.push(diff);
      }
    } else if (!before && after) {
      // New DTO added
      diffs.push({
        dtoName,
        fields: [{
          path: [dtoName],
          fieldName: dtoName,
          type: 'ADD',
          severity: 'MINOR',
          after: {
            type: 'object',
            required: true,
            description: `New DTO: ${dtoName}`,
          },
          message: `New DTO '${dtoName}' was added`,
        }],
        summary: {
          breaking: 0,
          minor: 1,
          patch: 0,
          total: 1,
        },
      });
    } else if (before && !after) {
      // DTO was removed
      diffs.push({
        dtoName,
        fields: [{
          path: [dtoName],
          fieldName: dtoName,
          type: 'DELETE',
          severity: 'BREAKING',
          before: {
            type: 'object',
            required: true,
            description: `Deleted DTO: ${dtoName}`,
          },
          message: `DTO '${dtoName}' was removed (BREAKING)`,
        }],
        summary: {
          breaking: 1,
          minor: 0,
          patch: 0,
          total: 1,
        },
      });
    }
  });

  // Sort by DTO name for consistent ordering
  return diffs.sort((a, b) => a.dtoName.localeCompare(b.dtoName));
}

/**
 * Gets a summary of breaking changes across all DTOs
 */
export function getBreakingChangeSummary(diffs: DtoDiff[]): BreakingChangeSummary {
  let totalBreaking = 0;
  let totalMinor = 0;
  let totalPatch = 0;
  const affectedDtos: string[] = [];
  const breakingChanges: FieldDiff[] = [];

  diffs.forEach(diff => {
    totalBreaking += diff.summary.breaking;
    totalMinor += diff.summary.minor;
    totalPatch += diff.summary.patch;

    if (diff.fields.length > 0) {
      affectedDtos.push(diff.dtoName);
    }

    // Collect all breaking changes
    diff.fields.forEach(field => {
      if (field.severity === 'BREAKING') {
        breakingChanges.push(field);
      }
    });
  });

  return {
    totalBreaking,
    totalMinor,
    totalPatch,
    affectedDtos,
    breakingChanges,
  };
}
