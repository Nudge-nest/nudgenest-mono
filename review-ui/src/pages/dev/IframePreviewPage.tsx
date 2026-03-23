/**
 * DEV-ONLY: Iframe Preview Page
 *
 * Mirrors the exact iframe configuration used in the Shopify liquid extension
 * (nudge-display/blocks/business_reviews.liquid) so you can preview and test
 * the embedded reviews widget locally without needing a Shopify storefront.
 *
 * Only accessible in development (import.meta.env.DEV).
 * Route: /dev/preview
 */
import { useEffect, useRef, useState } from 'react';

interface PreviewFrameProps {
    shopId: string;
    label: string;
    containerWidth: number | '100%';
}

const PreviewFrame = ({ shopId, label, containerWidth }: PreviewFrameProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        // Mirror the postMessage listener from business_reviews.liquid
        const handler = (e: MessageEvent) => {
            if (e.data?.type === 'nudgenest_resize' && iframeRef.current) {
                iframeRef.current.style.height = e.data.height + 'px';
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    return (
        <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text)' }}>
                    {label}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-gray)', fontFamily: 'monospace' }}>
                    {typeof containerWidth === 'number' ? `${containerWidth}px` : 'full width'}
                </span>
            </div>
            <div
                style={{
                    width: containerWidth,
                    border: '2px dashed var(--color-border)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: 'var(--color-lighter)',
                    boxSizing: 'border-box',
                }}
            >
                {/* Mirrors business_reviews.liquid iframe style exactly */}
                <iframe
                    ref={iframeRef}
                    src={`/reviews/${shopId}`}
                    style={{
                        display: 'block',
                        width: '100%',
                        height: '600px',
                        border: 'none',
                        borderRadius: '8px',
                        background: 'var(--color-bg)',
                    }}
                    title={`Reviews Preview — ${label}`}
                    allow="camera; microphone"
                />
            </div>
        </div>
    );
};

const DEFAULT_SHOP_ID = 'MTY3NTgwMjk3MzU0';

const IframePreviewPage = () => {
    // Hooks must be called unconditionally — guard comes after
    const [inputValue, setInputValue] = useState(DEFAULT_SHOP_ID);
    const [shopId, setShopId] = useState(DEFAULT_SHOP_ID); // auto-load default on mount

    if (!import.meta.env.DEV) return null;

    const load = () => {
        if (inputValue.trim()) setShopId(inputValue.trim());
    };

    return (
        <div style={{
            padding: '24px',
            fontFamily: 'system-ui, sans-serif',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            minHeight: '100vh',
        }}>
            {/* Header */}
            <div style={{
                marginBottom: '28px',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '20px',
            }}>
                <h1 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
                    🔧 Dev Preview — Shopify iframe embed
                </h1>
                <p style={{ margin: '0 0 16px', color: 'var(--color-gray)', fontSize: '13px' }}>
                    Mirrors{' '}
                    <code style={{
                        background: 'var(--color-lighter)',
                        color: 'var(--color-text)',
                        padding: '1px 5px',
                        borderRadius: '3px',
                    }}>
                        business_reviews.liquid
                    </code>{' '}
                    iframe config exactly. DEV only — not included in production build.
                </p>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && load()}
                        placeholder="shopId (e.g. MTY3NTgwMjk3MzU0)"
                        style={{
                            padding: '8px 12px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            fontSize: '13px',
                            width: '320px',
                            fontFamily: 'monospace',
                            background: 'var(--color-lighter)',
                            color: 'var(--color-text)',
                            outline: 'none',
                        }}
                    />
                    <button
                        onClick={load}
                        style={{
                            padding: '8px 20px',
                            background: 'var(--color-main)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 600,
                        }}
                    >
                        Load
                    </button>
                    {shopId && (
                        <span style={{ fontSize: '12px', color: 'var(--color-gray)' }}>
                            Loaded:{' '}
                            <code style={{
                                background: 'var(--color-lighter)',
                                color: 'var(--color-text)',
                                padding: '1px 5px',
                                borderRadius: '3px',
                            }}>
                                {shopId}
                            </code>
                        </span>
                    )}
                </div>
            </div>

            {/* Preview frames */}
            {shopId ? (
                <>
                    <PreviewFrame shopId={shopId} label="Mobile" containerWidth={375} />
                    <PreviewFrame shopId={shopId} label="Tablet" containerWidth={768} />
                    <PreviewFrame shopId={shopId} label="Desktop" containerWidth="100%" />
                </>
            ) : (
                <div style={{
                    padding: '60px 32px',
                    textAlign: 'center',
                    color: 'var(--color-disabled)',
                    border: '2px dashed var(--color-border)',
                    borderRadius: '10px',
                    fontSize: '14px',
                }}>
                    Enter a <strong>shopId</strong> above and press <strong>Load</strong> to preview
                    the embedded widget at mobile, tablet, and desktop widths.
                </div>
            )}
        </div>
    );
};

export default IframePreviewPage;
