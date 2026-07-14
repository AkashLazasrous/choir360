import React, { useState } from 'react';
import { MessageSquare, Camera, Heart } from 'lucide-react';
import { Member } from '../../types';

interface PrayerWallProps {
  member: Member;
}

interface PrayerPost {
  id: number;
  author: string;
  text: string;
  category: string;
  prays: number;
  userPrayed: boolean;
}

/** Community prayer-request wall: post intentions and "pray with us" reactions. */
export const PrayerWall: React.FC<PrayerWallProps> = ({ member }) => {
  const [prayers, setPrayers] = useState<PrayerPost[]>([]);
  const [newPrayerText, setNewPrayerText] = useState("");
  const [successPost, setSuccessPost] = useState("");

  const handlePostPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayerText.trim()) return;
    const added: PrayerPost = {
      id: prayers.length + 1,
      author: `${member.firstName} ${member.lastName} (${member.voiceType} Cantor)`,
      text: newPrayerText,
      category: "Personal Intention",
      prays: 0,
      userPrayed: false
    };
    setPrayers([added, ...prayers]);
    setNewPrayerText("");
    setSuccessPost("Prayer request posted to the Parish Choir prayer wall!");
    setTimeout(() => setSuccessPost(""), 4000);
  };

  const handleIncrementPray = (id: number) => {
    setPrayers(prayers.map(p => {
      if (p.id === id) {
        return {
          ...p,
          prays: p.userPrayed ? p.prays - 1 : p.prays + 1,
          userPrayed: !p.userPrayed
        };
      }
      return p;
    }));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 shadow-xs" id="member-social-wall">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <h4 className="font-sans font-bold text-slate-805 text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          Choir360 Community Prayer Request Wall
        </h4>
        <span className="text-[10px] text-slate-450 italic font-medium">Connected with Tamil Choirs</span>
      </div>

      {/* Input Form */}
      {successPost && (
        <p className="text-xs p-2 bg-emerald-50 text-emerald-805 border border-emerald-200 rounded-lg font-medium">
          {successPost}
        </p>
      )}

      <form onSubmit={handlePostPrayer} className="space-y-3" id="social-post-prayer-form">
        <div className="relative">
          <textarea
            value={newPrayerText}
            onChange={e => setNewPrayerText(e.target.value)}
            placeholder="Share general choir announcements, propose liturgical intentions, or attach a feast photo..."
            className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 outline-none h-18 text-slate-805 bg-slate-50/20"
          />
        </div>
        <div className="flex justify-between items-center">
          <button
            type="button"
            disabled
            className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center gap-1 font-medium bg-slate-105 px-2 py-1 rounded border border-slate-200 cursor-pointer transition"
          >
            <Camera className="w-3.5 h-3.5 text-slate-400" /> Photo upload unavailable
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Share to Choir Wall
          </button>
        </div>
      </form>

      {/* Prayers List Feed */}
      <div className="space-y-3.5 pt-2" id="prayers-forum-feed">
        {prayers.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No prayer requests have been posted yet.
          </div>
        )}
        {prayers.map((pr) => (
          <div key={pr.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition space-y-2.5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-805 leading-none">{pr.author}</p>
                <span className="text-[9px] font-mono text-slate-400">Posted on General Parish feed</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-800 border border-purple-100 uppercase">
                {pr.category}
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-sans">{pr.text}</p>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-100/60 justify-between text-xs">
              <button
                type="button"
                onClick={() => handleIncrementPray(pr.id)}
                className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md transition cursor-pointer ${
                  pr.userPrayed
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-white hover:bg-slate-100 text-slate-650 border border-slate-200'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${pr.userPrayed ? 'fill-emerald-700 text-emerald-700 animate-bounce' : 'text-slate-405'}`} />
                <span>{pr.userPrayed ? "I am Praying" : "Pray with Us"} ({pr.prays})</span>
              </button>
              <span className="text-[9px] text-slate-400 font-mono">Feedback is live</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
