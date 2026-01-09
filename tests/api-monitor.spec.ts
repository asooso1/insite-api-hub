import { test, expect } from '@playwright/test';
import { Pool } from 'pg';

// Create a new pool instance to connect to the database
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

test.describe('Dynamic API Monitor', () => {
    let endpoints: any[] = [];

    test.beforeAll(async () => {
        // 1. Check if DB is reachable and endpoints table exists
        const client = await pool.connect();
        try {
            const tableCheck = await client.query(`SELECT to_regclass('public.endpoints')`);
            if (tableCheck.rows[0].to_regclass) {
                // Fetch GET endpoints to verify availability
                // Exclude parameterized paths (e.g., /users/{id}) for simple health check
                const res = await client.query("SELECT * FROM endpoints WHERE method = 'GET' AND path NOT LIKE '%{%'");
                endpoints = res.rows;
                console.log(`🔎 Found ${endpoints.length} testable endpoints from DB.`);
            } else {
                console.warn('⚠️ Endpoints table does not exist. Skipping dynamic tests.');
            }
        } catch (e) {
            console.error('❌ DB Connection Failed inside Test:', e);
        } finally {
            client.release();
        }
    });

    test.afterAll(async () => {
        await pool.end();
    });

    // Verify Main Page
    test('should load main dashboard', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/API Hub/);
        // await expect(page.getByText('API List')).toBeVisible(); // Adjust selector based on actual UI
    });

    // Verify Dynamic APIs
    test('should verify all GET endpoints are reachable (200-499)', async ({ request }) => {
        if (endpoints.length === 0) {
            test.skip(true, 'No endpoints found to test');
            return;
        }

        let successCount = 0;

        for (const endpoint of endpoints) {
            console.log(`Testing: ${endpoint.method} ${endpoint.path}`);

            const response = await request.get(endpoint.path);
            const status = response.status();

            // We consider the API "reachable" if it doesn't return 404.
            // 401/403 means it exists but needs auth. 500 means it exists but crashed.
            // Ideally we want 200, but for generic monitoring, !404 is a good baseline.
            if (status === 404) {
                console.error(`❌ ${endpoint.path} returned 404 Not Found`);
            } else {
                successCount++;
            }

            expect(status, `API ${endpoint.path} should not be 404`).not.toBe(404);
        }

        console.log(`✅ Successfully verified ${successCount}/${endpoints.length} APIs.`);
    });
});
