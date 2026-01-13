'use server';

import { db } from "@/lib/db";
import { ApiField } from "@/lib/api-types";

/**
 * Fetch detailed fields for a specific model.
 * Used for lazy-loading in the Model Explorer to optimize initial page load.
 */
export async function getModelFields(projectId: string, modelId: string): Promise<ApiField[]> {
    try {
        const res = await db.query(
            "SELECT fields FROM api_models WHERE project_id = $1 AND id = $2 LIMIT 1",
            [projectId, modelId]
        );

        if (res.rows.length > 0) {
            return res.rows[0].fields;
        }
        return [];
    } catch (err) {
        console.error("Error fetching model fields:", err);
        return [];
    }
}

/**
 * Server-side search for models by name or field name.
 * Uses GIN index for performance if configured.
 */
export async function searchModels(projectId: string, query: string) {
    try {
        const res = await db.query(`
            SELECT name, fields 
            FROM api_models 
            WHERE project_id = $1 
            AND (
                name ILIKE $2 
                OR EXISTS (
                    SELECT 1 FROM jsonb_array_elements(fields) f 
                    WHERE f->>'name' ILIKE $2
                )
            )
            ORDER BY name ASC
        `, [projectId, `%${query}%`]);

        return res.rows;
    } catch (err) {
        console.error("Error searching models:", err);
        return [];
    }
}
