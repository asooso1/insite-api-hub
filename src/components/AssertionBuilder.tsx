'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AssertionConfig,
  FieldAssertion,
  ASSERTION_PRESETS,
} from '@/lib/assertion-validator';
import { dtoToJsonSchema, formatJsonSchema } from '@/lib/schema-generator';
import { ApiModel } from '@/lib/api-types';
import {
  glassClasses,
  cardVariants,
  listContainerVariants,
  listItemVariants,
} from '@/lib/design-system';
import {
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings,
  Zap,
  Shield,
  Target,
  Code,
  Save,
  RotateCcw,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface AssertionBuilderProps {
  responseModel?: ApiModel;
  allModels?: ApiModel[];
  initialConfig?: AssertionConfig;
  onSave: (config: AssertionConfig) => void;
  onCancel?: () => void;
}

type PresetKey = 'basic' | 'strict' | 'performance' | 'minimal';

// ============================================
// Main Component
// ============================================

export function AssertionBuilder({
  responseModel,
  allModels = [],
  initialConfig,
  onSave,
  onCancel,
}: AssertionBuilderProps) {
  // State
  const [config, setConfig] = useState<AssertionConfig>(
    initialConfig || ASSERTION_PRESETS.basic
  );
  const [showSchema, setShowSchema] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>(null);

  // Generate JSON Schema if model is available
  const jsonSchema = useMemo(() => {
    if (!responseModel) return null;
    return dtoToJsonSchema(responseModel, allModels);
  }, [responseModel, allModels]);

  const schemaJson = useMemo(() => {
    if (!jsonSchema) return '';
    return formatJsonSchema(jsonSchema);
  }, [jsonSchema]);

  // Handlers
  const handlePresetSelect = (preset: PresetKey) => {
    setConfig(ASSERTION_PRESETS[preset]);
    setSelectedPreset(preset);
  };

  const handleToggleSchema = () => {
    setConfig({ ...config, validateSchema: !config.validateSchema });
  };

  const handleToggleStrict = () => {
    setConfig({ ...config, schemaStrict: !config.schemaStrict });
  };

  const handleStatusChange = (statusCodes: string) => {
    const codes = statusCodes
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);
    setConfig({ ...config, expectedStatus: codes });
  };

  const handleResponseTimeChange = (time: string) => {
    const timeMs = parseInt(time, 10);
    setConfig({
      ...config,
      maxResponseTime: isNaN(timeMs) || timeMs <= 0 ? undefined : timeMs,
    });
  };

  const handleAddFieldAssertion = () => {
    const newAssertion: FieldAssertion = {
      path: 'data.',
      rule: 'required',
      expected: '',
    };
    setConfig({
      ...config,
      fieldAssertions: [...(config.fieldAssertions || []), newAssertion],
    });
  };

  const handleUpdateFieldAssertion = (
    index: number,
    updates: Partial<FieldAssertion>
  ) => {
    const fieldAssertions = [...(config.fieldAssertions || [])];
    fieldAssertions[index] = { ...fieldAssertions[index], ...updates };
    setConfig({ ...config, fieldAssertions });
  };

  const handleRemoveFieldAssertion = (index: number) => {
    const fieldAssertions = [...(config.fieldAssertions || [])];
    fieldAssertions.splice(index, 1);
    setConfig({ ...config, fieldAssertions });
  };

  const handleReset = () => {
    setConfig(initialConfig || ASSERTION_PRESETS.basic);
    setSelectedPreset(null);
  };

  const handleSave = () => {
    onSave(config);
  };

  return (
    <motion.div
      className="space-y-6"
      variants={listContainerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Assertion Configuration
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure automated response validation rules
          </p>
        </div>
      </div>

      {/* Preset Templates */}
      <motion.div
        className={`${glassClasses.card} p-6 rounded-2xl`}
        variants={cardVariants}
      >
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
          Quick Presets
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <PresetButton
            icon={<Target className="w-5 h-5" />}
            label="Basic"
            description="Schema validation + 200 OK"
            active={selectedPreset === 'basic'}
            onClick={() => handlePresetSelect('basic')}
          />
          <PresetButton
            icon={<Shield className="w-5 h-5" />}
            label="Strict"
            description="Strict schema + timing"
            active={selectedPreset === 'strict'}
            onClick={() => handlePresetSelect('strict')}
          />
          <PresetButton
            icon={<Zap className="w-5 h-5" />}
            label="Performance"
            description="Focus on speed"
            active={selectedPreset === 'performance'}
            onClick={() => handlePresetSelect('performance')}
          />
          <PresetButton
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Minimal"
            description="Status code only"
            active={selectedPreset === 'minimal'}
            onClick={() => handlePresetSelect('minimal')}
          />
        </div>
      </motion.div>

      {/* Schema Validation */}
      <motion.div
        className={`${glassClasses.card} p-6 rounded-2xl`}
        variants={cardVariants}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Code className="w-5 h-5" />
              JSON Schema Validation
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Automatically validate response structure against DTO schema
            </p>
          </div>

          <ToggleSwitch
            checked={config.validateSchema || false}
            onChange={handleToggleSchema}
          />
        </div>

        <AnimatePresence>
          {config.validateSchema && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4 border-t border-border/50"
            >
              {/* Strict Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold">Strict Mode</label>
                  <p className="text-xs text-muted-foreground">
                    Reject responses with additional properties
                  </p>
                </div>
                <ToggleSwitch
                  checked={config.schemaStrict || false}
                  onChange={handleToggleStrict}
                />
              </div>

              {/* Show Generated Schema */}
              {responseModel && (
                <div>
                  <button
                    onClick={() => setShowSchema(!showSchema)}
                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    {showSchema ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    {showSchema ? 'Hide' : 'Show'} Generated JSON Schema
                  </button>

                  <AnimatePresence>
                    {showSchema && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3"
                      >
                        <pre className="bg-muted/30 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto border border-border/50">
                          {schemaJson}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Status Code & Timing */}
      <motion.div
        className={`${glassClasses.card} p-6 rounded-2xl`}
        variants={cardVariants}
      >
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
          Basic Assertions
        </h3>

        <div className="space-y-4">
          {/* Expected Status Codes */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Expected Status Codes
            </label>
            <input
              type="text"
              value={config.expectedStatus?.join(', ') || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              placeholder="200, 201, 204"
              className={`w-full px-4 py-2 rounded-xl ${glassClasses.input} text-sm font-mono transition-all outline-none`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Comma-separated list of acceptable HTTP status codes
            </p>
          </div>

          {/* Max Response Time */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Max Response Time (ms)
            </label>
            <input
              type="number"
              value={config.maxResponseTime || ''}
              onChange={(e) => handleResponseTimeChange(e.target.value)}
              placeholder="1000"
              min="0"
              className={`w-full px-4 py-2 rounded-xl ${glassClasses.input} text-sm font-mono transition-all outline-none`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to skip response time validation
            </p>
          </div>
        </div>
      </motion.div>

      {/* Custom Field Assertions */}
      <motion.div
        className={`${glassClasses.card} p-6 rounded-2xl`}
        variants={cardVariants}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Custom Field Assertions
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add specific validation rules for response fields
            </p>
          </div>

          <motion.button
            onClick={handleAddFieldAssertion}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            Add Assertion
          </motion.button>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {config.fieldAssertions?.map((assertion, index) => (
              <FieldAssertionRow
                key={index}
                assertion={assertion}
                onUpdate={(updates) =>
                  handleUpdateFieldAssertion(index, updates)
                }
                onRemove={() => handleRemoveFieldAssertion(index)}
              />
            ))}
          </AnimatePresence>

          {(!config.fieldAssertions || config.fieldAssertions.length === 0) && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No custom field assertions configured
            </div>
          )}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <motion.button
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 bg-muted/50 hover:bg-muted rounded-xl font-semibold text-sm transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </motion.button>

        {onCancel && (
          <motion.button
            onClick={onCancel}
            className="flex items-center gap-2 px-5 py-2.5 bg-muted/50 hover:bg-muted rounded-xl font-semibold text-sm transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cancel
          </motion.button>
        )}

        <motion.button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Save className="w-4 h-4" />
          Save Configuration
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================
// Preset Button Component
// ============================================

interface PresetButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}

function PresetButton({
  icon,
  label,
  description,
  active,
  onClick,
}: PresetButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        p-4 rounded-xl text-left transition-all border-2
        ${
          active
            ? 'bg-primary/10 border-primary shadow-md'
            : 'bg-muted/30 border-transparent hover:bg-muted/50'
        }
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        <div
          className={`
          p-2 rounded-lg
          ${active ? 'bg-primary text-primary-foreground' : 'bg-muted'}
        `}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold">{label}</div>
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {description}
          </div>
        </div>
        {active && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
      </div>
    </motion.button>
  );
}

// ============================================
// Toggle Switch Component
// ============================================

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
}

function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      onClick={onChange}
      className={`
        relative w-12 h-6 rounded-full transition-colors
        ${checked ? 'bg-primary' : 'bg-muted'}
      `}
    >
      <motion.div
        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
        animate={{ x: checked ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// ============================================
// Field Assertion Row Component
// ============================================

interface FieldAssertionRowProps {
  assertion: FieldAssertion;
  onUpdate: (updates: Partial<FieldAssertion>) => void;
  onRemove: () => void;
}

function FieldAssertionRow({
  assertion,
  onUpdate,
  onRemove,
}: FieldAssertionRowProps) {
  const ruleOptions = [
    { value: 'required', label: 'Required' },
    { value: 'type', label: 'Type Check' },
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'pattern', label: 'Regex Pattern' },
    { value: 'minLength', label: 'Min Length' },
    { value: 'maxLength', label: 'Max Length' },
    { value: 'min', label: 'Min Value' },
    { value: 'max', label: 'Max Value' },
  ];

  return (
    <motion.div
      className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl"
      variants={listItemVariants}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Path */}
      <div className="flex-1">
        <label className="block text-xs font-semibold text-muted-foreground mb-1">
          Field Path
        </label>
        <input
          type="text"
          value={assertion.path}
          onChange={(e) => onUpdate({ path: e.target.value })}
          placeholder="data.user.email"
          className={`w-full px-3 py-1.5 rounded-lg ${glassClasses.input} text-xs font-mono transition-all outline-none`}
        />
      </div>

      {/* Rule */}
      <div className="w-40">
        <label className="block text-xs font-semibold text-muted-foreground mb-1">
          Rule
        </label>
        <select
          value={assertion.rule}
          onChange={(e) => onUpdate({ rule: e.target.value as any })}
          className={`w-full px-3 py-1.5 rounded-lg ${glassClasses.input} text-xs transition-all outline-none`}
        >
          {ruleOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Expected Value */}
      {assertion.rule !== 'required' && (
        <div className="flex-1">
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Expected
          </label>
          <input
            type="text"
            value={assertion.expected}
            onChange={(e) => onUpdate({ expected: e.target.value })}
            placeholder="Expected value"
            className={`w-full px-3 py-1.5 rounded-lg ${glassClasses.input} text-xs font-mono transition-all outline-none`}
          />
        </div>
      )}

      {/* Remove Button */}
      <div className="pt-6">
        <motion.button
          onClick={onRemove}
          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
