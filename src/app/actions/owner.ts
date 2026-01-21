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
    ownerId?: string
) {
    try {
        await db.query(
            `UPDATE endpoints
             SET owner_name = $1, owner_contact = $2, owner_id = $3
             WHERE id = $4`,
            [ownerName, ownerContact, ownerId || null, endpointId]
        );
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
