import { RecordStatus, TenantScopedRecord } from '../types';

const nowIso = () => new Date().toISOString();

// Fallback IDs use 'global' so data is accessible to any parish without env vars set.
// Set VITE_DEFAULT_TENANT_ID / VITE_DEFAULT_PARISH_ID / VITE_DEFAULT_CHOIR_ID in .env
// to scope records to a specific parish from day one.
export const DEFAULT_TENANT_CONTEXT = {
  tenantId: import.meta.env.VITE_DEFAULT_TENANT_ID || 'global',
  parishId: import.meta.env.VITE_DEFAULT_PARISH_ID || 'global',
  choirId: import.meta.env.VITE_DEFAULT_CHOIR_ID || 'global-choir',
};

export function createRecordMetadata(
  userId = 'system',
  status: RecordStatus = 'active',
): TenantScopedRecord {
  const timestamp = nowIso();
  return {
    ...DEFAULT_TENANT_CONTEXT,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: userId,
    updatedBy: userId,
    status,
    deletedAt: null,
    deletedBy: null,
  };
}

export function updateRecordMetadata<T extends Partial<TenantScopedRecord>>(
  record: T,
  userId = 'system',
): T & Pick<TenantScopedRecord, 'updatedAt' | 'updatedBy'> {
  return {
    ...record,
    updatedAt: nowIso(),
    updatedBy: userId,
  };
}

export function softDeleteRecord<T extends Partial<TenantScopedRecord>>(
  record: T,
  userId = 'system',
) {
  const timestamp = nowIso();
  return {
    ...record,
    status: 'deleted' as const,
    updatedAt: timestamp,
    updatedBy: userId,
    deletedAt: timestamp,
    deletedBy: userId,
  };
}
