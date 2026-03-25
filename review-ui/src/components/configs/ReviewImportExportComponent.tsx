import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { IconDownload, IconUpload, IconCheck, IconX } from '@tabler/icons-react';
import { useReviewConfig } from '../../contexts/ReviewConfigContext.tsx';
import { useImportReviewsPreviewMutation, useImportReviewsConfirmMutation } from '../../redux/nudgenest.ts';
import HeaderTextComponent from './HeaderTextComponent.tsx';

type ViewState = 'idle' | 'loading' | 'preview' | 'result';

const NUDGENEST_FIELD_LABELS: Record<string, string> = {
    customerName: 'Customer Name',
    customerEmail: 'Customer Email',
    rating: 'Rating (1–5)',
    comment: 'Comment',
    productName: 'Product Name',
    createdAt: 'Date',
    published: 'Published',
};

const ReviewImportExportComponent = () => {
    const { merchantId } = useReviewConfig();
    const [importPreview] = useImportReviewsPreviewMutation();
    const [importConfirm] = useImportReviewsConfirmMutation();

    const [view, setView] = useState<ViewState>('idle');
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
    const [allRows, setAllRows] = useState<Record<string, string>[]>([]);
    const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    // ── Export ───────────────────────────────────────────────
    const handleExport = async () => {
        if (!merchantId) return;
        setIsExporting(true);
        try {
            const apiKey = localStorage.getItem('nn-apiKey') || '';
            const baseUrl = import.meta.env.VITE_APP_BACKEND_HOST;

            const res = await fetch(`${baseUrl}reviews/export?merchantId=${merchantId}`, {
                headers: { 'x-api-key': apiKey },
            });

            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reviews-export.csv';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            setError(err.message || 'Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    // ── Import — drop CSV ────────────────────────────────────
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0 || !merchantId) return;
        setError(null);
        setView('loading');

        const formData = new FormData();
        formData.append('file', acceptedFiles[0]);
        formData.append('merchantId', merchantId);

        try {
            const res = await importPreview(formData).unwrap();
            setMapping(res.mapping);
            setPreviewRows(res.preview);
            setAllRows(res.allRows);
            setView('preview');
        } catch (err: any) {
            setError(err?.data?.error || err.message || 'Failed to process CSV');
            setView('idle');
        }
    }, [merchantId, importPreview]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
        multiple: false,
        noClick: false,
    });

    // ── Import — confirm ─────────────────────────────────────
    const handleConfirm = async () => {
        if (!merchantId) return;
        setView('loading');
        setError(null);
        try {
            const res = await importConfirm({ merchantId, mapping, rows: allRows }).unwrap();
            setResult(res);
            setView('result');
        } catch (err: any) {
            setError(err?.data?.error || err.message || 'Import failed');
            setView('preview');
        }
    };

    const reset = () => {
        setView('idle');
        setMapping({});
        setPreviewRows([]);
        setAllRows([]);
        setResult(null);
        setError(null);
    };

    // ── Render ───────────────────────────────────────────────
    return (
        <div className="w-full space-y-6">
            <HeaderTextComponent title="Import / Export Reviews" />

            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <IconX size={16} />
                    {error}
                </div>
            )}

            {/* ── IDLE ── */}
            {(view === 'idle' || view === 'loading') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Export card */}
                    <div className="border border-[color:var(--color-text)] rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-2 font-semibold text-[color:var(--color-text)]">
                            <IconDownload size={20} />
                            Export Reviews
                        </div>
                        <p className="text-sm text-[color:var(--color-disabled)]">
                            Download all your reviews as a CSV file.
                        </p>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="w-full py-2 rounded-lg bg-[color:var(--color-main)] text-white text-sm font-medium
                                hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExporting ? 'Exporting…' : 'Export Reviews'}
                        </button>
                    </div>

                    {/* Import card */}
                    <div className="border border-[color:var(--color-text)] rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-2 font-semibold text-[color:var(--color-text)]">
                            <IconUpload size={20} />
                            Import Reviews
                        </div>
                        <p className="text-sm text-[color:var(--color-disabled)]">
                            Accepts CSV from Judge.me, Yotpo, Stamped.io, or any review platform.
                        </p>
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                                ${isDragActive
                                    ? 'border-[color:var(--color-main)] bg-[color:var(--color-main)]/5'
                                    : 'border-[color:var(--color-disabled)] hover:border-[color:var(--color-main)]'
                                }
                                ${view === 'loading' ? 'opacity-50 pointer-events-none' : ''}
                            `}
                        >
                            <input {...getInputProps()} />
                            {view === 'loading' ? (
                                <p className="text-sm text-[color:var(--color-disabled)]">Processing CSV…</p>
                            ) : isDragActive ? (
                                <p className="text-sm text-[color:var(--color-main)]">Drop the CSV here</p>
                            ) : (
                                <p className="text-sm text-[color:var(--color-disabled)]">
                                    Drop a CSV file here, or click to select
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── PREVIEW ── */}
            {view === 'preview' && (
                <div className="space-y-4">
                    {/* Field mapping */}
                    <div>
                        <h3 className="font-semibold text-sm mb-2 text-[color:var(--color-text)]">
                            Field Mapping <span className="text-[color:var(--color-disabled)] font-normal">(AI-detected)</span>
                        </h3>
                        <div className="border border-[color:var(--color-text)] rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-[color:var(--color-main)]/10">
                                    <tr>
                                        <th className="text-left px-3 py-2 font-medium text-[color:var(--color-text)]">CSV Column</th>
                                        <th className="text-left px-3 py-2 font-medium text-[color:var(--color-text)]">Nudgenest Field</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(mapping).map(([csvCol, nudgeField]) => (
                                        <tr key={csvCol} className="border-t border-[color:var(--color-text)]/20">
                                            <td className="px-3 py-2 text-[color:var(--color-disabled)]">{csvCol}</td>
                                            <td className="px-3 py-2 text-[color:var(--color-text)]">
                                                {NUDGENEST_FIELD_LABELS[nudgeField] || nudgeField}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Row preview */}
                    {previewRows.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-sm mb-2 text-[color:var(--color-text)]">
                                Preview <span className="text-[color:var(--color-disabled)] font-normal">(first {previewRows.length} rows)</span>
                            </h3>
                            <div className="border border-[color:var(--color-text)] rounded-lg overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-[color:var(--color-main)]/10">
                                        <tr>
                                            {Object.keys(previewRows[0]).map(field => (
                                                <th key={field} className="text-left px-3 py-2 font-medium text-[color:var(--color-text)] whitespace-nowrap">
                                                    {NUDGENEST_FIELD_LABELS[field] || field}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewRows.map((row, i) => (
                                            <tr key={i} className="border-t border-[color:var(--color-text)]/20">
                                                {Object.values(row).map((val, j) => (
                                                    <td key={j} className="px-3 py-2 text-[color:var(--color-disabled)] max-w-[180px] truncate">
                                                        {String(val)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-[color:var(--color-disabled)] mt-1">
                                {allRows.length} total rows will be imported
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleConfirm}
                            className="px-5 py-2 rounded-lg bg-[color:var(--color-main)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            Confirm Import
                        </button>
                        <button
                            onClick={reset}
                            className="px-5 py-2 rounded-lg border border-[color:var(--color-text)] text-[color:var(--color-text)] text-sm font-medium hover:opacity-70 transition-opacity"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ── RESULT ── */}
            {view === 'result' && result && (
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-5 border border-green-200 bg-green-50 rounded-xl">
                        <IconCheck size={20} className="text-green-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-semibold text-green-800">Import complete</p>
                            <p className="text-sm text-green-700 mt-1">
                                {result.imported} review{result.imported !== 1 ? 's' : ''} imported
                                {result.skipped > 0 && `, ${result.skipped} skipped (missing or invalid rating)`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={reset}
                        className="px-5 py-2 rounded-lg border border-[color:var(--color-text)] text-[color:var(--color-text)] text-sm font-medium hover:opacity-70 transition-opacity"
                    >
                        Import another file
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReviewImportExportComponent;
