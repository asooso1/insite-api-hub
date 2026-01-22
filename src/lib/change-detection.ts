import { ApiEndpoint, ApiModel } from './api-types';

/**
 * Represents a change to an API endpoint between versions
 */
export interface ApiChange {
  type: 'ADD' | 'DELETE' | 'MODIFY' | 'UNCHANGED';
  path: string;
  method: string;
  current?: ApiEndpoint;
  previous?: ApiEndpoint;
  fieldChanges?: FieldChange[];
}

/**
 * Represents a change to a specific field
 */
export interface FieldChange {
  field: string;
  before: any;
  after: any;
}

/**
 * Represents a change to an API model
 */
export interface ModelChange {
  type: 'ADD' | 'DELETE' | 'MODIFY' | 'UNCHANGED';
  name: string;
  current?: ApiModel;
  previous?: ApiModel;
  fieldChanges?: FieldChange[];
}

/**
 * Statistics about changes between versions
 */
export interface ChangeStats {
  added: number;
  deleted: number;
  modified: number;
  unchanged: number;
  total: number;
  changeRate: number; // Percentage (0-100)
}

/**
 * Generates a unique key for an API endpoint for comparison purposes
 */
export function getEndpointKey(endpoint: ApiEndpoint): string {
  return `${endpoint.method.toUpperCase()} ${endpoint.path}`;
}

/**
 * Normalizes an endpoint by handling both camelCase and snake_case fields
 * from database snapshots
 */
function normalizeEndpoint(endpoint: any): ApiEndpoint {
  return {
    id: endpoint.id,
    path: endpoint.path,
    method: endpoint.method,
    className: endpoint.class_name || endpoint.className,
    methodName: endpoint.method_name || endpoint.methodName,
    summary: endpoint.summary || '',
    requestBody: endpoint.request_body_model || endpoint.requestBody,
    responseType: endpoint.response_type || endpoint.responseType,
    syncedAt: endpoint.synced_at || endpoint.syncedAt,
    version: endpoint.version,
  };
}

/**
 * Classifies the type of change between two endpoint states
 */
export function classifyChange(
  current: ApiEndpoint | undefined,
  previous: ApiEndpoint | undefined
): 'ADD' | 'DELETE' | 'MODIFY' | 'UNCHANGED' {
  if (current && !previous) {
    return 'ADD';
  }

  if (!current && previous) {
    return 'DELETE';
  }

  if (!current && !previous) {
    return 'UNCHANGED';
  }

  // Both exist - check for modifications
  if (current && previous) {
    const hasChanges =
      current.summary !== previous.summary ||
      current.requestBody !== previous.requestBody ||
      current.responseType !== previous.responseType ||
      current.className !== previous.className ||
      current.methodName !== previous.methodName;

    return hasChanges ? 'MODIFY' : 'UNCHANGED';
  }

  return 'UNCHANGED';
}

/**
 * Extracts detailed field-level changes between two endpoints
 */
export function getFieldChanges(
  current: ApiEndpoint,
  previous: ApiEndpoint
): FieldChange[] {
  const changes: FieldChange[] = [];

  const fieldsToCompare: (keyof ApiEndpoint)[] = [
    'summary',
    'requestBody',
    'responseType',
    'className',
    'methodName',
    'path',
    'method'
  ];

  for (const field of fieldsToCompare) {
    const currentValue = current[field];
    const previousValue = previous[field];

    if (currentValue !== previousValue) {
      changes.push({
        field,
        before: previousValue,
        after: currentValue,
      });
    }
  }

  return changes;
}

/**
 * Compares two sets of endpoints and returns all changes
 */
export function compareVersions(
  currentEndpoints: ApiEndpoint[],
  previousEndpoints: ApiEndpoint[]
): ApiChange[] {
  // Handle edge cases
  if (!currentEndpoints) currentEndpoints = [];
  if (!previousEndpoints) previousEndpoints = [];

  // Normalize previous endpoints (handle snake_case from DB)
  const normalizedPrevious = previousEndpoints.map(normalizeEndpoint);

  // Create maps for efficient lookup
  const currentMap = new Map<string, ApiEndpoint>();
  const previousMap = new Map<string, ApiEndpoint>();

  currentEndpoints.forEach(endpoint => {
    const key = getEndpointKey(endpoint);
    currentMap.set(key, endpoint);
  });

  normalizedPrevious.forEach(endpoint => {
    const key = getEndpointKey(endpoint);
    previousMap.set(key, endpoint);
  });

  // Get all unique keys
  const allKeys = new Set([...currentMap.keys(), ...previousMap.keys()]);

  const changes: ApiChange[] = [];

  allKeys.forEach(key => {
    const current = currentMap.get(key);
    const previous = previousMap.get(key);
    const [method, ...pathParts] = key.split(' ');
    const path = pathParts.join(' ');

    const changeType = classifyChange(current, previous);
    const fieldChanges = current && previous ? getFieldChanges(current, previous) : undefined;

    changes.push({
      type: changeType,
      path,
      method,
      current,
      previous,
      fieldChanges,
    });
  });

  // Sort by path for consistent ordering
  return changes.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Calculates statistics about changes
 */
export function calculateChangeStats(changes: ApiChange[]): ChangeStats {
  if (!changes || changes.length === 0) {
    return {
      added: 0,
      deleted: 0,
      modified: 0,
      unchanged: 0,
      total: 0,
      changeRate: 0,
    };
  }

  const added = changes.filter(c => c.type === 'ADD').length;
  const deleted = changes.filter(c => c.type === 'DELETE').length;
  const modified = changes.filter(c => c.type === 'MODIFY').length;
  const unchanged = changes.filter(c => c.type === 'UNCHANGED').length;
  const total = changes.length;

  // Calculate change rate (percentage of total that changed)
  const changed = added + deleted + modified;
  const changeRate = total > 0 ? (changed / total) * 100 : 0;

  return {
    added,
    deleted,
    modified,
    unchanged,
    total,
    changeRate: Math.round(changeRate * 10) / 10, // Round to 1 decimal
  };
}

/**
 * Generates a human-readable summary of changes for notifications
 */
export function generateChangeSummary(
  changes: ApiChange[],
  projectName: string,
  versionFrom: string,
  versionTo: string
): string {
  const stats = calculateChangeStats(changes);

  if (stats.total === 0) {
    return `[${projectName}] No endpoints found in comparison between ${versionFrom} and ${versionTo}`;
  }

  if (stats.added === 0 && stats.deleted === 0 && stats.modified === 0) {
    return `[${projectName}] No changes detected between ${versionFrom} and ${versionTo} (${stats.total} endpoints unchanged)`;
  }

  const lines: string[] = [];
  lines.push(`[${projectName}] API Changes: ${versionFrom} → ${versionTo}`);
  lines.push('');
  lines.push(`Summary: ${stats.changeRate}% changed (${stats.added + stats.deleted + stats.modified}/${stats.total})`);

  if (stats.added > 0) {
    lines.push(`  + ${stats.added} endpoint${stats.added > 1 ? 's' : ''} added`);
  }

  if (stats.deleted > 0) {
    lines.push(`  - ${stats.deleted} endpoint${stats.deleted > 1 ? 's' : ''} deleted`);
  }

  if (stats.modified > 0) {
    lines.push(`  ~ ${stats.modified} endpoint${stats.modified > 1 ? 's' : ''} modified`);
  }

  // Add details for significant changes
  const significantChanges = changes.filter(c => c.type !== 'UNCHANGED').slice(0, 5);

  if (significantChanges.length > 0) {
    lines.push('');
    lines.push('Notable changes:');

    significantChanges.forEach(change => {
      const symbol = change.type === 'ADD' ? '+' : change.type === 'DELETE' ? '-' : '~';
      lines.push(`  ${symbol} [${change.method}] ${change.path}`);

      if (change.type === 'MODIFY' && change.fieldChanges && change.fieldChanges.length > 0) {
        change.fieldChanges.forEach(fc => {
          if (fc.field === 'summary') {
            lines.push(`      Summary: "${fc.before}" → "${fc.after}"`);
          }
        });
      }
    });

    if (changes.filter(c => c.type !== 'UNCHANGED').length > 5) {
      lines.push(`  ... and ${changes.filter(c => c.type !== 'UNCHANGED').length - 5} more`);
    }
  }

  return lines.join('\n');
}

/**
 * Compares two sets of models and returns all changes
 * (Future enhancement for model change tracking)
 */
export function compareModels(
  currentModels: ApiModel[],
  previousModels: ApiModel[]
): ModelChange[] {
  // Handle edge cases
  if (!currentModels) currentModels = [];
  if (!previousModels) previousModels = [];

  // Create maps for efficient lookup
  const currentMap = new Map<string, ApiModel>();
  const previousMap = new Map<string, ApiModel>();

  currentModels.forEach(model => {
    currentMap.set(model.name, model);
  });

  previousModels.forEach(model => {
    previousMap.set(model.name, model);
  });

  // Get all unique model names
  const allNames = new Set([...currentMap.keys(), ...previousMap.keys()]);

  const changes: ModelChange[] = [];

  allNames.forEach(name => {
    const current = currentMap.get(name);
    const previous = previousMap.get(name);

    let type: ModelChange['type'] = 'UNCHANGED';
    let fieldChanges: FieldChange[] | undefined;

    if (current && !previous) {
      type = 'ADD';
    } else if (!current && previous) {
      type = 'DELETE';
    } else if (current && previous) {
      // Compare field counts as a simple heuristic
      const currentFieldCount = current.fieldCount || current.fields?.length || 0;
      const previousFieldCount = previous.fieldCount || previous.fields?.length || 0;

      if (currentFieldCount !== previousFieldCount) {
        type = 'MODIFY';
        fieldChanges = [{
          field: 'fieldCount',
          before: previousFieldCount,
          after: currentFieldCount,
        }];
      }
    }

    changes.push({
      type,
      name,
      current,
      previous,
      fieldChanges,
    });
  });

  // Sort by name for consistent ordering
  return changes.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Filters changes to only significant ones (excludes UNCHANGED)
 */
export function getSignificantChanges(changes: ApiChange[]): ApiChange[] {
  return changes.filter(c => c.type !== 'UNCHANGED');
}

/**
 * Groups changes by type
 */
export function groupChangesByType(changes: ApiChange[]): {
  added: ApiChange[];
  deleted: ApiChange[];
  modified: ApiChange[];
  unchanged: ApiChange[];
} {
  return {
    added: changes.filter(c => c.type === 'ADD'),
    deleted: changes.filter(c => c.type === 'DELETE'),
    modified: changes.filter(c => c.type === 'MODIFY'),
    unchanged: changes.filter(c => c.type === 'UNCHANGED'),
  };
}
