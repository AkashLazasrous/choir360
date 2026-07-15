import { CloudinaryMediaRecord } from '../types';
import { createRecordMetadata } from './recordMetadata';
import { auth, upsertTenantRecord } from './firebase';
import { apiFetch } from './apiClient';

// ── Upload context ────────────────────────────────────────────────────────────

export interface CloudinaryUploadContext {
  moduleName: CloudinaryMediaRecord['moduleName'];
  relatedRecordId: string;
  uploadedByUserId: string;
  /** Original filename before any compression */
  originalFileName?: string;
  /** MIME type of the original file */
  mimeType?: string;
  /** Size in bytes of the original file */
  sizeBytes?: number;
}

// ── Cloudinary API response shape ─────────────────────────────────────────────

interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  bytes?: number;
  format?: string;
  resource_type?: 'image' | 'video' | 'raw';
  created_at?: string;
  /** Pixel dimensions — returned for image uploads */
  width?: number;
  height?: number;
}

// ── Config ────────────────────────────────────────────────────────────────────

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadFolder = import.meta.env.VITE_CLOUDINARY_UPLOAD_FOLDER || 'choir360';

// ── URL builder ───────────────────────────────────────────────────────────────

export function buildCloudinaryImageUrl(publicId: string, transformation: string) {
  if (!cloudName) return '';
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
}

// ---------------------------------------------------------------------------
// CLIENT-SIDE UPLOAD VALIDATION
// Re-exported from imageValidation.ts for backward compat — callers that
// imported validateMediaFile directly from this module continue to work.
// ---------------------------------------------------------------------------
export { validateImageFile as validateMediaFile } from '../utils/imageValidation';

function friendlyUploadError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err);
  if (
    raw.includes('auth/admin-restricted-operation') ||
    raw.includes('auth/operation-not-allowed')
  ) {
    return new Error(
      'Photo upload could not start. Sign in if you have an account, or try again in a moment.',
    );
  }
  return err instanceof Error ? err : new Error(raw || 'Upload failed.');
}

// ── Main upload function ──────────────────────────────────────────────────────

/**
 * Uploads a file to Cloudinary using a server-side signed request, then
 * writes the resulting metadata to Firestore when the user is signed in.
 *
 * Public registration uploads do NOT use Firebase Anonymous Auth (disabled /
 * restricted in this project). The signature API allows unauthenticated
 * requests only for the `choir360/members` folder, rate-limited on the server.
 *
 * Firestore write is best-effort for signed-in users with tenant claims.
 */
export async function uploadMediaToCloudinary(
  file: File,
  context: CloudinaryUploadContext,
): Promise<CloudinaryMediaRecord> {
  if (!cloudName) {
    throw new Error(
      'Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME before uploading media.',
    );
  }

  try {
    // ── 1. Get signed upload parameters from the backend ────────────────────
    // apiFetch attaches a Bearer token when the user is already signed in.
    // Unauthenticated registration users get a public signature for members/*.
    const signatureResponse = await apiFetch('/api/cloudinary/signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folder: `${uploadFolder}/${context.moduleName}`,
        tags: ['choir360', context.moduleName, context.relatedRecordId],
        context: {
          moduleName: context.moduleName,
          relatedRecordId: context.relatedRecordId,
          uploadedByUserId: context.uploadedByUserId,
        },
      }),
    });

    if (!signatureResponse.ok) {
      const errorBody = await signatureResponse.json().catch(() => ({}));
      throw new Error(
        errorBody?.error || 'Could not create a secure Cloudinary upload signature.',
      );
    }

    const sig = await signatureResponse.json();

    // ── 2. Upload the file directly to Cloudinary ───────────────────────────
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sig.apiKey);
    formData.append('timestamp', sig.timestamp);
    formData.append('signature', sig.signature);
    formData.append('folder', sig.folder);
    formData.append('tags', sig.tags);
    formData.append('context', sig.context);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      { method: 'POST', body: formData },
    );

    if (!uploadResponse.ok) {
      const errBody = await uploadResponse.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || 'Cloudinary upload failed.');
    }

    const uploaded = (await uploadResponse.json()) as CloudinaryUploadResponse;

    // ── 3. Build the local media record ─────────────────────────────────────
    const uploadedAt = uploaded.created_at || new Date().toISOString();
    const mediaRecord: CloudinaryMediaRecord = {
      id: uploaded.public_id.replace(/[/.]/g, '_'),
      publicId: uploaded.public_id,
      secureUrl: uploaded.secure_url,
      thumbnailUrl: buildCloudinaryImageUrl(
        uploaded.public_id,
        'c_fill,w_240,h_240,q_auto,f_auto',
      ),
      optimizedUrl: buildCloudinaryImageUrl(uploaded.public_id, 'q_auto,f_auto'),
      uploadedAt,
      uploadedByUserId: context.uploadedByUserId,
      moduleName: context.moduleName,
      relatedRecordId: context.relatedRecordId,
      bytes: uploaded.bytes,
      format: uploaded.format,
      resourceType: uploaded.resource_type || 'auto',
      width: uploaded.width,
      height: uploaded.height,
      originalFileName: context.originalFileName,
      mimeType: context.mimeType,
      sizeBytes: context.sizeBytes ?? uploaded.bytes,
      ...createRecordMetadata(context.uploadedByUserId, 'active'),
    };

    // ── 4. Persist metadata to Firestore (signed-in users only) ─────────────
    // Skip for public registration — no tenant claims without a real account.
    if (auth?.currentUser && !auth.currentUser.isAnonymous) {
      try {
        await upsertTenantRecord('media', mediaRecord, context.uploadedByUserId);
      } catch (firestoreErr) {
        console.warn(
          '[Cloudinary] Firestore media record write skipped (non-fatal):',
          firestoreErr,
        );
      }
    }

    return mediaRecord;
  } catch (err) {
    throw friendlyUploadError(err);
  }
}
