/*Handles all things related to Google Cloud Storage media*/
import Hapi from '@hapi/hapi';

import * as dotenv from 'dotenv';
import Busboy from 'busboy';
import { Storage } from '@google-cloud/storage';
import crypto from 'crypto';
import sharp from 'sharp';

dotenv.config();

// Types
interface UploadedFile {
    filename: string;
    headers: { [key: string]: string };
    payload: Buffer;
}

// Configuration
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_REQUEST = 12;

declare module '@hapi/hapi' {
    interface ServerApplicationState {
        reviewMediaPlugin: any;
    }
}

const reviewMediaPlugin: Hapi.Plugin<null> = {
    name: 'reviewMediaPlugin',
    dependencies: ['prisma'],
    register: async (server: Hapi.Server) => {
        server.route([
            {
                method: 'POST',
                path: '/api/v1/media',
                handler: uploadMediaToGCSHandler,
                options: {
                    auth: 'apikey',
                    payload: {
                        output: 'stream',
                        parse: false,
                        multipart: true,
                        allow: 'multipart/form-data',
                        maxBytes: MAX_FILE_SIZE * MAX_FILES_PER_REQUEST,
                        timeout: 60000, // 60 seconds for large files
                        uploads: '/tmp', // Temporary directory for large files
                    },
                },
            },
            {
                method: 'DELETE',
                path: '/api/v1/media/{mediaUrl}',
                handler: deleteMediaFromGCSHandler,
                options: {
                    auth: 'apikey',
                },
            },
        ]);
    },
};

const uploadMediaToGCSHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    return new Promise((resolve) => {
        const files: Array<{ buffer: Buffer; filename: string; contentType: string }> = [];
        let reviewId = '';
        let merchantId = '';

        const busboy = Busboy({ headers: request.headers });

        // Handle form fields
        busboy.on('field', (fieldname: string, value: string) => {
            if (fieldname === 'reviewId') reviewId = value;
            if (fieldname === 'merchantId') merchantId = value;
        });

        // Handle files
        busboy.on('file', (fieldname: string, file: NodeJS.ReadableStream, info: any) => {
            const chunks: Buffer[] = [];

            file.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });

            file.on('end', () => {
                const buffer = Buffer.concat(chunks);
                files.push({
                    buffer,
                    filename: info.filename || `file_${files.length}.jpg`,
                    contentType: info.mimeType || 'image/jpeg',
                });
                console.log(`File received: ${info.filename}, ${buffer.length} bytes`);
            });
        });

        // Upload when done
        busboy.on('finish', async () => {
            try {
                // Initialize GCS client
                const storage = new Storage({
                    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
                    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
                });

                const bucketName = process.env.GCS_BUCKET_NAME || 'nudgenest-media';
                const bucket = storage.bucket(bucketName);

                const uploadedFiles = [];

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const timestamp = Date.now();
                    const randomId = crypto.randomBytes(4).toString('hex');

                    const isImage = file.contentType.startsWith('image/');
                    let uploadBuffer = file.buffer;
                    let fileName: string;
                    let uploadContentType = file.contentType;

                    if (isImage) {
                        // Convert all images to WebP for smaller file sizes
                        uploadBuffer = await sharp(file.buffer)
                            .webp({ quality: 85 })
                            .toBuffer();
                        fileName = `${merchantId}/${timestamp}_${randomId}_${i}.webp`;
                        uploadContentType = 'image/webp';
                    } else {
                        // Videos pass through unchanged
                        const ext = file.contentType.split('/')[1] || 'bin';
                        fileName = `${merchantId}/${timestamp}_${randomId}_${i}.${ext}`;
                    }

                    console.log(`📦 ${file.filename}: ${file.buffer.length} → ${uploadBuffer.length} bytes (${uploadContentType})`);

                    // Upload to GCS
                    const gcsFile = bucket.file(fileName);
                    await gcsFile.save(uploadBuffer, {
                        contentType: uploadContentType,
                        metadata: {
                            cacheControl: 'public, max-age=31536000',
                        },
                    });

                    // Generate public URL (bucket is already publicly readable via IAM)
                    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

                    uploadedFiles.push({
                        id: crypto.randomUUID(),
                        url: publicUrl,
                        filename: file.filename,
                        size: uploadBuffer.length,
                        type: uploadContentType,
                    });
                }

                console.log(`✅ Uploaded ${uploadedFiles.length} files to GCS`);

                resolve(
                    h
                        .response({
                            version: '1.0.0',
                            data: uploadedFiles,
                        })
                        .code(200)
                );
            } catch (error: any) {
                console.error('❌ GCS upload failed:', error);
                resolve(
                    h
                        .response({
                            version: '1.0.0',
                            error: 'Upload failed: ' + error.message,
                        })
                        .code(500)
                );
            }
        });

        request.raw.req.pipe(busboy);
    });
};

const deleteMediaFromGCSHandler = async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const { mediaUrl } = request.payload as { mediaUrl: string };
    try {
        // Extract GCS object name from URL
        // URL format: https://storage.googleapis.com/nudgenest-media/merchantId/timestamp_randomId_index.jpg
        // Object name should be: merchantId/timestamp_randomId_index.jpg

        const bucketName = process.env.GCS_BUCKET_NAME || 'nudgenest-media';
        const expectedPrefix = `https://storage.googleapis.com/${bucketName}/`;

        if (!mediaUrl.startsWith(expectedPrefix)) {
            return h
                .response({
                    version: '1.0.0',
                    error: 'Invalid media URL format',
                })
                .code(400);
        }

        // Extract the GCS object name (everything after the bucket URL)
        const objectName = mediaUrl.replace(expectedPrefix, '');

        console.log(`Deleting GCS object: ${objectName}`);

        // Initialize GCS client
        const storage = new Storage({
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(objectName);

        await file.delete();

        console.log(`✅ Deleted GCS object: ${objectName}`);

        return h
            .response({
                version: '1.0.0',
                message: 'Media deleted successfully',
            })
            .code(200);
    } catch (error: any) {
        console.error('❌ GCS delete failed:', error);
        return h
            .response({
                version: '1.0.0',
                error: 'Delete failed: ' + error.message,
            })
            .code(500);
    }
};

export default reviewMediaPlugin;
