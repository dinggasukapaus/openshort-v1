import React, { useState, useEffect, useRef } from 'react';
import { 
    Link2, Upload, FileVideo, X, Info, Loader2, ChevronDown, 
    Flame, ClipboardPaste, Check, Sparkles, Youtube, CheckCircle2,
    SlidersHorizontal, Video
} from 'lucide-react';
import { getApiUrl } from '../config';

const PLATFORM_QUICK_PILLS = [
    { name: 'YouTube', icon: <Youtube size={14} className="text-red-500" />, badge: 'Heatmap Ready 🔥', placeholder: 'https://www.youtube.com/watch?v=...' },
    { name: 'TikTok', icon: <Video size={14} className="text-cyan-400" />, placeholder: 'https://www.tiktok.com/@.../video/...' },
    { name: 'Instagram', icon: <Video size={14} className="text-pink-500" />, placeholder: 'https://www.instagram.com/reel/...' },
    { name: 'X / Twitter', icon: <Video size={14} className="text-sky-400" />, placeholder: 'https://x.com/.../status/...' },
];

const ALL_SUPPORTED_PLATFORMS = [
    'YouTube (Replay Heatmap)', 'TikTok', 'Instagram Reels', 'X / Twitter', 
    'Facebook Watch', 'Twitch Clips', 'Vimeo', 'Reddit', 'Streamable', 'Dailymotion'
];

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function MediaInput({ onProcess, isProcessing }) {
    const [youtubeUrlEnabled, setYoutubeUrlEnabled] = useState(true);
    const [mode, setMode] = useState('url'); // 'url' | 'file'
    const [url, setUrl] = useState('');
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [acknowledged, setAcknowledged] = useState(true);
    const [outputFormat, setOutputFormat] = useState('vertical'); // vertical | horizontal | square
    const [showInfo, setShowInfo] = useState(false);
    const [pasteSuccess, setPasteSuccess] = useState(false);

    // YouTube Heatmap Priority Toggle
    const [prioritizeReplay, setPrioritizeReplay] = useState(() => {
        try { return localStorage.getItem('os_prioritize_replay') !== '0'; } catch { return true; }
    });

    // Advanced options
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [targetClips, setTargetClips] = useState('');
    const [clipMinSeconds, setClipMinSeconds] = useState('');
    const [clipMaxSeconds, setClipMaxSeconds] = useState('');
    const [layout, setLayout] = useState(() => {
        try { return localStorage.getItem('os_layout') || 'auto'; } catch { return 'auto'; }
    });

    const infoRef = useRef(null);
    const inputRef = useRef(null);

    // Is current URL from YouTube?
    const isYouTubeUrl = Boolean(
        url && (url.includes('youtube.com/') || url.includes('youtu.be/'))
    );

    // Close platform info modal on outside click
    useEffect(() => {
        if (!showInfo) return;
        const onClick = (e) => {
            if (infoRef.current && !infoRef.current.contains(e.target)) setShowInfo(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [showInfo]);

    // Check backend URL config
    useEffect(() => {
        fetch(getApiUrl('/api/config'))
            .then((r) => r.ok ? r.json() : null)
            .then((cfg) => {
                if (cfg && cfg.youtubeUrlEnabled === false) {
                    setYoutubeUrlEnabled(false);
                    setMode('file');
                }
            })
            .catch(() => {});
    }, []);

    // Check localStorage pending URL from hero section
    useEffect(() => {
        let pending = null;
        try {
            pending = localStorage.getItem('os_pending_url');
            if (pending) localStorage.removeItem('os_pending_url');
        } catch { /* ignore */ }
        if (pending) {
            setMode('url');
            setUrl(pending);
        }
    }, []);

    const handlePasteFromClipboard = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                if (text && text.trim()) {
                    setUrl(text.trim());
                    setPasteSuccess(true);
                    setTimeout(() => setPasteSuccess(false), 2000);
                    if (inputRef.current) inputRef.current.focus();
                }
            }
        } catch (err) {
            console.warn('Clipboard read error:', err);
        }
    };

    const handleSelectPlatformPill = (p) => {
        if (!url) {
            setUrl(p.placeholder);
        }
        if (inputRef.current) inputRef.current.focus();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!acknowledged) return;

        const advanced = {
            targetClips: targetClips || null,
            clipMinSeconds: clipMinSeconds || null,
            clipMaxSeconds: clipMaxSeconds || null,
            layout,
            prioritizeReplay,
        };

        try {
            localStorage.setItem('os_layout', layout);
            localStorage.setItem('os_prioritize_replay', prioritizeReplay ? '1' : '0');
        } catch { /* ignore */ }

        if (mode === 'url' && url) {
            onProcess({ type: 'url', payload: url.trim(), acknowledged: true, outputFormat, ...advanced });
        } else if (mode === 'file' && file) {
            onProcess({ type: 'file', payload: file, acknowledged: true, outputFormat, ...advanced });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setMode('file');
        }
    };

    return (
        <div className="card p-4 sm:p-7 animate-fade shadow-xl border border-rule transition-all duration-300">
            {/* Top Navigation Tabs */}
            <div className="flex items-center justify-between gap-3 mb-6 pb-3 border-b border-rule" data-tutorial="source-tabs">
                <div className="flex gap-2 sm:gap-4">
                    {youtubeUrlEnabled && (
                        <button
                            type="button"
                            onClick={() => setMode('url')}
                            className={`flex items-center gap-2 py-2 px-3.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                                mode === 'url'
                                    ? 'bg-paper3 text-brass shadow-sm border border-brass/30'
                                    : 'text-muted hover:text-ink hover:bg-paper2 border border-transparent'
                            }`}
                        >
                            <Link2 size={16} className={mode === 'url' ? 'text-brass' : 'text-muted'} />
                            <span>Link Video URL</span>
                            <span className="hidden md:inline-flex items-center gap-1 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono font-bold">
                                <Flame size={10} /> Heatmap
                            </span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setMode('file')}
                        className={`flex items-center gap-2 py-2 px-3.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                            mode === 'file'
                                ? 'bg-paper3 text-brass shadow-sm border border-brass/30'
                                : 'text-muted hover:text-ink hover:bg-paper2 border border-transparent'
                        }`}
                    >
                        <Upload size={16} className={mode === 'file' ? 'text-brass' : 'text-muted'} />
                        <span>Upload File Video</span>
                    </button>
                </div>

                {/* Compatibility button */}
                <div className="relative" ref={infoRef}>
                    <button
                        type="button"
                        onClick={() => setShowInfo((v) => !v)}
                        className="text-xs text-muted hover:text-brass flex items-center gap-1.5 py-1 px-2.5 rounded-md hover:bg-paper2 transition-colors cursor-pointer"
                        title="Platform & Format yang didukung"
                    >
                        <Info size={14} />
                        <span className="hidden sm:inline text-[11px]">Dukungan Platform</span>
                    </button>
                    {showInfo && (
                        <div className="absolute right-0 top-full mt-2 w-72 z-30 card p-4 text-left shadow-2xl border border-rule2 animate-fade">
                            <p className="eyebrow mb-2 text-brass">Dukungan Platform Lengkap</p>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {ALL_SUPPORTED_PLATFORMS.map((p) => (
                                    <span key={p} className="text-[11px] px-2 py-0.5 rounded-full bg-paper3 text-ink2 border border-rule">
                                        {p}
                                    </span>
                                ))}
                            </div>
                            <p className="text-[11px] text-muted leading-relaxed border-t border-rule pt-2">
                                Termasuk YouTube, TikTok, IG Reels, X, dan 1.000+ situs video publik lainnya dengan integrasi deteksi heatmap putar ulang otomatis.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {mode === 'url' ? (
                    <div className="space-y-4" data-tutorial="drop-zone">
                        {/* Platform Quick Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            <span className="text-[11px] text-muted shrink-0 mr-1 font-mono uppercase">Platform:</span>
                            {PLATFORM_QUICK_PILLS.map((p) => (
                                <button
                                    key={p.name}
                                    type="button"
                                    onClick={() => handleSelectPlatformPill(p)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-paper2 hover:bg-paper3 text-ink2 hover:text-ink border border-rule transition-all shrink-0 cursor-pointer"
                                >
                                    {p.icon}
                                    <span>{p.name}</span>
                                    {p.badge && (
                                        <span className="text-[9px] font-mono text-amber-400 font-semibold bg-amber-500/15 px-1 rounded">
                                            {p.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* URL Input Box */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted group-focus-within:text-brass transition-colors">
                                {isYouTubeUrl ? (
                                    <Youtube size={18} className="text-red-500" />
                                ) : (
                                    <Link2 size={18} />
                                )}
                            </div>
                            <input
                                ref={inputRef}
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Tempel URL Video (YouTube, TikTok, IG Reels, dll.)..."
                                className="w-full pl-11 pr-24 py-3 sm:py-3.5 rounded-xl bg-paper2 border border-rule hover:border-rule2 focus:border-brass focus:ring-2 focus:ring-brass/20 text-ink text-sm sm:text-base outline-none transition-all placeholder:text-muted/60"
                                required
                            />
                            
                            <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                                {url ? (
                                    <button
                                        type="button"
                                        onClick={() => setUrl('')}
                                        className="p-1.5 text-muted hover:text-ink rounded-lg hover:bg-paper3 transition-colors cursor-pointer"
                                        title="Hapus URL"
                                    >
                                        <X size={16} />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handlePasteFromClipboard}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-paper3 hover:bg-paper text-ink2 hover:text-brass border border-rule transition-all cursor-pointer shadow-xs"
                                        title="Tempel dari Clipboard"
                                    >
                                        {pasteSuccess ? (
                                            <>
                                                <Check size={13} className="text-ok" />
                                                <span className="text-ok">Ditempel!</span>
                                            </>
                                        ) : (
                                            <>
                                                <ClipboardPaste size={13} />
                                                <span>Tempel</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* YouTube Most Replayed Priority Feature Callout */}
                        {isYouTubeUrl ? (
                            <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-red-500/10 via-amber-500/10 to-transparent border border-red-500/30 flex items-start justify-between gap-3 animate-fade">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="p-1 rounded bg-red-500/20 text-red-400">
                                            <Flame size={15} className="animate-pulse" />
                                        </span>
                                        <h4 className="text-xs sm:text-sm font-semibold text-ink flex items-center gap-1.5">
                                            <span>YouTube 'Most Replayed' Heatmap Engine</span>
                                            <span className="text-[10px] font-mono uppercase bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-bold">
                                                Aktif
                                            </span>
                                        </h4>
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-muted leading-relaxed">
                                        AI mengekstrak grafik lonjakan retensi nyata YouTube untuk menemukan detik-detik yang paling banyak diulang oleh penonton.
                                    </p>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 pt-1">
                                    <input
                                        type="checkbox"
                                        checked={prioritizeReplay}
                                        onChange={(e) => setPrioritizeReplay(e.target.checked)}
                                        className="w-4 h-4 accent-red-500 rounded cursor-pointer"
                                    />
                                    <span className="text-xs font-medium text-ink2 hidden sm:inline">Prioritaskan</span>
                                </label>
                            </div>
                        ) : (
                            <div className="p-2.5 rounded-lg bg-paper2/60 border border-rule/60 flex items-center justify-between text-xs text-muted">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-brass shrink-0" />
                                    <span>Didukung AI Deep 2-Pass Clip Intelligence & Whisper Timestamp Precision</span>
                                </div>
                                <span className="text-[10px] font-mono text-brass">v2.4</span>
                            </div>
                        )}
                    </div>
                ) : (
                    /* File Upload Drop Zone */
                    <div
                        data-tutorial="drop-zone"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-6 sm:p-9 text-center transition-all duration-300 cursor-pointer ${
                            isDragging
                                ? 'border-brass bg-brass/5 scale-[1.01]'
                                : file
                                ? 'border-ok/60 bg-ok/5'
                                : 'border-rule2 hover:border-brass/70 bg-paper2/40 hover:bg-paper2/70'
                        }`}
                    >
                        {file ? (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-paper rounded-xl border border-ok/30 shadow-sm text-left">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-3 rounded-lg bg-ok/10 text-ok shrink-0">
                                        <FileVideo size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm text-ink truncate max-w-xs sm:max-w-md">
                                                {file.name}
                                            </p>
                                            <CheckCircle2 size={16} className="text-ok shrink-0" />
                                        </div>
                                        <p className="text-xs text-muted font-mono mt-0.5">
                                            Ukuran: {formatBytes(file.size)} · Siap dianalisis
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="p-2 text-muted hover:text-red-400 hover:bg-paper3 rounded-lg transition-colors cursor-pointer shrink-0"
                                    title="Hapus file"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <label className="cursor-pointer block space-y-3">
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                                <div className="mx-auto w-12 h-12 rounded-full bg-paper3 border border-rule flex items-center justify-center text-muted group-hover:text-brass transition-colors">
                                    <Upload size={22} className="text-brass" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-ink">
                                        Tarik & lepas file video ke sini, atau <span className="text-brass underline underline-offset-2">pilih file</span>
                                    </p>
                                    <p className="text-xs text-muted mt-1">
                                        Mendukung MP4, MOV, MKV, WebM (Maksimal hingga 2GB)
                                    </p>
                                </div>
                            </label>
                        )}
                    </div>
                )}

                {/* Output Format Selector Cards */}
                <div className="mt-6" data-tutorial="output-format">
                    <div className="flex items-center justify-between mb-2.5">
                        <p className="eyebrow">Format Rasio Video</p>
                        <span className="text-[11px] text-muted">Disesuaikan otomatis dengan Smart Face Tracking</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                            { value: 'vertical', label: '9:16 Vertical', hint: 'Shorts · Reels · TikTok', w: 18, h: 32, badge: '🔥 Rekomendasi' },
                            { value: 'square', label: '1:1 Square', hint: 'Feed IG · LinkedIn', w: 26, h: 26 },
                            { value: 'horizontal', label: '16:9 Landscape', hint: 'YouTube · Standard Desktop', w: 34, h: 19 },
                        ].map((f) => {
                            const active = outputFormat === f.value;
                            return (
                                <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => setOutputFormat(f.value)}
                                    className={`relative p-3.5 rounded-xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer text-center ${
                                        active
                                            ? 'border-brass bg-brass/10 text-ink shadow-md ring-1 ring-brass/30'
                                            : 'border-rule bg-paper2/50 text-muted hover:border-rule2 hover:bg-paper2'
                                    }`}
                                >
                                    {f.badge && (
                                        <span className="absolute -top-2.5 right-2 text-[9px] font-mono font-bold bg-brass text-black px-2 py-0.5 rounded-full shadow-sm">
                                            {f.badge}
                                        </span>
                                    )}
                                    {/* Visual Aspect glyph */}
                                    <span
                                        className="rounded-sm border-2 transition-all"
                                        style={{
                                            width: `${f.w}px`,
                                            height: `${f.h}px`,
                                            borderColor: active ? 'var(--color-accent)' : 'var(--color-rule-2)',
                                            backgroundColor: active ? 'color-mix(in srgb, var(--color-accent) 25%, transparent)' : 'transparent',
                                        }}
                                    />
                                    <div>
                                        <span className="block font-medium text-xs sm:text-sm text-ink">{f.label}</span>
                                        <span className="block text-[11px] text-muted mt-0.5">{f.hint}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Advanced generation controls */}
                <div className="mt-5 border-t border-rule pt-4">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced((v) => !v)}
                        className="flex items-center gap-2 text-xs text-muted hover:text-ink transition-colors cursor-pointer py-1"
                    >
                        <SlidersHorizontal size={14} />
                        <span className="font-medium">Opsi Durasi & Layout Lanjutan</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
                        {(targetClips || clipMinSeconds || clipMaxSeconds || layout !== 'auto') && (
                            <span className="w-2 h-2 rounded-full bg-brass animate-pulse" />
                        )}
                    </button>

                    {showAdvanced && (
                        <div className="mt-3 p-4 rounded-xl bg-paper2/60 border border-rule space-y-4 animate-fade">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="eyebrow mb-1.5 block">Target Jumlah Klip</label>
                                    <input
                                        type="number" min="1" max="15" step="1"
                                        value={targetClips}
                                        onChange={(e) => setTargetClips(e.target.value)}
                                        placeholder="Otomatis (AI)"
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-paper border border-rule focus:border-brass outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="eyebrow mb-1.5 block">Min Durasi (detik)</label>
                                    <input
                                        type="number" min="5" max="175" step="1"
                                        value={clipMinSeconds}
                                        onChange={(e) => setClipMinSeconds(e.target.value)}
                                        placeholder="15"
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-paper border border-rule focus:border-brass outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="eyebrow mb-1.5 block">Maks Durasi (detik)</label>
                                    <input
                                        type="number" min="10" max="180" step="1"
                                        value={clipMaxSeconds}
                                        onChange={(e) => setClipMaxSeconds(e.target.value)}
                                        placeholder="60"
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-paper border border-rule focus:border-brass outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-rule">
                                <div>
                                    <span className="text-xs font-medium text-ink block">Mode Tata Letak Vertikal</span>
                                    <span className="text-[11px] text-muted">Deteksi multi-pembicara podcast atau presentasi</span>
                                </div>
                                <select
                                    value={layout}
                                    onChange={(e) => setLayout(e.target.value)}
                                    className="px-3 py-1.5 text-xs rounded-lg bg-paper border border-rule text-ink outline-none cursor-pointer"
                                >
                                    <option value="auto">Auto (AI Deteksi Otomatis)</option>
                                    <option value="split">Split Two Speakers (Bertingkat)</option>
                                    <option value="screencast">Screen Over Presenter</option>
                                    <option value="none">Single Center Crop</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Agreement Checkbox */}
                <label className="flex items-start gap-2.5 mt-5 text-left text-xs leading-relaxed text-muted cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={acknowledged}
                        onChange={(e) => setAcknowledged(e.target.checked)}
                        className="mt-0.5 w-4 h-4 shrink-0 accent-brass cursor-pointer"
                    />
                    <span>
                        Saya mengonfirmasi memiliki hak atas materi video ini untuk diproses menjadi konten klip vertikal. Lihat <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-ink2 underline underline-offset-2 hover:text-brass transition-colors" onClick={(e) => e.stopPropagation()}>Syarat</a> & <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-ink2 underline underline-offset-2 hover:text-brass transition-colors" onClick={(e) => e.stopPropagation()}>Ketentuan</a>.
                    </span>
                </label>

                {/* Submit Action Button */}
                <button
                    type="submit"
                    data-tutorial="generate"
                    disabled={isProcessing || !acknowledged || (mode === 'url' && !url) || (mode === 'file' && !file)}
                    className="w-full mt-5 py-3.5 px-6 rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-brass hover:bg-brass/90 text-black active:scale-[0.99]"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Sedang Menganalisis Video...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            <span>Hasilkan Viral Clips Sekarang</span>
                            {isYouTubeUrl && prioritizeReplay && (
                                <span className="text-[11px] font-mono bg-black/20 text-black px-1.5 py-0.5 rounded font-bold ml-1">
                                    + Heatmap
                                </span>
                            )}
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

