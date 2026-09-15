import React, { useState, useEffect, useRef } from 'react';
import Modal from './ui/Modal';
import { 
  Sparkles, ZoomIn, ZoomOut, Maximize2, Activity, Contrast, 
  Volume2, Play, Pause, Plus, Trash2, Wand2, Check, AlertCircle, 
  Loader2, RotateCcw, Sliders, Music, Film, Layers, Zap
} from 'lucide-react';
import { apiFetch } from '../lib/api';

const EFFECT_TYPES = [
  { id: 'zoom_in', name: 'Zoom In (Push-In)', icon: ZoomIn, desc: 'Kamera perlahan mendekat ke subjek, menambah intensitas dan fokus hook' },
  { id: 'zoom_out', name: 'Zoom Out (Pull-Back)', icon: ZoomOut, desc: 'Kamera perlahan mundur menjauh, membuka konteks atau penutup adegan' },
  { id: 'punch_in', name: 'Punch In (Emphasis)', icon: Maximize2, desc: 'Framing mendadak lebih dekat pada momen kata kunci atau punchline' },
  { id: 'zoom_pulse', name: 'Zoom Pulse (Beat)', icon: Activity, desc: 'Denyutan cepat maju-mundur mengikuti ketukan ritme' },
  { id: 'bw_moment', name: 'Filter Hitam Putih (B&W)', icon: Contrast, desc: 'Tampilan monokromatik sinematik untuk momen dramatis, flashback, atau meme' },
];

const SFX_OPTIONS = [
  { id: 'whoosh', name: 'Fast Whoosh', icon: '💨', desc: 'Hembusan angin modern TikTok/Reels' },
  { id: 'boom', name: 'Cinematic Boom', icon: '💥', desc: 'Dentuman sub-bass dramatis' },
  { id: 'camera', name: 'Camera Click', icon: '📸', desc: 'Klik jepretan kamera dua ketukan' },
  { id: 'pop', name: 'Bubble Pop', icon: '🎈', desc: 'Letupan gelembung renyah' },
  { id: 'chime', name: 'Notification Bell', icon: '🔔', desc: 'Denting notifikasi viral smartphone' },
  { id: 'none', name: 'Tanpa SFX', icon: '🔇', desc: 'Hanya audio asli klip' },
];

export default function EffectsModal({
  isOpen,
  onClose,
  videoUrl,
  jobId,
  clipIndex = 0,
  inputFilename = null,
  onEffectsApplied = null,
}) {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);

  // List of active effect layers
  const [edits, setEdits] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('viral-hook');

  // Processing state
  const [isApplying, setIsApplying] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [applyMode, setApplyMode] = useState('single'); // 'single' | 'all'
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Sound playback preview
  const playSfxPreview = (sfxId, vol = 0.4) => {
    if (!sfxId || sfxId === 'none') return;
    try {
      const audio = new Audio(`/sfx/${sfxId}.wav`);
      audio.volume = Math.min(1.0, Math.max(0.05, vol));
      audio.play().catch((e) => console.log('SFX play error:', e));
    } catch (e) {
      console.warn('Audio playback not supported:', e);
    }
  };

  // Video time tracking
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const d = videoRef.current.duration || 30;
      setDuration(d);
      // Initialize default viral preset once duration is known
      if (edits.length === 0) {
        applyPreset('viral-hook', d);
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekTo = (sec) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, sec));
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Preset definitions
  const applyPreset = (presetId, clipDur = duration) => {
    setSelectedPreset(presetId);
    const d = clipDur || 30;

    if (presetId === 'viral-hook') {
      const hookEnd = Math.min(3.2, Math.max(1.8, d * 0.22));
      const midStart = Math.min(d - 5.0, Math.max(hookEnd + 1.0, d * 0.42));
      const midEnd = Math.min(d - 3.5, midStart + 2.2);
      const outroStart = Math.max(midEnd + 1.0, d - 3.0);

      const items = [
        {
          id: 'e1',
          type: 'zoom_in',
          start: 0.0,
          end: Math.round(hookEnd * 10) / 10,
          strength: 0.12,
          sfx: 'whoosh',
          sfx_volume: 0.45,
          reason: 'Opening viral hook push-in',
        },
      ];

      if (midEnd > midStart + 0.5) {
        items.push({
          id: 'e2',
          type: 'punch_in',
          start: Math.round(midStart * 10) / 10,
          end: Math.round(midEnd * 10) / 10,
          strength: 0.10,
          sfx: 'pop',
          sfx_volume: 0.35,
          reason: 'Emphasis punchline beat',
        });
      }

      if (outroStart < d - 0.5) {
        items.push({
          id: 'e3',
          type: 'zoom_out',
          start: Math.round(outroStart * 10) / 10,
          end: Math.round(d * 10) / 10,
          strength: 0.12,
          sfx: 'whoosh',
          sfx_volume: 0.35,
          reason: 'Outro pull-back transition',
        });
      }
      setEdits(items);
    } else if (presetId === 'cinematic-bw') {
      const bwStart = Math.max(1.5, d * 0.3);
      const bwEnd = Math.min(d - 2.0, bwStart + 3.5);
      const items = [
        {
          id: 'e1',
          type: 'zoom_in',
          start: 0.0,
          end: Math.min(4.0, d * 0.25),
          strength: 0.08,
          sfx: 'whoosh',
          sfx_volume: 0.4,
          reason: 'Atmospheric slow push',
        },
      ];
      if (bwEnd > bwStart + 1.0) {
        items.push({
          id: 'e2',
          type: 'bw_moment',
          start: Math.round(bwStart * 10) / 10,
          end: Math.round(bwEnd * 10) / 10,
          strength: 0.85,
          sfx: 'boom',
          sfx_volume: 0.55,
          reason: 'Dramatic monochrome moment',
        });
      }
      setEdits(items);
    } else if (presetId === 'high-energy') {
      const items = [
        {
          id: 'e1',
          type: 'zoom_in',
          start: 0.0,
          end: Math.min(2.5, d * 0.18),
          strength: 0.14,
          sfx: 'whoosh',
          sfx_volume: 0.5,
          reason: 'Fast opening kick',
        },
        {
          id: 'e2',
          type: 'punch_in',
          start: Math.min(d * 0.35, d - 4.0),
          end: Math.min(d * 0.35 + 1.8, d - 2.2),
          strength: 0.12,
          sfx: 'pop',
          sfx_volume: 0.4,
          reason: 'Energy punch',
        },
        {
          id: 'e3',
          type: 'zoom_out',
          start: Math.max(0.0, d - 2.5),
          end: Math.round(d * 10) / 10,
          strength: 0.14,
          sfx: 'whoosh',
          sfx_volume: 0.45,
          reason: 'Rapid pull-back',
        },
      ];
      setEdits(items);
    } else if (presetId === 'noir-monochrome') {
      const items = [
        {
          id: 'e1',
          type: 'bw_moment',
          start: 0.0,
          end: Math.round(d * 10) / 10,
          strength: 0.9,
          sfx: 'camera',
          sfx_volume: 0.45,
          reason: 'Full noir black and white atmosphere',
        },
      ];
      setEdits(items);
    }
  };

  // AI Auto-detect endpoint
  const handleAutoDetect = async () => {
    setIsAutoDetecting(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch('/api/effects/auto-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          clip_index: clipIndex,
          input_filename: inputFilename,
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      if (data.recommended_edits && data.recommended_edits.length > 0) {
        const mapped = data.recommended_edits.map((item, idx) => ({
          ...item,
          id: `auto_${idx}_${Date.now()}`,
        }));
        setEdits(mapped);
        setSelectedPreset('ai-detect');
        setSuccessMsg(`Berhasil menganalisis ritme klip (${mapped.length} momen terdeteksi)!`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Auto-detect error:', err);
      setErrorMsg('Gagal menganalisis klip otomatis. Menggunakan preset standar.');
    } finally {
      setIsAutoDetecting(false);
    }
  };

  // Add a new effect item at current time
  const handleAddEffect = () => {
    const start = Math.round(currentTime * 10) / 10;
    const end = Math.min(Math.round(duration * 10) / 10, Math.round((start + 2.5) * 10) / 10);
    const newEdit = {
      id: `manual_${Date.now()}`,
      type: 'zoom_in',
      start,
      end,
      strength: 0.12,
      sfx: 'whoosh',
      sfx_volume: 0.4,
      reason: 'Manual effect',
    };
    setEdits([...edits, newEdit]);
    setSelectedPreset('custom');
  };

  const handleUpdateEdit = (id, field, value) => {
    setEdits(edits.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
    setSelectedPreset('custom');
  };

  const handleRemoveEdit = (id) => {
    setEdits(edits.filter((e) => e.id !== id));
    setSelectedPreset('custom');
  };

  // Apply edits to video
  const handleApply = async (applyToAll = false) => {
    if (edits.length === 0) {
      setErrorMsg('Harap tambahkan setidaknya satu efek visual.');
      return;
    }

    setIsApplying(true);
    setApplyMode(applyToAll ? 'all' : 'single');
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const endpoint = applyToAll ? '/api/effects/apply-all' : '/api/effects/apply';
      const cleanEdits = edits.map((e) => ({
        type: e.type,
        start: parseFloat(e.start),
        end: parseFloat(e.end),
        strength: parseFloat(e.strength || 0.1),
        sfx: e.sfx || 'none',
        sfx_volume: parseFloat(e.sfx_volume || 0.4),
      }));

      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          clip_index: clipIndex,
          input_filename: inputFilename,
          edits: cleanEdits,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Gagal menerapkan efek');
      }

      const data = await res.json();
      if (applyToAll) {
        setSuccessMsg(`Sukses! Efek visual dan SFX berhasil diterapkan ke ${data.updated_clips || 'semua'} klip.`);
      } else {
        setSuccessMsg('Sukses! Efek visual dan SFX berhasil diterapkan pada klip ini.');
      }

      if (onEffectsApplied && data.new_video_url) {
        onEffectsApplied(data.new_video_url);
      }

      setTimeout(() => {
        setSuccessMsg(null);
        if (!applyToAll) {
          onClose();
        }
      }, 2500);
    } catch (err) {
      console.error('Apply effects error:', err);
      setErrorMsg(err.message || 'Gagal merender efek visual dan SFX');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="VFX & AUDIO SFX STUDIO"
      title="Gerakan Kamera, Filter Hitam Putih & Sound Effects"
      size="xl"
    >
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left: Video Player & Scrubbing Preview */}
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col items-center">
          <div className="relative w-[240px] sm:w-[280px] aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-2xl border border-rule group">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              playsInline
            />

            {/* Play/Pause overlay button */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-brass/90 text-surface flex items-center justify-center shadow-lg transition-transform transform group-hover:scale-110">
                {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
              </div>
            </button>

            {/* Current Active Effects Indicator Banner */}
            {edits.map((e) => {
              const isActive = currentTime >= e.start && currentTime <= e.end;
              if (!isActive) return null;
              const eff = EFFECT_TYPES.find((t) => t.id === e.type);
              const EffIcon = eff ? eff.icon : Sparkles;
              return (
                <div
                  key={e.id}
                  className="absolute top-3 left-3 right-3 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-brass/40 shadow-lg flex items-center gap-2 animate-fade"
                >
                  <EffIcon size={14} className="text-brass animate-pulse" />
                  <span className="text-xs font-semibold text-ink uppercase tracking-wider truncate">
                    {eff?.name || e.type}
                  </span>
                  {e.sfx && e.sfx !== 'none' && (
                    <span className="ml-auto text-[11px] text-brass bg-brass/10 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                      <Music size={10} /> {e.sfx}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Time badge */}
            <div className="absolute bottom-2 left-2 bg-surface/80 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-mono text-ink font-semibold">
              {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
            </div>
          </div>

          {/* Scrubber bar */}
          <div className="w-full max-w-[280px] mt-3 space-y-1.5">
            <div className="flex justify-between text-[11px] text-muted font-mono">
              <span>0.0s</span>
              <span className="text-brass font-bold">{currentTime.toFixed(1)}s</span>
              <span>{duration.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 30}
              step="0.1"
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="w-full accent-brass cursor-pointer"
            />
          </div>
        </div>

        {/* Right: Presets, Timeline Editor, and Controls */}
        <div className="flex-1 w-full space-y-5">
          {/* Preset Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="eyebrow block">PRESET CEPAT (1-KLIK)</label>
              <button
                onClick={handleAutoDetect}
                disabled={isAutoDetecting}
                className="text-xs font-medium text-brass hover:text-brass/80 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Deteksi ketukan suara pembicara dan terapkan efek otomatis"
              >
                {isAutoDetecting ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                Auto-Detect Ritme Audio
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => applyPreset('viral-hook')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  selectedPreset === 'viral-hook'
                    ? 'border-brass bg-brass/10 text-ink shadow-sm'
                    : 'border-rule bg-paper hover:bg-surface text-ink2'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span className="text-sm">🚀</span> Viral Hook
                </div>
                <div className="text-[10px] text-muted leading-tight mt-1">
                  Zoom In awal + Punch beat + Zoom Out akhir
                </div>
              </button>

              <button
                onClick={() => applyPreset('cinematic-bw')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  selectedPreset === 'cinematic-bw'
                    ? 'border-brass bg-brass/10 text-ink shadow-sm'
                    : 'border-rule bg-paper hover:bg-surface text-ink2'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span className="text-sm">🎬</span> Drama & B&W
                </div>
                <div className="text-[10px] text-muted leading-tight mt-1">
                  Filter Hitam Putih + Boom SFX dramatis
                </div>
              </button>

              <button
                onClick={() => applyPreset('high-energy')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  selectedPreset === 'high-energy'
                    ? 'border-brass bg-brass/10 text-ink shadow-sm'
                    : 'border-rule bg-paper hover:bg-surface text-ink2'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span className="text-sm">⚡</span> High Energy
                </div>
                <div className="text-[10px] text-muted leading-tight mt-1">
                  Punch In & Zoom bertubi-tubi + Whoosh/Pop
                </div>
              </button>

              <button
                onClick={() => applyPreset('noir-monochrome')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  selectedPreset === 'noir-monochrome'
                    ? 'border-brass bg-brass/10 text-ink shadow-sm'
                    : 'border-rule bg-paper hover:bg-surface text-ink2'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span className="text-sm">🖤</span> Noir Monokrom
                </div>
                <div className="text-[10px] text-muted leading-tight mt-1">
                  Full Hitam Putih + Camera Click SFX
                </div>
              </button>
            </div>
          </div>

          {/* Active Effects List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className="eyebrow block">TIMELINE EFEK & SOUND EFFECTS ({edits.length})</label>
              </div>
              <button
                onClick={handleAddEffect}
                className="text-xs font-semibold text-brass hover:text-brass/80 flex items-center gap-1 transition-colors"
              >
                <Plus size={14} /> Tambah Efek Visual
              </button>
            </div>

            {edits.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-rule bg-paper/50 text-muted space-y-2">
                <Film size={28} className="mx-auto opacity-40" />
                <p className="text-sm">Belum ada efek visual pada klip ini.</p>
                <button
                  onClick={() => applyPreset('viral-hook')}
                  className="btn-primary text-xs py-1.5 px-3 rounded-lg"
                >
                  Gunakan Preset Viral Hook
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1.5 [color-scheme:dark]">
                {edits.map((edit) => {
                  const effConfig = EFFECT_TYPES.find((t) => t.id === edit.type) || EFFECT_TYPES[0];
                  const EffIcon = effConfig.icon;
                  const isCurrent = currentTime >= edit.start && currentTime <= edit.end;

                  return (
                    <div
                      key={edit.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-brass bg-brass/5 shadow-md ring-1 ring-brass/30'
                          : 'border-rule bg-paper hover:border-rule/80'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-rule/60">
                        {/* Type selection */}
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-surface border border-rule flex items-center justify-center text-brass shrink-0">
                            <EffIcon size={16} />
                          </div>
                          <select
                            value={edit.type}
                            onChange={(e) => handleUpdateEdit(edit.id, 'type', e.target.value)}
                            className="text-xs font-bold text-ink bg-surface border border-rule rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brass cursor-pointer"
                          >
                            {EFFECT_TYPES.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Timing controls */}
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-muted">mulai:</span>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max={edit.end}
                              value={edit.start}
                              onChange={(e) => handleUpdateEdit(edit.id, 'start', parseFloat(e.target.value) || 0)}
                              className="w-14 px-1.5 py-1 text-center bg-surface border border-rule rounded text-ink focus:border-brass focus:outline-none"
                            />
                            <span className="text-[11px] text-muted">s</span>
                          </div>

                          <span className="text-muted">→</span>

                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-muted">selesai:</span>
                            <input
                              type="number"
                              step="0.1"
                              min={edit.start + 0.2}
                              max={duration}
                              value={edit.end}
                              onChange={(e) => handleUpdateEdit(edit.id, 'end', parseFloat(e.target.value) || duration)}
                              className="w-14 px-1.5 py-1 text-center bg-surface border border-rule rounded text-ink focus:border-brass focus:outline-none"
                            />
                            <span className="text-[11px] text-muted">s</span>
                          </div>

                          {/* Jump to time button */}
                          <button
                            onClick={() => seekTo(edit.start)}
                            className="p-1 text-muted hover:text-brass transition-colors"
                            title="Lompat ke waktu ini"
                          >
                            <Play size={13} />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleRemoveEdit(edit.id)}
                            className="p-1 text-muted hover:text-danger transition-colors"
                            title="Hapus efek ini"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Second row: SFX choice & Strength */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 text-xs">
                        {/* SFX selection & Preview */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted shrink-0 flex items-center gap-1">
                            <Music size={12} className="text-brass" /> SFX:
                          </span>
                          <select
                            value={edit.sfx || 'none'}
                            onChange={(e) => {
                              handleUpdateEdit(edit.id, 'sfx', e.target.value);
                              playSfxPreview(e.target.value, edit.sfx_volume);
                            }}
                            className="flex-1 text-xs bg-surface border border-rule rounded-lg px-2 py-1 text-ink focus:outline-none focus:border-brass cursor-pointer"
                          >
                            {SFX_OPTIONS.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.icon} {s.name}
                              </option>
                            ))}
                          </select>

                          {edit.sfx && edit.sfx !== 'none' && (
                            <button
                              onClick={() => playSfxPreview(edit.sfx, edit.sfx_volume)}
                              className="p-1.5 bg-surface border border-rule hover:border-brass rounded text-muted hover:text-brass transition-colors shrink-0"
                              title="Dengarkan suara SFX"
                            >
                              <Volume2 size={13} />
                            </button>
                          )}
                        </div>

                        {/* Intensity / Strength */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted shrink-0 flex items-center gap-1">
                            <Sliders size={12} className="text-brass" /> Intensitas:
                          </span>
                          <input
                            type="range"
                            min="0.05"
                            max="0.20"
                            step="0.01"
                            value={edit.strength || 0.12}
                            onChange={(e) => handleUpdateEdit(edit.id, 'strength', parseFloat(e.target.value))}
                            className="flex-1 accent-brass cursor-pointer"
                          />
                          <span className="font-mono text-[11px] text-ink font-semibold w-8 text-right">
                            {Math.round((edit.strength || 0.12) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 rounded-lg text-xs bg-danger/10 border border-danger/30 text-danger flex items-center gap-2 animate-fade">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2 animate-fade">
              <Check size={15} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-rule flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-muted">
              Presisi 4K 9:16 vertical • Audio speech pembicara tetap utuh
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleApply(true)}
                disabled={isApplying || edits.length === 0}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-rule hover:border-brass/80 text-xs font-semibold text-ink hover:text-brass transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                title="Terapkan efek ini ke seluruh klip dalam project sekaligus"
              >
                {isApplying && applyMode === 'all' ? (
                  <Loader2 size={14} className="animate-spin text-brass" />
                ) : (
                  <Layers size={14} />
                )}
                Terapkan Semua Klip
              </button>

              <button
                onClick={() => handleApply(false)}
                disabled={isApplying || edits.length === 0}
                className="flex-1 sm:flex-none btn-primary px-5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg"
              >
                {isApplying && applyMode === 'single' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                {isApplying ? 'Merender Efek…' : 'Terapkan Efek (Klip Ini)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
