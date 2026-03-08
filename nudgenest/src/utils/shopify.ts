/**
 * Shopify API utilities for fetching product data
 */

/**
 * Get Shopify Admin API access token
 *
 * Uses a Custom App Admin API access token from environment variables.
 * This token is permanent and generated from Shopify Admin:
 * Settings → Apps → Develop apps → Create app → Configure scopes → Install app → Reveal token
 *
 * The token format is: shpat_xxxxxxxxxxxxxxxxxxxxx
 *
 * @returns Access token from environment variable or null if not set
 */
export function getShopifyAccessToken(): string | null {
    const token = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

    if (!token) {
        console.error('❌ SHOPIFY_ADMIN_API_ACCESS_TOKEN not set in environment variables');
        console.error('   To fix this:');
        console.error('   1. Go to Shopify Admin → Settings → Apps → Develop apps');
        console.error('   2. Create a custom app with read_products scope');
        console.error('   3. Install the app and reveal the Admin API access token');
        console.error('   4. Add SHOPIFY_ADMIN_API_ACCESS_TOKEN=shpat_xxx to your .env file');
        return null;
    }

    if (!token.startsWith('shpat_')) {
        console.warn('⚠️  SHOPIFY_ADMIN_API_ACCESS_TOKEN should start with "shpat_"');
    }

    return token;
}

interface ShopifyProductImage {
    id: number;
    product_id: number;
    position: number;
    src: string;
    width: number;
    height: number;
}

interface ShopifyProduct {
    id: number;
    title: string;
    image?: ShopifyProductImage;
    images?: ShopifyProductImage[];
}

interface ShopifyProductResponse {
    product: ShopifyProduct;
}

/**
 * Fetch product image from Shopify Admin API
 * @param shopDomain - The shop domain (e.g., "nudgenest.myshopify.com")
 * @param productId - The product ID
 * @param accessToken - The Shopify Admin API access token
 * @returns Product image URL or null if not found
 */
export async function fetchProductImage(
    shopDomain: string,
    productId: number,
    accessToken: string
): Promise<string | null> {
    try {
        // Shopify REST Admin API endpoint
        const apiVersion = '2024-01';
        const url = `https://${shopDomain}/admin/api/${apiVersion}/products/${productId}.json`;

        console.log(`🔍 Fetching product image from Shopify: product_id=${productId}`);
        console.log(`   Shop: ${shopDomain}`);
        console.log(`   Token present: ${!!accessToken}, length: ${accessToken?.length || 0}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Shopify API error: ${response.status} ${response.statusText}`);
            console.error(`   Response body:`, errorText);
            console.error(`   This usually means the access token is invalid or missing 'read_products' scope`);
            return null;
        }

        const data: ShopifyProductResponse = await response.json();

        // Return the first image src if available
        if (data.product.image?.src) {
            console.log(`✅ Found product image: ${data.product.image.src}`);
            return data.product.image.src;
        }

        if (data.product.images && data.product.images.length > 0) {
            console.log(`✅ Found product image: ${data.product.images[0].src}`);
            return data.product.images[0].src;
        }

        console.log(`⚠️ No image found for product ${productId}`);
        return null;
    } catch (error: any) {
        console.error(`❌ Error fetching product image:`, error.message);
        return null;
    }
}

/**
 * Enrich line items with product images from Shopify
 * @param lineItems - Array of line items from Shopify webhook
 * @param shopDomain - The shop domain
 * @param accessToken - The Shopify Admin API access token
 * @returns Line items with image URLs populated
 */
export async function enrichLineItemsWithImages(
    lineItems: any[],
    shopDomain: string
): Promise<any[]> {
    if (!lineItems || lineItems.length === 0) {
        return lineItems;
    }

    // Get access token from environment
    const accessToken = getShopifyAccessToken();
    if (!accessToken) {
        console.error('⚠️ Skipping image enrichment: no access token available');
        return lineItems;
    }

    console.log(`🖼️ Enriching ${lineItems.length} line items with images...`);

    // Fetch images for all products in parallel
    const enrichedItems = await Promise.all(
        lineItems.map(async (item) => {
            // If item already has an image, use it
            if (item.image) {
                return item;
            }

            // If no product_id, skip
            if (!item.product_id) {
                console.log(`⚠️ Line item "${item.name}" has no product_id, skipping image fetch`);
                return item;
            }

            // Fetch image from Shopify
            const imageSrc = await fetchProductImage(shopDomain, item.product_id, accessToken);

            // Return item with image
            return {
                ...item,
                image: imageSrc ? { src: imageSrc } : null,
            };
        })
    );

    console.log(`✅ Enriched ${enrichedItems.filter(i => i.image).length}/${lineItems.length} items with images`);

    return enrichedItems;
}
