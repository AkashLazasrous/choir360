import React, { useMemo } from 'react';
import type { Member } from '../../types';

const ACTIVE_STATUSES = new Set(['Active Member', 'Approved', 'Admin']);

export function memberDisplayName(member: Member): string {
  return `${member.firstName} ${member.lastName}`.trim() || member.email || member.id;
}

interface ReceivedBySelectProps {
  members: Member[];
  value: string;
  onChange: (memberId: string, displayName: string) => void;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
  label?: string;
}

/** Admin picker: who in the choir collected the special-mass payment. */
export const ReceivedBySelect: React.FC<ReceivedBySelectProps> = ({
  members,
  value,
  onChange,
  disabled = false,
  className,
  labelClassName = 'text-[10px] font-bold text-slate-400 uppercase',
  selectClassName = 'apple-select text-sm',
  label = 'Received By',
}) => {
  const options = useMemo(
    () =>
      members
        .filter((m) => ACTIVE_STATUSES.has(m.status))
        .slice()
        .sort((a, b) => memberDisplayName(a).localeCompare(memberDisplayName(b), undefined, { sensitivity: 'base' })),
    [members],
  );

  return (
    <div className={className ?? 'space-y-1'}>
      <label className={labelClassName}>{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const id = e.target.value;
          const member = options.find((m) => m.id === id);
          onChange(id, member ? memberDisplayName(member) : '');
        }}
        className={selectClassName}
      >
        <option value="">Select member…</option>
        {options.map((m) => (
          <option key={m.id} value={m.id}>
            {memberDisplayName(m)}
            {m.memberType ? ` · ${m.memberType}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
};
