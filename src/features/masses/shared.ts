import { MassCategory, isPaymentMassCategory } from '../../types';

/** Liturgy dropdown — Funeral removed from new entries (legacy docs may still show it). */
export const ALL_MASS_CATEGORIES: MassCategory[] = [
  'Sunday Mass', 'Saturday Mass', 'Weekday Mass', 'Special Mass', 'Wedding',
  'Death Mass', 'Death Anniversary Mass', 'Feast Day', 'Ordination',
  'First Holy Communion', 'Confirmation', 'Novena',
];

export const isPaymentMass = (cat: MassCategory) => isPaymentMassCategory(cat);

export const createUniqueId = (prefix: string) => {
  const randomPart = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${randomPart}`;
};

/** Snapshot of a locked settlement for one payment. */
export interface LockedCalc {
  singers: number;
  instruments: number;
  totalUnits: number;
  unitValue: number;
  singerShare: number;
  instrumentShare: number;
}
