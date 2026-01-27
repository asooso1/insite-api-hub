# E2E Tests for API Hub

This directory contains comprehensive Playwright end-to-end tests for the API Hub Next.js application.

## Directory Structure

```
tests/
├── e2e/                    # E2E test specifications
│   ├── auth.spec.ts       # Authentication flow tests
│   ├── dashboard.spec.ts  # Dashboard functionality tests
│   ├── sidebar.spec.ts    # Sidebar navigation tests
│   └── search-and-filter.spec.ts  # Search and filter tests
├── fixtures/              # Test fixtures and helpers
│   └── auth.ts           # Authentication fixtures
└── README.md             # This file
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npx playwright test tests/e2e/auth.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

### Run tests in UI mode (interactive)
```bash
npx playwright test --ui
```

### Run specific test by name
```bash
npx playwright test -g "should load auth page"
```

## Test Coverage

### 1. Authentication Tests (`auth.spec.ts`)
- ✅ Auth page loads with login form
- ✅ Toggle between login and signup forms
- ✅ Form validation (empty fields, HTML5 validation)
- ✅ Name field appears in signup mode
- ✅ Input types and attributes
- ✅ Loading states on submission
- ✅ User input acceptance
- ✅ Visual elements and styling
- ✅ Form state persistence when toggling modes
- ✅ Accessibility via placeholders

### 2. Dashboard Tests (`dashboard.spec.ts`)
- ✅ Redirect to /auth without session
- ✅ Dashboard loads with authenticated session
- ✅ Header displays API HUB branding
- ✅ Search input functionality
- ✅ User menu display
- ✅ User menu dropdown on hover
- ✅ Notification bell icon
- ✅ Version switch button
- ✅ Sidebar navigation visibility
- ✅ Main content area display
- ✅ Layout structure (header, sidebar, main)
- ✅ Default tab loading
- ✅ Action buttons (export, sync)
- ✅ Responsive design elements
- ✅ Authentication persistence across reloads
- ✅ Repo importer section
- ✅ Z-index layering
- ✅ Admin menu for admin users
- ✅ Regular user menu restrictions

### 3. Sidebar Navigation Tests (`sidebar.spec.ts`)
- ✅ Render all navigation items (12 tabs)
- ✅ Display navigation icons
- ✅ Show tooltips on hover
- ✅ Highlight active tab
- ✅ Navigate to different tabs
- ✅ Update active state on navigation
- ✅ User avatar at bottom
- ✅ Navigation groups content verification
- ✅ All tabs accessible
- ✅ Hover effects
- ✅ Consistent button sizing
- ✅ Sidebar visibility persistence
- ✅ Color coding for active tabs
- ✅ Smooth transitions
- ✅ Tooltip text accuracy
- ✅ Active state persistence after reload
- ✅ Rapid clicking handling
- ✅ Accessible navigation structure
- ✅ Active indicator animation
- ✅ Browser back/forward button support
- ✅ Sidebar state sync with browser navigation

### 4. Search and Filter Tests (`search-and-filter.spec.ts`)
- ✅ Search input display
- ✅ Accept search input
- ✅ Clear search input
- ✅ Persist search query
- ✅ Search query across tab changes (Zustand)
- ✅ Search icon visibility
- ✅ Focus styles
- ✅ Special characters handling
- ✅ Long search queries
- ✅ Enter key behavior
- ✅ Case-insensitive search
- ✅ Rapid typing handling
- ✅ Search state after reload
- ✅ Placeholder text
- ✅ Copy and paste support
- ✅ Mobile viewport behavior
- ✅ Search icon color on focus
- ✅ Tab navigation to search
- ✅ Escape key behavior
- ✅ Empty search handling
- ✅ Input styling
- ✅ Cross-tab persistence
- ✅ Simultaneous updates across tabs

## Test Fixtures

### Authentication Fixture (`fixtures/auth.ts`)

Provides authenticated page context for tests that require login.

```typescript
import { test, expect } from '../fixtures/auth';

test('my authenticated test', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    // Test code here
});
```

#### Helper Functions

- `createTestSession(overrides?)` - Create a test user session object
- `setSessionCookie(page, session?)` - Set session cookie on a page
- `setProjectCookie(page, projectId?)` - Set project cookie
- `clearAuthCookies(page)` - Clear all auth cookies

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
    test.beforeEach(async ({ page }) => {
        // Setup code
    });

    test('should do something', async ({ page }) => {
        // Test code
    });
});
```

### Authenticated Test Structure

```typescript
import { test, expect } from '../fixtures/auth';

test.describe('Authenticated Feature', () => {
    test('should work when logged in', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/');
        // Test code
    });
});
```

## Best Practices

1. **Use descriptive test names** - Start with "should" and describe expected behavior
2. **Use proper selectors** - Prefer role-based selectors over CSS classes
   - `getByRole('button', { name: 'Submit' })`
   - `getByPlaceholder('Email Address')`
   - `getByText('Welcome back')`
3. **Wait for elements properly** - Use `await expect().toBeVisible()` instead of arbitrary timeouts
4. **Test user workflows** - Test complete user journeys, not just individual components
5. **Handle Korean text** - Use regex or partial matches for Korean text: `/엔드포인트/`
6. **Isolate tests** - Each test should be independent and not rely on others
7. **Clean up state** - Use `beforeEach` to reset state between tests
8. **Use fixtures** - Leverage the auth fixture for authenticated tests

## Debugging Tests

### View test report
```bash
npx playwright show-report
```

### Generate trace
```bash
npx playwright test --trace on
```

### View trace
```bash
npx playwright show-trace trace.zip
```

### Take screenshot on failure
Tests are already configured to take screenshots on failure. Find them in `test-results/`.

## CI/CD Integration

Tests are configured to run in CI with:
- 2 retries on failure
- Single worker (sequential execution)
- HTML report generation

See `playwright.config.ts` for full configuration.

## Common Issues

### Issue: Tests timeout
**Solution**: Increase timeout in `playwright.config.ts` or use `test.setTimeout(60000)`

### Issue: Elements not found
**Solution**: Check if element is in viewport, wait for navigation, or use `await page.waitForSelector()`

### Issue: Authentication fails
**Solution**: Verify session cookie format matches `UserSession` type in `auth.ts` fixture

### Issue: Search doesn't persist
**Solution**: This is expected - Zustand state is in-memory and resets on page reload

## Tech Stack

- **Playwright** - E2E testing framework
- **TypeScript** - Type-safe test code
- **Next.js** - Application framework
- **Zustand** - State management (affects test behavior)

## Notes

- The application uses Korean language for UI, so many selectors use Korean text
- Authentication is cookie-based with JSON-serialized session data
- Dashboard uses URL-based tab navigation (`?tab=endpoints`)
- Search state is managed by Zustand and persists across tab changes but not page reloads
- The app has both v1 and v2 UI versions - tests focus on v2 (default)
