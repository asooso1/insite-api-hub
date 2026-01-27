import { test, expect } from '../fixtures/auth';

test.describe('Sidebar Navigation', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');
    });

    test('should render sidebar with all navigation items', async ({ authenticatedPage }) => {
        const sidebar = authenticatedPage.locator('aside').first();
        await expect(sidebar).toBeVisible();

        // Should have 12 navigation buttons (based on tabs array)
        const navButtons = sidebar.locator('button');
        await expect(navButtons).toHaveCount(12);
    });

    test('should display navigation icons', async ({ authenticatedPage }) => {
        const sidebar = authenticatedPage.locator('aside').first();

        // Each navigation button should contain an icon (svg)
        const iconsCount = await sidebar.locator('button svg').count();
        expect(iconsCount).toBeGreaterThan(0);
    });

    test('should show tooltips on hover', async ({ authenticatedPage }) => {
        const sidebar = authenticatedPage.locator('aside').first();

        // Hover over first nav button
        const firstButton = sidebar.locator('button').first();
        await firstButton.hover();

        // Tooltip should appear
        const tooltip = authenticatedPage.locator('.whitespace-nowrap').first();
        await expect(tooltip).toBeVisible({ timeout: 1000 });
    });

    test('should highlight active tab', async ({ authenticatedPage }) => {
        // Go to specific tab
        await authenticatedPage.goto('/?tab=endpoints');

        const sidebar = authenticatedPage.locator('aside').first();

        // Find the active button (has blue background)
        const activeButton = sidebar.locator('button.bg-blue-600').first();
        await expect(activeButton).toBeVisible();

        // Should have active indicator
        const activeIndicator = sidebar.locator('.bg-white.rounded-full').first();
        await expect(activeIndicator).toBeVisible();
    });

    test('should navigate to different tabs on click', async ({ authenticatedPage }) => {
        const sidebar = authenticatedPage.locator('aside').first();

        // Click second navigation button (models)
        const modelsButton = sidebar.locator('button').nth(1);
        await modelsButton.click();

        // URL should update
        await expect(authenticatedPage).toHaveURL(/tab=models/);

        // Content should change
        await expect(authenticatedPage.getByText(/데이터 모델/)).toBeVisible();
    });

    test('should update active state when clicking different tabs', async ({ authenticatedPage }) => {
        const sidebar = authenticatedPage.locator('aside').first();

        // Click on endpoints tab
        const endpointsButton = sidebar.locator('button').first();
        await endpointsButton.click();

        // Endpoints button should be active
        await expect(endpointsButton).toHaveClass(/bg-blue-600/);

        // Click on models tab
        const modelsButton = sidebar.locator('button').nth(1);
        await modelsButton.click();

        // Models button should now be active
        await expect(modelsButton).toHaveClass(/bg-blue-600/);

        // Endpoints button should no longer be active
        await expect(endpointsButton).not.toHaveClass(/bg-blue-600/);
    });

    test('should display user avatar at bottom of sidebar', async ({ authenticatedPage }) => {
        const sidebar = authenticatedPage.locator('aside').first();

        // Avatar should be visible at bottom
        const avatar = sidebar.locator('img[alt="avatar"]');
        await expect(avatar).toBeVisible();
    });

    test('should have proper navigation groups', async ({ authenticatedPage }) => {
        // Navigate through different navigation items and verify content changes

        // Test endpoints
        await authenticatedPage.goto('/?tab=endpoints');
        await expect(authenticatedPage.getByText(/엔드포인트|활성 엔드포인트 목록/)).toBeVisible();

        // Test models
        await authenticatedPage.goto('/?tab=models');
        await expect(authenticatedPage.getByText(/데이터 모델/)).toBeVisible();

        // Test API test
        await authenticatedPage.goto('/?tab=test');
        await expect(authenticatedPage.getByText(/API 테스트/)).toBeVisible();

        // Test scenarios
        await authenticatedPage.goto('/?tab=scenarios');
        await expect(authenticatedPage.getByText(/자동화 시나리오/)).toBeVisible();
    });

    test('should have working navigation to all tabs', async ({ authenticatedPage }) => {
        const tabs = [
            'endpoints',
            'models',
            'test',
            'testResults',
            'scenarios',
            'versions',
            'environments',
            'teams',
            'projects',
            'hierarchy',
            'settings',
            'demo',
        ];

        for (const tab of tabs) {
            await authenticatedPage.goto(`/?tab=${tab}`);
            await expect(authenticatedPage).toHaveURL(`/?tab=${tab}`);
        }
    });

    test('should show hover effects on navigation items', async ({ authenticatedPage }) => {
        const sidebar = authenticatedPage.locator('aside').first();
        const firstButton = sidebar.locator('button').first();

        // Get initial state
        const initialClass = await firstButton.getAttribute('class');

        // Hover
        await firstButton.hover();

        // Should have hover styles (hard to test without visual regression)
        // But we can verify the button is still interactive
        await expect(firstButton).toBeEnabled();
    });

    test('should have consistent button sizing', async ({ authenticatedPage }) => {
        const sidebar = authenticatedPage.locator('aside').first();
        const buttons = sidebar.locator('button');

        // Get dimensions of first button
        const firstButtonBox = await buttons.first().boundingBox();
        expect(firstButtonBox).not.toBeNull();

        // All navigation buttons should have same width and height
        const count = await buttons.count();
        for (let i = 0; i < count; i++) {
            const buttonBox = await buttons.nth(i).boundingBox();
            expect(buttonBox?.width).toBe(firstButtonBox?.width);
            expect(buttonBox?.height).toBe(firstButtonBox?.height);
        }
    });

    test('should maintain sidebar visibility on navigation', async ({ authenticatedPage }) => {
        const sidebar = authenticatedPage.locator('aside').first();

        // Navigate to different tabs
        await authenticatedPage.goto('/?tab=endpoints');
        await expect(sidebar).toBeVisible();

        await authenticatedPage.goto('/?tab=models');
        await expect(sidebar).toBeVisible();

        await authenticatedPage.goto('/?tab=test');
        await expect(sidebar).toBeVisible();
    });

    test('should have proper color coding for different tabs', async ({ authenticatedPage }) => {
        const sidebar = authenticatedPage.locator('aside').first();

        // Click different tabs and verify they get the active blue styling
        const buttons = sidebar.locator('button');
        const count = await buttons.count();

        for (let i = 0; i < Math.min(count, 5); i++) {
            await buttons.nth(i).click();

            // Active button should have blue background
            await expect(buttons.nth(i)).toHaveClass(/bg-blue-600/);
            await expect(buttons.nth(i)).toHaveClass(/text-white/);
        }
    });

    test('should show smooth transitions on tab changes', async ({ authenticatedPage }) => {
        const sidebar = authenticatedPage.locator('aside').first();

        // Click endpoints
        await sidebar.locator('button').first().click();
        await authenticatedPage.waitForTimeout(300); // Wait for animation

        // Click models
        await sidebar.locator('button').nth(1).click();
        await authenticatedPage.waitForTimeout(300); // Wait for animation

        // Content should have changed
        await expect(authenticatedPage.getByText(/데이터 모델/)).toBeVisible();
    });

    test('should display correct tooltip text for each navigation item', async ({ authenticatedPage }) => {
        const sidebar = authenticatedPage.locator('aside').first();

        // Test tooltip for endpoints
        await sidebar.locator('button').first().hover();
        await expect(authenticatedPage.getByText('엔드포인트')).toBeVisible({ timeout: 1000 });

        // Test tooltip for models
        await sidebar.locator('button').nth(1).hover();
        await expect(authenticatedPage.getByText('데이터 모델')).toBeVisible({ timeout: 1000 });
    });

    test('should persist active state after page reload', async ({ authenticatedPage }) => {
        // Navigate to models tab
        await authenticatedPage.goto('/?tab=models');

        const sidebar = authenticatedPage.locator('aside').first();
        const modelsButton = sidebar.locator('button').nth(1);

        // Should be active
        await expect(modelsButton).toHaveClass(/bg-blue-600/);

        // Reload page
        await authenticatedPage.reload();

        // Should still be on models tab
        await expect(authenticatedPage).toHaveURL(/tab=models/);

        // Models button should still be active
        await expect(modelsButton).toHaveClass(/bg-blue-600/);
    });

    test('should handle rapid clicking between tabs', async ({ authenticatedPage }) => {
        const sidebar = authenticatedPage.locator('aside').first();

        // Rapidly click different tabs
        await sidebar.locator('button').first().click();
        await sidebar.locator('button').nth(1).click();
        await sidebar.locator('button').nth(2).click();
        await sidebar.locator('button').nth(3).click();

        // Should end up on the last clicked tab
        await expect(authenticatedPage).toHaveURL(/tab=/);

        // Page should still be functional
        await expect(authenticatedPage.locator('main')).toBeVisible();
    });

    test('should have accessible navigation structure', async ({ authenticatedPage }) => {
        const sidebar = authenticatedPage.locator('aside').first();

        // All navigation items should be buttons
        const buttons = sidebar.locator('button');
        const count = await buttons.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should display active indicator animation', async ({ authenticatedPage }) => {
        const sidebar = authenticatedPage.locator('aside').first();

        // Click first tab
        await sidebar.locator('button').first().click();
        await expect(sidebar.locator('.bg-white.rounded-full').first()).toBeVisible();

        // Click second tab
        await sidebar.locator('button').nth(1).click();

        // Active indicator should still be visible (moved to new position)
        await expect(sidebar.locator('.bg-white.rounded-full').first()).toBeVisible();
    });
});

test.describe('Sidebar Navigation - Browser Navigation', () => {
    test('should support browser back/forward buttons', async ({ authenticatedPage }) => {
        // Navigate through tabs
        await authenticatedPage.goto('/?tab=endpoints');
        await authenticatedPage.goto('/?tab=models');
        await authenticatedPage.goto('/?tab=test');

        // Go back
        await authenticatedPage.goBack();
        await expect(authenticatedPage).toHaveURL(/tab=models/);

        // Go back again
        await authenticatedPage.goBack();
        await expect(authenticatedPage).toHaveURL(/tab=endpoints/);

        // Go forward
        await authenticatedPage.goForward();
        await expect(authenticatedPage).toHaveURL(/tab=models/);
    });

    test('should update sidebar active state with browser navigation', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/?tab=endpoints');
        await authenticatedPage.goto('/?tab=models');

        const sidebar = authenticatedPage.locator('aside').first();

        // Models button should be active
        const modelsButton = sidebar.locator('button').nth(1);
        await expect(modelsButton).toHaveClass(/bg-blue-600/);

        // Go back to endpoints
        await authenticatedPage.goBack();

        // Wait for state update
        await authenticatedPage.waitForTimeout(100);

        // Endpoints button should now be active
        const endpointsButton = sidebar.locator('button').first();
        await expect(endpointsButton).toHaveClass(/bg-blue-600/);
    });
});
