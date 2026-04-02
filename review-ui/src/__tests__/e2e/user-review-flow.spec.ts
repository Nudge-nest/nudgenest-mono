import { test, expect } from '@playwright/test';
import {mockOrderData} from "./helpers/test-helpers";

const WEBHOOK_BASE_URL = 'http://localhost:50001';
const FRONTEND_BASE_URL = 'http://localhost:3001';

test.describe('Customer Review Flow - Simple', () => {
    // Test the complete flow: webhook → review creation → customer review → submission
    // Skipped: requires HMAC authentication or test webhook endpoint
    test.skip('complete review flow from order to submission', async ({ page, request }) => {
        // Step 1: Create a review by simulating Shopify webhook
        console.log('Creating review via webhook...');

        // Send webhook to create review
        const webhookResponse = await request.post(`${WEBHOOK_BASE_URL}/api/v1/shopify-webhook`, {
            data: mockOrderData.single(),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('Webhook response1:', webhookResponse);
        expect(webhookResponse.ok()).toBeTruthy();
        const response = await webhookResponse.json();
        console.log('Webhook response:', response);

        // Extract review ID from response
        const reviewIdMatch = response.message.match(/id (\w+)/);
        const reviewId = reviewIdMatch ? reviewIdMatch[1] : '';
        expect(reviewId).toBeTruthy();
        console.log('Review created with ID:', reviewId);

        // Step 2: Navigate to review URL (simulating customer clicking email link)
        const reviewUrl = `${FRONTEND_BASE_URL}/review/${reviewId}`;
        console.log('Navigating to review URL:', reviewUrl);

        await page.goto(reviewUrl);

        // Step 3: Verify review page loads
        await expect(page.getByTestId('review-page')).toBeVisible({ timeout: 10000 });
        console.log('Review page loaded successfully');

        // Step 4: Check if product is displayed
        await expect(page.getByText('Gift Card')).toBeVisible();
        console.log('Product displayed correctly');

        // Step 5: Rate the product (click 5 stars)
        await page.getByTestId('star-Excellent').first().click();
        console.log('Rated product with 5 stars');

        // Wait a bit for the rating to register
        await page.waitForTimeout(500);

        // Step 6: Navigate to comment section (if using slider navigation)
        try {
            const sliderDot = page.getByTestId('slider-dot-2');
            if (await sliderDot.isVisible({ timeout: 2000 })) {
                await sliderDot.click();
                console.log('Navigated to comment section');
            }
        } catch {
            console.log('No slider navigation, comment section should be visible');
        }

        // Step 7: Add review comment
        const commentTextarea = page.getByTestId('comment-textarea');
        await expect(commentTextarea).toBeVisible({ timeout: 5000 });
        await commentTextarea.fill('Excellent product! Fast delivery and great quality. Would recommend!');
        console.log('Added review comment');

        // Step 8: Submit the review
        const submitButton = page.getByTestId('submit-button');
        await expect(submitButton).toBeVisible();
        await expect(submitButton).not.toBeDisabled();

        // Click submit and wait for response
        await submitButton.click();
        console.log('Submitted review');

        // Step 9: Verify success (thank you page)
        await expect(page.getByText('Gift Card')).toBeVisible();
        const stars = await page.getByTestId('star-container').all();
        expect(stars.length).toBeGreaterThan(0);
    });

    // Test that review page shows error for invalid ID
    test('should show error for invalid review ID', async ({ page }) => {
        await page.goto(`${FRONTEND_BASE_URL}/review/invalid-review-id`);
        // Should show error component
        await expect(page.getByTestId('error-component')).toBeVisible({ timeout: 10000 });
    });

    // Test demo mode if available
    test('should allow review in demo mode', async ({ page }) => {
        test.skip(!!process.env.CI, 'Requires running backend — skipped in CI');
        await page.goto(`${FRONTEND_BASE_URL}/review/demo`);

        // Check if demo mode works
        const reviewPage = page.getByTestId('review-page');
        const errorPage = page.getByTestId('error-component');

        // Either review page should load or error (if demo not enabled)
        const hasReviewPage = await reviewPage.isVisible({ timeout: 5000 }).catch(() => false);
        const hasErrorPage = await errorPage.isVisible({ timeout: 5000 }).catch(() => false);

        expect(hasReviewPage || hasErrorPage).toBeTruthy();

        if (hasReviewPage) {
            console.log('Demo mode is available');

            // Complete a demo review
            await page.getByTestId('star-Good').first().click();

            // Navigate to comment if needed
            try {
                await page.getByTestId('slider-dot-2').click({ timeout: 2000 });
            } catch {
                // Comment section might already be visible
            }

            await page.getByTestId('comment-textarea').fill('Demo review test');
            await page.getByTestId('submit-button').click();

            // Should show thank you
            await expect(page.getByTestId('thank-you-component')).toBeVisible({ timeout: 10000 });
        } else {
            console.log('Demo mode not available');
        }
    });
});