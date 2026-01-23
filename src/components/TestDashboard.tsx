'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TestHistory,
  BatchTestSummary,
  BatchTestResult,
  AssertionResult,
} from '@/lib/api-types';
import {
  formatAssertionSummary,
  getAssertionPassRate,
} from '@/lib/assertion-validator';
import {
  cardVariants,
  listContainerVariants,
  listItemVariants,
  glassClasses,
  modalBackdropVariants,
  modalContentVariants,
} from '@/lib/design-system';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Calendar,
  Zap,
  BarChart3,
  X,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TestDashboardProps {
  projectId: string;
  testHistory: TestHistory[];
  batchResults?: BatchTestSummary | null;
  onRefresh?: () => void;
}

interface ExpandedRow {
  testId: string;
  assertionResult?: AssertionResult;
}

type FilterStatus = 'all' | 'success' | 'failed';

export function TestDashboard({
  projectId,
  testHistory,
  batchResults,
  onRefresh,
}: TestDashboardProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedTest, setSelectedTest] = useState<TestHistory | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Statistics calculation
  const stats = useMemo(() => {
    const total = testHistory.length;
    const successCount = testHistory.filter((t) => t.success).length;
    const failCount = total - successCount;
    const successRate = total > 0 ? (successCount / total) * 100 : 0;

    const avgResponseTime =
      total > 0
        ? testHistory.reduce((sum, t) => sum + t.response_time, 0) / total
        : 0;

    const lastExecuted = testHistory.length > 0 ? testHistory[0]?.executed_at : null;

    // Trend calculation (compare last 10 vs previous 10)
    const recentTen = testHistory.slice(0, 10);
    const previousTen = testHistory.slice(10, 20);
    const recentAvg =
      recentTen.length > 0
        ? recentTen.reduce((sum, t) => sum + t.response_time, 0) / recentTen.length
        : 0;
    const previousAvg =
      previousTen.length > 0
        ? previousTen.reduce((sum, t) => sum + t.response_time, 0) /
          previousTen.length
        : 0;

    const trend =
      previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

    return {
      total,
      successCount,
      failCount,
      successRate,
      avgResponseTime,
      lastExecuted,
      trend,
    };
  }, [testHistory]);

  // Filtered test history
  const filteredHistory = useMemo(() => {
    if (filterStatus === 'all') return testHistory;
    if (filterStatus === 'success') return testHistory.filter((t) => t.success);
    return testHistory.filter((t) => !t.success);
  }, [testHistory, filterStatus]);

  // Toggle row expansion
  const toggleRowExpansion = (testId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId);
    } else {
      newExpanded.add(testId);
    }
    setExpandedRows(newExpanded);
  };

  // Export to Excel
  const handleExport = () => {
    setIsExporting(true);

    try {
      // Prepare batch results data if available
      const batchData = batchResults?.results || [];

      const data = batchData.map((result) => {
        const baseData: Record<string, any> = {
          '테스트 케이스 ID': result.testCaseId,
          '테스트 케이스명': result.testCaseName,
          상태코드: result.status,
          '성공 여부': result.success ? '성공' : '실패',
          '응답 시간 (ms)': result.responseTime,
          에러: result.error || '-',
        };

        // Add assertion results if available
        if (result.assertionResult) {
          const ar = result.assertionResult;
          baseData['Assertions'] = `${ar.passedAssertions}/${ar.totalAssertions}`;
          baseData['Assertion 성공률'] = `${getAssertionPassRate(ar)}%`;
        }

        return baseData;
      });

      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Test Results');

      const fileName = `test-results-${projectId}-${new Date().toISOString().split('T')[0]}.xlsx`;
      writeFile(wb, fileName);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Test Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            실시간 테스트 결과 분석 및 모니터링
          </p>
        </div>

        <div className="flex gap-3">
          <motion.button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-secondary/50 hover:bg-secondary rounded-xl font-semibold text-sm transition-all backdrop-blur-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </motion.button>

          <motion.button
            onClick={handleExport}
            disabled={filteredHistory.length === 0 || isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </motion.button>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
        variants={listContainerVariants}
        initial="initial"
        animate="animate"
      >
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          label="총 테스트 수"
          value={stats.total.toString()}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
          delay={0}
        />

        <StatCard
          icon={<CheckCircle2 className="w-6 h-6" />}
          label="성공률"
          value={`${stats.successRate.toFixed(1)}%`}
          subValue={
            <CircularProgress
              percentage={stats.successRate}
              size={48}
              strokeWidth={4}
            />
          }
          color="text-emerald-500"
          bgColor="bg-emerald-500/10"
          delay={0.05}
        />

        <StatCard
          icon={<Zap className="w-6 h-6" />}
          label="평균 응답 시간"
          value={`${stats.avgResponseTime.toFixed(0)}ms`}
          subValue={
            <div className="flex items-center gap-1 text-xs">
              {stats.trend > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-rose-500" />
                  <span className="text-rose-500 font-bold">
                    +{stats.trend.toFixed(1)}%
                  </span>
                </>
              ) : stats.trend < 0 ? (
                <>
                  <TrendingDown className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500 font-bold">
                    {stats.trend.toFixed(1)}%
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          }
          color="text-amber-500"
          bgColor="bg-amber-500/10"
          delay={0.1}
        />

        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          label="마지막 실행"
          value={
            stats.lastExecuted
              ? formatDistanceToNow(new Date(stats.lastExecuted), {
                  addSuffix: true,
                  locale: ko,
                })
              : 'N/A'
          }
          color="text-violet-500"
          bgColor="bg-violet-500/10"
          delay={0.15}
        />
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        className={`${glassClasses.card} p-4 rounded-2xl`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">
              필터
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filterStatus === 'all'}
              onClick={() => setFilterStatus('all')}
              label="All"
              count={stats.total}
            />
            <FilterButton
              active={filterStatus === 'success'}
              onClick={() => setFilterStatus('success')}
              label="Success"
              count={stats.successCount}
              color="emerald"
            />
            <FilterButton
              active={filterStatus === 'failed'}
              onClick={() => setFilterStatus('failed')}
              label="Failed"
              count={stats.failCount}
              color="rose"
            />
          </div>
        </div>
      </motion.div>

      {/* Batch Test Results (with Assertions) */}
      {batchResults && batchResults.results.length > 0 && (
        <motion.div
          className={`${glassClasses.card} rounded-2xl overflow-hidden`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="p-6 border-b border-border/50">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Batch Test Results
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Latest batch test with assertion validation
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    테스트 케이스
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    응답 시간
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Assertions
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    상세
                  </th>
                </tr>
              </thead>
              <motion.tbody
                className="divide-y divide-border/50"
                variants={listContainerVariants}
                initial="initial"
                animate="animate"
              >
                {batchResults.results.map((result, idx) => {
                  const isExpanded = expandedRows.has(result.testCaseId);
                  return (
                    <React.Fragment key={result.testCaseId}>
                      <motion.tr
                        variants={listItemVariants}
                        className={`
                          hover:bg-muted/20 transition-all
                          ${!result.success ? 'bg-rose-500/5 hover:bg-rose-500/10' : ''}
                        `}
                      >
                        <td className="px-6 py-4">
                          {result.success ? (
                            <div className="flex items-center gap-2 text-emerald-500">
                              <CheckCircle2 className="w-5 h-5" />
                              <span className="text-xs font-bold">SUCCESS</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-rose-500">
                              <XCircle className="w-5 h-5" />
                              <span className="text-xs font-bold">FAILED</span>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-semibold">{result.testCaseName}</div>
                            <code className="text-xs font-mono text-muted-foreground">
                              {result.testCaseId.slice(0, 8)}
                            </code>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-semibold">
                              {result.responseTime}ms
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {result.assertionResult ? (
                            <AssertionBadge assertionResult={result.assertionResult} />
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground text-xs">
                              <Shield className="w-4 h-4" />
                              <span>No assertions</span>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <motion.button
                            onClick={() => toggleRowExpansion(result.testCaseId)}
                            className="text-primary hover:text-primary/80 font-semibold text-sm"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <motion.div
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronRight className="w-5 h-5" />
                            </motion.div>
                          </motion.button>
                        </td>
                      </motion.tr>

                      {/* Expanded Assertion Details */}
                      <AnimatePresence>
                        {isExpanded && result.assertionResult && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-muted/10"
                          >
                            <td colSpan={5} className="px-6 py-4">
                              <AssertionDetails assertionResult={result.assertionResult} />
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </motion.tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Test History Table */}
      <motion.div
        className={`${glassClasses.card} rounded-2xl overflow-hidden`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  테스트 ID
                </th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  환경
                </th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  응답 시간
                </th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Assertions
                </th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  실행 일시
                </th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  상세
                </th>
              </tr>
            </thead>
            <motion.tbody
              className="divide-y divide-border/50"
              variants={listContainerVariants}
              initial="initial"
              animate="animate"
            >
              {filteredHistory.map((test, idx) => (
                <motion.tr
                  key={test.id}
                  variants={listItemVariants}
                  className={`
                    hover:bg-muted/20 transition-all cursor-pointer
                    ${!test.success ? 'bg-rose-500/5 hover:bg-rose-500/10' : ''}
                  `}
                  onClick={() => setSelectedTest(test)}
                >
                  <td className="px-6 py-4">
                    {test.success ? (
                      <div className="flex items-center gap-2 text-emerald-500">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-xs font-bold">SUCCESS</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-rose-500">
                        <XCircle className="w-5 h-5" />
                        <span className="text-xs font-bold">FAILED</span>
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <code className="text-sm font-mono text-foreground">
                      {test.test_case_id || test.id.slice(0, 8)}
                    </code>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`
                      px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter
                      ${
                        test.env === 'PRD'
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : test.env === 'STG'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }
                    `}
                    >
                      {test.env}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">
                        {test.response_time}ms
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Shield className="w-4 h-4" />
                      <span>N/A</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(test.executed_at), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </td>

                  <td className="px-6 py-4">
                    <motion.button
                      className="text-primary hover:text-primary/80 font-semibold text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredHistory.length === 0 && (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground italic">
              {filterStatus === 'all'
                ? '테스트 이력이 없습니다.'
                : `필터링된 항목이 없습니다.`}
            </p>
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedTest && (
          <TestDetailModal
            test={selectedTest}
            onClose={() => setSelectedTest(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Statistic Card Component
// ============================================
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: React.ReactNode;
  color: string;
  bgColor: string;
  delay: number;
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
  bgColor,
  delay,
}: StatCardProps) {
  return (
    <motion.div
      className={`${glassClasses.card} p-6 rounded-2xl`}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      custom={delay}
      transition={{ delay }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`${bgColor} ${color} p-3 rounded-xl inline-flex mb-4`}>
            {icon}
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
            {label}
          </p>
          <p className={`text-3xl font-black ${color} leading-none`}>{value}</p>
        </div>

        {subValue && <div className="ml-4">{subValue}</div>}
      </div>
    </motion.div>
  );
}

// ============================================
// Circular Progress Component
// ============================================
interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

function CircularProgress({
  percentage,
  size = 60,
  strokeWidth = 6,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-emerald-500"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black text-foreground">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

// ============================================
// Filter Button Component
// ============================================
interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: 'slate' | 'emerald' | 'rose';
}

function FilterButton({
  active,
  onClick,
  label,
  count,
  color = 'slate',
}: FilterButtonProps) {
  const colorClasses = {
    slate: active
      ? 'bg-slate-500 text-white'
      : 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20',
    emerald: active
      ? 'bg-emerald-500 text-white'
      : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20',
    rose: active
      ? 'bg-rose-500 text-white'
      : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20',
  };

  return (
    <motion.button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs
        transition-all backdrop-blur-sm
        ${active ? 'shadow-md' : ''}
        ${colorClasses[color]}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {label}
      <span
        className={`
        px-1.5 py-0.5 rounded text-[10px] font-black
        ${active ? 'bg-white/20' : 'bg-black/10'}
      `}
      >
        {count}
      </span>
    </motion.button>
  );
}

// ============================================
// Test Detail Modal Component
// ============================================
interface TestDetailModalProps {
  test: TestHistory;
  onClose: () => void;
}

function TestDetailModal({ test, onClose }: TestDetailModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      variants={modalBackdropVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={onClose}
    >
      <motion.div
        className={`${glassClasses.modal} max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-3xl p-8 shadow-2xl`}
        variants={modalContentVariants}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-black flex items-center gap-3">
              {test.success ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              ) : (
                <XCircle className="w-7 h-7 text-rose-500" />
              )}
              테스트 상세 정보
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(test.executed_at), {
                addSuffix: true,
                locale: ko,
              })}
            </p>
          </div>

          <motion.button
            onClick={onClose}
            className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Details Grid */}
        <div className="space-y-4">
          <DetailRow label="Test ID" value={test.id} mono />
          <DetailRow label="API ID" value={test.api_id} mono />
          {test.test_case_id && (
            <DetailRow label="Test Case ID" value={test.test_case_id} mono />
          )}
          <DetailRow
            label="환경"
            value={
              <span
                className={`
                px-3 py-1.5 rounded-md text-xs font-black uppercase
                ${
                  test.env === 'PRD'
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    : test.env === 'STG'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                }
              `}
              >
                {test.env}
              </span>
            }
          />
          <DetailRow
            label="상태 코드"
            value={
              <span
                className={`
                text-lg font-bold
                ${test.success ? 'text-emerald-500' : 'text-rose-500'}
              `}
              >
                {test.status}
              </span>
            }
          />
          <DetailRow
            label="응답 시간"
            value={
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-lg font-bold">{test.response_time}ms</span>
              </div>
            }
          />
          <DetailRow
            label="실행 일시"
            value={new Date(test.executed_at).toLocaleString('ko-KR')}
          />

          {/* Error message if failed */}
          {!test.success && (
            <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-rose-500 mb-1">
                    테스트 실패
                  </p>
                  <p className="text-xs text-rose-500/80">
                    상태 코드 {test.status}로 인해 테스트가 실패했습니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// Detail Row Component
// ============================================
interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}

function DetailRow({ label, value, mono = false }: DetailRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-border/50 last:border-0">
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`text-sm font-semibold text-foreground ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

// ============================================
// Assertion Badge Component
// ============================================

interface AssertionBadgeProps {
  assertionResult: AssertionResult;
}

function AssertionBadge({ assertionResult }: AssertionBadgeProps) {
  const passRate = getAssertionPassRate(assertionResult);
  const summary = formatAssertionSummary(assertionResult);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Shield
          className={`w-4 h-4 ${assertionResult.passed ? 'text-emerald-500' : 'text-rose-500'}`}
        />
        <span
          className={`text-sm font-bold ${assertionResult.passed ? 'text-emerald-500' : 'text-rose-500'}`}
        >
          {summary}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${assertionResult.passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${passRate}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <span className="text-xs font-bold text-muted-foreground">
        {passRate}%
      </span>
    </div>
  );
}

// ============================================
// Assertion Details Component
// ============================================

interface AssertionDetailsProps {
  assertionResult: AssertionResult;
}

function AssertionDetails({ assertionResult }: AssertionDetailsProps) {
  return (
    <div className="space-y-3">
      {/* Summary Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Assertion Results
        </h4>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-emerald-500 font-bold">
            ✓ {assertionResult.passedAssertions} Passed
          </span>
          {assertionResult.failedAssertions > 0 && (
            <span className="text-rose-500 font-bold">
              ✗ {assertionResult.failedAssertions} Failed
            </span>
          )}
        </div>
      </div>

      {/* Assertion List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {assertionResult.assertions.map((assertion, idx) => (
          <motion.div
            key={idx}
            className={`
              p-3 rounded-lg border
              ${
                assertion.passed
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-rose-500/5 border-rose-500/20'
              }
            `}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <div className="flex items-start gap-3">
              {assertion.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`
                      px-2 py-0.5 rounded text-[10px] font-black uppercase
                      ${
                        assertion.type === 'schema'
                          ? 'bg-purple-500/10 text-purple-500'
                          : assertion.type === 'status'
                            ? 'bg-blue-500/10 text-blue-500'
                            : assertion.type === 'timing'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-slate-500/10 text-slate-500'
                      }
                    `}
                  >
                    {assertion.type}
                  </span>
                  {assertion.path && (
                    <code className="text-[10px] font-mono text-muted-foreground">
                      {assertion.path}
                    </code>
                  )}
                </div>

                <p
                  className={`text-xs font-semibold mb-2 ${assertion.passed ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}
                >
                  {assertion.message}
                </p>

                {(assertion.expected !== undefined || assertion.actual !== undefined) && (
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    {assertion.expected !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Expected:</span>
                        <div className="text-foreground mt-0.5 break-all">
                          {JSON.stringify(assertion.expected)}
                        </div>
                      </div>
                    )}
                    {assertion.actual !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Actual:</span>
                        <div className="text-foreground mt-0.5 break-all">
                          {JSON.stringify(assertion.actual)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
