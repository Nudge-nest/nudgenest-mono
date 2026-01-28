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
        "id": orderId,
        "admin_graphql_api_id": "gid://shopify/Order/5866663018634",
        "app_id": 1354745,
        "browser_ip": "87.92.3.180",
        "buyer_accepts_marketing": false,
        "cancel_reason": null,
        "cancelled_at": null,
        "cart_token": null,
        "checkout_id": 36658923929738,
        "checkout_token": "517499a2321e4dad24391aedddc2b81e",
        "client_details": {
            "accept_language": null,
            "browser_height": null,
            "browser_ip": "87.92.3.180",
            "browser_width": null,
            "session_hash": null,
            "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
        },
        "closed_at": null,
        "company": null,
        "confirmation_number": "RXYEIQN0Q",
        "confirmed": true,
        "contact_email": "vapafot242@badfist.com",
        "created_at": "2025-02-05T11:10:14-05:00",
        "currency": "EUR",
        "current_shipping_price_set": {
            "shop_money": {
                "amount": "0.00",
                "currency_code": "EUR"
            },
            "presentment_money": {
                "amount": "0.00",
                "currency_code": "EUR"
            }
        },
        "current_subtotal_price": "10.00",
        "current_subtotal_price_set": {
            "shop_money": {
                "amount": "10.00",
                "currency_code": "EUR"
            },
            "presentment_money": {
                "amount": "10.00",
                "currency_code": "EUR"
            }
        },
        "current_total_additional_fees_set": null,
        "current_total_discounts": "0.00",
        "current_total_discounts_set": {
            "shop_money": {
                "amount": "0.00",
                "currency_code": "EUR"
            },
            "presentment_money": {
                "amount": "0.00",
                "currency_code": "EUR"
            }
        },
        "current_total_duties_set": null,
        "current_total_price": "10.00",
        "current_total_price_set": {
            "shop_money": {
                "amount": "10.00",
                "currency_code": "EUR"
            },
            "presentment_money": {
                "amount": "10.00",
                "currency_code": "EUR"
            }
        },
        "current_total_tax": "0.00",
        "current_total_tax_set": {
            "shop_money": {
                "amount": "0.00",
                "currency_code": "EUR"
            },
            "presentment_money": {
                "amount": "0.00",
                "currency_code": "EUR"
            }
        },
        "customer_locale": "en-FI",
        "device_id": null,
        "discount_codes": [],
        "duties_included": false,
        "email": "vapafot242@badfist.com",
        "estimated_taxes": false,
        "financial_status": "paid",
        "fulfillment_status": null,
        "landing_site": null,
        "landing_site_ref": null,
        "location_id": null,
        "merchant_business_entity_id": "MTY3NTgwMjk3MzU0",
        "merchant_of_record_app_id": null,
        "name": "#1007",
        "note": null,
        "note_attributes": [],
        "number": 7,
        "order_number": 1007,
        "order_status_url": "https://nudgenest.myshopify.com/67580297354/orders/3e2d4fbb7be5d4084e4c85213292a975/authenticate?key=10130d6a66ecb9bddec0e8dad429426e",
        "original_total_additional_fees_set": null,
        "original_total_duties_set": null,
        "payment_gateway_names": [
            "manual"
        ],
        "phone": null,
        "po_number": null,
        "presentment_currency": "EUR",
        "processed_at": "2025-02-05T11:10:14-05:00",
        "reference": null,
        "referring_site": null,
        "source_identifier": null,
        "source_name": "shopify_draft_order",
        "source_url": null,
        "subtotal_price": "10.00",
        "subtotal_price_set": {
            "shop_money": {
                "amount": "10.00",
                "currency_code": "EUR"
            },
            "presentment_money": {
                "amount": "10.00",
                "currency_code": "EUR"
            }
        },
        "tags": "nudgenest, testing orders",
        "tax_exempt": false,
        "tax_lines": [],
        "taxes_included": true,
        "test": false,
        "token": "3e2d4fbb7be5d4084e4c85213292a975",
        "total_cash_rounding_payment_adjustment_set": {
            "shop_money": {
                "amount": "0.00",
                "currency_code": "EUR"
            },
            "presentment_money": {
                "amount": "0.00",
                "currency_code": "EUR"
            }
        },
        "total_cash_rounding_refund_adjustment_set": {
            "shop_money": {
                "amount": "0.00",
                "currency_code": "EUR"
            },
            "presentment_money": {
                "amount": "0.00",
                "currency_code": "EUR"
            }
        },
        "total_discounts": "0.00",
        "total_discounts_set": {
            "shop_money": {
                "amount": "0.00",
                "currency_code": "EUR"
            },
            "presentment_money": {
                "amount": "0.00",
                "currency_code": "EUR"
            }
        },
        "total_line_items_price": "10.00",
        "total_line_items_price_set": {
            "shop_money": {
                "amount": "10.00",
                "currency_code": "EUR"
            },
            "presentment_money": {
                "amount": "10.00",
                "currency_code": "EUR"
            }
        },
        "total_outstanding": "0.00",
        "total_price": "10.00",
        "total_price_set": {
            "shop_money": {
                "amount": "10.00",
                "currency_code": "EUR"
            },
            "presentment_money": {
                "amount": "10.00",
                "currency_code": "EUR"
            }
        },
        "total_shipping_price_set": {
            "shop_money": {
                "amount": "0.00",
                "currency_code": "EUR"
            },
            "presentment_money": {
                "amount": "0.00",
                "currency_code": "EUR"
            }
        },
        "total_tax": "0.00",
        "total_tax_set": {
            "shop_money": {
                "amount": "0.00",
                "currency_code": "EUR"
            },
            "presentment_money": {
                "amount": "0.00",
                "currency_code": "EUR"
            }
        },
        "total_tip_received": "0.00",
        "total_weight": 0,
        "updated_at": "2025-02-05T11:10:15-05:00",
        "user_id": 90573439114,
        "billing_address": {
            "first_name": "Olujuwon",
            "address1": "Otonkuja 4D 91",
            "phone": null,
            "city": "Helsinki",
            "zip": "00870",
            "province": null,
            "country": "Finland",
            "last_name": "Alabi",
            "address2": null,
            "company": null,
            "latitude": null,
            "longitude": null,
            "name": "Olujuwon Alabi",
            "country_code": "FI",
            "province_code": null
        },
        "customer": {
            "id": 7938732589194,
            "email": "vapafot242@badfist.com",
            "created_at": "2025-02-02T08:01:05-05:00",
            "updated_at": "2025-02-05T11:10:15-05:00",
            "first_name": "Olujuwon",
            "last_name": "Alabi",
            "state": "disabled",
            "note": null,
            "verified_email": true,
            "multipass_identifier": null,
            "tax_exempt": false,
            "phone": null,
            "email_marketing_consent": {
                "state": "not_subscribed",
                "opt_in_level": "single_opt_in",
                "consent_updated_at": null
            },
            "sms_marketing_consent": null,
            "tags": "",
            "currency": "EUR",
            "tax_exemptions": [],
            "admin_graphql_api_id": "gid://shopify/Customer/7938732589194",
            "default_address": {
                "id": 9078882631818,
                "customer_id": 7938732589194,
                "first_name": "Olujuwon",
                "last_name": "Alabi",
                "company": null,
                "address1": "Otonkuja 4D 91",
                "address2": null,
                "city": "Helsinki",
                "province": null,
                "country": "Finland",
                "zip": "00870",
                "phone": null,
                "name": "Olujuwon Alabi",
                "province_code": null,
                "country_code": "FI",
                "country_name": "Finland",
                "default": true
            }
        },
        "discount_applications": [],
        "fulfillments": [],
        "line_items": [
            {
                "id": 14572083282058,
                "admin_graphql_api_id": "gid://shopify/LineItem/14572083282058",
                "attributed_staffs": [],
                "current_quantity": 1,
                "fulfillable_quantity": 1,
                "fulfillment_service": "gift_card",
                "fulfillment_status": null,
                "gift_card": true,
                "grams": 0,
                "name": "Gift Card - $10",
                "price": "10.00",
                "price_set": [
                    "Object"
                ],
                "product_exists": true,
                "product_id": 8365100138634,
                "properties": [],
                "quantity": 1,
                "requires_shipping": false,
                "sku": null,
                "taxable": false,
                "title": "Gift Card",
                "total_discount": "0.00",
                "total_discount_set": [
                    "Object"
                ],
                "variant_id": 45728675168394,
                "variant_inventory_management": null,
                "variant_title": "$10",
                "vendor": "Snowboard Vendor",
                "tax_lines": [],
                "duties": [],
                "discount_allocations": []
            }
        ],
        "payment_terms": null,
        "refunds": [],
        "shipping_address": {
            "first_name": "Olujuwon",
            "address1": "Otonkuja 4D 91",
            "phone": null,
            "city": "Helsinki",
            "zip": "00870",
            "province": null,
            "country": "Finland",
            "last_name": "Alabi",
            "address2": null,
            "company": null,
            "latitude": 60.1700549,
            "longitude": 25.0350375,
            "name": "Olujuwon Alabi",
            "country_code": "FI",
            "province_code": null
        },
        "shipping_lines": [],
        "returns": []
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