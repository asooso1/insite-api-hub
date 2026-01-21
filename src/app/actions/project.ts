"use server";
import 'server-only';

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Project } from "@/lib/api-types";

export async function getProjects(): Promise<Project[]> {
    const result = await db.query<Project>(
        "SELECT * FROM projects ORDER BY created_at DESC"
    );
    return result.rows;
}

export async function createProject(name: string, description: string, doorayWebhookUrl?: string) {
    const res = await db.query(
        "INSERT INTO projects (name, description, dooray_webhook_url) VALUES ($1, $2, $3) RETURNING *",
        [name, description, doorayWebhookUrl]
    );
    revalidatePath("/projects");
    return res.rows[0];
}

export async function updateProjectWebhook(projectId: string, url: string) {
    await db.query(
        "UPDATE projects SET dooray_webhook_url = $1 WHERE id = $2",
        [url, projectId]
    );
    revalidatePath("/projects");
}

export async function deleteProject(id: string) {
    try {
        // Cascading delete will handle endpoints, models, etc.
        await db.query("DELETE FROM projects WHERE id = $1", [id]);
        revalidatePath('/projects');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete project:", error);
        return { success: false, message: "프로젝트 삭제 실패" };
    }
}
