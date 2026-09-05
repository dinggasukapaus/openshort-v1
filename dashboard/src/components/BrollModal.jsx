import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Search, Upload, Sparkles, Film, Check, AlertCircle, 
  Loader2, Play, Pause, RotateCcw, Volume2, VolumeX, Key, 
  Layers, ChevronRight, ExternalLink, HelpCircle
} from 'lucide-react';
import Modal from './ui/Modal';
import { apiFetch, apiJson } from '../lib/api';
import { getApiUrl } from '../config';

const STOCK_NICHE_TAGS = [
  { label: '🤖 AI & Tech', query: 'artificial intelligence technology' },
  { label: '💼 Bisnis & Cuan', query: 'business finance money growth' },
  { label: '💻 Coding & Dev', query: 'coding developer software computer' },
  { label: '⛰️ Nature Aerial', query: 'nature aerial drone landscape' },
  { label: '😲 Reaksi & Fokus', query: 'reaction face surprised emotion' },
  { label: '🌆 City & Urban', query: 'city urban timelapse street neon' },
];

export default function BrollModal({
  isOpen,
  onClose,
  videoUrl,
  jobId,
  clipIndex,
  inputFilename,
  onBrollApplied,
}) {
  if (!isOpen) return null;

  // Tabs
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'upload' | 'ai'

  // Stock Search State
  const [searchQuery, setSearchQuery] = useState('technology');
  const [stockVideos, setStockVideos] = useState([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [hasPexelsKey, setHasPexelsKey] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [customPexelsKey, setCustomPexelsKey] = useState(() => {
    try {
      return localStorage.getItem('openshorts_pexels_key') || '';
    } catch {
      return '';
    }
  });

  // Custom Media Upload State
  const [uploadedMediaBase64, setUploadedMediaBase64] = useState(null);
  const [uploadedMediaName, setUploadedMediaName] = useState('');
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState(null);
  const [directVideoUrl, setDirectVideoUrl] = useState('');
  const fileInputRef = useRef(null);

  // AI Suggestions State
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Transcript & Timing State
  const [captions, setCaptions] = useState([]);
  const [isLoadingCaptions, setIsLoadingCaptions] = useState(false);
  const [clipDuration, setClipDuration] = useState(30.0);
  const [startTime, setStartTime] = useState(2.0);
  const [endTime, setEndTime] = useState(5.0);
  const [transition, setTransition] = useState('dissolve'); // 'dissolve' | 'cut'
  const [brollVolume, setBrollVolume] = useState(0.0); // 0.0 = silent (narrator voice 100%)

  // Video Preview Player
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Burning / Apply State
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState(null);

  // 1. Fetch word-level transcript when modal opens
  useEffect(() => {
    if (!isOpen || !jobId || clipIndex === undefined) return;
    setIsLoadingCaptions(true);
    apiFetch(`/api/clip/${jobId}/${clipIndex}/transcript`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.captions) {
          setCaptions(data.captions);
          const dur = data.durationSec || 30.0;
          setClipDuration(dur);
          const initStart = Math.min(Math.max(1.0, dur * 0.2), Math.max(0, dur - 3.5));
          const initEnd = Math.min(dur, initStart + 3.0);
          setStartTime(Number(initStart.toFixed(1)));
          setEndTime(Number(initEnd.toFixed(1)));
        }
      })
      .catch((err) => console.error('Failed to load clip transcript:', err))
      .finally(() => setIsLoadingCaptions(false));
  }, [isOpen, jobId, clipIndex]);

  // 2. Fetch stock videos on tab or search
  const fetchStockVideos = async (query = searchQuery) => {
    setIsLoadingStock(true);
    try {
      const headers = {};
      if (customPexelsKey.trim()) {
        headers['X-Pexels-Key'] = customPexelsKey.trim();
      }
      const res = await apiFetch(`/api/broll/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=12`, { headers });
      if (res.ok) {
        const data = await res.json();
        setStockVideos(data.results || []);
        setHasPexelsKey(data.has_pexels_key || false);
        if (data.results && data.results.length > 0 && !selectedStock && !uploadedMediaBase64 && !directVideoUrl) {
          setSelectedStock(data.results[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching stock videos:', err);
    } finally {
      setIsLoadingStock(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStockVideos(searchQuery);
    }
  }, [isOpen]);

  const handleSavePexelsKey = (key) => {
    setCustomPexelsKey(key);
    try {
      localStorage.setItem('openshorts_pexels_key', key);
    } catch (_) {}
    fetchStockVideos(searchQuery);
  };

  // 3. AI Suggestion fetch
  const handleFetchAiSuggestions = async () => {
    setIsLoadingAi(true);
    setAiError(null);
    try {
      const res = await apiFetch('/api/broll/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          clip_index: clipIndex,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        if (!data.suggestions || data.suggestions.length === 0) {
          setAiError('Tidak ada momen B-Roll yang terdeteksi dari transkrip.');
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setAiError(err.detail || 'Gagal memuat saran AI.');
      }
    } catch (err) {
      setAiError(err.message || 'Koneksi ke AI gagal.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleApplySuggestion = (sug) => {
    setStartTime(Number(sug.start_sec.toFixed(1)));
    setEndTime(Number(sug.end_sec.toFixed(1)));
    if (sug.keyword) {
      setSearchQuery(sug.keyword);
      setActiveTab('stock');
      fetchStockVideos(sug.keyword);
    }
  };

  // 4. Word clicker on transcript
  const handleWordClick = (word) => {
    const wordStart = word.startMs / 1000.0;
    const wordEnd = word.endMs / 1000.0;
    
    if (wordStart < startTime || Math.abs(wordStart - startTime) < Math.abs(wordEnd - endTime)) {
      setStartTime(Number(wordStart.toFixed(1)));
      if (wordEnd > endTime) {
        setEndTime(Number(Math.min(clipDuration, wordEnd + 1.5).toFixed(1)));
      }
    } else {
      setEndTime(Number(wordEnd.toFixed(1)));
    }

    if (videoRef.current) {
      videoRef.current.currentTime = wordStart;
    }
  };

  // 5. File upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedMediaName(file.name);
    const objectUrl = URL.createObjectURL(file);
    setUploadedPreviewUrl(objectUrl);
    setSelectedStock(null);
    setDirectVideoUrl('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedMediaBase64(ev.target?.result);
    };
    reader.readAsDataURL(file);
  };

  // 6. Scrubbing and range preview
  const handlePlayRange = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, startTime - 0.5);
    videoRef.current.play();
    setIsPlaying(true);
  };

  const isWithinBrollRange = currentTime >= startTime && currentTime <= endTime;

  // 7. Apply B-Roll to video via FFmpeg
  const handleApplyBroll = async () => {
    if (endTime <= startTime) {
      setApplyError('Waktu selesai harus lebih besar dari waktu mulai.');
      return;
    }

    setIsApplying(true);
    setApplyError(null);
    setApplySuccess(false);

    try {
      const payload = {
        job_id: jobId,
        clip_index: clipIndex,
        start_time: startTime,
        end_time: endTime,
        transition: transition,
        transition_duration: 0.3,
        broll_volume: brollVolume,
        input_filename: inputFilename || null,
      };

      if (uploadedMediaBase64) {
        payload.broll_source = 'upload';
        payload.broll_base64 = uploadedMediaBase64;
      } else if (directVideoUrl.trim()) {
        payload.broll_source = 'url';
        payload.broll_url = directVideoUrl.trim();
      } else if (selectedStock) {
        payload.broll_source = 'stock';
        payload.broll_url = selectedStock.download_url || selectedStock.preview_url;
      } else {
        throw new Error('Pilih salah satu footage Stock Video atau upload media terlebih dahulu.');
      }

      const res = await apiFetch('/api/broll/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Gagal menerapkan B-Roll ke video');
      }

      const data = await res.json();
      setApplySuccess(true);

      if (onBrollApplied && data.new_video_url) {
        onBrollApplied(data.new_video_url);
      }

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      console.error('B-Roll apply error:', err);
      setApplyError(err.message || 'Terjadi kesalahan saat merender B-roll.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="B-Roll Studio & Video Inserter 🎬"
      eyebrow="CINEMATIC SHORT-FORM OVERLAY"
      size="xl"
    >
      <div className="flex flex-col lg:flex-row gap-6 items-start mt-1">
        
        {/* LEFT COLUMN: Video Player & Timeline */}
        <div className="w-full lg:w-[360px] shrink-0 flex flex-col items-center">
          <div className="relative w-full aspect-[9/16] bg-black rounded-card overflow-hidden border border-rule shadow-xl flex items-center justify-center group">
            <video
              ref={videoRef}
              src={videoUrl}
              crossOrigin="anonymous"
              playsInline
              className="w-full h-full object-cover"
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* In-Preview B-Roll Simulation Indicator */}
            {isWithinBrollRange && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] border-2 border-brass/80 flex flex-col items-center justify-center p-4 text-center pointer-events-none animate-fade">
                <span className="bg-brass text-black text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2 shadow-lg flex items-center gap-1">
                  <Film size={12} /> B-Roll Active ({transition})
                </span>
                {selectedStock?.image && (
                  <img
                    src={selectedStock.image}
                    alt="B-roll preview"
                    className="w-28 h-40 object-cover rounded-lg border border-white/40 shadow-2xl mb-1.5"
                  />
                )}
                {uploadedPreviewUrl && (
                  <img
                    src={uploadedPreviewUrl}
                    alt="Custom B-roll"
                    className="w-28 h-40 object-cover rounded-lg border border-white/40 shadow-2xl mb-1.5"
                  />
                )}
                <p className="text-white text-xs font-semibold drop-shadow">
                  {selectedStock?.title || uploadedMediaName || 'Footage Terpilih'}
                </p>
                <p className="text-white/70 text-[10px]">
                  Audio suara narator tetap aktif & jernih
                </p>
              </div>
            )}

            {/* Play/Pause Overlay Button */}
            <button
              onClick={() => {
                if (videoRef.current) {
                  if (isPlaying) videoRef.current.pause();
                  else videoRef.current.play();
                }
              }}
              className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>
          </div>

          {/* Player Controls & Scrubber */}
          <div className="w-full mt-3 p-3 bg-paper3 rounded-input border border-rule space-y-2">
            <div className="flex items-center justify-between text-xs text-muted font-mono">
              <span className="flex items-center gap-1">
                ⏱️ Waktu: <strong className="text-brass">{currentTime.toFixed(1)}s</strong> / {clipDuration.toFixed(1)}s
              </span>
              <button
                onClick={handlePlayRange}
                className="text-[11px] px-2 py-0.5 rounded bg-brass/20 text-brass hover:bg-brass hover:text-black font-semibold transition-colors flex items-center gap-1"
                title="Putar preview di sekitar detik B-Roll"
              >
                <Play size={10} /> Preview Range
              </button>
            </div>

            {/* Timeline Progress with B-Roll Highlight Band */}
            <div className="relative w-full h-4 flex items-center cursor-pointer">
              <div className="absolute w-full h-1.5 bg-paper2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brass/40"
                  style={{
                    marginLeft: `${(startTime / clipDuration) * 100}%`,
                    width: `${((endTime - startTime) / clipDuration) * 100}%`,
                  }}
                />
              </div>
              <input
                type="range"
                min="0"
                max={clipDuration || 30}
                step="0.1"
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCurrentTime(val);
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="w-full accent-brass cursor-pointer opacity-80"
              />
            </div>
          </div>

          {/* Notice & Status */}
          {applySuccess && (
            <div className="w-full mt-2.5 p-2.5 rounded-input bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-medium animate-fade">
              <Check size={16} className="shrink-0 text-emerald-400" />
              <span>B-Roll Berhasil Disisipkan ke Klip!</span>
            </div>
          )}

          {applyError && (
            <div className="w-full mt-2.5 p-2.5 rounded-input bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 font-medium animate-fade">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span className="break-words text-[11px]">{applyError}</span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Tabs, Stock Library, Word Clicker & Timing */}
        <div className="flex-1 w-full space-y-4">
          
          {/* Top Tabs */}
          <div className="flex items-center justify-between border-b border-rule pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('stock')}
                className={`px-3 py-1.5 rounded-input text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'stock'
                    ? 'bg-brass text-black font-bold shadow'
                    : 'text-ink2 hover:text-ink hover:bg-paper3'
                }`}
              >
                <Search size={14} /> Stock Pexels
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-input text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-brass text-black font-bold shadow'
                    : 'text-ink2 hover:text-ink hover:bg-paper3'
                }`}
              >
                <Upload size={14} /> Upload Sendiri
              </button>
              <button
                onClick={() => {
                  setActiveTab('ai');
                  if (suggestions.length === 0) handleFetchAiSuggestions();
                }}
                className={`px-3 py-1.5 rounded-input text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'ai'
                    ? 'bg-brass text-black font-bold shadow'
                    : 'text-ink2 hover:text-ink hover:bg-paper3'
                }`}
              >
                <Sparkles size={14} /> ✨ Saran AI
              </button>
            </div>

            {/* Custom Pexels Key Toggle */}
            {activeTab === 'stock' && (
              <button
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="text-[11px] text-muted hover:text-brass flex items-center gap-1 transition-colors"
                title="Atur Pexels API Key sendiri"
              >
                <Key size={12} /> {customPexelsKey ? 'API Key Aktif' : 'Atur API Key'}
              </button>
            )}
          </div>

          {/* TAB 1: STOCK VIDEOS */}
          {activeTab === 'stock' && (
            <div className="space-y-3">
              {showKeyInput && (
                <div className="p-3 bg-paper3 rounded-input border border-rule text-xs space-y-2 animate-fade">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink flex items-center gap-1">
                      <Key size={12} className="text-brass" /> Pexels API Key (Gratis 20.000 req/bln)
                    </span>
                    <a
                      href="https://www.pexels.com/api/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-brass hover:underline flex items-center gap-0.5"
                    >
                      Daftar Key <ExternalLink size={10} />
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Tempel Pexels API Key Anda..."
                      value={customPexelsKey}
                      onChange={(e) => setCustomPexelsKey(e.target.value)}
                      className="input flex-1 text-xs py-1.5 px-2.5 rounded-input"
                    />
                    <button
                      onClick={() => handleSavePexelsKey(customPexelsKey)}
                      className="px-3 py-1.5 bg-paper2 hover:bg-paper text-ink font-semibold rounded-input text-xs border border-rule transition-colors"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              )}

              {/* Search Bar & Quick Tags */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-2.5 text-muted" />
                  <input
                    type="text"
                    placeholder="Cari stock video 9:16 (cth: robot, bitcoin, nature, coding)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchStockVideos()}
                    className="input w-full pl-8 pr-3 py-2 text-xs rounded-input"
                  />
                </div>
                <button
                  onClick={() => fetchStockVideos()}
                  disabled={isLoadingStock}
                  className="btn-primary text-xs px-4 py-2 rounded-input shrink-0"
                >
                  {isLoadingStock ? <Loader2 size={14} className="animate-spin" /> : 'Cari'}
                </button>
              </div>

              {/* Quick Niche Tags */}
              <div className="flex flex-wrap gap-1.5">
                {STOCK_NICHE_TAGS.map((tag) => (
                  <button
                    key={tag.label}
                    onClick={() => {
                      setSearchQuery(tag.query);
                      fetchStockVideos(tag.query);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-rule hover:border-brass/60 hover:bg-paper3 text-ink2 hover:text-ink transition-colors"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              {/* Stock Videos Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[190px] overflow-y-auto custom-scrollbar p-1">
                {isLoadingStock ? (
                  <div className="col-span-full py-8 text-center text-xs text-muted flex flex-col items-center gap-2">
                    <Loader2 size={20} className="animate-spin text-brass" />
                    <span>Mencari stock footage 9:16...</span>
                  </div>
                ) : stockVideos.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-muted">
                    Tidak ada video ditemukan. Coba kata kunci lain atau gunakan tab Upload.
                  </div>
                ) : (
                  stockVideos.map((v) => {
                    const isSelected = selectedStock?.id === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => {
                          setSelectedStock(v);
                          setUploadedMediaBase64(null);
                          setUploadedPreviewUrl(null);
                          setDirectVideoUrl('');
                        }}
                        className={`group relative aspect-[9/16] rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-brass ring-2 ring-brass/40 shadow-lg scale-[1.02]'
                            : 'border-rule hover:border-brass/50'
                        }`}
                      >
                        <img
                          src={v.image}
                          alt={v.title || 'Stock video'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-1.5 text-white">
                          <span className="text-[10px] font-medium line-clamp-1">
                            {v.title || v.photographer || 'Pexels Video'}
                          </span>
                          <span className="text-[9px] text-white/70">
                            ⏱️ {v.duration || 10}s
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-brass text-black rounded-full flex items-center justify-center shadow">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-3 p-3 bg-paper3 rounded-input border border-rule text-xs">
              <p className="font-semibold text-ink flex items-center gap-1.5">
                <Upload size={14} className="text-brass" /> Upload Footage Sendiri
              </p>
              <p className="text-muted text-[11px]">
                Mendukung video vertikal MP4, WEBM, MOV atau gambar JPG/PNG (efek visual B-roll).
              </p>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-rule hover:border-brass/60 rounded-lg p-5 text-center cursor-pointer transition-colors bg-paper2/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Film size={28} className="mx-auto text-brass mb-2" />
                <p className="font-medium text-ink">
                  {uploadedMediaName ? uploadedMediaName : 'Klik atau seret file media ke sini'}
                </p>
                <p className="text-[10px] text-muted mt-1">Maksimal 50MB</p>
              </div>

              <div className="pt-2 border-t border-rule">
                <label className="text-[11px] font-semibold text-muted block mb-1">
                  Atau Tempel URL Video Langsung (.mp4):
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/footage.mp4"
                  value={directVideoUrl}
                  onChange={(e) => {
                    setDirectVideoUrl(e.target.value);
                    setSelectedStock(null);
                    setUploadedMediaBase64(null);
                  }}
                  className="input w-full text-xs py-1.5 px-2.5 rounded-input"
                />
              </div>
            </div>
          )}

          {/* TAB 3: AI SUGGESTIONS */}
          {activeTab === 'ai' && (
            <div className="space-y-3 p-3 bg-paper3 rounded-input border border-rule text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brass" /> Deteksi Momen B-Roll Otomatis
                  </p>
                  <p className="text-muted text-[11px]">
                    Gemini AI menganalisis transkrip klip untuk menemukan segmen yang paling butuh ilustrasi visual.
                  </p>
                </div>
                <button
                  onClick={handleFetchAiSuggestions}
                  disabled={isLoadingAi}
                  className="btn-primary text-xs px-3 py-1.5 rounded-input shrink-0 flex items-center gap-1"
                >
                  {isLoadingAi ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                  Analisis Ulang
                </button>
              </div>

              {isLoadingAi ? (
                <div className="py-8 text-center text-xs text-muted flex flex-col items-center gap-2">
                  <Loader2 size={20} className="animate-spin text-brass" />
                  <span>Menganalisis retensi visual transkrip...</span>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted">
                  {aiError || 'Klik tombol Analisis untuk mendapatkan saran momen B-roll otomatis.'}
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                  {suggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-paper2 border border-rule hover:border-brass/60 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-brass font-bold text-[11px] bg-brass/10 px-2 py-0.5 rounded">
                            ⏱️ {sug.start_sec.toFixed(1)}s - {sug.end_sec.toFixed(1)}s
                          </span>
                          <span className="text-[11px] font-semibold text-ink">
                            Keyword: &quot;{sug.keyword}&quot;
                          </span>
                        </div>
                        <p className="text-[11px] text-muted">{sug.reason}</p>
                      </div>
                      <button
                        onClick={() => handleApplySuggestion(sug)}
                        className="px-2.5 py-1.5 bg-brass text-black font-bold text-[11px] rounded-input hover:bg-brass-dark shrink-0 flex items-center gap-1 shadow transition-colors"
                      >
                        Pilih <ChevronRight size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* INTERACTIVE TRANSCRIPT WORD PICKER */}
          <div className="p-3 bg-paper2 rounded-input border border-rule space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink flex items-center gap-1">
                💬 Klik Kata di Transkrip untuk Menentukan Menit Mulai & Selesai:
              </span>
              <span className="text-[10px] text-muted">
                Klik kata awal, lalu klik kata akhir
              </span>
            </div>

            {isLoadingCaptions ? (
              <div className="py-3 text-center text-xs text-muted flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin text-brass" />
                <span>Memuat kata transkrip...</span>
              </div>
            ) : captions.length === 0 ? (
              <p className="text-[11px] text-muted italic">Transkrip kata tidak tersedia untuk klip ini.</p>
            ) : (
              <div className="flex flex-wrap gap-1 max-h-[105px] overflow-y-auto custom-scrollbar p-1 bg-paper3/60 rounded border border-rule/50">
                {captions.map((c, i) => {
                  const wStart = c.startMs / 1000.0;
                  const wEnd = c.endMs / 1000.0;
                  const isSelected = wStart >= startTime - 0.1 && wEnd <= endTime + 0.1;
                  return (
                    <button
                      key={i}
                      onClick={() => handleWordClick(c)}
                      className={`text-[11px] px-1.5 py-0.5 rounded transition-colors font-mono ${
                        isSelected
                          ? 'bg-brass text-black font-bold shadow-sm scale-105'
                          : 'hover:bg-paper text-ink2 hover:text-ink'
                      }`}
                      title={`${wStart.toFixed(1)}s - ${wEnd.toFixed(1)}s`}
                    >
                      {c.text}
                    </button>
                  );
                })}
              </div>
            )}

            {/* TIMING INPUTS & TRANSITION */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-rule text-xs">
              <div>
                <label className="text-[11px] text-muted block mb-1">Mulai (Detik):</label>
                <input
                  type="number"
                  min="0"
                  max={clipDuration}
                  step="0.1"
                  value={startTime}
                  onChange={(e) => setStartTime(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="input w-full text-xs py-1 px-2 rounded-input font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted block mb-1">Selesai (Detik):</label>
                <input
                  type="number"
                  min={startTime + 0.5}
                  max={clipDuration}
                  step="0.1"
                  value={endTime}
                  onChange={(e) => setEndTime(Math.min(clipDuration, parseFloat(e.target.value) || 0))}
                  className="input w-full text-xs py-1 px-2 rounded-input font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted block mb-1">Efek Transisi:</label>
                <select
                  value={transition}
                  onChange={(e) => setTransition(e.target.value)}
                  className="input w-full text-xs py-1 px-2 rounded-input"
                >
                  <option value="dissolve">✨ Dissolve (Fade 0.3s)</option>
                  <option value="cut">⚡ Cut Langsung</option>
                </select>
              </div>
            </div>

            {/* Duration pill */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-muted">
              <span>
                Durasi B-Roll:{' '}
                <strong className="text-brass">{(Math.max(0, endTime - startTime)).toFixed(1)} detik</strong>
              </span>
              <span className="text-[10px] text-muted flex items-center gap-1">
                <Volume2 size={12} className="text-emerald-400" /> Audio vokal narator 100% terjaga utuh
              </span>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-rule">
            <button
              onClick={onClose}
              disabled={isApplying}
              className="px-4 py-2 rounded-input border border-rule hover:bg-paper3 text-xs text-ink2 hover:text-ink transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleApplyBroll}
              disabled={isApplying}
              className="btn-primary px-5 py-2 rounded-input text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isApplying ? (
                <>
                  <Loader2 size={16} className="animate-spin text-black" />
                  <span>Menyisipkan B-Roll ke Video...</span>
                </>
              ) : (
                <>
                  <Layers size={16} />
                  <span>Terapkan B-Roll ke Video</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </Modal>
  );
}
