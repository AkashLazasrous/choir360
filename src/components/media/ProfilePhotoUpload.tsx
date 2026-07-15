/**
 * ProfilePhotoUpload
 *
 * Flow:
 *  1. User selects a file  →  validated immediately (type / size / dimensions)
 *  2. Valid file           →  Base64 preview rendered instantly (no server call yet)
 *  3. User clicks "Upload" →  image is compressed, uploaded to Cloudinary via
 *                             signed backend endpoint, metadata saved to Firestore
 *  4. Success              →  preview updated with Cloudinary optimized URL
 *
 * Base64 data is used ONLY for the in-browser preview and is never persisted.
 */

import React, { useRef, useState } from 'react';
import { AlertTriangle, Camera, CheckCircle, Loader2, RefreshCw, Upload, X } from 'lucide-react';
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
}

type UploadPhase =
  | 'idle'
  | 'preview'
  | 'uploading'
  | 'success'
  | 'error';

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  memberId,
  uploadedByUserId,
  currentPhotoUrl,
  onUploadComplete,
  onError,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [displayUrl, setDisplayUrl] = useState(currentPhotoUrl ?? '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setProgressMsg('Validating…');
    setPhase('preview');

    try {
      await validateImageFile(file);
      const base64 = await fileToBase64(file);
      setDisplayUrl(base64);
      setSelectedFile(file);
      setProgressMsg('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Validation failed.';
      setErrorMsg(msg);
      onError?.(msg);
      setPhase('error');
      setProgressMsg('');
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setPhase('uploading');
    setProgressMsg('Compressing image…');

    try {
      const compressed = await compressImage(selectedFile);

      setProgressMsg('Uploading…');
      const record = await uploadMediaToCloudinary(compressed, {
        moduleName: 'members',
        relatedRecordId: memberId,
        uploadedByUserId,
        originalFileName: selectedFile.name,
        mimeType: selectedFile.type,
        sizeBytes: selectedFile.size,
      });

      setDisplayUrl(record.optimizedUrl || record.secureUrl);
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

  const handleReset = () => {
    setPhase('idle');
    setDisplayUrl(currentPhotoUrl ?? '');
    setSelectedFile(null);
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
            onChange={handleFileChange}
            disabled={phase === 'uploading'}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={phase === 'uploading'}
            className="btn-pill btn-pill-primary btn-pill-sm w-fit !text-[13px]"
          >
            <Camera className="h-3.5 w-3.5" />
            {displayUrl && phase === 'idle' ? 'Change Photo' : 'Choose File'}
          </button>

          {phase === 'preview' && selectedFile && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleUpload}
                className="btn-pill btn-pill-gold btn-pill-sm !text-[13px]"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-pill btn-pill-secondary btn-pill-sm !text-[13px]"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            </div>
          )}

          {phase === 'error' && (
            <button
              type="button"
              onClick={handleReset}
              className="btn-pill btn-pill-secondary btn-pill-sm w-fit !text-[13px]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
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
          Photo uploaded successfully.
        </p>
      )}
      {phase === 'preview' && selectedFile && !progressMsg && (
        <p className="text-[12px] text-[#86868b]">
          Selected: {selectedFile.name}
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
        Photos upload to Cloudinary; metadata is saved to Firebase.
      </p>
    </div>
  );
};
