import { test as base, Page } from '@playwright/test';

/**
 * User session type matching the application's UserSession interface
 */
export interface UserSession {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'USER';
    sessionToken?: string;
}

type AuthFixtures = {
    authenticatedPage: Page;
};

/**
 * Test fixture for authenticated page sessions
 * Sets a session cookie to bypass actual authentication
 */
export const test = base.extend<AuthFixtures>({
    authenticatedPage: async ({ page }, use) => {
        // Create test session
        const testSession: UserSession = {
            id: 'test-user-id-12345',
            email: 'test@example.com',
            name: 'Test User',
            role: 'ADMIN',
            sessionToken: 'test-session-token-abc123',
        };

        // Set session cookie before any navigation
        await page.context().addCookies([
            {
                name: 'session',
                value: JSON.stringify(testSession),
                domain: 'localhost',
                path: '/',
                httpOnly: true,
                sameSite: 'Lax',
            },
        ]);

        // Set project cookie
        await page.context().addCookies([
            {
                name: 'current_project_id',
                value: 'test-project-001',
                domain: 'localhost',
                path: '/',
                sameSite: 'Lax',
            },
        ]);

        await use(page);
    },
});

export { expect } from '@playwright/test';

/**
 * Helper function to create a test user session
 */
export function createTestSession(overrides?: Partial<UserSession>): UserSession {
    return {
        id: 'test-user-id-12345',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        sessionToken: 'test-session-token-abc123',
        ...overrides,
    };
}

/**
 * Helper function to set session cookie on a page
 */
export async function setSessionCookie(page: Page, session?: UserSession) {
    const testSession = session || createTestSession();

    await page.context().addCookies([
        {
            name: 'session',
            value: JSON.stringify(testSession),
            domain: 'localhost',
            path: '/',
            httpOnly: true,
            sameSite: 'Lax',
        },
    ]);
}

/**
 * Helper function to set project cookie
 */
export async function setProjectCookie(page: Page, projectId: string = 'test-project-001') {
    await page.context().addCookies([
        {
            name: 'current_project_id',
            value: projectId,
            domain: 'localhost',
            path: '/',
            sameSite: 'Lax',
        },
    ]);
}

/**
 * Helper function to clear all auth cookies
 */
export async function clearAuthCookies(page: Page) {
    await page.context().clearCookies();
}
