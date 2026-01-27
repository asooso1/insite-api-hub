'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  Zap,
  Trash2,
  Save,
  RotateCcw,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Server,
  Globe,
  Shield,
  X,
  FileJson,
  Copy,
  RotateCw,
  Signal,
  Hourglass,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { glassClasses, cardVariants, listItemVariants } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import {
  getMockConfig,
  createMockConfig,
  updateMockConfig,
  toggleMockConfig,
  deleteMockConfig,
  resetMockState,
} from '@/app/actions/mock';
import type { MockConfig } from '@/app/actions/mock';
import type { NetworkErrorType } from '@/lib/mock/network-simulator';
import { generateLatencyProfile } from '@/lib/mock/network-simulator';

// ============================================================================
// Props & Types
// ============================================================================

interface MockConfigPanelProps {
  endpointId: string;
  projectId: string;
  endpointPath: string;
  endpointMethod: string;
  onClose?: () => void;
}

interface ErrorScenario {
  type: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR' | 'SERVICE_UNAVAILABLE' | 'RATE_LIMITED';
  probability: number;
}

const STATUS_CODES = [200, 201, 204, 400, 401, 403, 404, 500, 502, 503];

const NETWORK_ERROR_TYPES: NetworkErrorType[] = [
  'CONNECTION_REFUSED',
  'CONNECTION_RESET',
  'DNS_RESOLUTION',
  'SSL_HANDSHAKE',
  'GATEWAY_TIMEOUT',
];

const ERROR_SCENARIO_TYPES = [
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INTERNAL_SERVER_ERROR',
  'SERVICE_UNAVAILABLE',
  'RATE_LIMITED',
] as const;

// ============================================================================
// Main Component
// ============================================================================

export function MockConfigPanel({
  endpointId,
  projectId,
  endpointPath,
  endpointMethod,
  onClose,
}: MockConfigPanelProps) {
  // State
  const [config, setConfig] = useState<MockConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [name, setName] = useState('Default Mock');
  const [statusCode, setStatusCode] = useState(200);
  const [useDynamicGeneration, setUseDynamicGeneration] = useState(true);
  const [responseTemplate, setResponseTemplate] = useState('{}');

  // Network simulation
  const [delayMs, setDelayMs] = useState(0);
  const [useRandomDelay, setUseRandomDelay] = useState(false);
  const [delayRandomMin, setDelayRandomMin] = useState(0);
  const [delayRandomMax, setDelayRandomMax] = useState(0);
  const [simulateTimeout, setSimulateTimeout] = useState(false);
  const [timeoutMs, setTimeoutMs] = useState(30000);
  const [simulateNetworkError, setSimulateNetworkError] = useState(false);
  const [networkErrorType, setNetworkErrorType] = useState<NetworkErrorType>('CONNECTION_REFUSED');
  const [networkErrorProbability, setNetworkErrorProbability] = useState(0.5);

  // Error scenarios
  const [errorScenarios, setErrorScenarios] = useState<ErrorScenario[]>([]);

  // Section expansion
  const [expandedSections, setExpandedSections] = useState({
    responseTemplate: false,
    networkSimulation: false,
    errorScenarios: false,
  });

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    loadConfig();
  }, [endpointId]);

  async function loadConfig() {
    setLoading(true);
    try {
      const loadedConfig = await getMockConfig(endpointId);
      if (loadedConfig) {
        setConfig(loadedConfig);
        populateFormFromConfig(loadedConfig);
      }
    } catch (error) {
      console.error('Failed to load mock config:', error);
      toast.error('Failed to load mock configuration');
    } finally {
      setLoading(false);
    }
  }

  function populateFormFromConfig(cfg: MockConfig) {
    setEnabled(cfg.enabled);
    setName(cfg.name);
    setStatusCode(cfg.statusCode);
    setUseDynamicGeneration(cfg.useDynamicGeneration);
    setResponseTemplate(cfg.responseTemplate ? JSON.stringify(cfg.responseTemplate, null, 2) : '{}');

    setDelayMs(cfg.delayMs);
    setUseRandomDelay(cfg.useRandomDelay);
    setDelayRandomMin(cfg.delayRandomMin);
    setDelayRandomMax(cfg.delayRandomMax);
    setSimulateTimeout(cfg.simulateTimeout);
    setTimeoutMs(cfg.timeoutMs);
    setSimulateNetworkError(cfg.simulateNetworkError);
    setNetworkErrorType(cfg.networkErrorType as NetworkErrorType);
    setNetworkErrorProbability(cfg.networkErrorProbability);

    setErrorScenarios(cfg.errorScenarios || []);
  }

  // ============================================================================
  // Handlers
  // ============================================================================

  async function handleSave() {
    setSaving(true);
    try {
      let parsedTemplate: Record<string, any> | null = null;

      if (responseTemplate.trim() !== '{}' && responseTemplate.trim() !== '') {
        try {
          parsedTemplate = JSON.parse(responseTemplate);
        } catch (e) {
          toast.error('Invalid JSON in response template');
          setSaving(false);
          return;
        }
      }

      const data: Partial<MockConfig> = {
        name,
        enabled,
        statusCode,
        responseTemplate: parsedTemplate,
        useDynamicGeneration,
        delayMs,
        delayRandomMin,
        delayRandomMax,
        useRandomDelay,
        simulateTimeout,
        timeoutMs,
        simulateNetworkError,
        networkErrorType,
        networkErrorProbability,
        errorScenarios,
      };

      if (config) {
        await updateMockConfig(config.id, data);
        toast.success('Mock configuration updated');
      } else {
        const newConfig = await createMockConfig({
          ...data,
          projectId,
          endpointId,
        });
        setConfig(newConfig);
        toast.success('Mock configuration created');
      }

      await loadConfig();
    } catch (error) {
      console.error('Failed to save mock config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!config) return;

    if (!confirm('Are you sure you want to delete this mock configuration?')) {
      return;
    }

    try {
      await deleteMockConfig(config.id);
      toast.success('Mock configuration deleted');
      onClose?.();
    } catch (error) {
      console.error('Failed to delete mock config:', error);
      toast.error('Failed to delete configuration');
    }
  }

  async function handleResetState() {
    try {
      await resetMockState(endpointId);
      toast.success('Mock state reset successfully');
    } catch (error) {
      console.error('Failed to reset mock state:', error);
      toast.error('Failed to reset state');
    }
  }

  async function handleEnableToggle(newEnabled: boolean) {
    if (!config) {
      // Create new config with enabled state
      setEnabled(newEnabled);
      return;
    }

    try {
      await toggleMockConfig(config.id, newEnabled);
      setEnabled(newEnabled);
      toast.success(newEnabled ? 'Mock enabled' : 'Mock disabled');
    } catch (error) {
      console.error('Failed to toggle mock:', error);
      toast.error('Failed to toggle mock');
    }
  }

  function handleFormatJson() {
    try {
      const parsed = JSON.parse(responseTemplate);
      setResponseTemplate(JSON.stringify(parsed, null, 2));
      toast.success('JSON formatted');
    } catch (e) {
      toast.error('Invalid JSON');
    }
  }

  function handleCopyJson() {
    navigator.clipboard.writeText(responseTemplate);
    toast.success('JSON copied to clipboard');
  }

  function handleResetJson() {
    setResponseTemplate('{}');
    toast.success('JSON reset');
  }

  function handleLatencyPreset(preset: 'fast' | 'normal' | 'slow' | '3g' | 'offline') {
    const profile = generateLatencyProfile(preset);

    if (profile.delay) {
      setUseRandomDelay(profile.delay.useRandom);
      setDelayMs(profile.delay.fixedMs || 0);
      setDelayRandomMin(profile.delay.randomMin || 0);
      setDelayRandomMax(profile.delay.randomMax || 0);
    }

    if (profile.networkError) {
      setSimulateNetworkError(profile.networkError.enabled);
      setNetworkErrorType(profile.networkError.errorType);
      setNetworkErrorProbability(profile.networkError.probability);
    }

    toast.success(`Applied "${preset}" latency preset`);
  }

  function toggleSection(section: keyof typeof expandedSections) {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  function handleAddErrorScenario() {
    setErrorScenarios([
      ...errorScenarios,
      { type: 'INTERNAL_SERVER_ERROR', probability: 0.1 },
    ]);
  }

  function handleRemoveErrorScenario(index: number) {
    setErrorScenarios(errorScenarios.filter((_, i) => i !== index));
  }

  function handleErrorScenarioChange(index: number, field: keyof ErrorScenario, value: any) {
    setErrorScenarios(errorScenarios.map((scenario, i) =>
      i === index ? { ...scenario, [field]: value } : scenario
    ));
  }

  // ============================================================================
  // Render Loading State
  // ============================================================================

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'p-8 rounded-2xl',
          glassClasses.cardDark
        )}
      >
        <div className="flex items-center justify-center space-x-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading mock configuration...</p>
        </div>
      </motion.div>
    );
  }

  // ============================================================================
  // Render Empty State (No Config)
  // ============================================================================

  if (!config && !loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'p-12 rounded-2xl text-center',
          glassClasses.cardDark
        )}
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <Server className="w-10 h-10 text-indigo-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">No Mock Configuration</h3>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          Create a mock configuration to simulate responses for {endpointMethod} {endpointPath}
        </p>
        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
        >
          <Play className="w-5 h-5" />
          {saving ? 'Creating...' : 'Enable Mock'}
        </button>
      </motion.div>
    );
  }

  // ============================================================================
  // Render Main Panel
  // ============================================================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className={cn('p-6 rounded-2xl', glassClasses.cardDark)}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
              <Settings className="w-6 h-6 text-indigo-400" />
              {/* Active State Indicator */}
              <motion.div
                animate={{
                  scale: enabled ? [1, 1.2, 1] : 1,
                  opacity: enabled ? [1, 0.7, 1] : 0.3,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={cn(
                  'absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900',
                  enabled ? 'bg-green-400' : 'bg-slate-500'
                )}
              />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Mock 설정</h2>
              <p className="text-sm text-slate-400">
                <span className="text-indigo-400 font-medium">{endpointMethod}</span> {endpointPath}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Basic Settings */}
        <div className="space-y-4">
          {/* Enable/Disable Toggle */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: enabled ? [0, 10, -10, 0] : 0,
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut"
                }}
              >
                {enabled ? (
                  <Wifi className="w-5 h-5 text-green-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-slate-500" />
                )}
              </motion.div>
              <div>
                <p className="font-semibold text-white">Mock 서버 상태</p>
                <p className="text-xs text-slate-400">
                  {enabled ? (
                    <span className="text-green-400">활성화 - Mock 응답 제공 중</span>
                  ) : (
                    <span>비활성화 - 실제 엔드포인트 사용</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleEnableToggle(!enabled)}
              className={cn(
                'relative w-14 h-8 rounded-full transition-all',
                enabled ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/20' : 'bg-slate-700'
              )}
            >
              <motion.div
                className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md"
                animate={{ x: enabled ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </motion.div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              설정 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
              placeholder="설정 이름을 입력하세요"
            />
          </div>

          {/* Status Code */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              상태 코드
            </label>
            <select
              value={statusCode}
              onChange={(e) => setStatusCode(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
            >
              {STATUS_CODES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Generation Toggle */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: useDynamicGeneration ? [0, -10, 10, 0] : 0,
                }}
                transition={{
                  duration: 2,
                  repeat: useDynamicGeneration ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                <Zap className="w-5 h-5 text-yellow-400" />
              </motion.div>
              <div>
                <p className="font-semibold text-white">동적 데이터 생성</p>
                <p className="text-xs text-slate-400">
                  실제 같은 Mock 데이터 자동 생성
                </p>
              </div>
            </div>
            <button
              onClick={() => setUseDynamicGeneration(!useDynamicGeneration)}
              className={cn(
                'relative w-14 h-8 rounded-full transition-all',
                useDynamicGeneration ? 'bg-gradient-to-r from-yellow-500 to-amber-600 shadow-lg shadow-yellow-500/20' : 'bg-slate-700'
              )}
            >
              <motion.div
                className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md"
                animate={{ x: useDynamicGeneration ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Response Template Section */}
      <motion.div
        variants={cardVariants}
        className={cn('rounded-2xl overflow-hidden', glassClasses.cardDark)}
      >
        <button
          onClick={() => toggleSection('responseTemplate')}
          className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 group-hover:border-indigo-500/40 transition-colors">
              <FileJson className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-left">
              <span className="font-bold text-white block tracking-tight">응답 템플릿</span>
              <span className="text-xs text-slate-400">JSON 형식의 커스텀 응답 정의</span>
            </div>
          </div>
          <motion.div
            animate={{ rotate: expandedSections.responseTemplate ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </button>

        <AnimatePresence>
          {expandedSections.responseTemplate && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="px-6 pb-6"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    템플릿 값은 동적으로 생성된 데이터를 덮어씁니다
                  </p>
                  {/* Mini Toolbar */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleFormatJson}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-white transition-colors"
                    >
                      <RotateCw className="w-3 h-3" />
                      정렬
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopyJson}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-white transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      복사
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleResetJson}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      초기화
                    </motion.button>
                  </div>
                </div>
                <textarea
                  value={responseTemplate}
                  onChange={(e) => setResponseTemplate(e.target.value)}
                  className="w-full h-64 px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent resize-none transition-all"
                  placeholder='{"message": "Custom response"}'
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Network Simulation Section */}
      <motion.div
        variants={cardVariants}
        className={cn('rounded-2xl overflow-hidden', glassClasses.cardDark)}
      >
        <button
          onClick={() => toggleSection('networkSimulation')}
          className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 group-hover:border-blue-500/40 transition-colors">
              <Globe className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <span className="font-bold text-white block tracking-tight">네트워크 시뮬레이션</span>
              <span className="text-xs text-slate-400">지연 및 네트워크 오류 시뮬레이션</span>
            </div>
          </div>
          <motion.div
            animate={{ rotate: expandedSections.networkSimulation ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </button>

        <AnimatePresence>
          {expandedSections.networkSimulation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6 space-y-4"
            >
              {/* Latency Presets - Visual Cards */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  지연 프리셋
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { preset: 'fast', label: '빠름', icon: Zap, color: 'green' },
                    { preset: 'normal', label: '보통', icon: Clock, color: 'blue' },
                    { preset: 'slow', label: '느림', icon: Hourglass, color: 'amber' },
                    { preset: '3g', label: '3G', icon: Signal, color: 'orange' },
                    { preset: 'offline', label: '오프라인', icon: WifiOff, color: 'red' },
                  ].map(({ preset, label, icon: Icon, color }) => (
                    <motion.button
                      key={preset}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleLatencyPreset(preset as any)}
                      className={cn(
                        'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                        `bg-${color}-500/10 border-${color}-500/30 hover:border-${color}-500/50 hover:bg-${color}-500/20`,
                        color === 'green' && 'bg-green-500/10 border-green-500/30 hover:border-green-500/50 hover:bg-green-500/20',
                        color === 'blue' && 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/20',
                        color === 'amber' && 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/20',
                        color === 'orange' && 'bg-orange-500/10 border-orange-500/30 hover:border-orange-500/50 hover:bg-orange-500/20',
                        color === 'red' && 'bg-red-500/10 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/20'
                      )}
                    >
                      <Icon className={cn(
                        'w-5 h-5',
                        color === 'green' && 'text-green-400',
                        color === 'blue' && 'text-blue-400',
                        color === 'amber' && 'text-amber-400',
                        color === 'orange' && 'text-orange-400',
                        color === 'red' && 'text-red-400'
                      )} />
                      <span className={cn(
                        'text-xs font-medium',
                        color === 'green' && 'text-green-300',
                        color === 'blue' && 'text-blue-300',
                        color === 'amber' && 'text-amber-300',
                        color === 'orange' && 'text-orange-300',
                        color === 'red' && 'text-red-300'
                      )}>
                        {label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Visual Delay Indicator */}
              {(delayMs > 0 || useRandomDelay) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      시뮬레이션 지연
                    </span>
                    <span className="text-xs text-blue-300 font-mono">
                      {useRandomDelay
                        ? `${delayRandomMin}ms ~ ${delayRandomMax}ms`
                        : `${delayMs}ms`}
                    </span>
                  </div>
                  <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(((useRandomDelay ? delayRandomMax : delayMs) / 5000) * 100, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Fixed Delay */}
              {!useRandomDelay && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    고정 지연 (ms)
                  </label>
                  <input
                    type="number"
                    value={delayMs}
                    onChange={(e) => setDelayMs(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                    min="0"
                  />
                </div>
              )}

              {/* Random Delay Toggle */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="font-semibold text-white">랜덤 지연</p>
                    <p className="text-xs text-slate-400">
                      최소/최대 범위 내에서 가변 지연
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setUseRandomDelay(!useRandomDelay)}
                  className={cn(
                    'relative w-14 h-8 rounded-full transition-all',
                    useRandomDelay ? 'bg-gradient-to-r from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/20' : 'bg-slate-700'
                  )}
                >
                  <motion.div
                    className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md"
                    animate={{ x: useRandomDelay ? 24 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </motion.div>

              {/* Random Delay Range */}
              {useRandomDelay && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      최소값 (ms)
                    </label>
                    <input
                      type="number"
                      value={delayRandomMin}
                      onChange={(e) => setDelayRandomMin(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      최대값 (ms)
                    </label>
                    <input
                      type="number"
                      value={delayRandomMax}
                      onChange={(e) => setDelayRandomMax(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                      min="0"
                    />
                  </div>
                </motion.div>
              )}

              {/* Timeout Simulation */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="font-semibold text-white">타임아웃 시뮬레이션</p>
                    <p className="text-xs text-slate-400">
                      요청 타임아웃 발생 시뮬레이션
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSimulateTimeout(!simulateTimeout)}
                  className={cn(
                    'relative w-14 h-8 rounded-full transition-all',
                    simulateTimeout ? 'bg-gradient-to-r from-orange-500 to-red-600 shadow-lg shadow-orange-500/20' : 'bg-slate-700'
                  )}
                >
                  <motion.div
                    className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md"
                    animate={{ x: simulateTimeout ? 24 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </motion.div>

              {simulateTimeout && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    타임아웃 (ms)
                  </label>
                  <input
                    type="number"
                    value={timeoutMs}
                    onChange={(e) => setTimeoutMs(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                    min="0"
                  />
                </motion.div>
              )}

              {/* Network Error */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <WifiOff className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="font-semibold text-white">네트워크 오류</p>
                    <p className="text-xs text-slate-400">
                      네트워크 장애 시뮬레이션
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSimulateNetworkError(!simulateNetworkError)}
                  className={cn(
                    'relative w-14 h-8 rounded-full transition-all',
                    simulateNetworkError ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-lg shadow-red-500/20' : 'bg-slate-700'
                  )}
                >
                  <motion.div
                    className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md"
                    animate={{ x: simulateNetworkError ? 24 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </motion.div>

              {simulateNetworkError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      오류 유형
                    </label>
                    <select
                      value={networkErrorType}
                      onChange={(e) => setNetworkErrorType(e.target.value as NetworkErrorType)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                    >
                      {NETWORK_ERROR_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      발생 확률: {Math.round(networkErrorProbability * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={networkErrorProbability * 100}
                      onChange={(e) => setNetworkErrorProbability(Number(e.target.value) / 100)}
                      className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error Scenarios Section */}
      <motion.div
        variants={cardVariants}
        className={cn('rounded-2xl overflow-hidden', glassClasses.cardDark)}
      >
        <button
          onClick={() => toggleSection('errorScenarios')}
          className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 group-hover:border-red-500/40 transition-colors">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white block tracking-tight">오류 시나리오</span>
                {errorScenarios.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30"
                  >
                    {errorScenarios.length}
                  </motion.span>
                )}
              </div>
              <span className="text-xs text-slate-400">다양한 에러 케이스 시뮬레이션</span>
            </div>
          </div>
          <motion.div
            animate={{ rotate: expandedSections.errorScenarios ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </button>

        <AnimatePresence>
          {expandedSections.errorScenarios && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="px-6 pb-6 space-y-4"
            >
              {errorScenarios.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-400">
                    설정된 오류 시나리오가 없습니다
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {errorScenarios.map((scenario, index) => {
                    const getSeverityColor = (type: string) => {
                      if (type.includes('500') || type === 'INTERNAL_SERVER_ERROR' || type === 'SERVICE_UNAVAILABLE') {
                        return 'red';
                      }
                      if (type.includes('400') || type === 'BAD_REQUEST' || type === 'UNAUTHORIZED' || type === 'FORBIDDEN') {
                        return 'amber';
                      }
                      if (type === 'NOT_FOUND') {
                        return 'orange';
                      }
                      if (type === 'RATE_LIMITED') {
                        return 'purple';
                      }
                      return 'slate';
                    };

                    const severityColor = getSeverityColor(scenario.type);

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                          'p-4 rounded-xl border-2 space-y-3 hover:shadow-lg transition-all',
                          severityColor === 'red' && 'bg-red-500/5 border-red-500/30 hover:border-red-500/50',
                          severityColor === 'amber' && 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50',
                          severityColor === 'orange' && 'bg-orange-500/5 border-orange-500/30 hover:border-orange-500/50',
                          severityColor === 'purple' && 'bg-purple-500/5 border-purple-500/30 hover:border-purple-500/50',
                          severityColor === 'slate' && 'bg-slate-800/50 border-white/10'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <select
                            value={scenario.type}
                            onChange={(e) =>
                              handleErrorScenarioChange(index, 'type', e.target.value)
                            }
                            className={cn(
                              'flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:border-transparent transition-all',
                              severityColor === 'red' && 'bg-red-500/10 border-red-500/30 text-red-300 focus:ring-red-500/50',
                              severityColor === 'amber' && 'bg-amber-500/10 border-amber-500/30 text-amber-300 focus:ring-amber-500/50',
                              severityColor === 'orange' && 'bg-orange-500/10 border-orange-500/30 text-orange-300 focus:ring-orange-500/50',
                              severityColor === 'purple' && 'bg-purple-500/10 border-purple-500/30 text-purple-300 focus:ring-purple-500/50',
                              severityColor === 'slate' && 'bg-slate-900/50 border-white/10 text-white focus:ring-indigo-500/50'
                            )}
                          >
                            {ERROR_SCENARIO_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type.replace(/_/g, ' ')}
                              </option>
                            ))}
                          </select>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemoveErrorScenario(index)}
                            className="ml-2 p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </motion.button>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-2">
                            발생 확률: <span className="text-white font-bold">{Math.round(scenario.probability * 100)}%</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={scenario.probability * 100}
                            onChange={(e) =>
                              handleErrorScenarioChange(
                                index,
                                'probability',
                                Number(e.target.value) / 100
                              )
                            }
                            className={cn(
                              'w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer',
                              severityColor === 'red' && '[&::-webkit-slider-thumb]:bg-red-500',
                              severityColor === 'amber' && '[&::-webkit-slider-thumb]:bg-amber-500',
                              severityColor === 'orange' && '[&::-webkit-slider-thumb]:bg-orange-500',
                              severityColor === 'purple' && '[&::-webkit-slider-thumb]:bg-purple-500',
                              severityColor === 'slate' && '[&::-webkit-slider-thumb]:bg-indigo-500'
                            )}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddErrorScenario}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-semibold transition-all flex items-center justify-center gap-2 border-2 border-dashed border-white/10 hover:border-white/20"
              >
                <AlertTriangle className="w-4 h-4" />
                오류 시나리오 추가
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action Buttons */}
      <div className={cn('p-6 rounded-2xl', glassClasses.cardDark)}>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Save className="w-5 h-5" />
            {saving ? '저장 중...' : '설정 저장'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleResetState}
            className="px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors flex items-center gap-2"
            title="시나리오 엔진 상태 초기화"
          >
            <RotateCcw className="w-5 h-5" />
            상태 초기화
          </motion.button>

          {config && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              className="px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold transition-colors flex items-center gap-2 border border-red-500/30 hover:border-red-500/50"
            >
              <Trash2 className="w-5 h-5" />
              삭제
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
