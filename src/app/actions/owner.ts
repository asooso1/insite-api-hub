"use server";
import 'server-only';

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface EndpointOwner {
    owner_id: string | null;
    owner_name: string | null;
    owner_contact: string | null;
}

export async function getEndpointOwner(endpointId: string): Promise<EndpointOwner | null> {
    try {
        const res = await db.query(
            `SELECT owner_id, owner_name, owner_contact FROM endpoints WHERE id = $1`,
            [endpointId]
        );
        return (res.rows[0] as EndpointOwner) || null;
    } catch (error) {
        console.error("Failed to get endpoint owner:", error);
        return null;
    }
}

export async function updateEndpointOwner(
    endpointId: string,
    ownerName: string,
    ownerContact: string,
    ownerId?: string,
    currentUserId?: string
) {
    try {
        // 1. 이전 Owner 정보 조회
        const previousOwnerRes = await db.query(
            `SELECT owner_id, owner_name, path, project_id FROM endpoints WHERE id = $1`,
            [endpointId]
        );
        const previousData = previousOwnerRes.rows[0];
        const previousOwnerId = previousData?.owner_id;
        const endpointPath = previousData?.path || '엔드포인트';
        const projectId = previousData?.project_id;

        // 2. Owner 업데이트
        await db.query(
            `UPDATE endpoints
             SET owner_name = $1, owner_contact = $2, owner_id = $3
             WHERE id = $4`,
            [ownerName, ownerContact, ownerId || null, endpointId]
        );

        // 3. 알림 및 활동 로그 생성 (Owner가 변경된 경우에만)
        if (ownerId && previousOwnerId !== ownerId) {
            const { createNotification } = await import('./notifications');
            const { logActivity } = await import('./activity');
            const { getWatchers } = await import('./watch');

            // 3-1. 새 Owner에게 알림
            await createNotification(
                ownerId,
                'API_CHANGE',
                '담당자로 지정됨',
                `${endpointPath} 엔드포인트의 새로운 담당자로 지정되었습니다.`,
                {
                    link: `/project/${projectId}?endpoint=${endpointId}`,
                    actorId: currentUserId,
                    metadata: { endpointId, previousOwnerId }
                }
            );

            // 3-2. 이전 Owner에게 알림 (존재하는 경우)
            if (previousOwnerId) {
                await createNotification(
                    previousOwnerId,
                    'API_CHANGE',
                    '담당 변경됨',
                    `${endpointPath} 엔드포인트의 담당자가 변경되었습니다.`,
                    {
                        link: `/project/${projectId}?endpoint=${endpointId}`,
                        actorId: currentUserId,
                        metadata: { endpointId, newOwnerId: ownerId }
                    }
                );
            }

            // 3-3. Watch 구독자에게 알림 (새/이전 Owner 제외)
            const watchers = await getWatchers(endpointId);
            for (const watcher of watchers) {
                if (watcher.user_id !== ownerId && watcher.user_id !== previousOwnerId) {
                    await createNotification(
                        watcher.user_id,
                        'API_CHANGE',
                        '담당자 변경됨',
                        `구독 중인 ${endpointPath} 엔드포인트의 담당자가 ${ownerName}(으)로 변경되었습니다.`,
                        {
                            link: `/project/${projectId}?endpoint=${endpointId}`,
                            actorId: currentUserId,
                            metadata: { endpointId, newOwnerId: ownerId, previousOwnerId }
                        }
                    );
                }
            }

            // 3-4. 활동 로그 기록
            await logActivity(
                projectId,
                'ENDPOINT_MODIFIED',
                '담당자 변경',
                `${endpointPath} 담당자가 ${ownerName}(으)로 변경됨`,
                {
                    userId: currentUserId,
                    entityType: 'ENDPOINT',
                    entityId: endpointId,
                    metadata: {
                        previousOwnerId,
                        previousOwnerName: previousData?.owner_name,
                        newOwnerId: ownerId,
                        newOwnerName: ownerName
                    }
                }
            );
        }

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to update endpoint owner:", error);
        return { success: false, message: "담당자 정보 업데이트 실패" };
    }
}

export async function getEndpointsWithOwners(projectId: string) {
    try {
        const res = await db.query(
            `SELECT
                e.id,
                e.path,
                e.method,
                e.class_name as "className",
                e.method_name as "methodName",
                e.summary,
                e.owner_id as "ownerId",
                e.owner_name as "ownerName",
                e.owner_contact as "ownerContact",
                u.name as "ownerUserName",
                u.email as "ownerUserEmail"
             FROM endpoints e
             LEFT JOIN users u ON e.owner_id = u.id
             WHERE e.project_id = $1
             ORDER BY e.path ASC`,
            [projectId]
        );
        return res.rows;
    } catch (error) {
        console.error("Failed to get endpoints with owners:", error);
        return [];
    }
}

export async function bulkUpdateOwners(
    updates: { endpointId: string; ownerName: string; ownerContact: string }[]
) {
    try {
        for (const update of updates) {
            await db.query(
                `UPDATE endpoints SET owner_name = $1, owner_contact = $2 WHERE id = $3`,
                [update.ownerName, update.ownerContact, update.endpointId]
            );
        }
        revalidatePath('/');
        return { success: true, count: updates.length };
    } catch (error) {
        console.error("Failed to bulk update owners:", error);
        return { success: false, message: "일괄 업데이트 실패" };
    }
}
