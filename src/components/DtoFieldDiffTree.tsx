'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  AlertCircle,
  ArrowRight,
  AlertTriangle,
  Info,
  FileCode,
} from 'lucide-react';
import { FieldDiff, DtoDiff } from '@/lib/dto-diff';
import { isBreakingChange, formatBreakingChangeMessage } from '@/lib/breaking-changes';
import { cn } from '@/lib/utils';
import { listContainerVariants, listItemVariants } from '@/lib/design-system';

interface DtoFieldDiffTreeProps {
  diff: DtoDiff;
}

/**
 * Visual tree component for displaying DTO field differences
 * with expandable/collapsible structure
 */
export function DtoFieldDiffTree({ diff }: DtoFieldDiffTreeProps) {
  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <DtoSummaryHeader diff={diff} />

      {/* Field Changes Tree */}
      <motion.div
        className="space-y-2"
        variants={listContainerVariants}
        initial="initial"
        animate="animate"
      >
        {diff.fields.map((fieldDiff, idx) => (
          <FieldDiffNode key={`${fieldDiff.path.join('.')}-${idx}`} fieldDiff={fieldDiff} />
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Summary header showing DTO name and change statistics
 */
function DtoSummaryHeader({ diff }: { diff: DtoDiff }) {
  const { summary } = diff;

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-white/10">
      <div className="flex items-center gap-3">
        <FileCode className="w-5 h-5 text-primary" />
        <div>
          <h4 className="font-semibold text-foreground">{diff.dtoName}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {summary.total} change{summary.total !== 1 ? 's' : ''} detected
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {summary.breaking > 0 && (
          <SeverityBadge severity="BREAKING" count={summary.breaking} />
        )}
        {summary.minor > 0 && (
          <SeverityBadge severity="MINOR" count={summary.minor} />
        )}
        {summary.patch > 0 && (
          <SeverityBadge severity="PATCH" count={summary.patch} />
        )}
      </div>
    </div>
  );
}

/**
 * Individual field difference node with expand/collapse functionality
 */
function FieldDiffNode({ fieldDiff }: { fieldDiff: FieldDiff }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasDetails = fieldDiff.before || fieldDiff.after;
  const isBreaking = isBreakingChange(fieldDiff);

  return (
    <motion.div
      variants={listItemVariants}
      className={cn(
        'rounded-lg border-l-4 transition-all overflow-hidden',
        'bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm',
        fieldDiff.type === 'ADD' && 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10',
        fieldDiff.type === 'DELETE' && 'border-l-rose-500 bg-rose-50/50 dark:bg-rose-900/10',
        fieldDiff.type === 'MODIFY' && 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10',
        fieldDiff.type === 'TYPE_CHANGE' && 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10',
        isBreaking && 'ring-2 ring-rose-500/20'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-start gap-3 p-4 cursor-pointer select-none',
          'hover:bg-black/5 dark:hover:bg-white/5 transition-colors'
        )}
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
      >
        {/* Expand/Collapse Icon */}
        <div className="mt-0.5">
          {hasDetails ? (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>

        {/* Change Type Icon */}
        <div className="mt-0.5">
          <ChangeTypeIcon type={fieldDiff.type} />
        </div>

        {/* Field Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="font-mono text-sm font-semibold text-foreground break-all">
              {fieldDiff.path.join('.')}
            </code>

            <SeverityBadge severity={fieldDiff.severity} />

            {isBreaking && (
              <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-3 h-3" />
                BREAKING
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-1">
            {isBreaking ? formatBreakingChangeMessage(fieldDiff) : fieldDiff.message}
          </p>
        </div>
      </div>

      {/* Expandable Details */}
      <AnimatePresence initial={false}>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-4 pl-11 space-y-3 border-t border-slate-200/50 dark:border-white/10 pt-3">
              {/* Before State */}
              {fieldDiff.before && (
                <div className="flex items-start gap-3">
                  <Minus className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 bg-rose-500/10 dark:bg-rose-900/20 rounded-lg p-3 border border-rose-500/20">
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 mb-2">
                      Before
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Type:</span>
                        <code className="px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded font-mono">
                          {fieldDiff.before.type}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Required:</span>
                        <span className={fieldDiff.before.required ? 'text-rose-600 font-semibold' : 'text-muted-foreground'}>
                          {fieldDiff.before.required ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {fieldDiff.before.description && (
                        <div className="flex flex-col gap-1 mt-2">
                          <span className="text-muted-foreground">Description:</span>
                          <p className="text-foreground/70 italic">
                            {fieldDiff.before.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* After State */}
              {fieldDiff.after && (
                <div className="flex items-start gap-3">
                  <Plus className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 bg-emerald-500/10 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-500/20">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                      After
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Type:</span>
                        <code className="px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded font-mono">
                          {fieldDiff.after.type}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Required:</span>
                        <span className={fieldDiff.after.required ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}>
                          {fieldDiff.after.required ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {fieldDiff.after.description && (
                        <div className="flex flex-col gap-1 mt-2">
                          <span className="text-muted-foreground">Description:</span>
                          <p className="text-foreground/70 italic">
                            {fieldDiff.after.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Change Arrow (if both before and after exist) */}
              {fieldDiff.before && fieldDiff.after && (
                <div className="flex items-center justify-center py-2">
                  <ArrowRight className="w-5 h-5 text-muted-foreground/50" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Change type icon based on diff type
 */
function ChangeTypeIcon({ type }: { type: FieldDiff['type'] }) {
  const iconClasses = 'w-4 h-4';

  switch (type) {
    case 'ADD':
      return <Plus className={cn(iconClasses, 'text-emerald-500')} />;
    case 'DELETE':
      return <Minus className={cn(iconClasses, 'text-rose-500')} />;
    case 'MODIFY':
      return <Info className={cn(iconClasses, 'text-blue-500')} />;
    case 'TYPE_CHANGE':
      return <AlertCircle className={cn(iconClasses, 'text-amber-500')} />;
    default:
      return <Info className={cn(iconClasses, 'text-muted-foreground')} />;
  }
}

/**
 * Severity badge component
 */
function SeverityBadge({ severity, count }: { severity: FieldDiff['severity']; count?: number }) {
  const styles = {
    BREAKING: 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/30 ring-rose-500/10',
    MINOR: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 ring-amber-500/10',
    PATCH: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30 ring-blue-500/10',
  };

  const icons = {
    BREAKING: <AlertTriangle className="w-3 h-3" />,
    MINOR: <AlertCircle className="w-3 h-3" />,
    PATCH: <Info className="w-3 h-3" />,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
        'border ring-1',
        styles[severity]
      )}
    >
      {icons[severity]}
      {severity}
      {count !== undefined && (
        <span className="ml-1 px-1 bg-black/10 dark:bg-white/10 rounded">
          {count}
        </span>
      )}
    </span>
  );
}

/**
 * Multi-DTO diff tree component
 */
export function MultiDtoFieldDiffTree({ diffs }: { diffs: DtoDiff[] }) {
  return (
    <div className="space-y-6">
      {diffs.map((diff, idx) => (
        <DtoFieldDiffTree key={`${diff.dtoName}-${idx}`} diff={diff} />
      ))}
    </div>
  );
}
