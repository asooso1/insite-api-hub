'use server';

import 'server-only';
import { db } from '@/lib/db';

export interface ProjectMember {
    id: string;
    user_id: string;
    project_id: string;
    role: string;
    joined_at: string;
    user_name?: string;
    user_email?: string;
}

/**
 * 프로젝트 멤버 목록 조회
 */
export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    try {
        const result = await db.query<ProjectMember>(
            `
            SELECT
                pm.id,
                pm.user_id,
                pm.project_id,
                pm.role,
                pm.joined_at,
                u.name as user_name,
                u.email as user_email
            FROM project_members pm
            LEFT JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = $1
            ORDER BY pm.joined_at DESC
            `,
            [projectId]
        );

        return result.rows;
    } catch (error) {
        console.error('Failed to get project members:', error);
        return [];
    }
}

/**
 * 프로젝트에 멤버 추가
 */
export async function addProjectMember(
    projectId: string,
    userId: string,
    role: string = 'MEMBER'
): Promise<{ success: boolean; error?: string }> {
    try {
        await db.query(
            `
            INSERT INTO project_members (project_id, user_id, role)
            VALUES ($1, $2, $3)
            ON CONFLICT (project_id, user_id) DO NOTHING
            `,
            [projectId, userId, role]
        );

        return { success: true };
    } catch (error: any) {
        console.error('Failed to add project member:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 프로젝트에서 멤버 제거
 */
export async function removeProjectMember(
    projectId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await db.query(
            `DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`,
            [projectId, userId]
        );

        return { success: true };
    } catch (error: any) {
        console.error('Failed to remove project member:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 프로젝트 멤버 권한 변경
 */
export async function updateProjectMemberRole(
    projectId: string,
    userId: string,
    role: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await db.query(
            `UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3`,
            [role, projectId, userId]
        );

        return { success: true };
    } catch (error: any) {
        console.error('Failed to update project member role:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 사용자가 프로젝트의 멤버인지 확인
 */
export async function isProjectMember(
    projectId: string,
    userId: string
): Promise<boolean> {
    try {
        const result = await db.query(
            `SELECT COUNT(*) as count FROM project_members WHERE project_id = $1 AND user_id = $2`,
            [projectId, userId]
        );

        return parseInt(result.rows[0]?.count || '0', 10) > 0;
    } catch (error) {
        console.error('Failed to check project membership:', error);
        return false;
    }
}
