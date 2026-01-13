"use server";
import 'server-only';

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface Repository {
    id: string;
    project_id?: string;
    team_id?: string;
    name: string;
    git_url: string;
    description?: string;
    created_at: string;
}

export async function getRepositories(projectId?: string, teamId?: string): Promise<Repository[]> {
    let query = "SELECT * FROM repositories WHERE 1=1";
    const params: any[] = [];

    if (projectId) {
        params.push(projectId);
        query += ` AND project_id = $${params.length}`;
    }

    if (teamId) {
        params.push(teamId);
        query += ` AND team_id = $${params.length}`;
    }

    query += " ORDER BY created_at DESC";

    const result = await db.query<Repository>(query, params);
    return result.rows;
}

export async function createRepository(name: string, gitUrl: string, projectId?: string, teamId?: string, description?: string) {
    const res = await db.query(
        "INSERT INTO repositories (name, git_url, project_id, team_id, description) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [name, gitUrl, projectId, teamId, description]
    );
    revalidatePath("/");
    return res.rows[0];
}

export async function deleteRepository(id: string) {
    await db.query("DELETE FROM repositories WHERE id = $1", [id]);
    revalidatePath("/");
}
