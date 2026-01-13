'use server';

import 'server-only';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { ApiVersion } from '@/lib/api-types';

export async function getVersions(projectId: string): Promise<ApiVersion[]> {
    const res = await db.query(
        "SELECT * FROM api_versions WHERE project_id = $1 ORDER BY created_at DESC",
        [projectId]
    );
    return res.rows.map(row => ({
        id: row.id,
        projectId: row.project_id,
        versionTag: row.version_tag,
        description: row.description,
        endpointsSnapshot: typeof row.endpoints_snapshot === 'string' ? JSON.parse(row.endpoints_snapshot) : row.endpoints_snapshot,
        modelsSnapshot: typeof row.models_snapshot === 'string' ? JSON.parse(row.models_snapshot) : row.models_snapshot,
        createdAt: row.created_at
    }));
}

export async function deleteVersion(id: string) {
    await db.query("DELETE FROM api_versions WHERE id = $1", [id]);
    revalidatePath('/');
}

export async function getVersionById(id: string): Promise<ApiVersion | null> {
    const res = await db.query("SELECT * FROM api_versions WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
        id: row.id,
        projectId: row.project_id,
        versionTag: row.version_tag,
        description: row.description,
        endpointsSnapshot: typeof row.endpoints_snapshot === 'string' ? JSON.parse(row.endpoints_snapshot) : row.endpoints_snapshot,
        modelsSnapshot: typeof row.models_snapshot === 'string' ? JSON.parse(row.models_snapshot) : row.models_snapshot,
        createdAt: row.created_at
    };
}
