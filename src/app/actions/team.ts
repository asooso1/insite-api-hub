"use server";
import 'server-only';

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface Team {
    id: string;
    name: string;
    description?: string;
    created_at: string;
}

export async function getTeams(): Promise<Team[]> {
    const result = await db.query<Team>(
        "SELECT * FROM teams ORDER BY created_at DESC"
    );
    return result.rows;
}

export async function createTeam(name: string, description: string) {
    const res = await db.query(
        "INSERT INTO teams (name, description) VALUES ($1, $2) RETURNING *",
        [name, description]
    );
    revalidatePath("/teams");
    return res.rows[0];
}

export async function updateTeam(id: string, name: string, description: string) {
    await db.query(
        "UPDATE teams SET name = $1, description = $2 WHERE id = $3",
        [name, description, id]
    );
    revalidatePath("/teams");
}

export async function deleteTeam(id: string) {
    try {
        await db.query("DELETE FROM teams WHERE id = $1", [id]);
        revalidatePath('/teams');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete team:", error);
        return { success: false, message: "팀 삭제 실패" };
    }
}

export async function linkProjectToTeam(teamId: string, projectId: string) {
    await db.query(
        "INSERT INTO team_projects (team_id, project_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [teamId, projectId]
    );
    revalidatePath("/teams");
    revalidatePath("/projects");
}

export async function unlinkProjectFromTeam(teamId: string, projectId: string) {
    await db.query(
        "DELETE FROM team_projects WHERE team_id = $1 AND project_id = $2",
        [teamId, projectId]
    );
    revalidatePath("/teams");
    revalidatePath("/projects");
}

export async function getProjectsByTeam(teamId: string) {
    const res = await db.query(
        `SELECT p.* FROM projects p 
         JOIN team_projects tp ON p.id = tp.project_id 
         WHERE tp.team_id = $1`,
        [teamId]
    );
    return res.rows;
}
