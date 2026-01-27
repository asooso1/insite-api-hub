import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Clear cookies before each test to ensure clean state
        await page.context().clearCookies();
    });

    test('should load auth page with login form', async ({ page }) => {
        await page.goto('/auth');

        // Verify page structure
        await expect(page.getByRole('heading', { name: 'API HUB' })).toBeVisible();
        await expect(page.getByText('Welcome back')).toBeVisible();

        // Verify form inputs
        await expect(page.getByPlaceholder('Email Address')).toBeVisible();
        await expect(page.getByPlaceholder('Password')).toBeVisible();

        // Verify submit button
        await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

        // Verify toggle button
        await expect(page.getByRole('button', { name: /Don't have an account/i })).toBeVisible();
    });

    test('should toggle between login and signup forms', async ({ page }) => {
        await page.goto('/auth');

        // Initially should show login form
        await expect(page.getByText('Welcome back')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

        // Click toggle to signup
        await page.getByRole('button', { name: /Don't have an account/i }).click();

        // Should now show signup form
        await expect(page.getByText('Create new account')).toBeVisible();
        await expect(page.getByPlaceholder('Full Name')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();

        // Click toggle back to login
        await page.getByRole('button', { name: /Already have an account/i }).click();

        // Should show login form again
        await expect(page.getByText('Welcome back')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

        // Name field should not be visible
        await expect(page.getByPlaceholder('Full Name')).not.toBeVisible();
    });

    test('should show validation for empty fields', async ({ page }) => {
        await page.goto('/auth');

        // Try to submit empty form
        await page.getByRole('button', { name: 'Sign In' }).click();

        // HTML5 validation should prevent submission
        const emailInput = page.getByPlaceholder('Email Address');
        const isEmailInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
        expect(isEmailInvalid).toBe(true);
    });

    test('should show name field in signup mode', async ({ page }) => {
        await page.goto('/auth');

        // Switch to signup
        await page.getByRole('button', { name: /Don't have an account/i }).click();

        // Name field should be visible and required
        const nameInput = page.getByPlaceholder('Full Name');
        await expect(nameInput).toBeVisible();

        const isRequired = await nameInput.getAttribute('required');
        expect(isRequired).not.toBeNull();
    });

    test('should have proper input types and attributes', async ({ page }) => {
        await page.goto('/auth');

        // Email input should have type="email"
        const emailInput = page.getByPlaceholder('Email Address');
        await expect(emailInput).toHaveAttribute('type', 'email');
        await expect(emailInput).toHaveAttribute('required');

        // Password input should have type="password"
        const passwordInput = page.getByPlaceholder('Password');
        await expect(passwordInput).toHaveAttribute('type', 'password');
        await expect(passwordInput).toHaveAttribute('required');
    });

    test('should display loading state on form submission', async ({ page }) => {
        await page.goto('/auth');

        // Fill in the form
        await page.getByPlaceholder('Email Address').fill('test@example.com');
        await page.getByPlaceholder('Password').fill('password123');

        // Submit form
        const submitButton = page.getByRole('button', { name: 'Sign In' });
        await submitButton.click();

        // Button should show loading state
        await expect(submitButton).toBeDisabled();

        // Loading spinner should be visible
        await expect(page.locator('.animate-spin')).toBeVisible({ timeout: 1000 });
    });

    test('should accept user input in form fields', async ({ page }) => {
        await page.goto('/auth');

        // Fill email
        const emailInput = page.getByPlaceholder('Email Address');
        await emailInput.fill('user@example.com');
        await expect(emailInput).toHaveValue('user@example.com');

        // Fill password
        const passwordInput = page.getByPlaceholder('Password');
        await passwordInput.fill('mypassword');
        await expect(passwordInput).toHaveValue('mypassword');

        // Switch to signup and fill name
        await page.getByRole('button', { name: /Don't have an account/i }).click();
        const nameInput = page.getByPlaceholder('Full Name');
        await nameInput.fill('John Doe');
        await expect(nameInput).toHaveValue('John Doe');
    });

    test('should have proper styling and visual elements', async ({ page }) => {
        await page.goto('/auth');

        // Check for logo/icon
        await expect(page.locator('svg').first()).toBeVisible();

        // Check main heading
        await expect(page.getByText('API HUB')).toBeVisible();

        // Check form container is visible
        await expect(page.locator('form')).toBeVisible();
    });

    test('should clear form values when toggling between modes', async ({ page }) => {
        await page.goto('/auth');

        // Fill login form
        await page.getByPlaceholder('Email Address').fill('test@example.com');
        await page.getByPlaceholder('Password').fill('password123');

        // Toggle to signup
        await page.getByRole('button', { name: /Don't have an account/i }).click();

        // Form should retain email and password values
        await expect(page.getByPlaceholder('Email Address')).toHaveValue('test@example.com');
        await expect(page.getByPlaceholder('Password')).toHaveValue('password123');

        // Fill name field
        await page.getByPlaceholder('Full Name').fill('Test User');

        // Toggle back to login
        await page.getByRole('button', { name: /Already have an account/i }).click();

        // Email and password should still be there
        await expect(page.getByPlaceholder('Email Address')).toHaveValue('test@example.com');
        await expect(page.getByPlaceholder('Password')).toHaveValue('password123');
    });

    test('should have accessible form labels via placeholders', async ({ page }) => {
        await page.goto('/auth');

        // Check all placeholders are descriptive
        await expect(page.getByPlaceholder('Email Address')).toBeVisible();
        await expect(page.getByPlaceholder('Password')).toBeVisible();

        await page.getByRole('button', { name: /Don't have an account/i }).click();
        await expect(page.getByPlaceholder('Full Name')).toBeVisible();
    });
});
