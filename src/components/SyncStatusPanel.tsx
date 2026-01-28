'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react';

interface SyncStatusPanelProps {
  projectId: string;
  gitUrl?: string;
  lastSyncAt?: string;
  syncStatus?: 'idle' | 'syncing' | 'success' | 'error';
  onSync?: () => void;
  compact?: boolean;
}

/**
 * Git 저장소 동기화 상태 패널
 *
 * 프로젝트 헤더 또는 사이드바에 배치하여
 * 저장소 연결 상태, 마지막 동기화 시간, 동기화 트리거를 제공합니다.
 */
export function SyncStatusPanel({
  projectId, // 향후 프로젝트별 동기화 이력 조회에 사용
  gitUrl,
  lastSyncAt,
  syncStatus = 'idle',
  onSync,
  compact = false
}: SyncStatusPanelProps) {
  const [status, setStatus] = useState(syncStatus);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    setStatus(syncStatus);
  }, [syncStatus]);

  // 향후 프로젝트별 동기화 이력 조회 시 사용
  useEffect(() => {
    if (projectId) {
      // TODO: 프로젝트별 동기화 이력 조회 API 연동
      console.debug('SyncStatusPanel mounted for project:', projectId);
    }
  }, [projectId]);

  const isConnected = !!gitUrl;

  const formatLastSync = (dateStr?: string) => {
    if (!dateStr) return '동기화 기록 없음';
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  const handleSync = () => {
    if (status === 'syncing' || !isConnected) return;
    setStatus('syncing');
    onSync?.();

    // 동기화 결과 알림 토스트 (STYLE-02-3)
    setTimeout(() => {
      setStatus('success');
      setToastMessage('저장소 동기화가 완료되었습니다.');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 2000);
  };

  const statusConfig = {
    idle: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-50', label: '대기 중' },
    syncing: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-50', label: '동기화 중...' },
    success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: '동기화 완료' },
    error: { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50', label: '동기화 실패' },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  // 컴팩트 모드 (사이드바용)
  if (compact) {
    return (
      <div className="px-3 py-2">
        <button
          onClick={handleSync}
          disabled={!isConnected || status === 'syncing'}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 group"
        >
          <div className={`w-8 h-8 rounded-lg ${currentStatus.bg} flex items-center justify-center`}>
            <StatusIcon className={`w-4 h-4 ${currentStatus.color} ${status === 'syncing' ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
              {isConnected ? '저장소 동기화' : '저장소 미연결'}
            </p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500">
              {formatLastSync(lastSyncAt)}
            </p>
          </div>
          {isConnected && status !== 'syncing' && (
            <RefreshCw className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
          )}
        </button>
      </div>
    );
  }

  // 전체 모드 (헤더/대시보드용)
  return (
    <div className="relative">
      {/* STYLE-02-4: Git 저장소 연결 상태 카드 */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
        {/* 연결 상태 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${isConnected ? 'bg-emerald-50' : 'bg-slate-50'} flex items-center justify-center`}>
              {isConnected ? (
                <Wifi className="w-5 h-5 text-emerald-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">
                {isConnected ? 'Git 연결됨' : 'Git 미연결'}
              </p>
              {gitUrl && (
                <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                  {gitUrl}
                </p>
              )}
            </div>
          </div>

          {/* 상태 뱃지 (STYLE-02-2) */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ${currentStatus.bg}`}>
            <StatusIcon className={`w-3.5 h-3.5 ${currentStatus.color} ${status === 'syncing' ? 'animate-spin' : ''}`} />
            <span className={`text-[10px] font-bold ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
          </div>
        </div>

        {/* 마지막 동기화 시간 (STYLE-02-2) */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <Clock className="w-3 h-3" />
            <span>마지막 동기화: {formatLastSync(lastSyncAt)}</span>
          </div>

          {/* 동기화 버튼 */}
          <button
            onClick={handleSync}
            disabled={!isConnected || status === 'syncing'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
          >
            <RefreshCw className={`w-3 h-3 ${status === 'syncing' ? 'animate-spin' : ''}`} />
            {status === 'syncing' ? '동기화 중...' : '지금 동기화'}
          </button>
        </div>
      </div>

      {/* STYLE-02-3: 동기화 결과 알림 토스트 */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`absolute -bottom-16 left-0 right-0 mx-auto w-fit px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 text-xs font-bold z-50 ${
              toastType === 'success'
                ? 'bg-emerald-500 text-white shadow-emerald-200'
                : 'bg-rose-500 text-white shadow-rose-200'
            }`}
          >
            {toastType === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
