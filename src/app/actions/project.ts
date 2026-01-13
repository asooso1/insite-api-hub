"use server";
import 'server-only';

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Project } from "@/lib/api-types";

export async function getProjects(): Promise<Project[]> {
    const client = await db.getClient();
    try {
        const result = await client.query(
            "SELECT * FROM projects ORDER BY created_at DESC"
        );
        return result.rows;
    } finally {
        client.release();
    }
}

export async function createProject(name: string, gitUrl: string, description: string) {
    const client = await db.getClient();
    try {
        const result = await client.query(
            "INSERT INTO projects (name, git_url, description) VALUES ($1, $2, $3) RETURNING *",
            [name, gitUrl, description]
        );
        revalidatePath('/');
        return { success: true, project: result.rows[0] };
    } catch (error) {
        console.error("Failed to create project:", error);
        return { success: false, message: "프로젝트 생성 실패" };
    } finally {
        client.release();
    }
}

export async function deleteProject(id: string) {
    const client = await db.getClient();
    try {
        // Cascading delete will handle endpoints, models, etc.
        await client.query("DELETE FROM projects WHERE id = $1", [id]);
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete project:", error);
        return { success: false, message: "프로젝트 삭제 실패" };
    } finally {
        client.release();
    }
}
