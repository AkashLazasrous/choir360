/**
 * ProfilePhotoUpload
 *
 * Flow:
 *  1. User selects a file  →  validated immediately (type / size / dimensions)
 *  2. Valid file           →  Base64 preview + automatic Cloudinary upload
 *  3. Success              →  preview updated with Cloudinary URL; parent gets onUploadComplete
 *
 * Base64 data is used ONLY for the in-browser preview and is never persisted.
 * Parents should disable Save while `onBusyChange(true)` so a pending upload
 * cannot be skipped.
 */

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { fileToBase64 } from '../../utils/fileToBase64';
import { validateImageFile } from '../../utils/imageValidation';
import { compressImage } from '../../utils/imageCompression';
import { uploadMediaToCloudinary } from '../../services/cloudinary';
import type { CloudinaryMediaRecord } from '../../types';

export interface ProfilePhotoUploadProps {
  memberId: string;
  uploadedByUserId: string;
  currentPhotoUrl?: string;
  onUploadComplete: (record: CloudinaryMediaRecord) => void;
  onError?: (message: string) => void;
  /** True while validating/compressing/uploading — parent should block Save. */
  onBusyChange?: (busy: boolean) => void;
}

type UploadPhase =
  | 'idle'
  | 'uploading'
  | 'success'
  | 'error';

/** Prefer Cloudinary's canonical secure_url; optimizedUrl is a client-built variant. */
export function pickCloudinaryPhotoUrl(record: CloudinaryMediaRecord): string {
  return (record.secureUrl || record.optimizedUrl || record.thumbnailUrl || '').trim();
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  memberId,
  uploadedByUserId,
  currentPhotoUrl,
  onUploadComplete,
  onError,
  onBusyChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [displayUrl, setDisplayUrl] = useState(currentPhotoUrl ?? '');
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Keep preview in sync when the parent photo URL changes (e.g. opening editor for another member).
  useEffect(() => {
    if (phase === 'uploading') return;
    setDisplayUrl(currentPhotoUrl ?? '');
  }, [currentPhotoUrl, phase]);

  useEffect(() => {
    onBusyChange?.(phase === 'uploading');
  }, [phase, onBusyChange]);

  const uploadFile = async (file: File) => {
    setPhase('uploading');
    setProgressMsg('Compressing image…');

    try {
      const compressed = await compressImage(file);

      setProgressMsg('Uploading…');
      const record = await uploadMediaToCloudinary(compressed, {
        moduleName: 'members',
        relatedRecordId: memberId,
        uploadedByUserId,
        originalFileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });

      const url = pickCloudinaryPhotoUrl(record);
      setDisplayUrl(url || record.secureUrl);
      setPhase('success');
      setProgressMsg('');
      onUploadComplete(record);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      setErrorMsg(msg);
      onError?.(msg);
      setPhase('error');
      setProgressMsg('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setProgressMsg('Validating…');
    setPhase('uploading');

    try {
      await validateImageFile(file);
      const base64 = await fileToBase64(file);
      setDisplayUrl(base64);
      setProgressMsg('');
      await uploadFile(file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Validation failed.';
      setErrorMsg(msg);
      onError?.(msg);
      setPhase('error');
      setProgressMsg('');
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleReset = () => {
    setPhase('idle');
    setDisplayUrl(currentPhotoUrl ?? '');
    setErrorMsg('');
    setProgressMsg('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="font-apple space-y-3">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Profile preview"
              className="h-[72px] w-[72px] rounded-full object-cover ring-1 ring-black/10"
            />
          ) : (
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-black/[0.06]">
              <Camera className="h-7 w-7 text-[#86868b]" />
            </div>
          )}

          {phase === 'uploading' && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}

          {phase === 'success' && (
            <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-[#30d158] p-0.5 ring-2 ring-white">
              <CheckCircle className="h-3.5 w-3.5 text-white" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden"
            onChange={(e) => void handleFileChange(e)}
            disabled={phase === 'uploading'}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={phase === 'uploading'}
            className="btn-pill btn-pill-primary w-fit"
          >
            <Camera className="h-4 w-4" />
            {displayUrl && phase === 'idle' ? 'Change Photo' : phase === 'uploading' ? 'Uploading…' : 'Choose File'}
          </button>

          {phase === 'error' && (
            <button
              type="button"
              onClick={handleReset}
              className="btn-pill btn-pill-secondary w-fit"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          )}
        </div>
      </div>

      {progressMsg && (
        <p className="flex items-center gap-1.5 text-[13px] text-[#8a6a10]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {progressMsg}
        </p>
      )}
      {phase === 'success' && (
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#18392f]">
          <CheckCircle className="h-3.5 w-3.5 text-[#30d158]" />
          Photo uploaded successfully. Save the profile to keep it.
        </p>
      )}
      {errorMsg && (
        <p className="flex items-start gap-1.5 text-[13px] font-medium text-[#d70015]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </p>
      )}

      <p className="text-[12px] leading-relaxed text-[#86868b]">
        JPEG, PNG, WebP, or HEIC · max 8 MB · max 6000 px per side.
        Photos upload to Cloudinary automatically after you choose a file.
      </p>
    </div>
  );
};
