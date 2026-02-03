'use server';

import 'server-only';
import { db } from '@/lib/db';
import {
  detectBreakingChanges,
  generateBreakingChangeSummary,
  BreakingChange,
  EndpointData,
} from '@/lib/breaking-changes';
import { createNotification } from './notifications';
import { getWatchers } from './watch';

/**
 * Breaking Change 발생 시 알림 전송
 *
 * @param params - 알림 파라미터
 * @param params.projectId - 프로젝트 ID
 * @param params.endpointId - 엔드포인트 ID
 * @param params.actorId - 변경한 사용자 ID
 * @param params.oldVersion - 이전 엔드포인트 데이터
 * @param params.newVersion - 새 엔드포인트 데이터
 */
export async function notifyBreakingChange(params: {
  projectId: string;
  endpointId: string;
  actorId: string;
  oldVersion: EndpointData;
  newVersion: EndpointData;
}): Promise<void> {
  const { projectId, endpointId, actorId, oldVersion, newVersion } = params;

  try {
    // Breaking Change 감지
    const breakingChanges = detectBreakingChanges(oldVersion, newVersion);

    if (breakingChanges.length === 0) {
      console.log('[Breaking Change] No breaking changes detected');
      return;
    }

    console.log(`[Breaking Change] Detected ${breakingChanges.length} breaking change(s)`);

    // 엔드포인트 정보 조회
    const endpointResult = await db.query(
      `SELECT path, method, summary, owner_name FROM endpoints WHERE id = $1`,
      [endpointId]
    );

    const endpoint = endpointResult.rows[0];
    if (!endpoint) {
      console.error('[Breaking Change] Endpoint not found:', endpointId);
      return;
    }

    // 프로젝트 정보 조회
    const projectResult = await db.query(
      `SELECT name, owner_id FROM projects WHERE id = $1`,
      [projectId]
    );

    const project = projectResult.rows[0];
    if (!project) {
      console.error('[Breaking Change] Project not found:', projectId);
      return;
    }

    const summary = generateBreakingChangeSummary(breakingChanges);
    const endpointPath = `${endpoint.method} ${endpoint.path}`;
    const title = `⚠️ Breaking Change: ${endpointPath}`;
    const message = `${endpoint.summary || '엔드포인트'}에 ${breakingChanges.length}개의 호환성 문제가 발견되었습니다.\n\n${summary}`;
    const link = `/projects/${projectId}/endpoints/${endpointId}`;

    // 1. Owner에게 알림
    if (project.owner_id && project.owner_id !== actorId) {
      await createNotification(project.owner_id, 'API_CHANGE', title, message, {
        link,
        actorId,
        metadata: {
          breakingChangesCount: breakingChanges.length,
          endpointPath,
          categories: Array.from(new Set(breakingChanges.map(c => c.category))),
        },
      });
    }

    // 2. Watch 구독자에게 알림
    const watchers = await getWatchers(endpointId);

    for (const watcher of watchers) {
      if (watcher.user_id === actorId) continue; // 자신에게는 알림 안 함

      await createNotification(watcher.user_id, 'API_CHANGE', title, message, {
        link,
        actorId,
        metadata: {
          breakingChangesCount: breakingChanges.length,
          endpointPath,
          categories: Array.from(new Set(breakingChanges.map(c => c.category))),
        },
      });
    }

    // 3. 활동 로그 기록 (endpoint_activity)
    await db.query(
      `INSERT INTO endpoint_activity (endpoint_id, actor_id, action, metadata)
       VALUES ($1, $2, $3, $4)`,
      [
        endpointId,
        actorId,
        'BREAKING_CHANGE_DETECTED',
        JSON.stringify({
          breakingChangesCount: breakingChanges.length,
          changes: breakingChanges.map(c => ({
            fieldPath: c.fieldPath,
            category: c.category,
            message: c.message,
          })),
          summary,
        }),
      ]
    );

    console.log(
      `[Breaking Change] Notifications sent to owner and ${watchers.length} watcher(s)`
    );
  } catch (error) {
    console.error('[Breaking Change] Failed to notify breaking change:', error);
    // 알림 실패가 전체 프로세스를 중단시키지 않도록 throw하지 않음
  }
}

/**
 * Breaking Change 요약 생성 (간단한 문자열)
 *
 * @param changes - Breaking Change 목록
 * @returns 요약 문자열
 */
export async function generateSummaryText(changes: BreakingChange[]): Promise<string> {
  return generateBreakingChangeSummary(changes);
}

/**
 * Breaking Change 카테고리별 그룹화
 *
 * @param changes - Breaking Change 목록
 * @returns 카테고리별로 그룹화된 객체
 */
export async function groupByCategory(changes: BreakingChange[]): Promise<Record<string, BreakingChange[]>> {
  const grouped: Record<string, BreakingChange[]> = {};

  for (const change of changes) {
    const category = change.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(change);
  }

  return grouped;
}

/**
 * Breaking Change 심각도별 통계
 *
 * @param changes - Breaking Change 목록
 * @returns 심각도별 개수
 */
export async function getBreakingChangeStats(changes: BreakingChange[]): Promise<{
  total: number;
  byCategory: Record<string, number>;
}> {
  const byCategory: Record<string, number> = {};

  for (const change of changes) {
    const category = change.category;
    byCategory[category] = (byCategory[category] || 0) + 1;
  }

  return {
    total: changes.length,
    byCategory,
  };
}
