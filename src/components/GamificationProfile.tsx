import React, { useState } from 'react';
import { Award, TrendingUp, Flame, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import type { Member } from '../types';
import {
  buildGamificationProfile,
  LEVEL_COLORS,
  LEVEL_ORDER,
  LEVEL_THRESHOLDS,
  type GamificationProfile,
} from '../services/GamificationEngine';

interface GamificationProfileProps {
  member: Member;
  allMembers?: Member[];
}

const LeaderboardRow: React.FC<{ profile: GamificationProfile; isCurrentUser: boolean }> = ({
  profile, isCurrentUser,
}) => {
  const colors = LEVEL_COLORS[profile.level];
  return (
    <div
      className={`apple-list-row rounded-xl ${
        isCurrentUser ? 'ring-2 ring-[#18392f] bg-[rgba(24,57,47,0.06)]' : 'apple-inset'
      }`}
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(120,120,128,0.12)] text-sm font-semibold text-[#86868b]">
        #{profile.rank ?? '—'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold tracking-tight">{profile.displayName}</p>
        <p className="apple-caption">
          {colors.emoji} {profile.level} · {profile.totalXP.toLocaleString()} XP
        </p>
      </div>
      {isCurrentUser && (
        <span className="apple-badge-forest">You</span>
      )}
    </div>
  );
};

export const GamificationProfileView: React.FC<GamificationProfileProps> = ({
  member,
  allMembers = [] as Member[],
}) => {
  const [showBadges, setShowBadges] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Build profiles for leaderboard
  const allProfiles = [member, ...allMembers.filter((m) => m.id !== member.id)]
    .map((m) => buildGamificationProfile(m))
    .sort((a, b) => b.totalXP - a.totalXP)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const myProfile = allProfiles.find((p) => p.memberId === member.id) ?? buildGamificationProfile(member, 1);
  const colors = LEVEL_COLORS[myProfile.level];
  const earnedBadges = myProfile.badges.filter((b) => b.earned);
  const unearnedBadges = myProfile.badges.filter((b) => !b.earned);

  return (
    <div className="space-y-4 font-apple">
      {/* Level Card */}
      <div className="apple-hero-soft p-6">
        <div className="choir-hero-ambient" aria-hidden />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="apple-caption text-[#a1a1a6]">
              Current Level
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-4xl">{colors.emoji}</span>
              <span className="text-3xl font-semibold tracking-tight text-[#f5f5f7]">{myProfile.level}</span>
            </div>
            {myProfile.rank && (
              <p className="apple-caption mt-1 text-[#a1a1a6]">
                Choir Rank #{myProfile.rank}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold tracking-tight text-[#f5f5f7]">{myProfile.totalXP.toLocaleString()}</p>
            <p className="apple-caption text-[#a1a1a6]">Total XP</p>
            <div className="mt-2 flex items-center gap-1 justify-end">
              <Flame className="h-3.5 w-3.5 text-[#f5c24c]" />
              <span className="text-sm font-semibold text-[#f5f5f7]">{myProfile.streak}mo streak</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {myProfile.level !== 'Legend' && (
          <div className="relative mt-4">
            <div className="mb-1 flex justify-between text-xs font-semibold opacity-80">
              <span>{myProfile.levelXP.toLocaleString()} XP</span>
              <span>{myProfile.nextLevelXP.toLocaleString()} XP to next</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white/80 transition-all duration-1000"
                style={{ width: `${myProfile.progressPct}%` }}
              />
            </div>
            <p className="mt-1 text-right text-[11px] font-bold opacity-70">
              {myProfile.progressPct}% to{' '}
              {LEVEL_ORDER[LEVEL_ORDER.indexOf(myProfile.level) + 1]}
            </p>
          </div>
        )}
      </div>

      {/* Level Roadmap */}
      <div className="apple-card p-5">
        <h3 className="apple-title mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#18392f]" />
          Level Roadmap
        </h3>
        <div className="space-y-2">
          {LEVEL_ORDER.map((lvl) => {
            const c = LEVEL_COLORS[lvl];
            const isCurrentLevel = lvl === myProfile.level;
            const isPast = myProfile.totalXP >= LEVEL_THRESHOLDS[lvl];
            return (
              <div
                key={lvl}
                className={`flex items-center gap-3 rounded-xl p-2 ${
                  isCurrentLevel ? 'ring-2 ring-[#18392f] bg-[rgba(24,57,47,0.06)]' : ''
                }`}
              >
                <span className="text-lg">{c.emoji}</span>
                <div className="flex-1">
                  <p className={`text-sm font-semibold tracking-tight ${isCurrentLevel ? 'text-[#18392f]' : ''}`}>
                    {lvl} {isCurrentLevel && '← You are here'}
                  </p>
                  <p className="apple-caption">{LEVEL_THRESHOLDS[lvl].toLocaleString()} XP</p>
                </div>
                {isPast && <span className="apple-badge-forest text-[11px]">✓ Reached</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div className="apple-card p-5">
        <button
          onClick={() => setShowBadges(!showBadges)}
          className="flex w-full items-center justify-between min-h-[44px]"
        >
          <h3 className="apple-title flex items-center gap-2">
            <Award className="h-4 w-4 text-[#f5c24c]" />
            Achievement Badges
            <span className="ml-1 apple-badge-gold">
              {earnedBadges.length}/{myProfile.badges.length}
            </span>
          </h3>
          {showBadges ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {showBadges && (
          <div className="mt-3 space-y-3">
            {/* Earned */}
            {earnedBadges.length > 0 && (
              <div>
                <p className="apple-label mb-2 text-[#18392f]">
                  Earned ({earnedBadges.length})
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {earnedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="apple-badge-forest flex items-center gap-2 p-3"
                    >
                      <span className="text-2xl">{badge.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold tracking-tight">{badge.name}</p>
                        <p className="apple-caption">+{badge.xpReward} XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unearned */}
            {unearnedBadges.length > 0 && (
              <div>
                <p className="apple-label mb-2">
                  Locked ({unearnedBadges.length})
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {unearnedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="apple-inset flex items-center gap-2 p-3 opacity-50"
                    >
                      <span className="text-2xl grayscale">{badge.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-600">{badge.name}</p>
                        <p className="text-[10px] text-slate-400">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="apple-card p-5">
        <button
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          className="flex w-full items-center justify-between min-h-[44px]"
        >
          <h3 className="apple-title flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#f5c24c]" />
            Choir Leaderboard
          </h3>
          {showLeaderboard ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {showLeaderboard && (
          <div className="mt-3 space-y-2">
            {allProfiles.slice(0, 10).map((p) => (
              <LeaderboardRow
                key={p.memberId}
                profile={p}
                isCurrentUser={p.memberId === member.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
