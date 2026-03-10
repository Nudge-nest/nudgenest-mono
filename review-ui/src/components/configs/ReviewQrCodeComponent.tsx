import { useEffect, useState } from 'react';
import ConfigRowComponent from './ConfigRowComponent.tsx';
import Loading from '../Loading.tsx';
import { useReviewConfig } from '../../contexts/ReviewConfigContext.tsx';
import HeaderTextComponent from './HeaderTextComponent.tsx';
import ColumnHeaderComponent from './ColumnHeaderComponent.tsx';
import QRCode from 'qrcode';
import { IconCopy, IconCheck } from '@tabler/icons-react';

const ReviewQrCodeComponent = () => {
    const { reviewConfigs, reviewConfigFormHoook, merchantId } = useReviewConfig();
    const [qrCodeImage, setQrCodeImage] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Find the current values
    const qrCodeUrl = reviewConfigs?.qrCode?.find((field) => field.key === 'qrCodeUrl')?.value || '';
    const qrCodeData = reviewConfigs?.qrCode?.find((field) => field.key === 'qrCodeData')?.value || '';

    // Generate store review URL — use current origin so it works in every environment
    const generateReviewUrl = () => {
        return `${window.location.origin}/store/review/${merchantId}`;
    };

    // Generate QR code from URL
    const generateQRCode = async (url: string) => {
        try {
            const qrCodeDataUrl = await QRCode.toDataURL(url, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
                errorCorrectionLevel: 'M',
            });
            return qrCodeDataUrl;
        } catch (error) {
            console.error('Error generating QR code:', error);
            return '';
        }
    };

    // Set QR code image when data is available
    useEffect(() => {
        if (qrCodeData && !hasGenerated) {
            setQrCodeImage(qrCodeData);
            setHasGenerated(true);
        }
    }, [qrCodeData, hasGenerated]);

    // Generate initial QR code if fields are empty
    useEffect(() => {
        const generateInitialQrCode = async () => {
            // Only generate if we have merchantId and fields are truly empty
            if (!reviewConfigs?.qrCode || hasGenerated) return;

            // If QR code data already exists, just display it
            if (qrCodeData) {
                setQrCodeImage(qrCodeData);
                setHasGenerated(true);
                return;
            }

            // If we have a URL but no QR code data, generate the QR code
            if (qrCodeUrl && !qrCodeData) {
                setIsGenerating(true);

                const newQrCode = await generateQRCode(qrCodeUrl);
                if (newQrCode) {
                    reviewConfigFormHoook.handleFieldChange('qrCodeData', newQrCode, 'qrCode');
                    setQrCodeImage(newQrCode);
                    setHasGenerated(true);
                }

                setIsGenerating(false);
                return;
            }

            // Only generate URL and QR code if both are empty
            if (!qrCodeUrl && !qrCodeData) {
                setIsGenerating(true);

                // Generate URL
                const newUrl = generateReviewUrl();
                reviewConfigFormHoook.handleFieldChange('qrCodeUrl', newUrl, 'qrCode');

                // Generate QR code
                const newQrCode = await generateQRCode(newUrl);
                if (newQrCode) {
                    reviewConfigFormHoook.handleFieldChange('qrCodeData', newQrCode, 'qrCode');
                    setQrCodeImage(newQrCode);
                    setHasGenerated(true);
                }

                setIsGenerating(false);
            }
        };

        generateInitialQrCode();
    }, [reviewConfigs?.qrCode]); // Minimal dependencies

    // Handle manual URL changes
    const handleUrlChange = async (key: string, value: string | number | boolean) => {
        reviewConfigFormHoook.handleFieldChange(key, value, 'qrCode');

        if (key === 'qrCodeUrl' && typeof value === 'string' && value) {
            setIsGenerating(true);
            const newQrCode = await generateQRCode(value);
            if (newQrCode) {
                reviewConfigFormHoook.handleFieldChange('qrCodeData', newQrCode, 'qrCode');
                setQrCodeImage(newQrCode);
            }
            setIsGenerating(false);
        }
    };

    // Handle copy to clipboard
    const handleCopyUrl = async () => {
        if (!qrCodeUrl) return;

        try {
            await navigator.clipboard.writeText(qrCodeUrl);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        } catch (error) {
            console.error('Failed to copy URL:', error);
        }
    };

    // Custom field renderer
    const renderField = (field: any) => {
        if (field.key === 'qrCodeData') {
            return null; // Hide raw data field
        }

        return (
            <ConfigRowComponent
                key={field.key}
                field={field}
                onFieldChange={field.key === 'qrCodeUrl' ? handleUrlChange : reviewConfigFormHoook.handleFieldChange}
                objPropName="qrCode"
            />
        );
    };

    return (
        <div>
            <HeaderTextComponent title="QR Code" subTitle="Configure QR code for live store reviews" />

            <ColumnHeaderComponent columns={['Setting', 'Value', 'Description']} />

            <div className="space-y-3">
                {reviewConfigs?.qrCode ? (
                    <>
                        {reviewConfigs.qrCode.map(renderField).filter(Boolean)}

                        {/* QR Code Preview */}
                        <div className="mt-6 p-6 border border-[color:var(--color-border)] rounded-lg bg-[color:var(--color-lighter)]">
                            <div className="flex items-start gap-6">
                                <div className="flex-1">
                                    <h3 className="text-[color:var(--color-text)] font-medium text-sm mb-2">QR Code Preview</h3>
                                    <p className="text-[color:var(--color-text)] opacity-75 text-sm">
                                        This QR code will direct customers to your review page.
                                    </p>
                                </div>

                                <div className="flex-shrink-0">
                                    {isGenerating ? (
                                        <div className="w-48 h-48 bg-[color:var(--color-bg)] rounded-lg flex items-center justify-center">
                                            <Loading />
                                        </div>
                                    ) : qrCodeImage ? (
                                        <div className="bg-white p-4 rounded-lg shadow-sm">
                                            <img src={qrCodeImage} alt="Review QR Code" className="w-40 h-40" />
                                        </div>
                                    ) : (
                                        <div className="w-48 h-48 bg-[color:var(--color-bg)] rounded-lg flex items-center justify-center">
                                            <span className="text-[color:var(--color-text)] opacity-50 text-sm">No QR Code</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {qrCodeImage && (
                                <div className="mt-4 flex justify-between items-center gap-3">
                                    {/* QR Code URL with Copy Button */}
                                    <div className="flex-1 flex items-center gap-2 bg-[color:var(--color-bg)] px-3 py-2 rounded-md border border-[color:var(--color-border)]">
                                        <span className="text-[color:var(--color-text)] text-sm truncate flex-1">
                                            {qrCodeUrl}
                                        </span>
                                        <button
                                            onClick={handleCopyUrl}
                                            className="flex items-center gap-1 px-3 py-1.5 text-[color:var(--color-main)] hover:bg-[color:var(--color-main)] hover:text-white rounded transition-all text-sm font-medium border border-[color:var(--color-main)]"
                                            title={isCopied ? 'Copied!' : 'Copy URL'}
                                        >
                                            {isCopied ? (
                                                <>
                                                    <IconCheck size={16} />
                                                    <span>Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <IconCopy size={16} />
                                                    <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Download Button */}
                                    <button
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.download = `store-review-qr-${merchantId}.png`;
                                            link.href = qrCodeImage;
                                            link.click();
                                        }}
                                        className="px-4 py-2 bg-[color:var(--color-main)] text-white rounded-md hover:opacity-90 transition-all text-sm font-medium whitespace-nowrap"
                                    >
                                        Download QR Code
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <Loading />
                )}
            </div>
        </div>
    );
};

export default ReviewQrCodeComponent;
