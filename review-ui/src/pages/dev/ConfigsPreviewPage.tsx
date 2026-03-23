/**
 * DEV-ONLY: Configs Preview Page
 *
 * Mirrors the exact overlay/iframe configuration used in the Shopify merchant
 * dashboard (nudgenest-shpfy-app/app/routes/app.dashboard.tsx → openConfigModal)
 * so you can preview and test the configs widget locally without needing the
 * Shopify app running.
 *
 * Shows the config iframe inside the Shopify modal chrome at three viewport
 * widths (mobile 375px, tablet 768px, desktop full-width) so responsive
 * behaviour is immediately visible.
 *
 * Only accessible in development (import.meta.env.DEV).
 * Route: /dev/configs-preview
 */
import { useState } from 'react';

interface ConfigFrameProps {
    configUrl: string;
    label: string;
    containerWidth: number | '100%';
    /** Approximate 95 vh at this viewport width's typical screen height */
    iframeHeight: number;
}

/** Shopify modal chrome + iframe at a constrained width */
const ConfigFrame = ({ configUrl, label, containerWidth, iframeHeight }: ConfigFrameProps) => (
    <div style={{ marginBottom: '48px' }}>
        {/* Viewport label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text)' }}>
                {label}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-gray)', fontFamily: 'monospace' }}>
                {typeof containerWidth === 'number' ? `${containerWidth}px` : 'full width'}
            </span>
        </div>

        {/* Outer dashed viewport container */}
        <div style={{
            width: containerWidth,
            border: '2px dashed var(--color-border)',
            borderRadius: '10px',
            overflow: 'hidden',
            background: 'var(--color-lighter)',
            boxSizing: 'border-box',
        }}>
            {/* Shopify modal chrome — mirrors openConfigModal overlayHTML exactly */}
            <div style={{
                background: '#f6f6f7',
                padding: '12px 16px',
                borderBottom: '1px solid #e1e3e5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
            }}>
                <span style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#202223',
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                }}>
                    Review Configuration
                </span>
                <span style={{
                    background: '#008060',
                    color: 'white',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 500,
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                }}>
                    Close
                </span>
            </div>

            {/* iframe — mirrors Shopify overlay iframe style exactly */}
            <iframe
                src={configUrl}
                style={{
                    width: '100%',
                    height: `${iframeHeight}px`,
                    border: 'none',
                    display: 'block',
                    background: 'white',
                }}
                title={`Config Preview — ${label}`}
            />
        </div>
    </div>
);

const ConfigsPreviewPage = () => {
    // Hooks must be called unconditionally — guard comes after
    const DEFAULT_MERCHANT_ID = '69b199115122b90be8b33f07';
    const DEFAULT_API_KEY = '6c5763312fe0f4a90daf3744c74edeac430aa7b8fb9280362f8775ad07a380fe';

    const [merchantIdInput, setMerchantIdInput] = useState(DEFAULT_MERCHANT_ID);
    const [apiKeyInput, setApiKeyInput] = useState(DEFAULT_API_KEY);
    const [merchantId, setMerchantId] = useState(DEFAULT_MERCHANT_ID);
    const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
    const [overlayOpen, setOverlayOpen] = useState(false);

    if (!import.meta.env.DEV) return null;

    const configUrl = merchantId
        ? `/configs/${merchantId}${apiKey ? `?apiKey=${apiKey}` : ''}`
        : '';

    const load = () => {
        const trimmed = merchantIdInput.trim();
        if (!trimmed) return;
        setMerchantId(trimmed);
        setApiKey(apiKeyInput.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') load();
    };

    const inputStyle: React.CSSProperties = {
        padding: '8px 12px',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        fontSize: '13px',
        fontFamily: 'monospace',
        background: 'var(--color-lighter)',
        color: 'var(--color-text)',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
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
                    🛠️ Dev Preview — Merchant Config Modal
                </h1>
                <p style={{ margin: '0 0 16px', color: 'var(--color-gray)', fontSize: '13px' }}>
                    Mirrors the{' '}
                    <code style={{ background: 'var(--color-lighter)', color: 'var(--color-text)', padding: '1px 5px', borderRadius: '3px' }}>
                        openConfigModal
                    </code>{' '}
                    overlay from{' '}
                    <code style={{ background: 'var(--color-lighter)', color: 'var(--color-text)', padding: '1px 5px', borderRadius: '3px' }}>
                        app.dashboard.tsx
                    </code>{' '}
                    at mobile, tablet, and desktop widths. DEV only.
                </p>

                {/* Inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '480px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-gray)' }}>
                            MERCHANT ID <span style={{ color: 'var(--color-error)' }}>*</span>
                        </label>
                        <input
                            value={merchantIdInput}
                            onChange={(e) => setMerchantIdInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g. 68414ac959456a2575dd1aae"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-gray)' }}>
                            API KEY{' '}
                            <span style={{ color: 'var(--color-disabled)', fontWeight: 400 }}>(optional)</span>
                        </label>
                        <input
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="leave blank if not required locally"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={load}
                            disabled={!merchantIdInput.trim()}
                            style={{
                                padding: '8px 20px',
                                background: merchantIdInput.trim() ? 'var(--color-main)' : 'var(--color-disabled)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: merchantIdInput.trim() ? 'pointer' : 'not-allowed',
                                fontSize: '13px',
                                fontWeight: 600,
                            }}
                        >
                            Load
                        </button>

                        {merchantId && (
                            <>
                                <button
                                    onClick={() => setOverlayOpen(true)}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'transparent',
                                        color: 'var(--color-main)',
                                        border: '1px solid var(--color-main)',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                    }}
                                >
                                    Open full overlay
                                </button>
                                <a
                                    href={configUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ fontSize: '12px', color: 'var(--color-main)', textDecoration: 'underline' }}
                                >
                                    Open direct ↗
                                </a>
                            </>
                        )}
                    </div>

                    {merchantId && (
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-gray)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                            {window.location.origin}{configUrl}
                        </p>
                    )}
                </div>
            </div>

            {/* Preview frames */}
            {merchantId ? (
                <>
                    {/* Mobile — 375px wide, ~95vh of 667px (iPhone SE) */}
                    <ConfigFrame
                        configUrl={configUrl}
                        label="Mobile"
                        containerWidth={375}
                        iframeHeight={580}
                    />

                    {/* Tablet — 768px wide, ~95vh of 1024px (iPad) */}
                    <ConfigFrame
                        configUrl={configUrl}
                        label="Tablet"
                        containerWidth={768}
                        iframeHeight={900}
                    />

                    {/* Desktop — full width, ~95vh of 900px laptop */}
                    <ConfigFrame
                        configUrl={configUrl}
                        label="Desktop"
                        containerWidth="100%"
                        iframeHeight={820}
                    />
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
                    Enter a <strong>merchantId</strong> above and press <strong>Load</strong> to preview
                    the config panel at mobile, tablet, and desktop widths.
                </div>
            )}

            {/* Full-screen Shopify-style overlay */}
            {overlayOpen && merchantId && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0, 0, 0, 0.8)',
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) setOverlayOpen(false); }}
                >
                    <div style={{
                        background: 'white',
                        width: '95vw',
                        height: '95vh',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                    }}>
                        <div style={{
                            background: '#f6f6f7',
                            padding: '16px 20px',
                            borderBottom: '1px solid #e1e3e5',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexShrink: 0,
                        }}>
                            <h2 style={{
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: 600,
                                color: '#202223',
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                            }}>
                                Review Configuration
                            </h2>
                            <button
                                onClick={() => setOverlayOpen(false)}
                                style={{
                                    background: '#008060',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                }}
                            >
                                Close
                            </button>
                        </div>
                        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                            <iframe
                                src={configUrl}
                                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                                title="Nudge-nest Configuration"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConfigsPreviewPage;
