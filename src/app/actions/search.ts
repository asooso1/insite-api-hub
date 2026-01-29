'use server';

import { db } from '@/lib/db';

/**
 * 검색 결과 타입
 */
export interface SearchResult {
  id: string;
  type: 'endpoint' | 'model' | 'project' | 'team';
  title: string;
  subtitle?: string;
  description?: string;
  path?: string;
  method?: string;
  projectId?: string;
  projectName?: string;
  icon?: string;
  keywords?: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  query: string;
}

/**
 * 전역 검색 - 엔드포인트, 모델, 프로젝트, 팀 검색
 */
export async function searchAll(
  query: string,
  options?: {
    projectId?: string;
    types?: ('endpoint' | 'model' | 'project' | 'team')[];
    limit?: number;
  }
): Promise<SearchResponse> {
  const { projectId, types, limit = 20 } = options || {};

  if (!query || query.trim().length < 1) {
    return { results: [], totalCount: 0, query };
  }

  const searchTerm = `%${query.toLowerCase()}%`;
  const results: SearchResult[] = [];

  // 타입 필터 (기본: 모든 타입)
  const searchTypes = types || ['endpoint', 'model', 'project', 'team'];

  try {
    // 1. 엔드포인트 검색
    if (searchTypes.includes('endpoint')) {
      const endpointRes = projectId
        ? await db.query(
            `SELECT
              e.id,
              e.path,
              e.method,
              e.summary,
              e.class_name,
              e.method_name,
              p.id as project_id,
              p.name as project_name
            FROM endpoints e
            LEFT JOIN projects p ON e.project_id = p.id
            WHERE e.project_id = $1
              AND (
                LOWER(e.path) LIKE $2
                OR LOWER(e.method) LIKE $2
                OR LOWER(COALESCE(e.summary, '')) LIKE $2
                OR LOWER(COALESCE(e.class_name, '')) LIKE $2
                OR LOWER(COALESCE(e.method_name, '')) LIKE $2
              )
            LIMIT $3`,
            [projectId, searchTerm, limit]
          )
        : await db.query(
            `SELECT
              e.id,
              e.path,
              e.method,
              e.summary,
              e.class_name,
              e.method_name,
              p.id as project_id,
              p.name as project_name
            FROM endpoints e
            LEFT JOIN projects p ON e.project_id = p.id
            WHERE
              LOWER(e.path) LIKE $1
              OR LOWER(e.method) LIKE $1
              OR LOWER(COALESCE(e.summary, '')) LIKE $1
              OR LOWER(COALESCE(e.class_name, '')) LIKE $1
              OR LOWER(COALESCE(e.method_name, '')) LIKE $1
            LIMIT $2`,
            [searchTerm, limit]
          );

      for (const ep of endpointRes.rows) {
        results.push({
          id: ep.id,
          type: 'endpoint',
          title: `${ep.method} ${ep.path}`,
          subtitle: ep.summary || ep.method_name,
          description: ep.class_name,
          path: ep.path,
          method: ep.method,
          projectId: ep.project_id,
          projectName: ep.project_name,
          keywords: [ep.path, ep.method, ep.class_name, ep.method_name].filter(Boolean),
        });
      }
    }

    // 2. 모델 검색
    if (searchTypes.includes('model')) {
      const modelRes = projectId
        ? await db.query(
            `SELECT
              m.id,
              m.name,
              m.field_count,
              p.id as project_id,
              p.name as project_name
            FROM models m
            LEFT JOIN projects p ON m.project_id = p.id
            WHERE m.project_id = $1
              AND LOWER(m.name) LIKE $2
            LIMIT $3`,
            [projectId, searchTerm, limit]
          )
        : await db.query(
            `SELECT
              m.id,
              m.name,
              m.field_count,
              p.id as project_id,
              p.name as project_name
            FROM models m
            LEFT JOIN projects p ON m.project_id = p.id
            WHERE LOWER(m.name) LIKE $1
            LIMIT $2`,
            [searchTerm, limit]
          );

      for (const m of modelRes.rows) {
        results.push({
          id: m.id,
          type: 'model',
          title: m.name,
          subtitle: `${m.field_count || 0}개 필드`,
          projectId: m.project_id,
          projectName: m.project_name,
          keywords: [m.name],
        });
      }
    }

    // 3. 프로젝트 검색
    if (searchTypes.includes('project')) {
      const projectRes = await db.query(
        `SELECT
          id,
          name,
          description,
          git_url
        FROM projects
        WHERE
          LOWER(name) LIKE $1
          OR LOWER(COALESCE(description, '')) LIKE $1
        LIMIT $2`,
        [searchTerm, limit]
      );

      for (const p of projectRes.rows) {
        results.push({
          id: p.id,
          type: 'project',
          title: p.name,
          subtitle: p.description,
          description: p.git_url,
          keywords: [p.name, p.description].filter(Boolean),
        });
      }
    }

    // 4. 팀 검색
    if (searchTypes.includes('team')) {
      const teamRes = await db.query(
        `SELECT
          id,
          name,
          description
        FROM teams
        WHERE
          LOWER(name) LIKE $1
          OR LOWER(COALESCE(description, '')) LIKE $1
        LIMIT $2`,
        [searchTerm, limit]
      );

      for (const t of teamRes.rows) {
        results.push({
          id: t.id,
          type: 'team',
          title: t.name,
          subtitle: t.description,
          keywords: [t.name, t.description].filter(Boolean),
        });
      }
    }

    // 결과 정렬: 제목 매칭 우선
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(query.toLowerCase()) ? 0 : 1;
      const bExact = b.title.toLowerCase().includes(query.toLowerCase()) ? 0 : 1;
      return aExact - bExact;
    });

    return {
      results: results.slice(0, limit),
      totalCount: results.length,
      query,
    };
  } catch (error) {
    console.error('검색 실패:', error);
    return { results: [], totalCount: 0, query };
  }
}

/**
 * 엔드포인트 검색 (필터 적용)
 */
export async function searchEndpoints(
  query: string,
  options?: {
    projectId?: string;
    methods?: string[];
    limit?: number;
  }
): Promise<SearchResult[]> {
  const { projectId, methods, limit = 50 } = options || {};

  if (!query || query.trim().length < 1) {
    return [];
  }

  const searchTerm = `%${query.toLowerCase()}%`;

  try {
    let endpointRes;

    if (projectId && methods && methods.length > 0) {
      endpointRes = await db.query(
        `SELECT
          e.id, e.path, e.method, e.summary, e.class_name, e.method_name,
          p.id as project_id, p.name as project_name
        FROM endpoints e
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE e.project_id = $1
          AND e.method = ANY($2)
          AND (
            LOWER(e.path) LIKE $3
            OR LOWER(COALESCE(e.summary, '')) LIKE $3
            OR LOWER(COALESCE(e.class_name, '')) LIKE $3
          )
        LIMIT $4`,
        [projectId, methods, searchTerm, limit]
      );
    } else if (projectId) {
      endpointRes = await db.query(
        `SELECT
          e.id, e.path, e.method, e.summary, e.class_name, e.method_name,
          p.id as project_id, p.name as project_name
        FROM endpoints e
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE e.project_id = $1
          AND (
            LOWER(e.path) LIKE $2
            OR LOWER(COALESCE(e.summary, '')) LIKE $2
            OR LOWER(COALESCE(e.class_name, '')) LIKE $2
          )
        LIMIT $3`,
        [projectId, searchTerm, limit]
      );
    } else {
      endpointRes = await db.query(
        `SELECT
          e.id, e.path, e.method, e.summary, e.class_name, e.method_name,
          p.id as project_id, p.name as project_name
        FROM endpoints e
        LEFT JOIN projects p ON e.project_id = p.id
        WHERE
          LOWER(e.path) LIKE $1
          OR LOWER(COALESCE(e.summary, '')) LIKE $1
          OR LOWER(COALESCE(e.class_name, '')) LIKE $1
        LIMIT $2`,
        [searchTerm, limit]
      );
    }

    return endpointRes.rows.map((ep: any) => ({
      id: ep.id,
      type: 'endpoint' as const,
      title: `${ep.method} ${ep.path}`,
      subtitle: ep.summary || ep.method_name,
      description: ep.class_name,
      path: ep.path,
      method: ep.method,
      projectId: ep.project_id,
      projectName: ep.project_name,
    }));
  } catch (error) {
    console.error('엔드포인트 검색 실패:', error);
    return [];
  }
}

/**
 * 모델 검색
 */
export async function searchModels(
  query: string,
  options?: {
    projectId?: string;
    limit?: number;
  }
): Promise<SearchResult[]> {
  const { projectId, limit = 50 } = options || {};

  if (!query || query.trim().length < 1) {
    return [];
  }

  const searchTerm = `%${query.toLowerCase()}%`;

  try {
    const modelRes = projectId
      ? await db.query(
          `SELECT
            m.id, m.name, m.field_count,
            p.id as project_id, p.name as project_name
          FROM models m
          LEFT JOIN projects p ON m.project_id = p.id
          WHERE m.project_id = $1
            AND LOWER(m.name) LIKE $2
          LIMIT $3`,
          [projectId, searchTerm, limit]
        )
      : await db.query(
          `SELECT
            m.id, m.name, m.field_count,
            p.id as project_id, p.name as project_name
          FROM models m
          LEFT JOIN projects p ON m.project_id = p.id
          WHERE LOWER(m.name) LIKE $1
          LIMIT $2`,
          [searchTerm, limit]
        );

    return modelRes.rows.map((m: any) => ({
      id: m.id,
      type: 'model' as const,
      title: m.name,
      subtitle: `${m.field_count || 0}개 필드`,
      projectId: m.project_id,
      projectName: m.project_name,
    }));
  } catch (error) {
    console.error('모델 검색 실패:', error);
    return [];
  }
}
