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
  width?: number;
  height?: number;
}

interface SignaturePayload {
  apiKey: string;
  timestamp: string | number;
  signature: string;
  folder: string;
  tags: string;
  context: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadFolder = import.meta.env.VITE_CLOUDINARY_UPLOAD_FOLDER || 'choir360';
/** Unsigned preset for public registration photos (no Firebase Auth required). */
const unsignedPreset =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'choir360_members_unsigned';

// ── URL builder ───────────────────────────────────────────────────────────────

export function buildCloudinaryImageUrl(publicId: string, transformation: string) {
  if (!cloudName) return '';
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
}

export { validateImageFile as validateMediaFile } from '../utils/imageValidation';

function friendlyUploadError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err);
  if (
    raw.includes('auth/admin-restricted-operation') ||
    raw.includes('auth/operation-not-allowed') ||
    raw.includes('Missing Firebase ID token')
  ) {
    return new Error(
      'Photo upload is temporarily unavailable. Please try again in a moment, or submit without a custom photo.',
    );
  }
  return err instanceof Error ? err : new Error(raw || 'Upload failed.');
}

function toMediaRecord(
  uploaded: CloudinaryUploadResponse,
  context: CloudinaryUploadContext,
): CloudinaryMediaRecord {
  const uploadedAt = uploaded.created_at || new Date().toISOString();
  return {
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
}

async function uploadWithSignature(
  file: File,
  sig: SignaturePayload,
): Promise<CloudinaryUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', sig.apiKey);
  formData.append('timestamp', String(sig.timestamp));
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

  return (await uploadResponse.json()) as CloudinaryUploadResponse;
}

/**
 * Direct Cloudinary upload using an unsigned preset.
 * Used for public registration when the backend signature API still requires auth
 * (e.g. Render has not redeployed yet) or Firebase Anonymous Auth is disabled.
 */
async function uploadWithUnsignedPreset(
  file: File,
  context: CloudinaryUploadContext,
): Promise<CloudinaryUploadResponse> {
  if (context.moduleName !== 'members') {
    throw new Error('Unsigned upload is only available for member profile photos.');
  }

  // Preset already scopes folder + allowed formats. Only send file + preset
  // (+ optional tags) so we don't conflict with locked preset settings.
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', unsignedPreset);
  formData.append('tags', `choir360,members,${context.relatedRecordId}`);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData },
  );

  if (!uploadResponse.ok) {
    const errBody = await uploadResponse.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message ||
        'Unsigned Cloudinary upload failed. Create preset "choir360_members_unsigned" or redeploy the backend.',
    );
  }

  return (await uploadResponse.json()) as CloudinaryUploadResponse;
}

async function requestSignature(
  context: CloudinaryUploadContext,
): Promise<{ ok: true; sig: SignaturePayload } | { ok: false; status: number; error: string }> {
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
    return {
      ok: false,
      status: signatureResponse.status,
      error: errorBody?.error || 'Could not create a secure Cloudinary upload signature.',
    };
  }

  return { ok: true, sig: (await signatureResponse.json()) as SignaturePayload };
}

/**
 * Uploads a file to Cloudinary.
 *
 * 1. Prefer signed upload via backend (authenticated or public members folder).
 * 2. If signature is rejected (old backend requiring Firebase token), fall back
 *    to unsigned preset for member photos — no Anonymous Auth needed.
 * 3. Firestore metadata write is best-effort for signed-in non-anonymous users.
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
    let uploaded: CloudinaryUploadResponse | null = null;

    const signed = await requestSignature(context);
    if (signed.ok) {
      uploaded = await uploadWithSignature(file, signed.sig);
    } else {
      const needsPublicFallback =
        context.moduleName === 'members' &&
        (signed.status === 401 ||
          signed.status === 403 ||
          /firebase|token|auth/i.test(signed.error));

      if (!needsPublicFallback) {
        throw new Error(signed.error);
      }

      // Old Render builds still require a Firebase ID token. Anonymous Auth is
      // disabled in this project, so use a scoped unsigned Cloudinary preset.
      uploaded = await uploadWithUnsignedPreset(file, context);
    }

    const mediaRecord = toMediaRecord(uploaded, context);

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
