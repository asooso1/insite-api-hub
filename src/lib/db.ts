import 'server-only';
import { Pool, QueryResultRow } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = {
    async query<T extends QueryResultRow>(text: string, params?: any[]) {
        const start = Date.now();
        try {
            const res = await pool.query<T>(text, params);
            const duration = Date.now() - start;
            console.log('🐘 [DB] Executed query', {
                text: text.slice(0, 100) + (text.length > 100 ? '...' : ''),
                duration: `${duration}ms`,
                rows: res.rowCount
            });
            return res;
        } catch (error: any) {
            const duration = Date.now() - start;
            console.error('❌ [DB] Query error', {
                text,
                params,
                duration: `${duration}ms`,
                error: error.message
            });
            throw error;
        }
    },
    async getClient() {
        return await pool.connect();
    }
};
