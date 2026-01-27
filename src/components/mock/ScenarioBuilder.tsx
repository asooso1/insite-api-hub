'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { glassClasses, cardVariants, listContainerVariants, listItemVariants } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import {
  GitBranch,
  ListOrdered,
  Filter,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Save,
  Code,
  Workflow,
  Hash,
  X,
  Play,
} from 'lucide-react';
import toast from 'react-hot-toast';

import type {
  ScenarioConfig,
  ScenarioState,
  StateTransition,
  SequenceResponse,
  ConditionalRule,
} from '@/lib/mock/scenario-engine';

interface ScenarioBuilderProps {
  scenarioConfig: ScenarioConfig | null;
  sequenceResponses: SequenceResponse[] | null;
  conditionalRules: ConditionalRule[] | null;
  onSaveScenario: (config: ScenarioConfig) => void;
  onSaveSequence: (responses: SequenceResponse[]) => void;
  onSaveConditionalRules: (rules: ConditionalRule[]) => void;
  onClose?: () => void;
}

type TabType = 'state-machine' | 'sequence' | 'conditional';

const OPERATORS = ['eq', 'neq', 'gt', 'lt', 'contains', 'exists', 'matches'] as const;
const TRIGGER_TYPES = ['auto', 'on_call', 'condition'] as const;

export function ScenarioBuilder({
  scenarioConfig,
  sequenceResponses,
  conditionalRules,
  onSaveScenario,
  onSaveSequence,
  onSaveConditionalRules,
  onClose,
}: ScenarioBuilderProps) {
  const [activeTab, setActiveTab] = useState<TabType>('state-machine');

  // State Machine tab state
  const [states, setStates] = useState<ScenarioState[]>(
    scenarioConfig?.states || [
      {
        name: 'initial',
        response: {
          statusCode: 200,
          body: {},
        },
      },
    ]
  );
  const [transitions, setTransitions] = useState<StateTransition[]>(
    scenarioConfig?.transitions || []
  );
  const [initialState, setInitialState] = useState(scenarioConfig?.initialState || 'initial');

  // Sequence tab state
  const [sequences, setSequences] = useState<SequenceResponse[]>(
    sequenceResponses || [
      {
        callNumber: 1,
        statusCode: 200,
        body: {},
      },
    ]
  );

  // Conditional tab state
  const [rules, setRules] = useState<ConditionalRule[]>(
    conditionalRules || [
      {
        condition: {
          field: '',
          operator: 'eq',
          value: '',
        },
        response: {
          statusCode: 200,
          body: {},
        },
      },
    ]
  );

  // Helper: Format JSON with error handling
  const formatJSON = (jsonStr: string): string => {
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch {
      return jsonStr;
    }
  };

  // Helper: Get state badge color
  const getStateBadgeColor = (statusCode: number): string => {
    if (statusCode >= 200 && statusCode < 300) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (statusCode >= 400 && statusCode < 500) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (statusCode >= 500) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  // Save handlers
  const handleSaveScenario = () => {
    try {
      // Validate
      if (states.length === 0) {
        toast.error('At least one state is required');
        return;
      }

      if (!states.find((s) => s.name === initialState)) {
        toast.error('Initial state must exist in states list');
        return;
      }

      // Validate JSON in all states
      for (const state of states) {
        JSON.stringify(state.response.body);
      }

      const config: ScenarioConfig = {
        states,
        transitions,
        initialState,
      };

      onSaveScenario(config);
      toast.success('State machine saved successfully');
    } catch (error) {
      toast.error('Invalid JSON in state responses');
    }
  };

  const handleSaveSequence = () => {
    try {
      // Validate JSON
      for (const seq of sequences) {
        JSON.stringify(seq.body);
      }

      onSaveSequence(sequences);
      toast.success('Sequence responses saved successfully');
    } catch (error) {
      toast.error('Invalid JSON in sequence responses');
    }
  };

  const handleSaveConditionalRules = () => {
    try {
      // Validate JSON
      for (const rule of rules) {
        JSON.stringify(rule.response.body);
      }

      onSaveConditionalRules(rules);
      toast.success('Conditional rules saved successfully');
    } catch (error) {
      toast.error('Invalid JSON in rule responses');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          glassClasses.modal,
          'w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
              <Workflow className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Scenario Builder</h2>
              <p className="text-sm text-slate-400">Define stateful mock behaviors</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tabs - Pill Style Selector */}
        <div className="flex items-center justify-center gap-2 p-4 bg-slate-950/50">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-800/50 border border-white/10">
            <TabButton
              active={activeTab === 'state-machine'}
              onClick={() => setActiveTab('state-machine')}
              icon={<GitBranch className="w-4 h-4" />}
              label="상태 머신"
            />
            <TabButton
              active={activeTab === 'sequence'}
              onClick={() => setActiveTab('sequence')}
              icon={<ListOrdered className="w-4 h-4" />}
              label="순차 응답"
            />
            <TabButton
              active={activeTab === 'conditional'}
              onClick={() => setActiveTab('conditional')}
              icon={<Filter className="w-4 h-4" />}
              label="조건부 규칙"
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'state-machine' && (
              <StateMachineTab
                key="state-machine"
                states={states}
                setStates={setStates}
                transitions={transitions}
                setTransitions={setTransitions}
                initialState={initialState}
                setInitialState={setInitialState}
                formatJSON={formatJSON}
                getStateBadgeColor={getStateBadgeColor}
              />
            )}
            {activeTab === 'sequence' && (
              <SequenceTab
                key="sequence"
                sequences={sequences}
                setSequences={setSequences}
                formatJSON={formatJSON}
              />
            )}
            {activeTab === 'conditional' && (
              <ConditionalTab
                key="conditional"
                rules={rules}
                setRules={setRules}
                formatJSON={formatJSON}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10 bg-slate-950/50">
          <div className="text-sm font-medium text-slate-400">
            {activeTab === 'state-machine' && (
              <span className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-bold">{states.length} 상태</span>
                <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 text-xs font-bold">{transitions.length} 전환</span>
              </span>
            )}
            {activeTab === 'sequence' && (
              <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-300 text-xs font-bold">
                {sequences.length} 순차 응답
              </span>
            )}
            {activeTab === 'conditional' && (
              <span className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold">
                {rules.length} 조건부 규칙
              </span>
            )}
          </div>
          <div className="flex gap-3">
            {onClose && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
              >
                취소
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (activeTab === 'state-machine') handleSaveScenario();
                if (activeTab === 'sequence') handleSaveSequence();
                if (activeTab === 'conditional') handleSaveConditionalRules();
              }}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              <Save className="w-4 h-4" />
              {activeTab === 'state-machine' ? '시나리오' : activeTab === 'sequence' ? '순차' : '규칙'} 저장
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Tab Button Component - Pill Style
function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all rounded-lg',
        active
          ? 'text-white'
          : 'text-slate-400 hover:text-slate-300'
      )}
    >
      {active && (
        <motion.div
          layoutId="activeTabPill"
          className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {icon}
        {label}
      </span>
    </motion.button>
  );
}

// State Machine Tab
function StateMachineTab({
  states,
  setStates,
  transitions,
  setTransitions,
  initialState,
  setInitialState,
  formatJSON,
  getStateBadgeColor,
}: {
  states: ScenarioState[];
  setStates: (states: ScenarioState[]) => void;
  transitions: StateTransition[];
  setTransitions: (transitions: StateTransition[]) => void;
  initialState: string;
  setInitialState: (state: string) => void;
  formatJSON: (json: string) => string;
  getStateBadgeColor: (statusCode: number) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Initial State Selector */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/30"
      >
        <label className="block text-sm font-semibold text-indigo-300 mb-3 flex items-center gap-2">
          <Play className="w-4 h-4" />
          시작 상태
        </label>
        <select
          value={initialState}
          onChange={(e) => setInitialState(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-indigo-500/30 text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
        >
          {states.map((state) => (
            <option key={state.name} value={state.name}>
              {state.name}
            </option>
          ))}
        </select>
      </motion.div>

      {/* States Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
            <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
              <Code className="w-5 h-5 text-indigo-400" />
            </div>
            상태 목록
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              setStates([
                ...states,
                {
                  name: `state_${states.length + 1}`,
                  response: { statusCode: 200, body: {} },
                },
              ])
            }
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-indigo-300 text-sm font-semibold transition-all border border-indigo-500/30 hover:border-indigo-500/50"
          >
            <Plus className="w-4 h-4" />
            상태 추가
          </motion.button>
        </div>

        <motion.div variants={listContainerVariants} initial="initial" animate="animate" className="space-y-3">
          {states.map((state, index) => (
            <motion.div
              key={index}
              variants={listItemVariants}
              whileHover={{ scale: 1.01, y: -2 }}
              className="p-5 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 border-2 border-white/10 hover:border-indigo-500/30 space-y-4 shadow-lg hover:shadow-indigo-500/10 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">상태 이름</label>
                    <input
                      type="text"
                      value={state.name}
                      onChange={(e) => {
                        const newStates = [...states];
                        newStates[index].name = e.target.value;
                        setStates(newStates);
                      }}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-900/50 border border-white/10 text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">상태 코드</label>
                    <input
                      type="number"
                      value={state.response.statusCode}
                      onChange={(e) => {
                        const newStates = [...states];
                        newStates[index].response.statusCode = parseInt(e.target.value) || 200;
                        setStates(newStates);
                      }}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-900/50 border border-white/10 text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setStates(states.filter((_, i) => i !== index))}
                  className="ml-3 p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300">응답 본문 (JSON)</label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const newStates = [...states];
                      newStates[index].response.body = JSON.parse(
                        formatJSON(JSON.stringify(state.response.body))
                      );
                      setStates(newStates);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    정렬
                  </motion.button>
                </div>
                <textarea
                  value={JSON.stringify(state.response.body, null, 2)}
                  onChange={(e) => {
                    try {
                      const newStates = [...states];
                      newStates[index].response.body = JSON.parse(e.target.value);
                      setStates(newStates);
                    } catch {
                      // Keep typing, don't update if invalid
                    }
                  }}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-white/10 text-slate-300 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2', getStateBadgeColor(state.response.statusCode))}>
                  {state.response.statusCode}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {state.name}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Transitions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
            <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
              <GitBranch className="w-5 h-5 text-purple-400" />
            </div>
            전환 규칙
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              setTransitions([
                ...transitions,
                {
                  from: states[0]?.name || '',
                  to: states[0]?.name || '',
                  trigger: 'auto',
                },
              ])
            }
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 text-sm font-semibold transition-all border border-purple-500/30 hover:border-purple-500/50"
          >
            <Plus className="w-4 h-4" />
            전환 추가
          </motion.button>
        </div>

        <motion.div variants={listContainerVariants} initial="initial" animate="animate" className="space-y-3">
          {transitions.map((transition, index) => (
            <motion.div
              key={index}
              variants={listItemVariants}
              className="p-4 rounded-xl bg-white/5 border border-purple-500/20 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">From State</label>
                    <select
                      value={transition.from}
                      onChange={(e) => {
                        const newTransitions = [...transitions];
                        newTransitions[index].from = e.target.value;
                        setTransitions(newTransitions);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    >
                      {states.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">To State</label>
                    <select
                      value={transition.to}
                      onChange={(e) => {
                        const newTransitions = [...transitions];
                        newTransitions[index].to = e.target.value;
                        setTransitions(newTransitions);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    >
                      {states.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Trigger</label>
                    <select
                      value={transition.trigger}
                      onChange={(e) => {
                        const newTransitions = [...transitions];
                        newTransitions[index].trigger = e.target.value as any;
                        setTransitions(newTransitions);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    >
                      {TRIGGER_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => setTransitions(transitions.filter((_, i) => i !== index))}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {transition.trigger === 'condition' && (
                <div className="grid grid-cols-3 gap-3 pl-4 border-l-2 border-purple-500/30">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Field Path</label>
                    <input
                      type="text"
                      placeholder="e.g., user.role"
                      value={transition.condition?.field || ''}
                      onChange={(e) => {
                        const newTransitions = [...transitions];
                        newTransitions[index].condition = {
                          ...newTransitions[index].condition!,
                          field: e.target.value,
                          operator: newTransitions[index].condition?.operator || 'eq',
                        };
                        setTransitions(newTransitions);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Operator</label>
                    <select
                      value={transition.condition?.operator || 'eq'}
                      onChange={(e) => {
                        const newTransitions = [...transitions];
                        newTransitions[index].condition = {
                          ...newTransitions[index].condition!,
                          field: newTransitions[index].condition?.field || '',
                          operator: e.target.value as any,
                        };
                        setTransitions(newTransitions);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    >
                      {OPERATORS.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Value</label>
                    <input
                      type="text"
                      placeholder="comparison value"
                      value={transition.condition?.value || ''}
                      onChange={(e) => {
                        const newTransitions = [...transitions];
                        newTransitions[index].condition = {
                          ...newTransitions[index].condition!,
                          field: newTransitions[index].condition?.field || '',
                          operator: newTransitions[index].condition?.operator || 'eq',
                          value: e.target.value,
                        };
                        setTransitions(newTransitions);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Visual Transition Arrow */}
              <div className="flex items-center gap-2 text-xs">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30"
                >
                  {transition.from}
                </motion.span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center gap-1 text-purple-400"
                >
                  <div className="w-8 h-0.5 bg-gradient-to-r from-purple-500 to-transparent" />
                  <span className="text-lg">→</span>
                </motion.div>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30"
                >
                  {transition.to}
                </motion.span>
                <span className="px-2 py-1 rounded-md bg-slate-800/50 text-slate-400 text-[10px] font-mono border border-white/5">
                  {transition.trigger}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Visual Flow Indicator - Enhanced */}
      {transitions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-pink-500/10 border-2 border-purple-500/30 relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
          </div>

          <div className="relative">
            <h4 className="text-sm font-bold text-purple-300 mb-4 flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              상태 흐름 시각화
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500/40 to-purple-500/40 text-indigo-100 text-sm font-bold border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/20"
              >
                시작: {initialState}
              </motion.span>
              {transitions.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                    className="flex items-center gap-1 text-purple-400"
                  >
                    <div className="w-6 h-0.5 bg-gradient-to-r from-purple-500 to-transparent" />
                    <span className="text-lg">→</span>
                  </motion.div>
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-200 text-sm font-bold border-2 border-purple-500/40 shadow-lg shadow-purple-500/10"
                  >
                    {t.to}
                  </motion.span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Sequence Tab
function SequenceTab({
  sequences,
  setSequences,
  formatJSON,
}: {
  sequences: SequenceResponse[];
  setSequences: (sequences: SequenceResponse[]) => void;
  formatJSON: (json: string) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30"
      >
        <p className="text-sm text-blue-200 font-medium">
          응답은 호출 순서대로 매칭됩니다. 모든 시퀀스가 소진되면 기본 응답이 반환됩니다.
        </p>
      </motion.div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
            <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
              <Hash className="w-5 h-5 text-blue-400" />
            </div>
            순차 응답
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              setSequences([
                ...sequences,
                {
                  callNumber: sequences.length + 1,
                  statusCode: 200,
                  body: {},
                },
              ])
            }
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-blue-300 text-sm font-semibold transition-all border border-blue-500/30 hover:border-blue-500/50"
          >
            <Plus className="w-4 h-4" />
            응답 추가
          </motion.button>
        </div>

        {/* Numbered Timeline with Connecting Line */}
        <div className="relative">
          {/* Connecting Line */}
          {sequences.length > 1 && (
            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-500/50 via-cyan-500/50 to-blue-500/50" />
          )}

          <motion.div variants={listContainerVariants} initial="initial" animate="animate" className="space-y-4 relative">
            {sequences.map((seq, index) => (
              <motion.div
                key={index}
                variants={listItemVariants}
                whileHover={{ scale: 1.01, x: 4 }}
                className="relative p-5 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 border-2 border-white/10 hover:border-blue-500/30 space-y-4 shadow-lg hover:shadow-blue-500/10 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-4">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-1">
                      <motion.button
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          if (index === 0) return;
                          const newSeqs = [...sequences];
                          [newSeqs[index], newSeqs[index - 1]] = [newSeqs[index - 1], newSeqs[index]];
                          newSeqs.forEach((s, i) => (s.callNumber = i + 1));
                          setSequences(newSeqs);
                        }}
                        disabled={index === 0}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1, y: 2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          if (index === sequences.length - 1) return;
                          const newSeqs = [...sequences];
                          [newSeqs[index], newSeqs[index + 1]] = [newSeqs[index + 1], newSeqs[index]];
                          newSeqs.forEach((s, i) => (s.callNumber = i + 1));
                          setSequences(newSeqs);
                        }}
                        disabled={index === sequences.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </motion.button>
                    </div>

                    {/* Numbered Badge */}
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      className="relative flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-2 border-blue-500/40 shadow-lg shadow-blue-500/20"
                    >
                      <div className="absolute -left-2 w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-900" />
                      <Hash className="w-5 h-5 text-blue-300" />
                      <span className="text-sm font-black text-blue-100">호출 #{seq.callNumber}</span>
                    </motion.div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">상태 코드</label>
                      <input
                        type="number"
                        value={seq.statusCode}
                        onChange={(e) => {
                          const newSeqs = [...sequences];
                          newSeqs[index].statusCode = parseInt(e.target.value) || 200;
                          setSequences(newSeqs);
                        }}
                        className="w-24 px-3 py-2.5 rounded-lg bg-slate-900/50 border border-white/10 text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        const newSeqs = sequences.filter((_, i) => i !== index);
                        newSeqs.forEach((s, i) => (s.callNumber = i + 1));
                        setSequences(newSeqs);
                      }}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-300">응답 본문 (JSON)</label>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const newSeqs = [...sequences];
                        newSeqs[index].body = JSON.parse(formatJSON(JSON.stringify(seq.body)));
                        setSequences(newSeqs);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      정렬
                    </motion.button>
                  </div>
                  <textarea
                    value={JSON.stringify(seq.body, null, 2)}
                    onChange={(e) => {
                      try {
                        const newSeqs = [...sequences];
                        newSeqs[index].body = JSON.parse(e.target.value);
                        setSequences(newSeqs);
                      } catch {
                        // Keep typing
                      }
                    }}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-white/10 text-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// Conditional Tab
function ConditionalTab({
  rules,
  setRules,
  formatJSON,
}: {
  rules: ConditionalRule[];
  setRules: (rules: ConditionalRule[]) => void;
  formatJSON: (json: string) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30"
      >
        <p className="text-sm text-amber-200 font-medium">
          첫 번째로 매칭되는 규칙이 적용됩니다. 매칭되는 규칙이 없으면 기본 응답이 사용됩니다.
        </p>
      </motion.div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
              <Filter className="w-5 h-5 text-amber-400" />
            </div>
            조건부 규칙
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              setRules([
                ...rules,
                {
                  condition: {
                    field: '',
                    operator: 'eq',
                    value: '',
                  },
                  response: {
                    statusCode: 200,
                    body: {},
                  },
                },
              ])
            }
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 text-sm font-semibold transition-all border border-amber-500/30 hover:border-amber-500/50"
          >
            <Plus className="w-4 h-4" />
            규칙 추가
          </motion.button>
        </div>

        <motion.div variants={listContainerVariants} initial="initial" animate="animate" className="space-y-4">
          {rules.map((rule, index) => (
            <motion.div
              key={index}
              variants={listItemVariants}
              whileHover={{ scale: 1.01, y: -2 }}
              className="p-5 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 border-2 border-white/10 hover:border-amber-500/30 space-y-4 shadow-lg hover:shadow-amber-500/10 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1">
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (index === 0) return;
                        const newRules = [...rules];
                        [newRules[index], newRules[index - 1]] = [newRules[index - 1], newRules[index]];
                        setRules(newRules);
                      }}
                      disabled={index === 0}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, y: 2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (index === rules.length - 1) return;
                        const newRules = [...rules];
                        [newRules[index], newRules[index + 1]] = [newRules[index + 1], newRules[index]];
                        setRules(newRules);
                      }}
                      disabled={index === rules.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </motion.button>
                  </div>

                  {/* Rule Badge with Priority Indicator */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/30 to-orange-500/30 border-2 border-amber-500/40 shadow-lg shadow-amber-500/20"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 text-xs font-black">
                        {index + 1}
                      </div>
                      <span className="text-sm font-black text-amber-100">규칙</span>
                    </div>
                    {index === 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-200 text-[10px] font-bold">우선</span>
                    )}
                  </motion.div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRules(rules.filter((_, i) => i !== index))}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Condition - Card Style */}
              <div className="space-y-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  조건
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-amber-300 mb-2">필드 경로</label>
                    <input
                      type="text"
                      placeholder="예: user.role"
                      value={rule.condition.field}
                      onChange={(e) => {
                        const newRules = [...rules];
                        newRules[index].condition.field = e.target.value;
                        setRules(newRules);
                      }}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-900/50 border border-amber-500/20 text-white text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-300 mb-2">연산자</label>
                    <select
                      value={rule.condition.operator}
                      onChange={(e) => {
                        const newRules = [...rules];
                        newRules[index].condition.operator = e.target.value as any;
                        setRules(newRules);
                      }}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-900/50 border border-amber-500/20 text-white text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                    >
                      {OPERATORS.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-300 mb-2">비교값</label>
                    <input
                      type="text"
                      placeholder="비교할 값"
                      value={rule.condition.value || ''}
                      onChange={(e) => {
                        const newRules = [...rules];
                        newRules[index].condition.value = e.target.value;
                        setRules(newRules);
                      }}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-900/50 border border-amber-500/20 text-white text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Response - Card Style */}
              <div className="space-y-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-green-300 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    응답
                  </h4>
                  <div className="w-28">
                    <label className="block text-xs font-semibold text-green-300 mb-2">상태 코드</label>
                    <input
                      type="number"
                      value={rule.response.statusCode}
                      onChange={(e) => {
                        const newRules = [...rules];
                        newRules[index].response.statusCode = parseInt(e.target.value) || 200;
                        setRules(newRules);
                      }}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-900/50 border border-green-500/20 text-white text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-green-300">응답 본문 (JSON)</label>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const newRules = [...rules];
                        newRules[index].response.body = JSON.parse(
                          formatJSON(JSON.stringify(rule.response.body))
                        );
                        setRules(newRules);
                      }}
                      className="text-xs text-green-400 hover:text-green-300 font-medium"
                    >
                      정렬
                    </motion.button>
                  </div>
                  <textarea
                    value={JSON.stringify(rule.response.body, null, 2)}
                    onChange={(e) => {
                      try {
                        const newRules = [...rules];
                        newRules[index].response.body = JSON.parse(e.target.value);
                        setRules(newRules);
                      } catch {
                        // Keep typing
                      }
                    }}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-green-500/20 text-slate-300 text-sm font-mono focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none transition-all"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
