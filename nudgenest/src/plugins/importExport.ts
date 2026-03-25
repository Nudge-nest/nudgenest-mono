/*Handles CSV export and AI-mapped CSV import of reviews*/
import Hapi from '@hapi/hapi';
import Busboy from 'busboy';
import { parse } from 'csv-parse/sync';
import { mapCsvFields } from '../services/ai';

declare module '@hapi/hapi' {
    interface ServerApplicationState {
        importExportPlugin: any;
    }
}

const NUDGENEST_FIELDS = ['customerName', 'customerEmail', 'rating', 'comment', 'productName', 'createdAt', 'published'];

// ============================================================
// Export
// ============================================================

const exportReviews = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const { merchantId } = request.query as { merchantId: string };
    const { prisma } = request.server.app;

    if (!merchantId) {
        return h.response({ error: 'merchantId is required' }).code(400);
    }

    try {
        const reviews = await prisma.reviews.findMany({ where: { merchantId } });

        const rows: string[][] = [];
        const headers = ['id', 'customerName', 'customerEmail', 'rating', 'comment', 'productName', 'status', 'published', 'verified', 'createdAt'];
        rows.push(headers);

        for (const review of reviews) {
            const result: any[] = Array.isArray(review.result) ? (review.result as any[]) : [];
            const ratings = result.map((r: any) => Number(r?.value)).filter((v: number) => !isNaN(v) && v > 0);
            const avgRating = ratings.length > 0 ? Math.round(ratings.reduce((s: number, v: number) => s + v, 0) / ratings.length) : '';
            const comment = result.map((r: any) => r?.comment).filter(Boolean).join(' | ');
            const items: any[] = Array.isArray(review.items) ? (review.items as any[]) : [];
            const productName = items[0]?.name || '';
            let createdAtStr = '';
            try {
                if (review.createdAt) {
                    createdAtStr = new Date(review.createdAt as any).toISOString();
                }
            } catch {
                createdAtStr = String(review.createdAt);
            }

            rows.push([
                review.id,
                review.customerName || '',
                review.customerEmail || '',
                String(avgRating),
                comment,
                productName,
                review.status || '',
                String(review.published ?? false),
                String(review.verified ?? false),
                createdAtStr,
            ]);
        }

        const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

        return h.response(csv)
            .type('text/csv')
            .header('Content-Disposition', 'attachment; filename="reviews-export.csv"');
    } catch (error: any) {
        return h.response({ error: error.message }).code(500);
    }
};

// ============================================================
// Import — Preview (CSV parse + AI field mapping)
// ============================================================

const importPreview = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    return new Promise((resolve) => {
        const payload = request.payload as any;
        const busboy = Busboy({ headers: request.headers as any });

        let merchantId = '';
        let csvBuffer = Buffer.alloc(0);

        busboy.on('field', (name: string, value: string) => {
            if (name === 'merchantId') merchantId = value;
        });

        busboy.on('file', (_fieldName: string, stream: NodeJS.ReadableStream) => {
            const chunks: Buffer[] = [];
            stream.on('data', (chunk: Buffer) => chunks.push(chunk));
            stream.on('end', () => { csvBuffer = Buffer.concat(chunks); });
        });

        busboy.on('finish', async () => {
            if (!merchantId) {
                resolve(h.response({ error: 'merchantId is required' }).code(400));
                return;
            }
            if (!csvBuffer.length) {
                resolve(h.response({ error: 'CSV file is required' }).code(400));
                return;
            }

            try {
                const allRows: Record<string, string>[] = parse(csvBuffer, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                }) as Record<string, string>[];

                if (allRows.length === 0) {
                    resolve(h.response({ error: 'CSV file is empty' }).code(400));
                    return;
                }

                const headers = Object.keys(allRows[0]);
                const sampleRow = Object.values(allRows[0]);
                const mapping = await mapCsvFields(headers, sampleRow);

                // Preview: first 5 rows mapped to Nudgenest field names
                const preview = allRows.slice(0, 5).map(row => {
                    const mapped: Record<string, string> = {};
                    for (const [csvCol, nudgeField] of Object.entries(mapping)) {
                        if (NUDGENEST_FIELDS.includes(nudgeField)) {
                            mapped[nudgeField] = row[csvCol] || '';
                        }
                    }
                    return mapped;
                });

                resolve(h.response({ mapping, preview, allRows }).code(200));
            } catch (error: any) {
                resolve(h.response({ error: error.message || 'Failed to process CSV' }).code(500));
            }
        });

        payload.pipe(busboy);
    });
};

// ============================================================
// Import — Confirm (bulk insert)
// ============================================================

interface ImportRow {
    [key: string]: string;
}

interface ImportConfirmPayload {
    merchantId: string;
    mapping: Record<string, string>;
    rows: ImportRow[];
}

const importConfirm = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const { merchantId, mapping, rows } = request.payload as ImportConfirmPayload;
    const { prisma } = request.server.app;

    if (!merchantId || !mapping || !rows) {
        return h.response({ error: 'merchantId, mapping, and rows are required' }).code(400);
    }

    // Build a reverse lookup: nudgenestField → csvColumn
    const fieldToCol: Record<string, string> = {};
    for (const [col, field] of Object.entries(mapping)) {
        fieldToCol[field] = col;
    }

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
        const ratingRaw = row[fieldToCol['rating']];
        const rating = parseInt(ratingRaw, 10);

        if (isNaN(rating) || rating < 1 || rating > 5) {
            skipped++;
            continue;
        }

        const customerName = row[fieldToCol['customerName']] || 'Imported Customer';
        const customerEmail = row[fieldToCol['customerEmail']] || '';
        const comment = row[fieldToCol['comment']] || '';
        const productName = row[fieldToCol['productName']] || '';
        const publishedRaw = row[fieldToCol['published']];
        const published = publishedRaw === 'true' || publishedRaw === '1';
        const createdAtRaw = row[fieldToCol['createdAt']];
        const createdAt = createdAtRaw ? new Date(createdAtRaw) : new Date();

        const result = [{ value: rating, comment, id: productName }];
        const items = productName ? [{ name: productName, id: productName }] : [];

        try {
            await prisma.reviews.create({
                data: {
                    merchantId,
                    merchantBusinessId: '',
                    shopId: '',
                    customerEmail,
                    customerPhone: '',
                    customerName,
                    items,
                    result,
                    verified: false,
                    published,
                    status: 'Completed',
                    merchantApiKey: null,
                    createdAt,
                },
            });
            imported++;
        } catch {
            skipped++;
        }
    }

    return h.response({ imported, skipped }).code(200);
};

// ============================================================
// Plugin registration
// ============================================================

const importExportPlugin: Hapi.Plugin<null> = {
    name: 'importExportPlugin',
    dependencies: ['prisma', 'auth'],
    register: async (server: Hapi.Server) => {
        server.route([
            {
                method: 'GET',
                path: '/api/v1/reviews/export',
                handler: exportReviews,
                options: {
                    auth: 'apikey',
                },
            },
            {
                method: 'POST',
                path: '/api/v1/reviews/import/preview',
                handler: importPreview,
                options: {
                    auth: 'apikey',
                    payload: {
                        output: 'stream',
                        parse: false,
                        multipart: true,
                        allow: 'multipart/form-data',
                        maxBytes: 5 * 1024 * 1024, // 5MB CSV limit
                    },
                },
            },
            {
                method: 'POST',
                path: '/api/v1/reviews/import/confirm',
                handler: importConfirm,
                options: {
                    auth: 'apikey',
                    payload: {
                        parse: true,
                        allow: 'application/json',
                    },
                },
            },
        ]);
    },
};

export default importExportPlugin;
