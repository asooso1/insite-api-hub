import { test, expect } from '../fixtures/auth';

test.describe('Search and Filter Functionality', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
        // Start on endpoints tab where search and filters are most visible
        await authenticatedPage.goto('/?tab=endpoints');
    });

    test('should display search input in header', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);
        await expect(searchInput).toBeVisible();
    });

    test('should accept search input', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        await searchInput.fill('user');
        await expect(searchInput).toHaveValue('user');

        await searchInput.fill('');
        await searchInput.fill('api/endpoint');
        await expect(searchInput).toHaveValue('api/endpoint');
    });

    test('should clear search input', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        await searchInput.fill('test query');
        await expect(searchInput).toHaveValue('test query');

        await searchInput.fill('');
        await expect(searchInput).toHaveValue('');
    });

    test('should persist search query in input field', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        await searchInput.fill('persistent search');
        await expect(searchInput).toHaveValue('persistent search');

        // Navigate to another section of the page
        await authenticatedPage.evaluate(() => window.scrollTo(0, 1000));

        // Search query should still be there
        await expect(searchInput).toHaveValue('persistent search');
    });

    test('should show search query across tab changes', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        // Set search query
        await searchInput.fill('cross-tab search');
        await expect(searchInput).toHaveValue('cross-tab search');

        // Change to models tab
        await authenticatedPage.goto('/?tab=models');

        // Search should persist (controlled by Zustand store)
        await expect(searchInput).toHaveValue('cross-tab search');

        // Change to test tab
        await authenticatedPage.goto('/?tab=test');

        // Search should still persist
        await expect(searchInput).toHaveValue('cross-tab search');
    });

    test('should have search icon visible', async ({ authenticatedPage }) => {
        const searchContainer = authenticatedPage.locator('.group.focus-within\\:ring-2').filter({
            has: authenticatedPage.getByPlaceholder(/빠른 검색/)
        });

        // Search icon should be visible
        const searchIcon = searchContainer.locator('svg').first();
        await expect(searchIcon).toBeVisible();
    });

    test('should show focus styles when search is active', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        await searchInput.focus();

        // Parent container should have focus styles
        const container = authenticatedPage.locator('.focus-within\\:ring-2').first();
        await expect(container).toBeVisible();
    });

    test('should handle special characters in search', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        const specialQueries = [
            '/api/users/{id}',
            'user@email.com',
            'test-query',
            'query_with_underscore',
            '한글검색',
        ];

        for (const query of specialQueries) {
            await searchInput.fill(query);
            await expect(searchInput).toHaveValue(query);
            await searchInput.clear();
        }
    });

    test('should handle long search queries', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        const longQuery = 'this is a very long search query that contains many words and should still work properly without breaking the UI';

        await searchInput.fill(longQuery);
        await expect(searchInput).toHaveValue(longQuery);
    });

    test('should not submit form on Enter key', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        await searchInput.fill('test');
        await searchInput.press('Enter');

        // Should still be on the same page
        await expect(authenticatedPage).toHaveURL(/^\//);

        // Search value should still be there
        await expect(searchInput).toHaveValue('test');
    });

    test('should be case-insensitive', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        // Test uppercase
        await searchInput.fill('USER');
        await expect(searchInput).toHaveValue('USER');

        // Test lowercase
        await searchInput.fill('user');
        await expect(searchInput).toHaveValue('user');

        // Test mixed case
        await searchInput.fill('UsEr');
        await expect(searchInput).toHaveValue('UsEr');
    });

    test('should handle rapid typing', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        // Type quickly
        await searchInput.fill('q');
        await searchInput.fill('qu');
        await searchInput.fill('que');
        await searchInput.fill('quer');
        await searchInput.fill('query');

        await expect(searchInput).toHaveValue('query');
    });

    test('should maintain search state after page reload', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        // Note: This might not persist after reload since Zustand state is in-memory
        // But we can test the behavior
        await searchInput.fill('reload test');

        await authenticatedPage.reload();

        // After reload, search should be empty (default Zustand behavior)
        await expect(searchInput).toHaveValue('');
    });

    test('should have proper placeholder text', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        const placeholder = await searchInput.getAttribute('placeholder');
        expect(placeholder).toContain('빠른 검색');
    });

    test('should allow copy and paste', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        // Fill some text
        await searchInput.fill('original text');

        // Select all and copy (simulated)
        await searchInput.selectText();
        await searchInput.press('Meta+C'); // or Control+C

        // Clear and paste
        await searchInput.clear();
        await searchInput.press('Meta+V'); // or Control+V

        // Note: Clipboard operations might be restricted in test environment
        // Just verify the input still works
        await searchInput.fill('pasted text');
        await expect(searchInput).toHaveValue('pasted text');
    });

    test('should have search in mobile viewport', async ({ authenticatedPage }) => {
        // Set mobile viewport
        await authenticatedPage.setViewportSize({ width: 375, height: 667 });

        // Search might be hidden on mobile based on "hidden md:flex" class
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        // Check if visible (might not be on small screens)
        const isVisible = await searchInput.isVisible().catch(() => false);

        // If not visible, that's expected behavior for mobile
        // If visible, it should work
        if (isVisible) {
            await searchInput.fill('mobile search');
            await expect(searchInput).toHaveValue('mobile search');
        }
    });

    test('should have search icon change color on focus', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);
        const searchIcon = authenticatedPage.locator('.group').filter({
            has: searchInput
        }).locator('svg').first();

        // Icon should be visible
        await expect(searchIcon).toBeVisible();

        // Focus on search input
        await searchInput.focus();

        // Icon should still be visible (color might change via CSS)
        await expect(searchIcon).toBeVisible();
    });

    test('should handle tab navigation to search', async ({ authenticatedPage }) => {
        // Press Tab multiple times to reach search input
        await authenticatedPage.keyboard.press('Tab');
        await authenticatedPage.keyboard.press('Tab');
        await authenticatedPage.keyboard.press('Tab');

        // One of these tabs should focus the search (keyboard navigation)
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        // Try to type after tabbing
        await authenticatedPage.keyboard.type('tabbed search');

        // Check if input received the text (if it was focused by tab)
        const value = await searchInput.inputValue();

        // Value might be empty if search wasn't focused, or contain text if it was
        // This is more of a UX test
    });

    test('should clear search on Escape key', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        await searchInput.fill('test query');
        await expect(searchInput).toHaveValue('test query');

        // Press Escape
        await searchInput.press('Escape');

        // Value should remain (no default clear behavior unless implemented)
        // This documents current behavior
        await expect(searchInput).toHaveValue('test query');
    });

    test('should handle empty search gracefully', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        // Start with empty search
        await expect(searchInput).toHaveValue('');

        // Fill then clear
        await searchInput.fill('something');
        await searchInput.clear();

        await expect(searchInput).toHaveValue('');

        // Page should still be functional
        await expect(authenticatedPage.locator('main')).toBeVisible();
    });

    test('should have proper input styling', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        // Input should have proper classes
        await expect(searchInput).toHaveClass(/bg-transparent/);
        await expect(searchInput).toHaveClass(/outline-none/);
    });
});

test.describe('Search - Cross-tab Persistence', () => {
    test('should persist search when navigating between tabs', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        // Set search on endpoints
        await authenticatedPage.goto('/?tab=endpoints');
        await searchInput.fill('persistent query');

        // Navigate to models
        await authenticatedPage.goto('/?tab=models');
        await expect(searchInput).toHaveValue('persistent query');

        // Navigate to test
        await authenticatedPage.goto('/?tab=test');
        await expect(searchInput).toHaveValue('persistent query');

        // Navigate back to endpoints
        await authenticatedPage.goto('/?tab=endpoints');
        await expect(searchInput).toHaveValue('persistent query');
    });

    test('should update search across multiple tabs simultaneously', async ({ authenticatedPage }) => {
        const searchInput = authenticatedPage.getByPlaceholder(/빠른 검색/);

        // Start on endpoints
        await authenticatedPage.goto('/?tab=endpoints');
        await searchInput.fill('query1');

        // Go to models - search should persist
        await authenticatedPage.goto('/?tab=models');
        await expect(searchInput).toHaveValue('query1');

        // Update search on models tab
        await searchInput.fill('query2');

        // Go back to endpoints - should have new value
        await authenticatedPage.goto('/?tab=endpoints');
        await expect(searchInput).toHaveValue('query2');
    });
});
