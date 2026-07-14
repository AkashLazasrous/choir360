import React, { useState } from 'react';
import { Activity, AlertOctagon } from 'lucide-react';
import { Language } from '../../types';
import { MULTILINGUAL_DICTIONARY } from '../../data/mockData';

interface AvailabilityCardProps {
  currentLang: Language;
}

/** Availability toggle with a mandatory reason when unavailable. */
export const AvailabilityCard: React.FC<AvailabilityCardProps> = ({ currentLang }) => {
  const dict = MULTILINGUAL_DICTIONARY[currentLang] || MULTILINGUAL_DICTIONARY.en;

  const [isAvailable, setIsAvailable] = useState(true);
  const [unavailReason, setUnavailReason] = useState('');
  const [availSavedMsg, setAvailSavedMsg] = useState('');

  const handleAvailabilitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAvailable && !unavailReason.trim()) {
      alert("Please provide the reason why you are unavailable.");
      return;
    }
    setAvailSavedMsg(`Your availability for the upcoming Solemn Feast liturgies has been locked into the AI Schedule Optimizer roster! (${isAvailable ? 'Available' : 'Unavailable: ' + unavailReason})`);
    setTimeout(() => setAvailSavedMsg(''), 6000);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4" id="member-availability-card">
      <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-2">
        <Activity className="w-4 h-4 text-emerald-600" />
        {dict.availability}
      </h4>
      <p className="text-[11px] text-slate-500 leading-normal">
        State your availability for upcoming Sunday and Wednesday Solemn Feast Masses so the scheduler optimizer can balance our vocals.
      </p>

      {availSavedMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-medium leading-relaxed">
          {availSavedMsg}
        </div>
      )}

      <form onSubmit={handleAvailabilitySubmit} className="space-y-4 text-xs" id="availability-form">
        <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100 justify-between">
          <span className="font-semibold text-slate-700">Are you available?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setIsAvailable(true); setUnavailReason(''); }}
              className={`px-3 py-1 text-xs font-bold rounded-md cursor-pointer transition ${
                isAvailable ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              Yes, Available
            </button>
            <button
              type="button"
              onClick={() => setIsAvailable(false)}
              className={`px-3 py-1 text-xs font-bold rounded-md cursor-pointer transition ${
                !isAvailable ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              No, Unavailable
            </button>
          </div>
        </div>

        {!isAvailable && (
          <div className="space-y-1.5 animate-slide-up" id="unavail-reason-input-group">
            <label className="text-[10px] font-bold text-rose-700 uppercase flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              State Reason (Mandatory) *
            </label>
            <input
              type="text"
              value={unavailReason}
              onChange={e => setUnavailReason(e.target.value)}
              placeholder="e.g. Travel, parish coordinator duty, medical..."
              className="w-full p-2.5 text-xs rounded-lg border border-rose-200 bg-rose-50/20 focus:ring-1 focus:ring-rose-500 font-medium"
              required={!isAvailable}
            />
          </div>
        )}

        <button
          type="submit"
          id="save-availability-btn"
          className="w-full py-3 min-h-[44px] bg-slate-800 hover:bg-slate-700 font-bold text-white text-xs rounded-xl flex items-center justify-center gap-1 transition shadow-xs"
        >
          Update My Availability
        </button>
      </form>
    </div>
  );
};
