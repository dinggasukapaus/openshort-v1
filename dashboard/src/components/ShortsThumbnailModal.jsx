import React, { useState, useEffect, useRef } from 'react';
import Modal from './ui/Modal';
import { Download, Sparkles, Image, RefreshCw, X, Upload, Check, Type, Eye, Trash2, Search, Sliders, Volume2, Play, VolumeX, AlertCircle, Loader2, Music, Clapperboard } from 'lucide-react';
import { apiFetch } from '../lib/api';

const COLOR_PRESETS = [
  { id: 'meta-blue', name: 'Facebook Blue', color: '#1877F2', text: '#FFFFFF', pillBg: '#FFFFFF', pillText: '#1877F2' },
  { id: 'youtube-red', name: 'Viral Red', color: '#E50914', text: '#FFFFFF', pillBg: '#FFFFFF', pillText: '#E50914' },
  { id: 'hormozi-gold', name: 'Hormozi Gold', color: '#F59E0B', text: '#000000', pillBg: '#000000', pillText: '#F59E0B' },
  { id: 'emerald-green', name: 'Finance Emerald', color: '#059669', text: '#FFFFFF', pillBg: '#FFFFFF', pillText: '#059669' },
  { id: 'cyber-purple', name: 'Cyber Purple', color: '#7C3AED', text: '#FFFFFF', pillBg: '#FFFFFF', pillText: '#7C3AED' },
  { id: 'dark-slate', name: 'Dark Slate', color: '#18181B', text: '#FFFFFF', pillBg: '#27272A', pillText: '#F4F4F5' },
];

const SFX_PRESETS = [
  { id: 'chime', name: 'iPhone / Chime', icon: '🔔', desc: 'Denting notifikasi smartphone (paling viral menghentikan scroll)' },
  { id: 'whoosh', name: 'Fast Whoosh', icon: '💨', desc: 'Hembusan angin cepat modern ala TikTok/Reels' },
  { id: 'boom', name: 'Cinematic Boom', icon: '💥', desc: 'Dentuman bass elegan berkelas' },
  { id: 'camera', name: 'Camera Click', icon: '📸', desc: 'Klik jepretan kamera dua ketukan' },
  { id: 'pop', name: 'Bubble Pop', icon: '🎈', desc: 'Letupan gelembung renyah dan santai' },
  { id: 'none', name: 'Tanpa SFX', icon: '🔇', desc: 'Hanya audio suara pembicara asli' },
];

export default function ShortsThumbnailModal({
  isOpen,
  onClose,
  videoUrl,
  initialTitle = '',
  initialHook = '',
  nicheLabel = 'Trending',
  jobId = '',
  clipIndex = 0,
  onIntroApplied = null,
  inputFilename = null,
}) {
  if (!isOpen) return null;

  // Settings State
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [pillText, setPillText] = useState(() => initialTitle ? initialTitle.slice(0, 15) : 'Earn Money');
  const [headline, setHeadline] = useState(initialTitle || 'Introducing Facebook Content Monetization');
  const [headlineSize, setHeadlineSize] = useState(56);
  const [showBottomCard, setShowBottomCard] = useState(true);
  const [cardEyebrow, setCardEyebrow] = useState('ANNOUNCEMENTS');
  const [cardText, setCardText] = useState(
    initialHook || initialTitle || "Earn Money from More of your Content: Introducing Facebook's New Monetization Program"
  );
  
  // Arch / Curve style
  const [curveStyle, setCurveStyle] = useState('arch'); // 'arch', 'wave', 'slant', 'straight'

  // Channel Logo State (Saved to localStorage)
  const [channelLogo, setChannelLogo] = useState(() => {
    try {
      return localStorage.getItem('openshorts_channel_logo') || null;
    } catch {
      return null;
    }
  });
  const [logoPlacement, setLogoPlacement] = useState('pill'); // 'pill', 'corner', 'card', 'none'
  const fileInputRef = useRef(null);

  // Audio SFX Overlay State
  const [selectedSfx, setSelectedSfx] = useState('chime');
  const [sfxVolume, setSfxVolume] = useState(35);
  const [customSfx, setCustomSfx] = useState(null);
  const sfxInputRef = useRef(null);

  // Burn Video Intro State
  const [isBurningIntro, setIsBurningIntro] = useState(false);
  const [introBurnSuccess, setIntroBurnSuccess] = useState(false);
  const [burnError, setBurnError] = useState(null);

  // Video Frame Scrubbing
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load logo from file
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setChannelLogo(base64);
      try {
        localStorage.setItem('openshorts_channel_logo', base64);
      } catch (err) {
        console.warn('Could not save logo to localStorage:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setChannelLogo(null);
    try {
      localStorage.removeItem('openshorts_channel_logo');
    } catch {}
  };

  // Play preview sound
  const playSfxPreview = (sfxId) => {
    if (sfxId === 'none') return;
    try {
      let audioUrl = `/sfx/${sfxId}.wav`;
      if (customSfx && sfxId === 'custom') {
        audioUrl = customSfx;
      }
      const audio = new Audio(audioUrl);
      audio.volume = Math.min(1.0, Math.max(0.05, sfxVolume / 100));
      audio.play().catch(e => console.log('Audio preview error:', e));
    } catch (e) {
      console.warn('Audio playback not supported:', e);
    }
  };

  // Video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 30);
      setVideoLoaded(true);
      drawCanvas();
    }
  };

  // Redraw canvas whenever settings change
  useEffect(() => {
    if (videoLoaded) {
      drawCanvas();
    }
  }, [selectedColor, pillText, headline, headlineSize, showBottomCard, cardEyebrow, cardText, curveStyle, channelLogo, logoPlacement, currentTime, videoLoaded]);

  // Helper: Text Wrapping
  const wrapText = (ctx, text, maxWidth) => {
    const words = (text || '').split(' ');
    const lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Draw 1080x1920 High-Res Thumbnail
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // 1. Draw full video frame as background
    try {
      const vw = video.videoWidth || W;
      const vh = video.videoHeight || H;
      const hRatio = W / vw;
      const vRatio = H / vh;
      const ratio = Math.max(hRatio, vRatio);
      const centerShiftX = (W - vw * ratio) / 2;
      const centerShiftY = (H - vh * ratio) / 2;
      ctx.drawImage(video, 0, 0, vw, vh, centerShiftX, centerShiftY, vw * ratio, vh * ratio);
    } catch (e) {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Draw Top Colored Banner with Curve
    ctx.save();
    ctx.fillStyle = selectedColor.color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);

    if (curveStyle === 'arch') {
      ctx.lineTo(W, 580);
      ctx.bezierCurveTo(W * 0.7, 560, W * 0.35, 620, 0, 840);
    } else if (curveStyle === 'wave') {
      ctx.lineTo(W, 640);
      ctx.quadraticCurveTo(W * 0.5, 780, 0, 640);
    } else if (curveStyle === 'slant') {
      ctx.lineTo(W, 560);
      ctx.lineTo(0, 720);
    } else {
      ctx.lineTo(W, 620);
      ctx.lineTo(0, 620);
    }

    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Draw Search Pill at Top: [ 🔍 PillText ] (X / Logo)
    const pillY = 110;
    const pillH = 88;
    const pillPadX = 36;
    ctx.save();
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const pillTextWidth = ctx.measureText(pillText || 'Topic').width;
    const iconWidth = 50;
    const pillW = Math.max(280, pillTextWidth + iconWidth + pillPadX * 2);
    const pillX = 60;

    // Outer Pill Background
    ctx.fillStyle = selectedColor.pillBg;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 44);
    ctx.fill();

    // Search Icon 🔍
    ctx.fillStyle = selectedColor.pillText;
    ctx.font = '34px sans-serif';
    ctx.fillText('🔍', pillX + 24, pillY + 56);

    // Pill Text
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(pillText || 'Topic', pillX + 76, pillY + 57);

    // Pill Circle Button (Right side of pill: Close button or Logo)
    const circleBtnX = pillX + pillW + 20;
    const circleBtnY = pillY;
    const circleBtnR = pillH / 2;

    if (channelLogo && logoPlacement === 'pill') {
      const logoImg = new window.Image();
      logoImg.src = channelLogo;
      if (logoImg.complete) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(circleBtnX + circleBtnR, circleBtnY + circleBtnR, circleBtnR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, circleBtnX, circleBtnY, pillH, pillH);
        ctx.restore();
      }
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.arc(circleBtnX + circleBtnR, circleBtnY + circleBtnR, circleBtnR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✕', circleBtnX + circleBtnR, circleBtnY + circleBtnR);
    }
    ctx.restore();

    // 4. Draw Logo in Corner if selected
    if (channelLogo && logoPlacement === 'corner') {
      const logoImg = new window.Image();
      logoImg.src = channelLogo;
      if (logoImg.complete) {
        ctx.save();
        const logoSize = 110;
        ctx.drawImage(logoImg, W - logoSize - 60, 100, logoSize, logoSize);
        ctx.restore();
      }
    }

    // 5. Draw Headline Text (Large bold multi-line)
    ctx.save();
    ctx.fillStyle = selectedColor.text;
    ctx.font = `800 ${headlineSize}px -apple-system, BlinkMacSystemFont, "Montserrat", "Poppins", sans-serif`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    const headlineLines = wrapText(ctx, headline, W - 140);
    let headlineY = 240;
    const lineSpacing = headlineSize * 1.22;

    for (const line of headlineLines) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      ctx.fillText(line, 60, headlineY);
      headlineY += lineSpacing;
    }
    ctx.restore();

    // 6. Draw Bottom Announcement Card (White card from reference)
    if (showBottomCard) {
      ctx.save();
      const cardX = 60;
      const cardY = 1260;
      const cardW = W - 120;
      const cardH = 540;
      const radius = 16;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 12;

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, radius);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      ctx.fillStyle = '#111827';
      ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText((cardEyebrow || 'ANNOUNCEMENTS').toUpperCase(), cardX + 44, cardY + 60);

      ctx.fillStyle = selectedColor.color === '#FFFFFF' ? '#1877F2' : selectedColor.color;
      ctx.font = '800 46px -apple-system, BlinkMacSystemFont, "Montserrat", "Segoe UI", sans-serif';
      ctx.textBaseline = 'top';

      const cardLines = wrapText(ctx, cardText, cardW - 88);
      let textY = cardY + 110;
      for (const line of cardLines.slice(0, 6)) {
        ctx.fillText(line, cardX + 44, textY);
        textY += 62;
      }

      if (channelLogo && logoPlacement === 'card') {
        const logoImg = new window.Image();
        logoImg.src = channelLogo;
        if (logoImg.complete) {
          ctx.drawImage(logoImg, cardX + cardW - 100, cardY + 40, 60, 60);
        }
      }
      ctx.restore();
    }
  };

  // Download high-resolution PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsGenerating(true);

    try {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanJob = (jobId || 'short').slice(0, 8);
        const cleanTitle = (headline || 'thumbnail').slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `cover_${cleanJob}_clip_${clipIndex + 1}_${cleanTitle}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setIsGenerating(false);
      }, 'image/png');
    } catch (err) {
      console.error('Download thumbnail failed:', err);
      setIsGenerating(false);
    }
  };

  // Burn thumbnail as 2.5s video intro with audio SFX
  const handleBurnIntro = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !jobId) return;

    setIsBurningIntro(true);
    setBurnError(null);
    setIntroBurnSuccess(false);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const res = await apiFetch('/api/thumbnail-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          clip_index: clipIndex,
          thumbnail_image: dataUrl,
          duration_seconds: 2.5,
          sfx_id: selectedSfx,
          sfx_volume: sfxVolume / 100,
          custom_sfx_base64: customSfx,
          input_filename: inputFilename,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Gagal memproses intro video');
      }

      const data = await res.json();
      setIntroBurnSuccess(true);
      if (onIntroApplied && data.new_video_url) {
        onIntroApplied(data.new_video_url);
      }
      setTimeout(() => setIntroBurnSuccess(false), 5000);
    } catch (err) {
      console.error('Burn intro error:', err);
      setBurnError(err.message || 'Gagal membakar intro video');
    } finally {
      setIsBurningIntro(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="THUMBNAIL STUDIO & VIDEO INTRO PRO"
      title="9:16 Viral Thumbnail & Video Intro"
      size="xl"
    >
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Side: Live 9:16 Canvas Preview & Actions */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col items-center">
          <div className="relative w-full aspect-[9/16] bg-black/90 rounded-card overflow-hidden border-2 border-rule shadow-2xl flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Hidden Video for Canvas Frame Extraction */}
          <video
            ref={videoRef}
            src={videoUrl}
            crossOrigin="anonymous"
            onLoadedMetadata={handleLoadedMetadata}
            onSeeked={drawCanvas}
            className="hidden"
            playsInline
            muted
          />

          {/* Frame Scrubber */}
          <div className="w-full mt-3 p-3 bg-paper3 rounded-input border border-rule space-y-2">
            <div className="flex items-center justify-between text-xs text-muted font-mono">
              <span>⏱️ Frame Video:</span>
              <span className="text-brass font-bold">{currentTime.toFixed(1)}s / {duration.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 30}
              step="0.1"
              value={currentTime}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCurrentTime(val);
                if (videoRef.current) {
                  videoRef.current.currentTime = val;
                }
              }}
              className="w-full accent-brass cursor-pointer"
            />
          </div>

          {/* Notification Messages */}
          {introBurnSuccess && (
            <div className="w-full mt-2.5 p-2.5 rounded-input bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-medium animate-fade">
              <Check size={16} className="shrink-0 text-emerald-400" />
              <span>Intro Video & SFX Berhasil Dipasang ke Klip!</span>
            </div>
          )}

          {burnError && (
            <div className="w-full mt-2.5 p-2.5 rounded-input bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 font-medium animate-fade">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span className="truncate">{burnError}</span>
            </div>
          )}

          {/* Primary Action 1: Burn as Video Intro */}
          <button
            onClick={handleBurnIntro}
            disabled={isBurningIntro}
            className="btn-primary w-full py-3 mt-3 text-xs flex items-center justify-center gap-2 font-bold shadow-lg cursor-pointer"
            title="Bakar thumbnail ini ke 2.5 detik pertama video klip lengkap dengan SFX"
          >
            {isBurningIntro ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Membakar Intro Video & SFX…</span>
              </>
            ) : (
              <>
                <Clapperboard size={16} />
                <span>🎬 Pasang Sebagai Intro Video (2.5s + SFX)</span>
              </>
            )}
          </button>

          {/* Secondary Action 2: Download Standalone PNG */}
          <button
            onClick={handleDownload}
            disabled={isGenerating || isBurningIntro}
            className="btn-quiet w-full py-2 mt-2 text-xs flex items-center justify-center gap-1.5 cursor-pointer font-medium"
            title="Unduh file gambar cover PNG terpisah untuk upload manual"
          >
            <Download size={14} />
            <span>Download Gambar Cover (PNG 1080x1920)</span>
          </button>
        </div>

        {/* Right Side: Customization Controls */}
        <div className="flex-1 w-full space-y-5 overflow-y-auto max-h-[75vh] custom-scrollbar pr-1">
          {/* Copyright-Free Audio SFX Overlay */}
          <div className="p-3.5 bg-paper2 rounded-card border border-brass/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="eyebrow text-brass flex items-center gap-1.5">
                <Music size={13} /> AUDIO SFX INTRO (100% BEBAS COPYRIGHT)
              </label>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>Volume:</span>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={sfxVolume}
                  onChange={(e) => setSfxVolume(parseInt(e.target.value))}
                  className="w-16 accent-brass"
                />
                <span className="font-mono text-brass">{sfxVolume}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SFX_PRESETS.map((sfx) => (
                <div
                  key={sfx.id}
                  onClick={() => { setSelectedSfx(sfx.id); playSfxPreview(sfx.id); }}
                  className={`p-2 rounded-input border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                    selectedSfx === sfx.id
                      ? 'border-brass bg-paper3 shadow-xs'
                      : 'border-rule hover:border-muted bg-paper'
                  }`}
                  title={sfx.desc}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-base">{sfx.icon}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); playSfxPreview(sfx.id); }}
                      className="p-1 text-muted hover:text-brass transition-colors"
                      title="Dengar Suara"
                    >
                      <Play size={11} />
                    </button>
                  </div>
                  <span className="font-medium text-[11px] truncate">{sfx.name}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted">
              SFX matematika murni & public domain yang berbunyi di detik ke-0 tanpa memotong suara narator.
            </p>
          </div>

          {/* Preset Color Themes */}
          <div>
            <label className="eyebrow block mb-2">🎨 WARNA TEMA HEADER</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedColor(preset)}
                  className={`p-2 rounded-input border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    selectedColor.id === preset.id
                      ? 'border-brass bg-paper3 shadow-xs'
                      : 'border-rule hover:border-muted bg-paper'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full shrink-0 border border-white/20" style={{ backgroundColor: preset.color }} />
                  <span className="truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Curve Style */}
          <div>
            <label className="eyebrow block mb-2">✂️ BENTUK POTONGAN HEADER (CURVE)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'arch', label: 'Arch (Contoh)' },
                { id: 'wave', label: 'Wave (Gelombang)' },
                { id: 'slant', label: 'Slant (Miring)' },
                { id: 'straight', label: 'Straight (Lurus)' },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setCurveStyle(style.id)}
                  className={`py-1.5 px-2 text-xs rounded border text-center cursor-pointer transition-colors ${
                    curveStyle === style.id ? 'bg-paper3 border-brass text-brass font-bold' : 'border-rule text-muted hover:text-ink'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Channel Logo Upload */}
          <div className="p-3.5 bg-paper2 rounded-card border border-rule space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="eyebrow text-brass flex items-center gap-1.5">
                <Image size={13} /> LOGO CHANNEL
              </label>
              {channelLogo && (
                <button onClick={removeLogo} className="text-[11px] text-red-400 hover:underline flex items-center gap-1">
                  <Trash2 size={11} /> Hapus Logo
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {channelLogo ? (
                <div className="w-12 h-12 rounded-full border border-brass p-1 bg-paper3 shrink-0 flex items-center justify-center overflow-hidden">
                  <img src={channelLogo} alt="Channel Logo" className="w-full h-full object-contain rounded-full" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full border border-dashed border-rule shrink-0 flex items-center justify-center text-muted">
                  <Upload size={18} />
                </div>
              )}

              <div className="flex-1">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-quiet text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <Upload size={13} />
                  <span>{channelLogo ? 'Ganti Logo' : 'Upload Logo Channel (PNG/JPG)'}</span>
                </button>
                <p className="text-[10px] text-muted mt-1">Logo tersimpan permanen untuk seluruh klip berikutnya.</p>
              </div>
            </div>

            {channelLogo && (
              <div className="pt-2 border-t border-rule flex items-center gap-2">
                <span className="text-[11px] text-muted">Posisi:</span>
                {[
                  { id: 'pill', label: 'Di Pill Atas' },
                  { id: 'corner', label: 'Sudut Kanan' },
                  { id: 'card', label: 'Di Kartu Bawah' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => setLogoPlacement(pos.id)}
                    className={`text-[11px] px-2 py-0.5 rounded border cursor-pointer ${
                      logoPlacement === pos.id ? 'bg-brass/20 text-brass border-brass' : 'border-rule text-muted'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Top Search Pill */}
          <div className="space-y-1.5">
            <label className="eyebrow block">🔍 TEKS SEARCH PILL (KATEGORI / NAMA)</label>
            <input
              type="text"
              value={pillText}
              onChange={(e) => setPillText(e.target.value)}
              className="w-full bg-paper border border-rule rounded-input px-3 py-2 text-xs text-ink focus:outline-none focus:border-brass"
              placeholder="Contoh: Earn Money, AI & Tech, Podcast..."
            />
          </div>

          {/* Headline Text & Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="eyebrow">📢 HEADLINE UTAMA</label>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>Ukuran:</span>
                <input
                  type="range"
                  min="42"
                  max="76"
                  value={headlineSize}
                  onChange={(e) => setHeadlineSize(parseInt(e.target.value))}
                  className="w-24 accent-brass"
                />
                <span className="font-mono text-brass">{headlineSize}px</span>
              </div>
            </div>
            <textarea
              rows={3}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full bg-paper border border-rule rounded-input p-3 text-xs text-ink focus:outline-none focus:border-brass font-medium"
              placeholder="Tulis kalimat judul yang menarik dan besar..."
            />
          </div>

          {/* Bottom Announcement Card */}
          <div className="p-3.5 bg-paper2 rounded-card border border-rule space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="eyebrow flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBottomCard}
                  onChange={(e) => setShowBottomCard(e.target.checked)}
                  className="rounded text-brass focus:ring-brass"
                />
                <span>TAMPILKAN KARTU PENGUMUMAN BAWAH</span>
              </label>
            </div>

            {showBottomCard && (
              <div className="space-y-2 pt-1">
                <div>
                  <span className="text-[10px] uppercase font-mono text-muted">Label Kategori (Eyebrow):</span>
                  <input
                    type="text"
                    value={cardEyebrow}
                    onChange={(e) => setCardEyebrow(e.target.value)}
                    className="w-full bg-paper border border-rule rounded-input px-2.5 py-1.5 text-xs text-ink mt-0.5"
                    placeholder="Contoh: ANNOUNCEMENTS, BREAKING, TIPS..."
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-muted">Isi Teks Pengumuman:</span>
                  <textarea
                    rows={2}
                    value={cardText}
                    onChange={(e) => setCardText(e.target.value)}
                    className="w-full bg-paper border border-rule rounded-input p-2.5 text-xs text-ink mt-0.5 font-medium"
                    placeholder="Tulis ringkasan hook pengumuman..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}