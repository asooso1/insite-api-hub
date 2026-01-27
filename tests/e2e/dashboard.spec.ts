import { test, expect } from '../fixtures/auth';

test.describe('Dashboard', () => {
    test('should redirect to /auth when not authenticated', async ({ page }) => {
        // Clear any existing cookies
        await page.context().clearCookies();

        // Try to access dashboard
        await page.goto('/');

        // Should redirect to auth page
        await expect(page).toHaveURL('/auth');
        await expect(page.getByRole('heading', { name: 'API HUB' })).toBeVisible();
    });

    test('should load dashboard with authenticated session', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Should stay on dashboard
        await expect(authenticatedPage).toHaveURL(/^\//);

        // Should show header
        await expect(authenticatedPage.getByText(/API HUB/)).toBeVisible();
    });

    test('should display header with API HUB branding', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Check for API HUB text in header
        await expect(authenticatedPage.getByText(/API HUB/)).toBeVisible();
        await expect(authenticatedPage.getByText(/v2\.0/)).toBeVisible();

        // Check for logo/icon
        await expect(authenticatedPage.locator('header svg').first()).toBeVisible();
    });

    test('should display search input in header', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Search input should be visible
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);
        await expect(searchInput).toBeVisible();

        // Should accept input
        await searchInput.fill('test query');
        await expect(searchInput).toHaveValue('test query');
    });

    test('should display user menu in header', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // User name should be visible
        await expect(authenticatedPage.getByText('Test User')).toBeVisible();

        // User role badge should be visible
        await expect(authenticatedPage.getByText(/시스템 관리자|프로젝트 멤버/)).toBeVisible();
    });

    test('should show user menu dropdown on hover', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Find user icon
        const userIcon = authenticatedPage.locator('header').getByRole('img', { name: /avatar/i }).or(
            authenticatedPage.locator('header svg[class*="UserCircle"]').first()
        );

        // Hover over user menu
        await userIcon.hover();

        // Dropdown should appear (with timeout for animation)
        await expect(authenticatedPage.getByText(/로그아웃/)).toBeVisible({ timeout: 2000 });
    });

    test('should display notification bell icon', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Bell icon should be visible
        const bellIcon = authenticatedPage.locator('header').locator('svg').filter({ hasText: '' }).nth(1);
        await expect(bellIcon).toBeVisible();

        // Notification badge should be visible
        const notificationBadge = authenticatedPage.locator('.bg-rose-500');
        await expect(notificationBadge.first()).toBeVisible();
    });

    test('should have version switch button', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Version switch button should be visible
        await expect(authenticatedPage.getByRole('button', { name: /v1 정통 테마로 전환/ })).toBeVisible();
    });

    test('should display sidebar navigation', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Sidebar should be visible
        const sidebar = authenticatedPage.locator('aside').first();
        await expect(sidebar).toBeVisible();

        // Should contain navigation items (at least a few)
        const navButtons = sidebar.locator('button');
        await expect(navButtons).toHaveCount(12); // Based on tabs array
    });

    test('should display main content area', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Main content should be visible
        const mainContent = authenticatedPage.locator('main');
        await expect(mainContent).toBeVisible();

        // Should have workspace breadcrumb
        await expect(authenticatedPage.getByText('Workspace')).toBeVisible();
    });

    test('should have proper layout structure', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Header should be fixed at top
        const header = authenticatedPage.locator('header');
        await expect(header).toHaveCSS('position', 'fixed');

        // Sidebar should be visible
        const sidebar = authenticatedPage.locator('aside').first();
        await expect(sidebar).toBeVisible();

        // Main content should be scrollable
        const main = authenticatedPage.locator('main');
        await expect(main).toBeVisible();
    });

    test('should load with default tab (endpoints)', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Default tab should be visible in URL or content
        await expect(authenticatedPage.getByText(/엔드포인트|활성 엔드포인트 목록/)).toBeVisible();
    });

    test('should display action buttons', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Export button should be visible
        await expect(authenticatedPage.getByRole('button', { name: /데이터 내보내기/ })).toBeVisible();

        // Sync button should be visible
        await expect(authenticatedPage.getByRole('button', { name: /저장소 동기화/ })).toBeVisible();
    });

    test('should have responsive design elements', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Set viewport to mobile size
        await authenticatedPage.setViewportSize({ width: 375, height: 667 });

        // Header should still be visible
        await expect(authenticatedPage.locator('header')).toBeVisible();

        // Main content should be visible
        await expect(authenticatedPage.locator('main')).toBeVisible();
    });

    test('should persist authentication across page reloads', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Verify we're on dashboard
        await expect(authenticatedPage.getByText(/API HUB/)).toBeVisible();

        // Reload page
        await authenticatedPage.reload();

        // Should still be on dashboard (not redirected to auth)
        await expect(authenticatedPage).toHaveURL(/^\//);
        await expect(authenticatedPage.getByText(/API HUB/)).toBeVisible();
    });

    test('should show repo importer section', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Scroll to footer area
        await authenticatedPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // Footer should contain repo sync information
        await expect(authenticatedPage.getByText(/자동 분석 엔진|Spring 2.x 생태계/)).toBeVisible();
    });

    test('should have proper z-index layering', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');

        // Header should be on top
        const header = authenticatedPage.locator('header');
        const headerZIndex = await header.evaluate((el) => window.getComputedStyle(el).zIndex);
        expect(parseInt(headerZIndex)).toBeGreaterThan(0);

        // Sidebar should have z-index
        const sidebar = authenticatedPage.locator('aside').first();
        const sidebarZIndex = await sidebar.evaluate((el) => window.getComputedStyle(el).zIndex);
        expect(parseInt(sidebarZIndex)).toBeGreaterThan(0);
    });
});

test.describe('Dashboard - Admin Features', () => {
    test('should show admin menu option for admin users', async ({ page }) => {
        // Create admin session
        const adminSession = {
            id: 'admin-user-id',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'ADMIN' as const,
            sessionToken: 'admin-session-token',
        };

        await page.context().addCookies([
            {
                name: 'session',
                value: JSON.stringify(adminSession),
                domain: 'localhost',
                path: '/',
                httpOnly: true,
                sameSite: 'Lax',
            },
        ]);

        await page.goto('/');

        // Hover over user menu
        const userIcon = page.locator('header').locator('svg').last();
        await userIcon.hover();

        // Admin menu option should be visible
        await expect(page.getByText(/시스템 백오피스 관리/)).toBeVisible({ timeout: 2000 });
    });

    test('should not show admin menu option for regular users', async ({ page }) => {
        // Create regular user session
        const userSession = {
            id: 'regular-user-id',
            email: 'user@example.com',
            name: 'Regular User',
            role: 'USER' as const,
            sessionToken: 'user-session-token',
        };

        await page.context().addCookies([
            {
                name: 'session',
                value: JSON.stringify(userSession),
                domain: 'localhost',
                path: '/',
                httpOnly: true,
                sameSite: 'Lax',
            },
        ]);

        await page.goto('/');

        // Hover over user menu
        const userIcon = page.locator('header').locator('svg').last();
        await userIcon.hover();

        // Admin menu option should NOT be visible
        await expect(page.getByText(/시스템 백오피스 관리/)).not.toBeVisible();

        // But logout should still be visible
        await expect(page.getByText(/로그아웃/)).toBeVisible({ timeout: 2000 });
    });
});
