import 'server-only';
import { Pool, QueryResultRow } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = {
    async query<T extends QueryResultRow>(text: string, params?: any[]) {
        const start = Date.now();
        const res = await pool.query<T>(text, params);
        const duration = Date.now() - start;
        console.log('executed query', { text, duration, rows: res.rowCount });
        return res;
    },
    async getClient() {
        return await pool.connect();
    }
};
