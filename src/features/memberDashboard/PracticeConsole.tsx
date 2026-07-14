import React, { useState } from 'react';
import { Music, Play, Pause } from 'lucide-react';

/** Vocal register isolation mixer, tempo control, and mock pitch trainer. */
export const PracticeConsole: React.FC = () => {
  const [isPlayingPractice, setIsPlayingPractice] = useState(false);
  const [sopranoVol, setSopranoVol] = useState(85);
  const [altoVol, setAltoVol] = useState(70);
  const [tenorVol, setTenorVol] = useState(40);
  const [bassVol, setBassVol] = useState(90);
  const [organVol, setOrganVol] = useState(60);
  const [tempoBpm, setTempoBpm] = useState(96);
  const [isRecordActive, setIsRecordActive] = useState(false);
  const [pitchAccuracy, setPitchAccuracy] = useState<number | null>(null);
  const [pitchMatches, setPitchMatches] = useState<string>('');

  const triggerRecordAndAnalyze = () => {
    setIsRecordActive(true);
    setPitchAccuracy(null);
    setPitchMatches("Listening to Cantor vocal register mic entry...");
    setTimeout(() => {
      const mockAcc = Math.floor(Math.random() * 15) + 84; // 84 to 98%
      setPitchAccuracy(mockAcc);
      setIsRecordActive(false);
      setPitchMatches(`Acoustics Analyzed! Freq Match: ${mockAcc >= 95 ? 'A4 440Hz' : 'A4 438Hz'}. Deviation: ${100 - mockAcc} cents. Breath balance: Steady & Ideal! Excellent support.`);
    }, 2500);
  };

  return (
    <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-md border border-slate-800 space-y-5 shadow-xs" id="member-practice-isolation-card">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <h4 className="font-sans font-bold text-white text-sm flex items-center gap-2">
          <Music className="w-4 h-4 text-emerald-400" />
          Vocal Register Rehearsal & Isolation Console
        </h4>
        <span className="text-[9px] bg-slate-800 font-mono text-emerald-400 px-2 py-0.5 rounded-full uppercase border border-slate-700">
          OFFLINE CACHED
        </span>
      </div>

      <p className="text-[11px] text-slate-400 leading-normal">
        Practice upcoming feast scores. Drag individual sliders to isolate each register voice dynamically, adjust the tempo, or record your voice.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Isolation Sliders */}
        <div className="space-y-3.5" id="register-sliders">
          <h5 className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Register Balance Mixer</h5>

          {/* Soprano Voice */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-bold text-slate-350">Soprano (Melodic Voice)</span>
              <span className="font-mono text-emerald-400">{sopranoVol}%</span>
            </div>
            <input type="range" min="0" max="100" value={sopranoVol} onChange={e => setSopranoVol(Number(e.target.value))} className="w-full accent-emerald-500" />
          </div>

          {/* Alto Voice */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-bold text-slate-350">Alto (Harmony Mid)</span>
              <span className="font-mono text-blue-400">{altoVol}%</span>
            </div>
            <input type="range" min="0" max="100" value={altoVol} onChange={e => setAltoVol(Number(e.target.value))} className="w-full accent-blue-500" />
          </div>

          {/* Tenor Voice */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-bold text-slate-350">Tenor (Tenor Lead Harmony)</span>
              <span className="font-mono text-amber-400">{tenorVol}%</span>
            </div>
            <input type="range" min="0" max="100" value={tenorVol} onChange={e => setTenorVol(Number(e.target.value))} className="w-full accent-amber-500" />
          </div>

          {/* Bass Voice */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-bold text-slate-350">Bass (Fundamental Acoustic)</span>
              <span className="font-mono text-purple-400">{bassVol}%</span>
            </div>
            <input type="range" min="0" max="100" value={bassVol} onChange={e => setBassVol(Number(e.target.value))} className="w-full accent-purple-500" />
          </div>

          {/* Organ / Synthesizer */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-bold text-slate-305">Church Organ Guide</span>
              <span className="font-mono text-slate-400">{organVol}%</span>
            </div>
            <input type="range" min="0" max="100" value={organVol} onChange={e => setOrganVol(Number(e.target.value))} className="w-full accent-slate-400" />
          </div>
        </div>

        {/* Player State & Recording test */}
        <div className="space-y-4 bg-slate-800/50 p-4 rounded-xl border border-slate-800 flex flex-col justify-between" id="player-calibration">
          <div className="space-y-2">
            <h5 className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Practice Deck Console</h5>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlayingPractice(!isPlayingPractice)}
                className={`p-3 rounded-full text-white cursor-pointer transition ${
                  isPlayingPractice ? 'bg-rose-600' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {isPlayingPractice ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <div>
                <h6 className="text-xs font-bold font-sans">Imported PDF Songbook (Roster Rehearsal)</h6>
                <p className="text-[9px] text-slate-400 font-mono">Key: Em • Tempo: {tempoBpm} BPM</p>
              </div>
            </div>

            {/* Tempo slider */}
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                <span>Tempo (BPM)</span>
                <span className="font-mono text-white">{tempoBpm} BPM</span>
              </div>
              <input type="range" min="60" max="150" value={tempoBpm} onChange={e => setTempoBpm(Number(e.target.value))} className="w-full accent-emerald-505" />
            </div>
          </div>

          {/* Audio record & analysis */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-750 text-[11px] space-y-2">
            <div className="flex justify-between items-center bg-slate-900 pb-1.5 border-b border-slate-800">
              <span className="font-bold text-slate-300">Pitch Trainer</span>
              <button
                type="button"
                onClick={triggerRecordAndAnalyze}
                disabled={isRecordActive}
                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[9px] disabled:opacity-40 cursor-pointer"
              >
                {isRecordActive ? "Analyzing..." : "Record & Test"}
              </button>
            </div>
            {pitchMatches && (
              <p className="text-[10px] text-emerald-410 leading-relaxed font-mono">
                {pitchMatches}
              </p>
            )}
            {pitchAccuracy !== null && (
              <div className="flex justify-between items-center border-t border-slate-800/80 pt-1 text-[10px]">
                <span className="text-slate-400">Vocal Register Pitch Alignment:</span>
                <span className="font-mono font-bold text-white text-[11px]">
                  {pitchAccuracy}% Match {pitchAccuracy >= 94 ? "🏆" : "👍"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
