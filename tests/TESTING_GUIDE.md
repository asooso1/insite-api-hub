# Comprehensive Testing Guide for API Hub

## Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Run all E2E tests
npm run test:e2e

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in UI mode (interactive debugging)
npx playwright test --ui

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run tests matching a pattern
npx playwright test -g "should load auth page"
```

## Test Structure

### Test Files Created

```
tests/
├── fixtures/
│   └── auth.ts                      # Authentication helpers and fixtures
├── e2e/
│   ├── auth.spec.ts                 # 12 authentication tests
│   ├── dashboard.spec.ts            # 19 dashboard tests
│   ├── sidebar.spec.ts              # 25 sidebar navigation tests
│   └── search-and-filter.spec.ts    # 24 search functionality tests
└── README.md                        # Test documentation
```

**Total: 80 comprehensive E2E tests**

## Test Coverage Overview

### 1. Authentication Tests (auth.spec.ts) - 12 tests

Tests the `/auth` page authentication flow:

- ✅ Page loads with correct form elements
- ✅ Toggle between login/signup modes
- ✅ HTML5 form validation
- ✅ Input field types and attributes
- ✅ Loading states during submission
- ✅ Form state management
- ✅ Visual elements and styling
- ✅ Accessibility features

**Key Scenarios:**
- User can switch between login and signup
- Form validates empty fields
- Name field appears only in signup mode
- Loading spinner shows during authentication

### 2. Dashboard Tests (dashboard.spec.ts) - 19 tests

Tests the main dashboard functionality:

- ✅ Authentication redirect (no session → /auth)
- ✅ Dashboard loads for authenticated users
- ✅ Header branding and navigation
- ✅ Search functionality
- ✅ User menu and dropdown
- ✅ Notification system
- ✅ Responsive design
- ✅ Admin vs. regular user features
- ✅ Session persistence

**Key Scenarios:**
- Unauthenticated users redirected to login
- Header displays user info correctly
- Admin users see admin menu options
- Regular users don't see admin options
- Search bar accepts input
- Dashboard persists across reloads

### 3. Sidebar Navigation Tests (sidebar.spec.ts) - 25 tests

Tests the sidebar navigation system:

- ✅ Renders all 12 navigation items
- ✅ Tab navigation and URL updates
- ✅ Active state highlighting
- ✅ Tooltips on hover
- ✅ Browser back/forward support
- ✅ Smooth transitions
- ✅ Keyboard accessibility
- ✅ Visual feedback

**Key Scenarios:**
- Clicking nav items changes content and URL
- Active tab shows visual indicator
- Tooltips display correct labels
- Browser back button works correctly
- Rapid clicking handled gracefully
- Active state persists after reload

### 4. Search and Filter Tests (search-and-filter.spec.ts) - 24 tests

Tests search functionality across the app:

- ✅ Search input visibility and interaction
- ✅ Query persistence across tabs (Zustand)
- ✅ Special characters handling
- ✅ Long query support
- ✅ Case-insensitive search
- ✅ Focus states
- ✅ Mobile viewport behavior
- ✅ Copy/paste support

**Key Scenarios:**
- Search query persists when switching tabs
- Handles Korean and English text
- Special characters work correctly
- Long queries don't break UI
- Search state managed by Zustand store
- Clears on page reload (expected behavior)

## Running Tests

### Basic Commands

```bash
# Run all tests
npm run test:e2e

# Run all tests in parallel
npx playwright test --workers=4

# Run specific file
npx playwright test tests/e2e/auth.spec.ts

# Run specific test by name
npx playwright test -g "should load auth page"

# Run tests for specific browser
npx playwright test --project=chromium
```

### Debug Mode

```bash
# Debug mode (step through tests)
npx playwright test --debug

# Debug specific test
npx playwright test tests/e2e/auth.spec.ts --debug

# Debug with specific line number
npx playwright test tests/e2e/auth.spec.ts:27 --debug
```

### UI Mode (Interactive)

```bash
# Launch Playwright UI
npx playwright test --ui

# Benefits:
# - Visual test execution
# - Time travel debugging
# - Watch mode
# - Pick and choose tests
```

### Headed Mode (See Browser)

```bash
# Run with visible browser
npx playwright test --headed

# Run with slow motion
npx playwright test --headed --slow-mo=1000

# Run in specific browser
npx playwright test --headed --browser=firefox
```

### Reporting

```bash
# Generate HTML report
npx playwright test --reporter=html

# View report
npx playwright show-report

# List all tests
npx playwright test --list

# Run with verbose output
npx playwright test --reporter=list
```

### Trace Viewer

```bash
# Run with trace on
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip

# Trace only on failure (default config)
npx playwright test --trace on-first-retry
```

## Test Fixtures

### Using the Authentication Fixture

The `authenticatedPage` fixture automatically sets up a session cookie:

```typescript
import { test, expect } from '../fixtures/auth';

test('my test', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    // You're now authenticated as "Test User" (ADMIN)
});
```

### Helper Functions

```typescript
import {
    createTestSession,
    setSessionCookie,
    setProjectCookie,
    clearAuthCookies
} from '../fixtures/auth';

// Create custom session
const adminSession = createTestSession({ role: 'ADMIN' });
const userSession = createTestSession({ role: 'USER', name: 'John' });

// Set session manually
await setSessionCookie(page, adminSession);

// Set project
await setProjectCookie(page, 'my-project-id');

// Clear cookies
await clearAuthCookies(page);
```

## Writing New Tests

### Test Structure Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
    test.beforeEach(async ({ page }) => {
        // Setup before each test
        await page.goto('/');
    });

    test('should do something specific', async ({ page }) => {
        // Arrange
        const button = page.getByRole('button', { name: 'Submit' });

        // Act
        await button.click();

        // Assert
        await expect(page.getByText('Success')).toBeVisible();
    });

    test.afterEach(async ({ page }) => {
        // Cleanup after each test (if needed)
    });
});
```

### Authenticated Test Template

```typescript
import { test, expect } from '../fixtures/auth';

test.describe('Authenticated Feature', () => {
    test('should work when logged in', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/dashboard');

        await expect(authenticatedPage.getByText('Welcome')).toBeVisible();
    });
});
```

## Best Practices

### 1. Use Semantic Selectors

```typescript
// ✅ GOOD - Semantic and robust
await page.getByRole('button', { name: 'Submit' });
await page.getByPlaceholder('Email Address');
await page.getByText('Welcome back');
await page.getByLabel('Password');

// ❌ AVOID - Fragile
await page.locator('.btn-submit');
await page.locator('#email-input');
```

### 2. Wait for Elements Properly

```typescript
// ✅ GOOD - Built-in waiting
await expect(page.getByText('Success')).toBeVisible();

// ❌ AVOID - Arbitrary waits
await page.waitForTimeout(3000);
```

### 3. Handle Korean Text

```typescript
// ✅ GOOD - Regex for partial match
await expect(page.getByText(/엔드포인트/)).toBeVisible();

// ✅ GOOD - Exact match
await expect(page.getByText('API HUB')).toBeVisible();

// ❌ AVOID - Might fail with whitespace
await page.getByText('API HUB v2.0');
```

### 4. Test User Workflows

```typescript
// ✅ GOOD - Complete workflow
test('user can create and edit project', async ({ authenticatedPage }) => {
    // Navigate to projects
    await authenticatedPage.goto('/?tab=projects');

    // Create project
    await authenticatedPage.getByRole('button', { name: '+ New' }).click();
    await authenticatedPage.getByPlaceholder('Project name').fill('Test');
    await authenticatedPage.getByRole('button', { name: 'Save' }).click();

    // Verify created
    await expect(authenticatedPage.getByText('Test')).toBeVisible();

    // Edit project
    await authenticatedPage.getByText('Test').click();
    // ... continue workflow
});

// ❌ AVOID - Isolated component test
test('button exists', async ({ page }) => {
    await expect(page.getByRole('button')).toBeVisible();
});
```

### 5. Isolate Tests

```typescript
// ✅ GOOD - Independent tests
test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/auth');
});

// ❌ AVOID - Dependent tests
test('create item', async ({ page }) => { /* ... */ });
test('edit item created above', async ({ page }) => {
    // This fails if previous test fails
});
```

## Debugging Tips

### 1. Use Page Screenshots

```typescript
test('debug visual issue', async ({ page }) => {
    await page.goto('/');
    await page.screenshot({ path: 'debug.png', fullPage: true });
});
```

### 2. Use Console Logs

```typescript
test('debug selector', async ({ page }) => {
    const count = await page.locator('button').count();
    console.log(`Found ${count} buttons`);
});
```

### 3. Pause Execution

```typescript
test('debug step by step', async ({ page }) => {
    await page.goto('/');
    await page.pause(); // Opens inspector
});
```

### 4. Check Element State

```typescript
test('debug visibility', async ({ page }) => {
    const button = page.getByRole('button');

    console.log('Visible:', await button.isVisible());
    console.log('Enabled:', await button.isEnabled());
    console.log('Count:', await page.locator('button').count());
});
```

## Common Issues & Solutions

### Issue: Test times out

```typescript
// Solution 1: Increase timeout
test('slow test', async ({ page }) => {
    test.setTimeout(60000); // 60 seconds
    // ... test code
});

// Solution 2: Wait for specific condition
await page.waitForLoadState('networkidle');
await page.waitForSelector('.content-loaded');
```

### Issue: Element not found

```typescript
// Solution: Check if element is in viewport
await page.locator('.sidebar').scrollIntoViewIfNeeded();

// Solution: Wait for element
await page.waitForSelector('.dynamic-content', { state: 'visible' });

// Solution: Check if element exists first
const exists = await page.locator('.element').count() > 0;
if (exists) {
    await page.locator('.element').click();
}
```

### Issue: Flaky test (sometimes passes, sometimes fails)

```typescript
// Solution: Wait for stable state
await page.waitForLoadState('networkidle');

// Solution: Retry specific action
await expect(async () => {
    await page.getByText('Dynamic').click();
    await expect(page.getByText('Result')).toBeVisible();
}).toPass({ timeout: 10000 });

// Solution: Add explicit waits
await page.waitForTimeout(100); // Use sparingly
```

### Issue: Authentication not working

```typescript
// Solution: Verify cookie format
const cookies = await page.context().cookies();
console.log('Session cookie:', cookies.find(c => c.name === 'session'));

// Solution: Use the auth fixture
import { test } from '../fixtures/auth';
test('use auth fixture', async ({ authenticatedPage }) => {
    // Already authenticated
});
```

## CI/CD Integration

Tests are configured for CI in `playwright.config.ts`:

```typescript
{
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
}
```

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Performance Tips

### 1. Run Tests in Parallel

```bash
# Use multiple workers
npx playwright test --workers=4
```

### 2. Run Specific Tests During Development

```bash
# Only run tests you're working on
npx playwright test -g "auth"
```

### 3. Use Headed Mode Selectively

```bash
# Headed mode is slower
npx playwright test --headed  # Slow
npx playwright test           # Fast
```

## Test Maintenance

### Regular Updates Needed

1. **When UI text changes** - Update Korean text selectors
2. **When routes change** - Update URL expectations
3. **When features added** - Add new test files
4. **When auth changes** - Update fixture session format

### Monthly Checklist

- [ ] Run full test suite and fix failures
- [ ] Review test coverage (aim for 80%+)
- [ ] Update test data if schema changed
- [ ] Check for deprecated Playwright APIs
- [ ] Review and remove flaky tests

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Generator](https://playwright.dev/docs/codegen) - `npx playwright codegen http://localhost:3000`
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)

## Getting Help

1. **Check test output** - Error messages are usually clear
2. **Use `--debug` mode** - Step through test execution
3. **Use UI mode** - Visual debugging interface
4. **Check Playwright docs** - Comprehensive examples
5. **Review existing tests** - Learn from working examples

---

Happy Testing! 🎭
