// e2e/helpers/test-helpers.ts
import { Page, expect, BrowserContext } from '@playwright/test';

export class ReviewTestHelper {
    private reviewStorage = new Map<string, any>();

    constructor(
        private page: Page,
        private context: BrowserContext
    ) {}

    /**
     * Sets up API mocking for the review flow
     */
    async setupAPIMocks() {
        // Mock the Shopify webhook endpoint
        await this.context.route('**/api/v1/shopify-webhook', async (route, request) => {
            const body = request.postDataJSON();
            const reviewId = `mock-review-${Date.now()}`;

            // Store the review data for later retrieval
            this.reviewStorage.set(reviewId, {
                id: reviewId,
                orderId: body.id,
                customer: body.customer,
                items: body.line_items,
                status: 'pending',
                createdAt: new Date().toISOString()
            });

            // Return the expected response
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    version: '1.0.0',
                    message: `New review processed successfully with id ${reviewId}`
                })
            });
        });

        // Mock the get review endpoint
        await this.context.route('**/api/v1/reviews/*', async (route, request) => {
            if (request.method() === 'GET') {
                const urlParts = request.url().split('/');
                const reviewId = urlParts[urlParts.length - 1];
                const review = this.reviewStorage.get(reviewId);

                if (review) {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify(review)
                    });
                } else {
                    await route.fulfill({
                        status: 404,
                        contentType: 'application/json',
                        body: JSON.stringify({ error: 'Review not found' })
                    });
                }
            } else {
                await route.continue();
            }
        });

        // Mock the review submission endpoint
        await this.context.route('**/api/v1/reviews/*/submit', async (route, request) => {
            if (request.method() === 'POST') {
                const urlParts = request.url().split('/');
                const reviewId = urlParts[urlParts.length - 2];
                const review = this.reviewStorage.get(reviewId);
                const body = request.postDataJSON();

                if (review) {
                    // Update review with submission data
                    review.status = 'completed';
                    review.rating = body.rating;
                    review.comment = body.comment;
                    review.media = body.media || [];
                    review.completedAt = new Date().toISOString();

                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            success: true,
                            review
                        })
                    });
                } else {
                    await route.fulfill({
                        status: 404,
                        contentType: 'application/json',
                        body: JSON.stringify({ error: 'Review not found' })
                    });
                }
            }
        });
    }

    /**
     * Creates a review via mocked webhook and returns the review ID
     * Use this when you want to test with mocked API
     */
    async createMockedReview(orderData: any): Promise<string> {
        // Trigger the webhook
        const response = await this.page.request.post('http://localhost:50001/api/v1/shopify-webhook', {
            data: orderData,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        expect(response.ok()).toBeTruthy();
        const responseData = await response.json();

        // Extract review ID from response message
        const reviewId = responseData.message.match(/id (\w+)/)?.[1] || '';
        expect(reviewId).toBeTruthy();

        return reviewId;
    }

    /**
     * Navigates to review page
     */
    async navigateToReview(reviewId: string, queryParams?: string) {
        const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
        const url = queryParams
            ? `${baseUrl}/review/${reviewId}?${queryParams}`
            : `${baseUrl}/review/${reviewId}`;

        await this.page.goto(url);
        await this.page.waitForSelector('[data-testid="review-page"]', {
            timeout: 10000
        });
    }

    /**
     * Rates a product with given stars
     */
    async rateProduct(productIndex: number, stars: number) {
        const widget = this.page.getByTestId(`rating-widget-${productIndex}`);
        await widget.locator(`[data-testid="star-${stars}"]`).click();

        // Verify rating was applied
        await expect(
            widget.locator(`[data-testid="star-filled-${stars}"]`)
        ).toBeVisible();
    }

    /**
     * Completes the review form
     */
    async completeReview(comment: string) {
        // Navigate to comment section
        const commentSlider = this.page.getByTestId('slider-dot-2');
        if (await commentSlider.isVisible()) {
            await commentSlider.click();
        }

        // Fill comment
        const textarea = this.page.getByTestId('comment-textarea');
        await textarea.fill(comment);

        // Submit
        const submitButton = this.page.getByTestId('submit-button');
        await expect(submitButton).not.toBeDisabled();
        await submitButton.click();

        // Wait for success
        await expect(
            this.page.getByTestId('thank-you-component')
        ).toBeVisible({ timeout: 10000 });
    }

    /**
     * Intercepts and monitors API calls
     */
    async monitorAPICalls() {
        const apiCalls: { url: string; method: string; data?: any }[] = [];

        this.page.on('request', request => {
            if (request.url().includes('/api/')) {
                apiCalls.push({
                    url: request.url(),
                    method: request.method(),
                    data: request.postDataJSON()
                });
            }
        });

        return apiCalls;
    }

    /**
     * Waits for a specific API call
     */
    async waitForAPICall(urlPattern: string | RegExp) {
        return this.page.waitForRequest(request => {
            if (typeof urlPattern === 'string') {
                return request.url().includes(urlPattern);
            }
            return urlPattern.test(request.url());
        });
    }

    /**
     * Intercepts and modifies API responses for error testing
     */
    async mockAPIError(endpoint: string, errorCode: number = 500) {
        await this.context.route(`**/${endpoint}`, route => {
            route.fulfill({
                status: errorCode,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: 'Mocked error for testing',
                    code: errorCode
                })
            });
        });
    }
}

// e2e/helpers/mock-data.ts
export const mockOrderData = {
    single: (orderId: string = 'test-order-123') => ({
        id: orderId,
        email: 'test@example.com',
        contact_email: 'test@example.com',
        currency: 'EUR',
        total_price: '29.99',
        financial_status: 'paid',
        order_number: 1001,
        created_at: new Date().toISOString(),
        customer: {
            id: 12345,
            email: 'test@example.com',
            first_name: 'John',
            last_name: 'Doe',
            verified_email: true
        },
        line_items: [
            {
                id: 'item-1',
                name: 'Test Product',
                price: '29.99',
                product_id: 1001,
                quantity: 1,
                title: 'Test Product',
                vendor: 'Test Vendor'
            }
        ],
        billing_address: {
            first_name: 'John',
            last_name: 'Doe',
            address1: '123 Test St',
            city: 'Helsinki',
            zip: '00100',
            country: 'Finland'
        }
    }),

    multiple: (orderId: string = 'test-order-multi') => ({
        id: orderId,
        email: 'test@example.com',
        contact_email: 'test@example.com',
        currency: 'EUR',
        total_price: '89.97',
        financial_status: 'paid',
        order_number: 1002,
        created_at: new Date().toISOString(),
        customer: {
            id: 12345,
            email: 'test@example.com',
            first_name: 'Jane',
            last_name: 'Smith',
            verified_email: true
        },
        line_items: [
            {
                id: 'item-1',
                name: 'Product A',
                price: '29.99',
                product_id: 2001,
                quantity: 1,
                title: 'Product A'
            },
            {
                id: 'item-2',
                name: 'Product B',
                price: '39.99',
                product_id: 2002,
                quantity: 1,
                title: 'Product B'
            },
            {
                id: 'item-3',
                name: 'Product C',
                price: '19.99',
                product_id: 2003,
                quantity: 1,
                title: 'Product C'
            }
        ],
        billing_address: {
            first_name: 'Jane',
            last_name: 'Smith',
            address1: '456 Test Ave',
            city: 'Espoo',
            zip: '02100',
            country: 'Finland'
        }
    }),

    // Generate random order for unique testing
    random: () => {
        const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const products = [
            { name: 'Widget A', price: '19.99' },
            { name: 'Gadget B', price: '29.99' },
            { name: 'Tool C', price: '39.99' },
            { name: 'Device D', price: '49.99' }
        ];

        const selectedProduct = products[Math.floor(Math.random() * products.length)];

        return {
            id: orderId,
            email: `test-${Date.now()}@example.com`,
            contact_email: `test-${Date.now()}@example.com`,
            currency: 'EUR',
            total_price: selectedProduct.price,
            financial_status: 'paid',
            order_number: Math.floor(Math.random() * 10000),
            created_at: new Date().toISOString(),
            customer: {
                id: Math.floor(Math.random() * 1000000),
                email: `test-${Date.now()}@example.com`,
                first_name: 'Test',
                last_name: `User-${Date.now()}`,
                verified_email: true
            },
            line_items: [
                {
                    id: `item-${Date.now()}`,
                    name: selectedProduct.name,
                    price: selectedProduct.price,
                    product_id: Math.floor(Math.random() * 10000),
                    quantity: 1,
                    title: selectedProduct.name,
                    vendor: 'Test Vendor'
                }
            ],
            billing_address: {
                first_name: 'Test',
                last_name: 'User',
                address1: '123 Test St',
                city: 'Helsinki',
                zip: '00100',
                country: 'Finland'
            }
        };
    }
};

// e2e/helpers/test-config.ts
export const testConfig = {
    urls: {
        base: process.env.BASE_URL || 'http://localhost:5173',
        api: process.env.API_URL || 'http://localhost:50001'
    },
    timeouts: {
        navigation: 10000,
        element: 5000,
        api: 30000
    },
    retries: {
        flaky: 2,
        api: 3
    }
};