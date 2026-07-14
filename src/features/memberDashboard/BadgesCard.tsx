import React from 'react';
import { Award } from 'lucide-react';

/** Gamification level progress and earned badges. */
export const BadgesCard: React.FC = () => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4" id="member-gamification-card">
    <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-2 pb-2 border-b border-slate-50">
      <Award className="w-4 h-4 text-amber-500" />
      My Choral Badges & Level
    </h4>

    {/* Level status */}
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-700">Cantor status: <span className="text-emerald-700">Level 4</span></span>
        <span className="text-[10px] text-slate-400 font-mono">2,450 / 3,000 XP</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1.5">
        <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '81%' }} />
      </div>
      <p className="text-[10px] text-slate-500 leading-normal">
        Earn 550 XP from upcoming rehearsals or translations to level-up to <strong>Choral Director (Level 5)</strong>!
      </p>
    </div>

    {/* Badges list */}
    <div className="grid grid-cols-2 gap-3" id="badges-grid-case">
      <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl text-center space-y-1 hover:shadow-2xs transition duration-200">
        <div className="text-xl">👑</div>
        <p className="text-[10px] font-bold text-slate-800">Perfect Attendance</p>
        <p className="text-[9px] text-slate-400">Ordinary Season</p>
      </div>

      <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl text-center space-y-1 hover:shadow-2xs transition duration-200">
        <div className="text-xl">🎵</div>
        <p className="text-[10px] font-bold text-slate-800">Music Master</p>
        <p className="text-[9px] text-slate-400">Transliteration</p>
      </div>

      <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl text-center space-y-1 hover:shadow-2xs transition duration-200">
        <div className="text-xl">🤝</div>
        <p className="text-[10px] font-bold text-slate-800">Service Veteran</p>
        <p className="text-[9px] text-slate-400">10 Wedding Masses</p>
      </div>

      <div className="p-3 bg-purple-50/40 border border-purple-100 rounded-xl text-center space-y-1 hover:shadow-2xs transition duration-200">
        <div className="text-xl">🌟</div>
        <p className="text-[10px] font-bold text-slate-800">Vocal Pillar</p>
        <p className="text-[9px] text-slate-400">Soprano High Spec</p>
      </div>
    </div>
  </div>
);
