import { FieldDiff, DtoDiff, BreakingChangeSummary } from './dto-diff';

/**
 * Breaking Change Categories
 */
export enum BreakingChangeCategory {
  REQUIRED_FIELD_REMOVED = 'REQUIRED_FIELD_REMOVED',
  REQUIRED_FIELD_ADDED = 'REQUIRED_FIELD_ADDED',
  TYPE_INCOMPATIBLE = 'TYPE_INCOMPATIBLE',
  FIELD_MADE_REQUIRED = 'FIELD_MADE_REQUIRED',
  DTO_REMOVED = 'DTO_REMOVED',
}

/**
 * Determines if a change is breaking based on strict API contract rules
 */
export function isBreakingChange(change: FieldDiff): boolean {
  switch (change.type) {
    case 'ADD':
      // Adding a required field breaks existing clients that don't send it
      return change.after?.required === true;

    case 'DELETE':
      // Removing a required field breaks clients expecting it
      // Removing optional fields is also potentially breaking for clients using them
      return change.before?.required === true;

    case 'TYPE_CHANGE':
      // Type changes are almost always breaking
      return true;

    case 'MODIFY':
      // Making a field required is breaking
      if (change.before?.required === false && change.after?.required === true) {
        return true;
      }
      return false;

    default:
      return false;
  }
}

/**
 * Categorizes a breaking change for better reporting
 */
export function categorizeBreakingChange(change: FieldDiff): BreakingChangeCategory | null {
  if (!isBreakingChange(change)) {
    return null;
  }

  switch (change.type) {
    case 'ADD':
      if (change.after?.required) {
        return BreakingChangeCategory.REQUIRED_FIELD_ADDED;
      }
      return null;

    case 'DELETE':
      if (change.before?.required) {
        return BreakingChangeCategory.REQUIRED_FIELD_REMOVED;
      }
      // Treat all deletions as breaking even if optional
      return BreakingChangeCategory.REQUIRED_FIELD_REMOVED;

    case 'TYPE_CHANGE':
      return BreakingChangeCategory.TYPE_INCOMPATIBLE;

    case 'MODIFY':
      if (change.before?.required === false && change.after?.required === true) {
        return BreakingChangeCategory.FIELD_MADE_REQUIRED;
      }
      return null;

    default:
      return null;
  }
}

/**
 * Formats a breaking change into a human-readable message
 */
export function formatBreakingChangeMessage(change: FieldDiff): string {
  const category = categorizeBreakingChange(change);
  const fieldPath = change.path.join('.');

  if (!category) {
    return change.message;
  }

  switch (category) {
    case BreakingChangeCategory.REQUIRED_FIELD_REMOVED:
      return `⚠️ BREAKING: Required field '${fieldPath}' was removed. Clients expecting this field will fail.`;

    case BreakingChangeCategory.REQUIRED_FIELD_ADDED:
      return `⚠️ BREAKING: Required field '${fieldPath}' (${change.after?.type}) was added. Existing clients not sending this field will be rejected.`;

    case BreakingChangeCategory.TYPE_INCOMPATIBLE:
      return `⚠️ BREAKING: Field '${fieldPath}' type changed from ${change.before?.type} to ${change.after?.type}. This may cause data parsing errors.`;

    case BreakingChangeCategory.FIELD_MADE_REQUIRED:
      return `⚠️ BREAKING: Field '${fieldPath}' is now required (was optional). Clients not sending this field will be rejected.`;

    case BreakingChangeCategory.DTO_REMOVED:
      return `⚠️ BREAKING: DTO was completely removed. All endpoints using this type will fail.`;

    default:
      return change.message;
  }
}

/**
 * Gets a comprehensive breaking change summary with detailed analysis
 */
export function getBreakingChangeSummary(diffs: DtoDiff[]): BreakingChangeSummary & {
  categories: Record<BreakingChangeCategory, number>;
  recommendations: string[];
} {
  let totalBreaking = 0;
  let totalMinor = 0;
  let totalPatch = 0;
  const affectedDtos: string[] = [];
  const breakingChanges: FieldDiff[] = [];
  const categories: Record<BreakingChangeCategory, number> = {
    [BreakingChangeCategory.REQUIRED_FIELD_REMOVED]: 0,
    [BreakingChangeCategory.REQUIRED_FIELD_ADDED]: 0,
    [BreakingChangeCategory.TYPE_INCOMPATIBLE]: 0,
    [BreakingChangeCategory.FIELD_MADE_REQUIRED]: 0,
    [BreakingChangeCategory.DTO_REMOVED]: 0,
  };

  diffs.forEach(diff => {
    totalBreaking += diff.summary.breaking;
    totalMinor += diff.summary.minor;
    totalPatch += diff.summary.patch;

    if (diff.fields.length > 0) {
      affectedDtos.push(diff.dtoName);
    }

    // Analyze each field change
    diff.fields.forEach(field => {
      if (field.severity === 'BREAKING') {
        breakingChanges.push(field);

        const category = categorizeBreakingChange(field);
        if (category) {
          categories[category]++;
        }
      }
    });
  });

  // Generate recommendations based on breaking changes
  const recommendations: string[] = [];

  if (totalBreaking > 0) {
    recommendations.push('Consider versioning your API (e.g., /v2/) to maintain backward compatibility');

    if (categories[BreakingChangeCategory.REQUIRED_FIELD_ADDED] > 0) {
      recommendations.push('For new required fields, consider making them optional initially or provide default values');
    }

    if (categories[BreakingChangeCategory.REQUIRED_FIELD_REMOVED] > 0) {
      recommendations.push('Deprecate fields before removing them. Mark as deprecated in v1, remove in v2');
    }

    if (categories[BreakingChangeCategory.TYPE_INCOMPATIBLE] > 0) {
      recommendations.push('Type changes should be avoided. Consider adding a new field with the new type');
    }

    if (categories[BreakingChangeCategory.FIELD_MADE_REQUIRED] > 0) {
      recommendations.push('Making fields required should be done across major versions with proper client migration notice');
    }

    recommendations.push('Communicate breaking changes to all API consumers before deployment');
    recommendations.push('Consider a migration period where both old and new APIs are supported');
  }

  return {
    totalBreaking,
    totalMinor,
    totalPatch,
    affectedDtos,
    breakingChanges,
    categories,
    recommendations,
  };
}

/**
 * Validates if a change is safe for deployment
 */
export function isSafeForDeployment(diffs: DtoDiff[]): {
  safe: boolean;
  reason?: string;
  breakingCount: number;
} {
  const summary = getBreakingChangeSummary(diffs);

  if (summary.totalBreaking === 0) {
    return {
      safe: true,
      breakingCount: 0,
    };
  }

  return {
    safe: false,
    reason: `${summary.totalBreaking} breaking change(s) detected across ${summary.affectedDtos.length} DTO(s)`,
    breakingCount: summary.totalBreaking,
  };
}

/**
 * Generates a detailed report for breaking changes
 */
export function generateBreakingChangeReport(diffs: DtoDiff[]): string {
  const summary = getBreakingChangeSummary(diffs);

  if (summary.totalBreaking === 0) {
    return 'No breaking changes detected. Safe to deploy.';
  }

  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════');
  lines.push('           BREAKING CHANGES DETECTED               ');
  lines.push('═══════════════════════════════════════════════════');
  lines.push('');

  lines.push(`Summary:`);
  lines.push(`  Breaking Changes: ${summary.totalBreaking}`);
  lines.push(`  Minor Changes: ${summary.totalMinor}`);
  lines.push(`  Patch Changes: ${summary.totalPatch}`);
  lines.push(`  Affected DTOs: ${summary.affectedDtos.length}`);
  lines.push('');

  lines.push('Breakdown by Category:');
  Object.entries(summary.categories).forEach(([category, count]) => {
    if (count > 0) {
      const categoryName = category.replace(/_/g, ' ');
      lines.push(`  - ${categoryName}: ${count}`);
    }
  });
  lines.push('');

  lines.push('Detailed Changes:');
  lines.push('───────────────────────────────────────────────────');

  diffs.forEach(diff => {
    const breakingFields = diff.fields.filter(f => f.severity === 'BREAKING');

    if (breakingFields.length > 0) {
      lines.push('');
      lines.push(`DTO: ${diff.dtoName}`);

      breakingFields.forEach(field => {
        lines.push(`  ${formatBreakingChangeMessage(field)}`);
      });
    }
  });

  if (summary.recommendations.length > 0) {
    lines.push('');
    lines.push('Recommendations:');
    lines.push('───────────────────────────────────────────────────');
    summary.recommendations.forEach((rec, idx) => {
      lines.push(`${idx + 1}. ${rec}`);
    });
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}

/**
 * Filters changes to only breaking changes
 */
export function getOnlyBreakingChanges(diffs: DtoDiff[]): DtoDiff[] {
  return diffs
    .map(diff => ({
      ...diff,
      fields: diff.fields.filter(f => f.severity === 'BREAKING'),
      summary: {
        ...diff.summary,
        breaking: diff.fields.filter(f => f.severity === 'BREAKING').length,
        minor: 0,
        patch: 0,
        total: diff.fields.filter(f => f.severity === 'BREAKING').length,
      },
    }))
    .filter(diff => diff.fields.length > 0);
}

/**
 * Estimates the impact level of changes
 */
export function estimateImpactLevel(diffs: DtoDiff[]): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' {
  const summary = getBreakingChangeSummary(diffs);

  if (summary.totalBreaking === 0 && summary.totalMinor === 0 && summary.totalPatch === 0) {
    return 'NONE';
  }

  if (summary.totalBreaking >= 10) {
    return 'CRITICAL';
  }

  if (summary.totalBreaking >= 5) {
    return 'HIGH';
  }

  if (summary.totalBreaking >= 1) {
    return 'MEDIUM';
  }

  return 'LOW';
}
