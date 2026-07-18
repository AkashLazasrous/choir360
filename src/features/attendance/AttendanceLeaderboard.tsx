import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Info, Medal, Trophy, Users } from 'lucide-react';
import type { AttendanceRecord, Member } from '../../types';
import {
  LEADERBOARD_CAPTION,
  LEADERBOARD_FORMULA_HINT,
  computeAttendanceLeaderboard,
  findLeaderboardRank,
  type CategoryAttendanceStats,
  type LeaderboardEntry,
} from '../../utils/attendanceLeaderboard';
import { CountUp } from '../../components/interactions/CountUp';

interface AttendanceLeaderboardProps {
  attendanceRecords: AttendanceRecord[];
  members: Member[];
  /** Highlight the signed-in member row */
  viewerMemberId?: string | null;
  /** Max rows to show (default: all ranked members) */
  limit?: number;
  /** Tighter padding for embedding in My Ministry */
  compact?: boolean;
  className?: string;
}

const MEDAL: Record<number, { label: string; className: string; glow: string }> = {
  1: {
    label: 'Gold',
    className: 'bg-[linear-gradient(135deg,#fde68a_0%,#f5c24c_45%,#f59e0b_100%)] text-[#5c4308]',
    glow: 'shadow-[0_0_0_3px_rgba(245,194,76,0.28)]',
  },
  2: {
    label: 'Silver',
    className: 'bg-[linear-gradient(135deg,#f1f5f9_0%,#cbd5e1_55%,#94a3b8_100%)] text-[#334155]',
    glow: 'shadow-[0_0_0_3px_rgba(148,163,184,0.28)]',
  },
  3: {
    label: 'Bronze',
    className: 'bg-[linear-gradient(135deg,#fdba74_0%,#ea580c_55%,#9a3412_100%)] text-white',
    glow: 'shadow-[0_0_0_3px_rgba(234,88,12,0.22)]',
  },
};

function RankBadge({ rank }: { rank: number }) {
  const medal = MEDAL[rank];
  if (medal) {
    return (
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${medal.className} ${medal.glow}`}
        title={`${medal.label} · #${rank}`}
        aria-label={`Rank ${rank}, ${medal.label}`}
      >
        {rank === 1 ? <Trophy className="h-4 w-4" /> : <Medal className="h-4 w-4" />}
      </div>
    );
  }
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(14,61,76,0.08)] text-[13px] font-semibold tabular-nums text-[#0e3d4c] lg:bg-white/10 lg:text-[#f5f5f7]"
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </div>
  );
}

function Avatar({ entry }: { entry: LeaderboardEntry }) {
  const initials = entry.memberName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  if (entry.photoUrl) {
    return (
      <img
        src={entry.photoUrl}
        alt=""
        referrerPolicy="no-referrer"
        className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-[rgba(14,61,76,0.12)]"
      />
    );
  }

  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(14,61,76,0.1)] text-[12px] font-semibold text-[#0e3d4c] ring-2 ring-[rgba(14,61,76,0.12)]"
      aria-hidden
    >
      {initials || '?'}
    </div>
  );
}

function ScoreBar({
  percent,
  delay,
  reduceMotion,
  accent,
}: {
  percent: number;
  delay: number;
  reduceMotion: boolean | null;
  accent: boolean;
}) {
  const width = `${Math.max(0, Math.min(100, percent))}%`;
  const fillStyle = {
    width,
    backgroundImage: accent ? 'var(--grad-gold)' : 'var(--grad-maldives)',
  } as const;

  if (reduceMotion) {
    return (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(14,61,76,0.08)] lg:bg-white/12">
        <div className="h-full rounded-full" style={fillStyle} />
      </div>
    );
  }
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(14,61,76,0.08)] lg:bg-white/12">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundImage: fillStyle.backgroundImage }}
        initial={{ width: 0 }}
        animate={{ width }}
        transition={{ duration: 0.7, delay: delay + 0.12, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

function CategoryChip({ label, stats }: { label: string; stats: CategoryAttendanceStats }) {
  if (stats.logged === 0) {
    return (
      <span className="rounded-lg bg-[rgba(14,61,76,0.04)] px-2 py-1 text-[10px] text-[#86868b] lg:bg-white/8 lg:text-white/55">
        {label}: —
      </span>
    );
  }
  return (
    <span
      className="rounded-lg bg-[rgba(14,61,76,0.06)] px-2 py-1 text-[10px] tabular-nums text-[#334155] lg:bg-white/8 lg:text-white/75"
      title={`${label}: Present ${stats.present}, Late ${stats.late}, Absent ${stats.absent}, Excused ${stats.excused}`}
    >
      <span className="font-semibold text-[#0e3d4c] lg:text-sky-300">{label}</span>{' '}
      {stats.attended}/{stats.logged}
      {stats.late > 0 && <span className="text-[#8a6a10] lg:text-amber-300"> · L{stats.late}</span>}
      {stats.absent > 0 && <span className="text-[#d70015] lg:text-rose-300"> · A{stats.absent}</span>}
    </span>
  );
}

const LeaderboardRow: React.FC<{
  entry: LeaderboardEntry;
  isYou: boolean;
  index: number;
  reduceMotion: boolean | null;
  compact: boolean;
}> = ({ entry, isYou, index, reduceMotion, compact }) => {
  const top3 = entry.rank <= 3;
  const content = (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-3 py-3 transition sm:items-center ${
        compact ? 'sm:px-3' : 'sm:px-4'
      } ${
        isYou
          ? 'border-[rgba(14,61,76,0.28)] bg-[rgba(14,61,76,0.06)] ring-1 ring-[rgba(14,61,76,0.12)] lg:border-sky-400/35 lg:bg-sky-400/10 lg:ring-sky-400/20'
          : top3
            ? 'border-[rgba(245,194,76,0.22)] bg-gradient-to-r from-[rgba(245,194,76,0.08)] to-white lg:from-amber-400/20 lg:to-[#0a1628] lg:border-amber-300/35'
            : 'border-black/[0.06] bg-white lg:border-white/10 lg:bg-white/[0.04]'
      }`}
    >
      <RankBadge rank={entry.rank} />
      <Avatar entry={entry} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[15px] font-semibold tracking-tight text-[#1d1d1f] lg:text-[#f5f5f7]">
            {entry.memberName}
          </p>
          {isYou && <span className="apple-badge-forest">You</span>}
        </div>
        <p className="mt-0.5 truncate text-[12px] text-[#86868b] lg:text-white/65">
          {entry.memberType} · {entry.voiceType}
        </p>
        <div className="mt-2 space-y-1.5">
          <ScoreBar
            percent={entry.scorePercent}
            delay={index * 0.05}
            reduceMotion={reduceMotion}
            accent={top3}
          />
          <div className="flex flex-wrap gap-1.5">
            <CategoryChip label="Mass" stats={entry.mass} />
            <CategoryChip label="Special" stats={entry.specialMass} />
            <CategoryChip label="Practice" stats={entry.practice} />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] tabular-nums text-[#64748b] lg:text-white/60">
            <span>
              Overall{' '}
              <strong className="font-semibold text-[#0e3d4c] lg:text-sky-300">
                {entry.sessionAttended}/{entry.sessionLogged}
              </strong>
            </span>
            <span>
              Late <strong className="font-semibold text-[#8a6a10] lg:text-amber-300">{entry.late}</strong>
            </span>
            <span>
              Absent <strong className="font-semibold text-[#d70015] lg:text-rose-300">{entry.absent}</strong>
            </span>
            <span className="sm:ml-auto">
              Rate{' '}
              <strong className="font-semibold text-[#0e3d4c] lg:text-[#f5c24c]">
                {reduceMotion ? (
                  `${entry.scorePercent}%`
                ) : (
                  <>
                    <CountUp value={entry.scorePercent} durationS={0.8} />%
                  </>
                )}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (reduceMotion) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      {top3 ? (
        <motion.div
          animate={{ scale: [1, 1.012, 1] }}
          transition={{ duration: 2.4, delay: 0.4 + index * 0.08, repeat: 0, ease: 'easeInOut' }}
        >
          {content}
        </motion.div>
      ) : (
        content
      )}
    </motion.div>
  );
};

/**
 * Animated attendance reliability leaderboard — Mass / Special / Practice columns.
 */
export const AttendanceLeaderboard: React.FC<AttendanceLeaderboardProps> = ({
  attendanceRecords,
  members,
  viewerMemberId,
  limit,
  compact = false,
  className = '',
}) => {
  const reduceMotion = useReducedMotion();
  const entries = useMemo(
    () => computeAttendanceLeaderboard(attendanceRecords, members),
    [attendanceRecords, members],
  );
  const visible = limit ? entries.slice(0, limit) : entries;
  const you = findLeaderboardRank(entries, viewerMemberId);
  const youOffList = Boolean(you && limit && you.rank > limit);

  return (
    <section
      className={`apple-card overflow-hidden font-apple ${className}`}
      aria-labelledby="attendance-leaderboard-title"
    >
      <div
        className={`border-b border-black/[0.06] lg:border-white/10 ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}
        style={{
          background:
            'linear-gradient(135deg, rgba(14,61,76,0.06) 0%, rgba(245,194,76,0.1) 48%, rgba(255,255,255,0.9) 100%)',
        }}
        data-leaderboard-header
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 inline-flex items-center gap-1.5 apple-badge-gold px-2.5 py-0.5">
              <Trophy className="h-3 w-3" />
              <span className="text-[10px] font-semibold uppercase tracking-wide">Reliability</span>
            </div>
            <h3
              id="attendance-leaderboard-title"
              className={`font-semibold tracking-tight text-[#0e3d4c] lg:text-[#f5f5f7] ${compact ? 'text-[17px]' : 'text-[19px]'}`}
            >
              Attendance Leaderboard
            </h3>
            <p className="mt-1 text-[12px] leading-snug text-[#64748b] lg:text-white/65">{LEADERBOARD_CAPTION}</p>
          </div>
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#0e3d4c] shadow-sm lg:bg-white/10 lg:text-amber-300 lg:shadow-none"
            title={LEADERBOARD_FORMULA_HINT}
            aria-label={LEADERBOARD_FORMULA_HINT}
          >
            <Info className="h-4 w-4" />
          </span>
        </div>
        {you && (
          <p className="mt-2 text-[12px] font-medium text-[#0e3d4c] lg:text-sky-300">
            Your rank: <span className="tabular-nums">#{you.rank}</span>
            <span className="text-[#86868b] lg:text-white/60"> · {you.scorePercent}% reliability</span>
            {entries.length > 0 && (
              <span className="text-[#86868b] lg:text-white/60"> of {entries.length}</span>
            )}
          </p>
        )}
      </div>

      <div className={compact ? 'space-y-2 p-3' : 'space-y-2.5 p-4 sm:p-5'}>
        {visible.length === 0 ? (
          <div className="apple-empty py-10">
            <Users className="mx-auto mb-2 h-9 w-9 text-[#c7c7cc] lg:text-white/40" />
            <p className="text-[14px] font-medium text-[#3a3a3c] lg:text-[#f5f5f7]">No attendance yet</p>
            <p className="mt-1 text-[12px] text-[#86868b] lg:text-white/60">
              Rankings appear once Mass, Special Mass, or Practice check-ins are logged.
            </p>
          </div>
        ) : (
          <>
            {visible.map((entry, index) => (
              <LeaderboardRow
                key={entry.memberId}
                entry={entry}
                isYou={entry.memberId === viewerMemberId}
                index={index}
                reduceMotion={reduceMotion}
                compact={compact}
              />
            ))}
            {youOffList && you && (
              <div className="pt-1">
                <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-[#86868b] lg:text-white/55">
                  Your position
                </p>
                <LeaderboardRow
                  entry={you}
                  isYou
                  index={visible.length}
                  reduceMotion={reduceMotion}
                  compact={compact}
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default AttendanceLeaderboard;
