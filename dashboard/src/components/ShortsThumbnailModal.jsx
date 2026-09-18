import React, { useState, useEffect, useRef } from 'react';
import Modal from './ui/Modal';
import { 
  Download, Sparkles, Image, RefreshCw, X, Upload, Check, Type, 
  Eye, Trash2, Search, Sliders, Volume2, Play, VolumeX, AlertCircle, 
  Loader2, Music, Clapperboard, Layout, Palette, Tag, ShieldAlert,
  Flame, Radio, Film, Layers, Award, RotateCcw
} from 'lucide-react';
import { apiFetch } from '../lib/api';

// Viral Layout Templates
const TEMPLATE_PRESETS = [
  { 
    id: 'blueprint-podcast', 
    name: 'Felix Blueprint', 
    icon: '📐', 
    badge: 'Signature',
    desc: 'Pola blueprint grid arsitektur biru navy + 2-baris judul raksasa ala Felix Siauw' 
  },
  { 
    id: 'meta-card', 
    name: 'Meta Creator', 
    icon: '📱', 
    badge: 'Populer',
    desc: 'Header lengkung modern + Search pill + Kartu pengumuman bawah (ala Facebook/Meta Monetization)' 
  },
  { 
    id: 'hormozi-bold', 
    name: 'Bold Hormozi', 
    icon: '💥', 
    badge: 'Viral TikTok',
    desc: 'Teks raksasa kontras tinggi dengan stroke hitam tebal + vignette gelap penarik atensi' 
  },
  { 
    id: 'breaking-news', 
    name: 'Breaking News', 
    icon: '🚨', 
    badge: 'Urgent',
    desc: 'Ticker bar merah berkedip "BREAKING NEWS" + bingkai kotak peringatan investigasi' 
  },
  { 
    id: 'podcast-quote', 
    name: 'Podcast Quote', 
    icon: '🎙️', 
    badge: 'Talkshow',
    desc: 'Kutipan dialog dengan ornamen tanda petik besar + badge narasumber / tamu' 
  },
  { 
    id: 'cinematic-minimal', 
    name: 'Cinematic Vox', 
    icon: '🎬', 
    badge: 'Dokumenter',
    desc: 'Letterbox sinematik + gradasi hitam bawah + tipografi elegan berkelas' 
  },
  { 
    id: 'sticker-hook', 
    name: 'Viral Sticker', 
    icon: '🏷️', 
    badge: 'Trendy',
    desc: 'Stiker miring pop-art + stabilo / highlighter di belakang kata kunci penting' 
  },
  { 
    id: 'split-comparison', 
    name: 'VS Comparison', 
    icon: '⚔️', 
    badge: 'Komparasi',
    desc: 'Dua warna kontras terpisah dengan emblem lingkaran "VS" di tengah' 
  },
];

// Modern Viral Color Palettes
const COLOR_PRESETS = [
  { id: 'blueprint-indigo', name: 'Blueprint Navy', color: '#1E3A8A', text: '#FFFFFF', pillBg: '#0F172A', pillText: '#60A5FA', accent: '#3B82F6' },
  { id: 'meta-blue', name: 'Facebook Blue', color: '#1877F2', text: '#FFFFFF', pillBg: '#FFFFFF', pillText: '#1877F2', accent: '#0D65D9' },
  { id: 'youtube-red', name: 'Viral Red', color: '#E50914', text: '#FFFFFF', pillBg: '#FFFFFF', pillText: '#E50914', accent: '#B20710' },
  { id: 'hormozi-gold', name: 'Hormozi Amber', color: '#F59E0B', text: '#000000', pillBg: '#000000', pillText: '#F59E0B', accent: '#D97706' },
  { id: 'emerald-green', name: 'Finance Emerald', color: '#059669', text: '#FFFFFF', pillBg: '#FFFFFF', pillText: '#059669', accent: '#047857' },
  { id: 'cyber-purple', name: 'Cyber Purple', color: '#7C3AED', text: '#FFFFFF', pillBg: '#FFFFFF', pillText: '#7C3AED', accent: '#6D28D9' },
  { id: 'dark-slate', name: 'Stealth Black', color: '#18181B', text: '#FFFFFF', pillBg: '#27272A', pillText: '#F4F4F5', accent: '#09090B' },
  { id: 'neon-pink', name: 'Neon Pink', color: '#EC4899', text: '#FFFFFF', pillBg: '#FFFFFF', pillText: '#EC4899', accent: '#DB2777' },
  { id: 'electric-cyan', name: 'Electric Cyan', color: '#06B6D4', text: '#000000', pillBg: '#000000', pillText: '#06B6D4', accent: '#0891B2' },
  { id: 'sunset-orange', name: 'TikTok Orange', color: '#FF5722', text: '#FFFFFF', pillBg: '#FFFFFF', pillText: '#FF5722', accent: '#E64A19' },
  { id: 'volt-lime', name: 'Volt Lime', color: '#84CC16', text: '#000000', pillBg: '#000000', pillText: '#84CC16', accent: '#65A30D' },
  { id: 'earthy-olive', name: 'Earthy Olive', color: '#4D7C0F', text: '#FFFFFF', pillBg: '#FFFFFF', pillText: '#4D7C0F', accent: '#3F6212' },
  { id: 'luxe-bronze', name: 'Luxe Bronze', color: '#78350F', text: '#FFFFFF', pillBg: '#FEF3C7', pillText: '#78350F', accent: '#92400E' },
  { id: 'pastel-lavender', name: 'Pastel Lavender', color: '#A855F7', text: '#FFFFFF', pillBg: '#FFFFFF', pillText: '#A855F7', accent: '#9333EA' },
  { id: 'ocean-navy', name: 'Deep Navy', color: '#0F172A', text: '#FFFFFF', pillBg: '#1E293B', pillText: '#38BDF8', accent: '#0284C7' },
  { id: 'crimson-warning', name: 'Crimson Warning', color: '#991B1B', text: '#FFFFFF', pillBg: '#FEF2F2', pillText: '#991B1B', accent: '#7F1D1D' },
  { id: 'monochrome-noir', name: 'Monochrome Noir', color: '#000000', text: '#FFFFFF', pillBg: '#FFFFFF', pillText: '#000000', accent: '#27272A' },
];

// 1-Click Viral Stickers / Badges
const STICKER_PRESETS = [
  { id: 'none', label: 'Tanpa Stiker', emoji: '' },
  { id: 'viral', label: '🔥 VIRAL!', emoji: '🔥' },
  { id: 'penting', label: '🚨 PENTING!', emoji: '🚨' },
  { id: 'tips', label: '💡 TIPS & TRIK', emoji: '💡' },
  { id: 'cuan', label: '💰 CUAN GURIH', emoji: '💰' },
  { id: 'shocking', label: '😱 SHOCKING!', emoji: '😱' },
  { id: 'rahasia', label: '🤫 RAHASIA!', emoji: '🤫' },
  { id: 'wajib', label: '✅ WAJIB NONTON', emoji: '✅' },
  { id: 'stop', label: '❌ JANGAN LAKUKAN', emoji: '❌' },
  { id: 'podcast', label: '🎙️ PODCAST', emoji: '🎙️' },
];

// Typography Styles
const FONT_OPTIONS = [
  { id: 'impact', name: 'Modern Impact', family: '-apple-system, BlinkMacSystemFont, "Montserrat", "Impact", sans-serif' },
  { id: 'condensed', name: 'Condensed Punch', family: '"Anton", "Bebas Neue", -apple-system, sans-serif' },
  { id: 'clean', name: 'Clean Geometric', family: '-apple-system, BlinkMacSystemFont, "Poppins", "Inter", sans-serif' },
  { id: 'serif', name: 'Cinematic Serif', family: '"Playfair Display", "Georgia", serif' },
];

// Copyright-Free Audio SFX
const SFX_PRESETS = [
  { id: 'chime', name: 'iPhone / Chime', icon: '🔔', desc: 'Denting notifikasi smartphone viral' },
  { id: 'whoosh', name: 'Fast Whoosh', icon: '💨', desc: 'Hembusan angin cepat modern' },
  { id: 'boom', name: 'Cinematic Boom', icon: '💥', desc: 'Dentuman bass elegan berkelas' },
  { id: 'camera', name: 'Camera Click', icon: '📸', desc: 'Klik jepretan kamera dua ketukan' },
  { id: 'pop', name: 'Bubble Pop', icon: '🎈', desc: 'Letupan gelembung renyah' },
  { id: 'none', name: 'Tanpa SFX', icon: '🔇', desc: 'Hanya audio asli klip' },
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
  // Template & Theme State
  const [selectedTemplate, setSelectedTemplate] = useState('meta-card');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [selectedSticker, setSelectedSticker] = useState('viral');

  // Text State
  const [pillText, setPillText] = useState(() => initialTitle ? initialTitle.slice(0, 18) : 'Trending Now');
  const [headline, setHeadline] = useState(initialTitle || 'Cara Menghasilkan Uang dari Konten Video');
  const [headlineSize, setHeadlineSize] = useState(56);
  const [showBottomCard, setShowBottomCard] = useState(true);
  const [cardEyebrow, setCardEyebrow] = useState('ANNOUNCEMENTS');
  const [cardText, setCardText] = useState(
    initialHook || initialTitle || "Pelajari strategi viral algoritma terbaru untuk mempercepat pertumbuhan akun Anda."
  );

  // Manual Headline Layout & Style Overrides
  const [headlinePosY, setHeadlinePosY] = useState(0); // Offset in px: -400 to +700
  const [headlinePosX, setHeadlinePosX] = useState(0); // Offset in px: -300 to +300
  const [headlineAlign, setHeadlineAlign] = useState('auto'); // 'auto' | 'left' | 'center' | 'right'
  const [customHeadlineColor, setCustomHeadlineColor] = useState(''); // '' means auto/template default
  const [customBgColor, setCustomBgColor] = useState(''); // '' means auto/template default
  const [customBgBox, setCustomBgBox] = useState(false); // Enable explicit background box/highlight
  const [bgBoxOpacity, setBgBoxOpacity] = useState(85); // 20 to 100%

  const resetHeadlineLayout = () => {
    setHeadlinePosY(0);
    setHeadlinePosX(0);
    setHeadlineAlign('auto');
    setCustomHeadlineColor('');
    setCustomBgColor('');
    setCustomBgBox(false);
    setBgBoxOpacity(85);
  };

  // Curve Style for Meta template
  const [curveStyle, setCurveStyle] = useState('arch'); // 'arch', 'wave', 'slant', 'straight'

  // Visual Contrast & Readability Enhancers
  const [vignetteDim, setVignetteDim] = useState(25); // 0 to 80%
  const [highlightText, setHighlightText] = useState(false); // highlighter marker box
  const [borderFrame, setBorderFrame] = useState('none'); // 'none', 'white', 'neon', 'letterbox'

  // Channel Logo State (Persisted in localStorage)
  const [channelLogo, setChannelLogo] = useState(() => {
    try {
      return localStorage.getItem('openshorts_channel_logo') || null;
    } catch {
      return null;
    }
  });
  const [logoPlacement, setLogoPlacement] = useState('pill'); // 'pill', 'corner', 'card', 'none'
  const fileInputRef = useRef(null);

  // Audio SFX State
  const [selectedSfx, setSelectedSfx] = useState('chime');
  const [sfxVolume, setSfxVolume] = useState(35);
  const [customSfx, setCustomSfx] = useState(null);

  // Intro Burn State
  const [isBurningIntro, setIsBurningIntro] = useState(false);
  const [introBurnSuccess, setIntroBurnSuccess] = useState(false);
  const [burnError, setBurnError] = useState(null);
  const [introMode, setIntroMode] = useState('overlay'); // 'overlay' | 'freeze'

  // Video Scrubbing
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

  // Play audio preview
  const playSfxPreview = (sfxId) => {
    if (sfxId === 'none') return;
    try {
      const audioUrl = customSfx && sfxId === 'custom' ? customSfx : `/sfx/${sfxId}.wav`;
      const audio = new Audio(audioUrl);
      audio.volume = Math.min(1.0, Math.max(0.05, sfxVolume / 100));
      audio.play().catch((e) => console.log('Audio preview error:', e));
    } catch (e) {
      console.warn('Audio playback not supported:', e);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 30);
      setVideoLoaded(true);
      drawCanvas();
    }
  };

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.load();
    }
  }, [videoUrl]);

  useEffect(() => {
    if (videoLoaded) {
      drawCanvas();
    }
  }, [
    selectedTemplate, selectedColor, selectedFont, selectedSticker, pillText, 
    headline, headlineSize, showBottomCard, cardEyebrow, cardText, curveStyle, 
    vignetteDim, highlightText, borderFrame, channelLogo, logoPlacement, currentTime, videoLoaded,
    headlinePosY, headlinePosX, headlineAlign, customHeadlineColor, customBgColor, customBgBox, bgBoxOpacity
  ]);

  // Helper: Hex color to RGBA string
  const hexToRgba = (hex, alpha = 1) => {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const r = parseInt(c.substring(0, 2), 16) || 0;
    const g = parseInt(c.substring(2, 4), 16) || 0;
    const b = parseInt(c.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Helper: Draw background box behind headline lines
  const drawHeadlineBackgroundBox = (ctx, lines, startX, startY, lineHeight, align, W) => {
    if (!lines || lines.length === 0) return;
    ctx.save();
    const padX = 32;
    const padY = 20;
    const radius = 18;
    const fillCol = customBgColor ? hexToRgba(customBgColor, bgBoxOpacity / 100) : `rgba(0, 0, 0, ${bgBoxOpacity / 100})`;

    ctx.fillStyle = fillCol;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;

    let maxLineWidth = 0;
    for (const l of lines) {
      const lw = ctx.measureText(l).width;
      if (lw > maxLineWidth) maxLineWidth = lw;
    }

    const totalHeight = lines.length * lineHeight;
    let boxX = startX;
    if (align === 'center') {
      boxX = startX - maxLineWidth / 2 - padX;
    } else if (align === 'right') {
      boxX = startX - maxLineWidth - padX;
    } else {
      boxX = startX - padX;
    }

    ctx.beginPath();
    ctx.roundRect(boxX, startY - padY, maxLineWidth + padX * 2, totalHeight + padY * 2, radius);
    ctx.fill();

    // Subtle border on custom box
    ctx.strokeStyle = customHeadlineColor ? hexToRgba(customHeadlineColor, 0.4) : 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  };

  // Helper: Text Wrapping with full manual newline support
  const wrapText = (ctx, text, maxWidth) => {
    if (!text) return [];
    // Normalize literal "\n" strings (e.g. from copy-paste) into real newlines and split
    const normalizedText = String(text).replace(/\\n/g, '\n');
    const rawLines = normalizedText.split(/\r?\n/);
    const finalLines = [];

    for (const rawLine of rawLines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      const words = trimmed.split(/\s+/);
      let currentLine = words[0] || '';

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
          currentLine += ' ' + word;
        } else {
          finalLines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) finalLines.push(currentLine);
    }
    return finalLines;
  };

  // -------------------------------------------------------------
  // MASTER CANVAS RENDERER (1080x1920)
  // -------------------------------------------------------------
  const renderThumbnailToCanvas = (targetCanvas, withVideo = true) => {
    const video = videoRef.current;
    if (!targetCanvas) return;

    const ctx = targetCanvas.getContext('2d');
    const W = 1080;
    const H = 1920;
    targetCanvas.width = W;
    targetCanvas.height = H;
    ctx.clearRect(0, 0, W, H);

    // 1. Draw Video Frame
    if (withVideo && video) {
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
    }

    // 2. Readability Vignette & Dimmer Overlay
    if (withVideo && vignetteDim > 0) {
      ctx.save();
      const alpha = Math.min(0.85, vignetteDim / 100);
      // Top and bottom gradient for maximum text clarity
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, `rgba(0, 0, 0, ${alpha * 0.9})`);
      grad.addColorStop(0.35, `rgba(0, 0, 0, ${alpha * 0.3})`);
      grad.addColorStop(0.65, `rgba(0, 0, 0, ${alpha * 0.3})`);
      grad.addColorStop(1, `rgba(0, 0, 0, ${alpha * 0.95})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // 3. Render Selected Template Layout
    switch (selectedTemplate) {
      case 'hormozi-bold':
        renderTemplateHormozi(ctx, W, H);
        break;
      case 'breaking-news':
        renderTemplateBreakingNews(ctx, W, H);
        break;
      case 'podcast-quote':
        renderTemplatePodcastQuote(ctx, W, H);
        break;
      case 'cinematic-minimal':
        renderTemplateCinematicMinimal(ctx, W, H);
        break;
      case 'sticker-hook':
        renderTemplateStickerHook(ctx, W, H);
        break;
      case 'split-comparison':
        renderTemplateSplitComparison(ctx, W, H);
        break;
      case 'blueprint-podcast':
        renderTemplateBlueprintPodcast(ctx, W, H);
        break;
      case 'meta-card':
      default:
        renderTemplateMetaCard(ctx, W, H);
        break;
    }

    // 4. Draw Channel Logo in Corner if chosen
    if (channelLogo && logoPlacement === 'corner') {
      const logoImg = new window.Image();
      logoImg.src = channelLogo;
      if (logoImg.complete) {
        ctx.save();
        const logoSize = 110;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 12;
        ctx.drawImage(logoImg, W - logoSize - 60, 90, logoSize, logoSize);
        ctx.restore();
      }
    }

    // 5. Border Frame Option
    if (borderFrame !== 'none') {
      ctx.save();
      if (borderFrame === 'white') {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 14;
        ctx.strokeRect(20, 20, W - 40, H - 40);
      } else if (borderFrame === 'neon') {
        ctx.strokeStyle = selectedColor.color;
        ctx.lineWidth = 12;
        ctx.shadowColor = selectedColor.color;
        ctx.shadowBlur = 24;
        ctx.strokeRect(20, 20, W - 40, H - 40);
      } else if (borderFrame === 'letterbox') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, 80);
        ctx.fillRect(0, H - 80, W, 80);
      }
      ctx.restore();
    }
  };

  // -------------------------------------------------------------
  // TEMPLATE 1: META / FACEBOOK CREATOR CARD
  // -------------------------------------------------------------
  const renderTemplateMetaCard = (ctx, W, H) => {
    // Top colored banner
    ctx.save();
    ctx.fillStyle = customBgColor || selectedColor.color;
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

    // Search Pill
    const pillY = 110;
    const pillH = 88;
    const pillPadX = 36;
    ctx.save();
    ctx.font = `bold 36px ${selectedFont.family}`;
    const pillTextWidth = ctx.measureText(pillText || 'Topic').width;
    const iconWidth = 50;
    const pillW = Math.max(280, pillTextWidth + iconWidth + pillPadX * 2);
    const pillX = 60;

    ctx.fillStyle = selectedColor.pillBg;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 44);
    ctx.fill();

    ctx.fillStyle = selectedColor.pillText;
    ctx.font = '34px sans-serif';
    ctx.fillText('🔍', pillX + 24, pillY + 56);

    ctx.font = `bold 36px ${selectedFont.family}`;
    ctx.fillText(pillText || 'Topic', pillX + 76, pillY + 57);

    // Pill right button
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

    // Headline Text
    ctx.save();
    ctx.fillStyle = customHeadlineColor || selectedColor.text;
    ctx.font = `800 ${headlineSize}px ${selectedFont.family}`;
    ctx.textBaseline = 'top';

    const finalAlign = headlineAlign !== 'auto' ? headlineAlign : 'left';
    ctx.textAlign = finalAlign;

    const headlineLines = wrapText(ctx, headline, W - 140);
    const lineSpacing = headlineSize * 1.22;
    let headlineY = 240 + headlinePosY;

    let headlineX = 60 + headlinePosX;
    if (finalAlign === 'center') headlineX = W / 2 + headlinePosX;
    if (finalAlign === 'right') headlineX = W - 60 + headlinePosX;

    if (customBgBox) {
      drawHeadlineBackgroundBox(ctx, headlineLines, headlineX, headlineY, lineSpacing, finalAlign, W);
    }

    for (const line of headlineLines) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.fillText(line, headlineX, headlineY);
      headlineY += lineSpacing;
    }
    ctx.restore();

    // Bottom Announcement Card
    if (showBottomCard) {
      ctx.save();
      const cardX = 60;
      const cardY = 1260;
      const cardW = W - 120;
      const cardH = 540;
      const radius = 20;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 14;

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, radius);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      ctx.fillStyle = '#111827';
      ctx.font = `800 24px ${selectedFont.family}`;
      ctx.fillText((cardEyebrow || 'ANNOUNCEMENTS').toUpperCase(), cardX + 44, cardY + 60);

      ctx.fillStyle = selectedColor.color === '#FFFFFF' ? '#1877F2' : selectedColor.color;
      ctx.font = `800 46px ${selectedFont.family}`;
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

  // -------------------------------------------------------------
  // TEMPLATE 2: BOLD HORMOZI / MRBEAST HIGH-IMPACT
  // -------------------------------------------------------------
  const renderTemplateHormozi = (ctx, W, H) => {
    ctx.save();
    // Top viral sticker badge
    const stickerObj = STICKER_PRESETS.find((s) => s.id === selectedSticker);
    if (stickerObj && stickerObj.id !== 'none') {
      const badgeText = stickerObj.label;
      ctx.font = `900 36px ${selectedFont.family}`;
      const badgeW = ctx.measureText(badgeText).width + 60;
      const badgeX = (W - badgeW) / 2;
      const badgeY = 140;

      ctx.fillStyle = selectedColor.color;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, 76, 38);
      ctx.fill();

      ctx.fillStyle = selectedColor.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, W / 2, badgeY + 38);
    }

    // Huge Hormozi Headline in center-top area
    const finalAlign = headlineAlign !== 'auto' ? headlineAlign : 'center';
    ctx.textAlign = finalAlign;
    ctx.textBaseline = 'middle';
    const bigSize = Math.max(68, Math.min(102, headlineSize * 1.35));
    ctx.font = `900 ${bigSize}px ${selectedFont.family}`;

    const lines = wrapText(ctx, headline.toUpperCase(), W - 120);
    const lineSpacing = bigSize * 1.18;
    const totalH = lines.length * lineSpacing;
    let startY = 380 + (400 - totalH) / 2 + headlinePosY;

    let startX = W / 2 + headlinePosX;
    if (finalAlign === 'left') startX = 80 + headlinePosX;
    if (finalAlign === 'right') startX = W - 80 + headlinePosX;

    if (customBgBox) {
      drawHeadlineBackgroundBox(ctx, lines, startX, startY - bigSize * 0.55, lineSpacing, finalAlign, W);
    }

    lines.forEach((line, i) => {
      const y = startY + i * lineSpacing;

      // Optional highlighter box behind words
      if (highlightText && !customBgBox) {
        const lineW = ctx.measureText(line).width + 40;
        ctx.fillStyle = customBgColor || (i % 2 === 0 ? selectedColor.color : '#FFFFFF');
        let hBoxX = (W - lineW) / 2 + headlinePosX;
        if (finalAlign === 'left') hBoxX = startX - 20;
        if (finalAlign === 'right') hBoxX = startX - lineW + 20;
        ctx.fillRect(hBoxX, y - bigSize * 0.55, lineW, bigSize * 1.05);
      }

      // Thick black stroke for 100% pop
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 14;
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 2;
      ctx.strokeText(line, startX, y);

      // Fill text
      ctx.fillStyle = customHeadlineColor || (
        highlightText
          ? (i % 2 === 0 ? selectedColor.text : '#000000')
          : (i % 2 === 0 ? selectedColor.color : '#FFFFFF')
      );

      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      ctx.fillText(line, startX, y);
    });

    // Bottom Hook Card / Subtitle
    if (showBottomCard && cardText) {
      const bCardW = W - 140;
      const bCardH = 220;
      const bCardX = 70;
      const bCardY = H - 340;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.strokeStyle = selectedColor.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(bCardX, bCardY, bCardW, bCardH, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `800 36px ${selectedFont.family}`;
      ctx.textAlign = 'center';
      const cLines = wrapText(ctx, cardText, bCardW - 60);
      cLines.slice(0, 3).forEach((cl, idx) => {
        ctx.fillText(cl, W / 2, bCardY + 60 + idx * 46);
      });
    }
    ctx.restore();
  };

  // -------------------------------------------------------------
  // TEMPLATE 3: BREAKING NEWS / VIRAL ALERT
  // -------------------------------------------------------------
  const renderTemplateBreakingNews = (ctx, W, H) => {
    ctx.save();
    // Top Breaking News Banner Bar
    ctx.fillStyle = customBgColor || '#E50914';
    ctx.fillRect(0, 0, W, 140);

    // Blinking dot + Title
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(80, 70, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 48px ${selectedFont.family}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('BREAKING NEWS', 120, 70);

    ctx.font = `700 28px ${selectedFont.family}`;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FEF08A';
    ctx.fillText('🔴 LIVE UPDATE', W - 60, 70);

    // News Chyron Box for Headline
    const boxY = 180 + headlinePosY;
    const boxW = W - 100;
    const boxX = 50 + headlinePosX;
    const lines = wrapText(ctx, headline, boxW - 80);
    const lineSpacing = headlineSize * 1.25;
    const boxH = Math.max(220, lines.length * lineSpacing + 80);

    const boxBg = customBgColor ? hexToRgba(customBgColor, bgBoxOpacity / 100) : 'rgba(15, 23, 42, 0.92)';
    ctx.fillStyle = boxBg;
    ctx.strokeStyle = customBgColor || '#E50914';
    ctx.lineWidth = 8;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 16);
    ctx.fill();
    ctx.stroke();

    // Headline inside box
    const finalAlign = headlineAlign !== 'auto' ? headlineAlign : 'left';
    ctx.textAlign = finalAlign;
    ctx.textBaseline = 'top';
    ctx.fillStyle = customHeadlineColor || '#FFFFFF';
    ctx.font = `800 ${headlineSize}px ${selectedFont.family}`;

    let textX = boxX + 40;
    if (finalAlign === 'center') textX = boxX + boxW / 2;
    if (finalAlign === 'right') textX = boxX + boxW - 40;

    lines.forEach((l, i) => {
      ctx.fillText(l, textX, boxY + 40 + i * lineSpacing);
    });

    // Bottom Ticker Banner
    if (showBottomCard) {
      const tickH = 130;
      const tickY = H - 220;

      ctx.fillStyle = selectedColor.color;
      ctx.fillRect(0, tickY, W, tickH);

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, tickY, 200, tickH);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `900 32px ${selectedFont.family}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('INFO :', 100, tickY + tickH / 2);

      ctx.fillStyle = selectedColor.text;
      ctx.font = `700 34px ${selectedFont.family}`;
      ctx.textAlign = 'left';
      ctx.fillText(cardText.slice(0, 55) + '…', 230, tickY + tickH / 2);
    }
    ctx.restore();
  };

  // -------------------------------------------------------------
  // TEMPLATE 4: PODCAST / TALKSHOW QUOTE
  // -------------------------------------------------------------
  const renderTemplatePodcastQuote = (ctx, W, H) => {
    ctx.save();
    // Top Host / Podcast Tag
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    ctx.roundRect(60, 100, 360, 70, 35);
    ctx.fill();

    ctx.fillStyle = selectedColor.color;
    ctx.font = `800 28px ${selectedFont.family}`;
    ctx.textBaseline = 'middle';
    ctx.fillText('🎙️ ' + (pillText || 'PODCAST HIGHLIGHT'), 86, 135);

    // Large Quotation Mark
    ctx.fillStyle = customBgColor || selectedColor.color;
    ctx.font = '900 160px Georgia, serif';
    ctx.textBaseline = 'top';
    ctx.fillText('“', 60 + headlinePosX, 220 + headlinePosY);

    // Quote Content Box
    const quoteY = 320 + headlinePosY;
    const quoteW = W - 140;
    ctx.font = `800 ${Math.max(48, headlineSize)}px ${selectedFont.family}`;
    ctx.fillStyle = customHeadlineColor || '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 16;

    const finalAlign = headlineAlign !== 'auto' ? headlineAlign : 'left';
    ctx.textAlign = finalAlign;

    let startX = 80 + headlinePosX;
    if (finalAlign === 'center') startX = W / 2 + headlinePosX;
    if (finalAlign === 'right') startX = W - 80 + headlinePosX;

    const qLines = wrapText(ctx, headline, quoteW);
    const lineSpacing = headlineSize * 1.25;

    if (customBgBox) {
      drawHeadlineBackgroundBox(ctx, qLines, startX, quoteY, lineSpacing, finalAlign, W);
    }

    let qY = quoteY;
    qLines.forEach((ql) => {
      ctx.fillText(ql, startX, qY);
      qY += lineSpacing;
    });

    // Speaker Name Card at Bottom
    if (showBottomCard) {
      const cardY = H - 360;
      ctx.fillStyle = 'rgba(24, 24, 27, 0.92)';
      ctx.strokeStyle = selectedColor.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(60, cardY, W - 120, 220, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = selectedColor.color;
      ctx.font = `900 32px ${selectedFont.family}`;
      ctx.fillText(cardEyebrow || 'NARASUMBER / GUEST', 100, cardY + 60);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `600 34px ${selectedFont.family}`;
      const cLines = wrapText(ctx, cardText, W - 200);
      cLines.slice(0, 2).forEach((cl, i) => {
        ctx.fillText(cl, 100, cardY + 115 + i * 44);
      });
    }
    ctx.restore();
  };

  // -------------------------------------------------------------
  // TEMPLATE 5: CINEMATIC MINIMAL / VOX
  // -------------------------------------------------------------
  const renderTemplateCinematicMinimal = (ctx, W, H) => {
    ctx.save();
    // Top Widescreen Letterbox Bar
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, 100);
    ctx.fillRect(0, H - 100, W, 100);

    // Minimalist Category Tag
    ctx.fillStyle = selectedColor.color;
    ctx.font = `800 30px ${selectedFont.family}`;
    ctx.textAlign = 'left';
    ctx.fillText('• ' + (pillText || 'DOKUMENTER').toUpperCase(), 70, 150);

    // Bottom Third Gradient
    const bGrad = ctx.createLinearGradient(0, H - 850, 0, H);
    if (customBgColor) {
      bGrad.addColorStop(0, 'rgba(0,0,0,0)');
      bGrad.addColorStop(0.5, hexToRgba(customBgColor, (bgBoxOpacity / 100) * 0.85));
      bGrad.addColorStop(1, hexToRgba(customBgColor, bgBoxOpacity / 100));
    } else {
      bGrad.addColorStop(0, 'rgba(0,0,0,0)');
      bGrad.addColorStop(0.5, 'rgba(0,0,0,0.85)');
      bGrad.addColorStop(1, '#000000');
    }
    ctx.fillStyle = bGrad;
    ctx.fillRect(0, H - 850, W, 850);

    // Headline in Bottom Third
    ctx.fillStyle = customHeadlineColor || '#FFFFFF';
    ctx.font = `800 ${headlineSize}px ${selectedFont.family}`;
    ctx.textBaseline = 'bottom';
    const finalAlign = headlineAlign !== 'auto' ? headlineAlign : 'left';
    ctx.textAlign = finalAlign;

    let startX = 70 + headlinePosX;
    if (finalAlign === 'center') startX = W / 2 + headlinePosX;
    if (finalAlign === 'right') startX = W - 70 + headlinePosX;

    const lines = wrapText(ctx, headline, W - 140);
    const lineSpacing = headlineSize * 1.2;
    let curY = (H - 280) + headlinePosY;

    if (customBgBox) {
      const topY = curY - (lines.length * lineSpacing);
      drawHeadlineBackgroundBox(ctx, lines, startX, topY, lineSpacing, finalAlign, W);
    }

    for (let i = lines.length - 1; i >= 0; i--) {
      ctx.fillText(lines[i], startX, curY);
      curY -= lineSpacing;
    }

    // Subtitle text line
    if (showBottomCard && cardText) {
      ctx.fillStyle = customBgColor || selectedColor.color;
      ctx.font = `700 32px ${selectedFont.family}`;
      ctx.fillText(cardText.slice(0, 60), 70, H - 180);
    }
    ctx.restore();
  };

  // -------------------------------------------------------------
  // TEMPLATE 6: VIRAL STICKER / TIKTOK HOOK
  // -------------------------------------------------------------
  const renderTemplateStickerHook = (ctx, W, H) => {
    ctx.save();
    // Tilted Sticker Badge
    const stickerObj = STICKER_PRESETS.find((s) => s.id === selectedSticker);
    const stickerLabel = stickerObj && stickerObj.id !== 'none' ? stickerObj.label : '🔥 WAJIB TAHU!';

    ctx.save();
    ctx.translate(140, 160);
    ctx.rotate((-5 * Math.PI) / 180);

    ctx.fillStyle = '#000000';
    ctx.fillRect(-10, -10, 360, 80);

    ctx.fillStyle = selectedColor.color;
    ctx.fillRect(-16, -16, 360, 80);

    ctx.fillStyle = selectedColor.text;
    ctx.font = `900 36px ${selectedFont.family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stickerLabel, 164, 24);
    ctx.restore();

    // Headline with Neon Highlighter Boxes
    ctx.font = `900 ${headlineSize}px ${selectedFont.family}`;
    ctx.textBaseline = 'top';
    const finalAlign = headlineAlign !== 'auto' ? headlineAlign : 'left';
    ctx.textAlign = finalAlign;

    const lines = wrapText(ctx, headline, W - 140);
    let startY = 320 + headlinePosY;

    lines.forEach((line, idx) => {
      const lineW = ctx.measureText(line).width + 36;
      const boxH = headlineSize * 1.25;

      let boxX = 70 + headlinePosX;
      let textX = 88 + headlinePosX;
      if (finalAlign === 'center') {
        boxX = (W - lineW) / 2 + headlinePosX;
        textX = W / 2 + headlinePosX;
      } else if (finalAlign === 'right') {
        boxX = W - lineW - 70 + headlinePosX;
        textX = W - 70 - 18 + headlinePosX;
      }

      // Drop shadow box
      ctx.fillStyle = '#000000';
      ctx.fillRect(boxX + 4, startY + 6, lineW, boxH);

      // Bright colored marker box
      ctx.fillStyle = customBgColor || (idx % 2 === 0 ? selectedColor.color : '#FFFFFF');
      ctx.fillRect(boxX, startY, lineW, boxH);

      // Text inside box
      ctx.fillStyle = customHeadlineColor || (idx % 2 === 0 ? selectedColor.text : '#000000');
      ctx.fillText(line, textX, startY + (boxH - headlineSize) / 2);

      startY += boxH + 16;
    });

    // Bottom Callout Sticker
    if (showBottomCard && cardText) {
      const calloutY = H - 320;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(60, calloutY, W - 120, 180, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = selectedColor.color;
      ctx.font = `900 32px ${selectedFont.family}`;
      ctx.textAlign = 'center';
      ctx.fillText('👉 ' + cardText.slice(0, 48), W / 2, calloutY + 95);
    }
    ctx.restore();
  };

  // -------------------------------------------------------------
  // TEMPLATE 7: SPLIT COMPARISON (VS)
  // -------------------------------------------------------------
  const renderTemplateSplitComparison = (ctx, W, H) => {
    ctx.save();
    // Top Banner
    ctx.fillStyle = customBgColor || selectedColor.color;
    ctx.fillRect(0, 0, W, 360);

    ctx.fillStyle = selectedColor.text;
    ctx.font = `900 48px ${selectedFont.family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((pillText || 'CARA LAMA vs CARA BARU').toUpperCase(), W / 2, 110);

    ctx.fillStyle = customHeadlineColor || '#FFFFFF';
    ctx.font = `800 ${headlineSize * 0.9}px ${selectedFont.family}`;
    const finalAlign = headlineAlign !== 'auto' ? headlineAlign : 'center';
    ctx.textAlign = finalAlign;

    let startX = W / 2 + headlinePosX;
    if (finalAlign === 'left') startX = 80 + headlinePosX;
    if (finalAlign === 'right') startX = W - 80 + headlinePosX;

    const topLines = wrapText(ctx, headline, W - 160);
    const lineSpacing = headlineSize * 0.95;

    if (customBgBox) {
      drawHeadlineBackgroundBox(ctx, topLines, startX, 210 + headlinePosY - lineSpacing * 0.5, lineSpacing, finalAlign, W);
    }

    topLines.forEach((tl, i) => {
      ctx.fillText(tl, startX, 210 + headlinePosY + i * lineSpacing);
    });

    // Center "VS" Emblem
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(W / 2, 360, 68, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = selectedColor.color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(W / 2, 360, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#E50914';
    ctx.font = `900 46px ${selectedFont.family}`;
    ctx.fillText('VS', W / 2, 362);

    // Bottom Result Banner
    if (showBottomCard && cardText) {
      const bH = 260;
      const bY = H - bH;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(0, bY, W, bH);

      ctx.fillStyle = '#22C55E';
      ctx.font = `900 32px ${selectedFont.family}`;
      ctx.fillText('HASIL REKOMENDASI:', W / 2, bY + 60);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `700 36px ${selectedFont.family}`;
      const bLines = wrapText(ctx, cardText, W - 140);
      bLines.slice(0, 2).forEach((bl, i) => {
        ctx.fillText(bl, W / 2, bY + 120 + i * 46);
      });
    }
    ctx.restore();
  };

  // -------------------------------------------------------------
  // TEMPLATE 8: BLUEPRINT PODCAST / FELIX SIAUW SIGNATURE
  // -------------------------------------------------------------
  const renderTemplateBlueprintPodcast = (ctx, W, H) => {
    ctx.save();

    // 1. Top Blueprint Grid Container (y: 0 -> 680)
    const headerH = 680;

    // Dark indigo/navy base gradient with smooth bottom fade
    const bgGrad = ctx.createLinearGradient(0, 0, 0, headerH);
    if (customBgColor) {
      bgGrad.addColorStop(0, hexToRgba(customBgColor, (bgBoxOpacity / 100) * 0.96));
      bgGrad.addColorStop(0.65, hexToRgba(customBgColor, (bgBoxOpacity / 100) * 0.92));
      bgGrad.addColorStop(0.85, hexToRgba(customBgColor, (bgBoxOpacity / 100) * 0.60));
      bgGrad.addColorStop(1, hexToRgba(customBgColor, 0.0));
    } else {
      bgGrad.addColorStop(0, 'rgba(10, 16, 36, 0.96)');
      bgGrad.addColorStop(0.65, 'rgba(15, 23, 42, 0.92)');
      bgGrad.addColorStop(0.85, 'rgba(15, 23, 42, 0.60)');
      bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');
    }

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, headerH);

    // 2. Procedural Blueprint Grid Overlay
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, headerH);
    ctx.clip();

    const gridSize = 36;
    const gridMajor = 4; // Every 4th line is a major line

    // Vertical grid lines
    for (let x = 0; x <= W; x += gridSize) {
      const isMajor = (x / gridSize) % gridMajor === 0;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, headerH);
      ctx.strokeStyle = isMajor ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.14)';
      ctx.lineWidth = isMajor ? 1.5 : 0.8;
      ctx.stroke();
    }

    // Horizontal grid lines with progressive bottom fade
    for (let y = 0; y <= headerH; y += gridSize) {
      const isMajor = (y / gridSize) % gridMajor === 0;
      const alphaFactor = Math.max(0, 1 - (y / headerH));
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.strokeStyle = isMajor 
        ? `rgba(59, 130, 246, ${0.35 * alphaFactor})` 
        : `rgba(59, 130, 246, ${0.14 * alphaFactor})`;
      ctx.lineWidth = isMajor ? 1.5 : 0.8;
      ctx.stroke();
    }

    // Technical crosshairs (+) at major intersections
    for (let x = gridSize * gridMajor; x < W; x += gridSize * gridMajor) {
      for (let y = gridSize * gridMajor; y < headerH - 80; y += gridSize * gridMajor) {
        const crossAlpha = Math.max(0, 0.5 * (1 - y / headerH));
        ctx.strokeStyle = `rgba(147, 197, 253, ${crossAlpha})`;
        ctx.lineWidth = 1.2;
        const len = 6;
        ctx.beginPath();
        ctx.moveTo(x - len, y);
        ctx.lineTo(x + len, y);
        ctx.moveTo(x, y - len);
        ctx.lineTo(x, y + len);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 3. Optional Category / Topic Tag or Sticker Badge
    const stickerObj = STICKER_PRESETS.find((s) => s.id === selectedSticker);
    if (stickerObj && stickerObj.id !== 'none') {
      const bText = stickerObj.label;
      ctx.font = `800 24px ${selectedFont.family}`;
      const bW = ctx.measureText(bText).width + 36;
      const bX = (W - bW) / 2;
      const bY = 70;

      ctx.fillStyle = 'rgba(30, 58, 138, 0.85)';
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, 44, 22);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#93C5FD';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bText, W / 2, bY + 22);
    }

    // 4. Two-Tier Typography (The Felix Siauw Signature)
    // Tier 1: Lead-in / Question prefix (e.g. "KENAPA LEPAS" or pillText)
    const tier1Text = (pillText || 'KENAPA LEPAS').toUpperCase();
    const tier1Size = Math.max(40, Math.min(64, Math.round(headlineSize * 0.75)));

    ctx.font = `800 ${tier1Size}px ${selectedFont.family}`;
    const finalAlign = headlineAlign !== 'auto' ? headlineAlign : 'center';
    ctx.textAlign = finalAlign;
    ctx.textBaseline = 'middle';

    let startX = W / 2 + headlinePosX;
    if (finalAlign === 'left') startX = 80 + headlinePosX;
    if (finalAlign === 'right') startX = W - 80 + headlinePosX;

    const tier1Y = (stickerObj && stickerObj.id !== 'none' ? 180 : 160) + headlinePosY;

    // Text drop shadow & subtle stroke for 100% legibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = customHeadlineColor || '#FFFFFF';
    ctx.fillText(tier1Text, startX, tier1Y);

    // Tier 2: Giant Ultra-Bold Keyword / Headline (e.g. "HIJAB?")
    const tier2Lines = wrapText(ctx, (headline || 'HIJAB?').toUpperCase(), W - 140);
    const tier2Size = Math.max(76, Math.min(140, Math.round(headlineSize * (tier2Lines.length > 1 ? 1.35 : 1.6))));

    ctx.font = `900 ${tier2Size}px ${selectedFont.family}`;
    ctx.textAlign = finalAlign;
    ctx.textBaseline = 'middle';

    const tier2LineSpacing = tier2Size * 1.15;
    const tier2StartY = tier1Y + tier1Size * 0.6 + tier2Size * 0.55 + 16;

    if (customBgBox) {
      drawHeadlineBackgroundBox(ctx, tier2Lines, startX, tier2StartY - tier2Size * 0.5, tier2LineSpacing, finalAlign, W);
    }

    // Heavy outline + deep shadow for pop across all headline lines
    tier2Lines.forEach((line, idx) => {
      const lineY = tier2StartY + idx * tier2LineSpacing;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 12;
      ctx.strokeText(line, startX, lineY);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = customHeadlineColor || '#FFFFFF';
      ctx.fillText(line, startX, lineY);
    });

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Technical cyan blueprint line accent below title
    let maxTier2Width = 0;
    tier2Lines.forEach((line) => {
      const lw = ctx.measureText(line).width;
      if (lw > maxTier2Width) maxTier2Width = lw;
    });
    const accentW = Math.min(360, Math.max(140, maxTier2Width * 0.45));
    const lastTier2Y = tier2StartY + (tier2Lines.length - 1) * tier2LineSpacing;
    const accentY = lastTier2Y + tier2Size * 0.55 + 18;
    ctx.fillStyle = customBgColor || '#38BDF8';
    let accentX = (W - accentW) / 2 + headlinePosX;
    if (finalAlign === 'left') accentX = 80 + headlinePosX;
    if (finalAlign === 'right') accentX = W - 80 - accentW + headlinePosX;
    ctx.fillRect(accentX, accentY, accentW, 4);

    // 5. Bottom Subtitle / Hook Card (Optional)
    if (showBottomCard && cardText) {
      const bCardW = W - 140;
      const bCardH = 200;
      const bCardX = 70;
      const bCardY = H - 320;

      ctx.fillStyle = 'rgba(10, 16, 36, 0.88)';
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.55)';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.roundRect(bCardX, bCardY, bCardW, bCardH, 20);
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#38BDF8';
      ctx.font = `800 24px ${selectedFont.family}`;
      ctx.textAlign = 'center';
      ctx.fillText((cardEyebrow || 'INTISARI PESAN').toUpperCase(), W / 2, bCardY + 44);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `600 32px ${selectedFont.family}`;
      const cLines = wrapText(ctx, cardText, bCardW - 60);
      cLines.slice(0, 2).forEach((cl, idx) => {
        ctx.fillText(cl, W / 2, bCardY + 95 + idx * 44);
      });
    }

    ctx.restore();
  };

  const drawCanvas = () => {
    if (canvasRef.current) {
      renderThumbnailToCanvas(canvasRef.current, true);
    }
  };

  // Download high-resolution PNG
  const handleDownload = () => {
    if (!canvasRef.current) return;
    setIsGenerating(true);

    try {
      const offscreen = document.createElement('canvas');
      renderThumbnailToCanvas(offscreen, true);

      offscreen.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanJob = (jobId || 'short').slice(0, 8);
        const cleanTitle = (headline || 'thumbnail').replace(/\r?\n/g, ' ').slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
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
    if (!canvasRef.current || !jobId) return;

    setIsBurningIntro(true);
    setBurnError(null);
    setIntroBurnSuccess(false);

    try {
      const offscreen = document.createElement('canvas');
      if (introMode === 'overlay') {
        renderThumbnailToCanvas(offscreen, false);
      } else {
        renderThumbnailToCanvas(offscreen, true);
      }
      const dataUrl = offscreen.toDataURL('image/png');

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
      title="Studio Desain Cover 9:16 & Intro Video"
      size="xl"
    >
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Side: Live 9:16 Canvas Preview & Actions */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col items-center">
          <div className="relative w-full aspect-[9/16] bg-black/90 rounded-card overflow-hidden border-2 border-rule shadow-2xl flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
          </div>

          {/* Hidden Video for Frame Scrubbing */}
          <video
            ref={videoRef}
            src={videoUrl}
            crossOrigin="anonymous"
            onLoadedMetadata={handleLoadedMetadata}
            onLoadedData={() => { setVideoLoaded(true); drawCanvas(); }}
            onCanPlay={() => { setVideoLoaded(true); drawCanvas(); }}
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

          {/* Tipe Intro Video Selector */}
          <div className="w-full mt-3 p-2.5 bg-paper3 rounded-input border border-rule space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <span className="eyebrow text-brass text-[10px]">TIPE INTRO VIDEO</span>
              <span className="text-[10px] text-muted">2.5 Detik + SFX</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setIntroMode('overlay')}
                className={`p-2 rounded text-[11px] font-semibold flex flex-col items-center text-center transition-all cursor-pointer ${
                  introMode === 'overlay'
                    ? 'bg-brass/20 text-brass border border-brass shadow-xs'
                    : 'bg-paper text-muted border border-rule hover:text-ink'
                }`}
              >
                <span>🎬 Overlay Banner</span>
                <span className="text-[9px] font-normal opacity-80 mt-0.5">Video tetap berjalan</span>
              </button>
              <button
                type="button"
                onClick={() => setIntroMode('freeze')}
                className={`p-2 rounded text-[11px] font-semibold flex flex-col items-center text-center transition-all cursor-pointer ${
                  introMode === 'freeze'
                    ? 'bg-brass/20 text-brass border border-brass shadow-xs'
                    : 'bg-paper text-muted border border-rule hover:text-ink'
                }`}
              >
                <span>🖼️ Freeze Frame</span>
                <span className="text-[9px] font-normal opacity-80 mt-0.5">Cover diam 2.5s</span>
              </button>
            </div>
          </div>

          {/* Primary Action 1: Burn as Video Intro */}
          <button
            onClick={handleBurnIntro}
            disabled={isBurningIntro}
            className="btn-primary w-full py-3 mt-3 text-xs flex items-center justify-center gap-2 font-bold shadow-lg cursor-pointer"
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
          >
            <Download size={14} />
            <span>Download Gambar Cover (PNG 1080x1920)</span>
          </button>
        </div>

        {/* Right Side: Design & Customization Controls */}
        <div className="flex-1 w-full space-y-5 overflow-y-auto max-h-[75vh] custom-scrollbar pr-1 text-left">
          
          {/* 1. LAYOUT TEMPLATES (7 OPTIONS) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="eyebrow text-brass flex items-center gap-1.5">
                <Layout size={13} /> TEMPLATE DESAIN THUMBNAIL ({TEMPLATE_PRESETS.length} PILIHAN)
              </label>
              <span className="text-[11px] text-muted font-mono">{selectedTemplate}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
              {TEMPLATE_PRESETS.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`p-2.5 rounded-card border cursor-pointer transition-all flex flex-col justify-between ${
                    selectedTemplate === tpl.id
                      ? 'border-brass bg-brass/10 shadow-sm ring-1 ring-brass/40'
                      : 'border-rule bg-paper hover:bg-paper3'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xl">{tpl.icon}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface border border-rule text-brass">
                        {tpl.badge}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-ink leading-tight">{tpl.name}</div>
                  </div>
                  <div className="text-[10px] text-muted leading-tight mt-1.5 line-clamp-2">
                    {tpl.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. 16 VIRAL COLOR THEMES */}
          <div className="space-y-2">
            <label className="eyebrow flex items-center gap-1.5">
              <Palette size={13} /> 16 WARNA TEMA POPULER
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-[140px] overflow-y-auto p-1 border border-rule/60 rounded-card [color-scheme:dark]">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedColor(preset)}
                  className={`p-1.5 rounded text-left flex items-center gap-2 border transition-all cursor-pointer ${
                    selectedColor.id === preset.id
                      ? 'border-brass bg-paper3 shadow-xs'
                      : 'border-transparent hover:bg-surface'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 border border-white/30 shadow-xs"
                    style={{ backgroundColor: preset.color }}
                  />
                  <span className="text-[11px] font-medium text-ink truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. 1-CLICK VIRAL STICKERS & BADGES */}
          <div className="space-y-2">
            <label className="eyebrow flex items-center gap-1.5">
              <Flame size={13} className="text-brass" /> STIKER VIRAL (1-KLIK)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STICKER_PRESETS.map((stk) => (
                <button
                  key={stk.id}
                  onClick={() => setSelectedSticker(stk.id)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                    selectedSticker === stk.id
                      ? 'bg-brass text-surface font-bold border-brass shadow-xs'
                      : 'bg-paper text-muted border-rule hover:text-ink hover:border-muted'
                  }`}
                >
                  {stk.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. TYPOGRAPHY & READABILITY ENHANCERS */}
          <div className="p-3.5 bg-paper2 rounded-card border border-rule grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Font Style */}
            <div>
              <span className="eyebrow block mb-1 text-[10px]">TIPE FONT</span>
              <select
                value={selectedFont.id}
                onChange={(e) => setSelectedFont(FONT_OPTIONS.find((f) => f.id === e.target.value) || FONT_OPTIONS[0])}
                className="w-full bg-paper border border-rule rounded px-2 py-1.5 text-xs text-ink focus:border-brass"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Readability Vignette */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-muted mb-1 font-mono">
                <span>VIGNETTE GELAP:</span>
                <span className="text-brass font-bold">{vignetteDim}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={vignetteDim}
                onChange={(e) => setVignetteDim(parseInt(e.target.value))}
                className="w-full accent-brass cursor-pointer"
              />
            </div>

            {/* Highlighter marker */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-ink py-1">
                <input
                  type="checkbox"
                  checked={highlightText}
                  onChange={(e) => setHighlightText(e.target.checked)}
                  className="rounded text-brass focus:ring-brass"
                />
                <span className="font-semibold">Kotak Stabilo Teks</span>
              </label>
            </div>
          </div>

          {/* 5. AUDIO SFX OVERLAY */}
          <div className="p-3.5 bg-paper2 rounded-card border border-brass/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="eyebrow text-brass flex items-center gap-1.5">
                <Music size={13} /> AUDIO SFX INTRO (BEBAS COPYRIGHT)
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
          </div>

          {/* 6. TEKS JUDUL & KATEGORI */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="eyebrow block mb-1">🔍 KATEGORI / TOPIC PILL</label>
                <input
                  type="text"
                  value={pillText}
                  onChange={(e) => setPillText(e.target.value)}
                  className="w-full bg-paper border border-rule rounded-input px-3 py-2 text-xs text-ink focus:outline-none focus:border-brass"
                  placeholder="Contoh: Trending, AI & Tech, Podcast..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="eyebrow">📢 UKURAN JUDUL</label>
                  <span className="font-mono text-brass text-xs">{headlineSize}px</span>
                </div>
                <input
                  type="range"
                  min="42"
                  max="86"
                  value={headlineSize}
                  onChange={(e) => setHeadlineSize(parseInt(e.target.value))}
                  className="w-full accent-brass cursor-pointer mt-1"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="eyebrow">📢 HEADLINE / JUDUL UTAMA</label>
                <span className="text-[10px] text-muted">Tekan <b>Enter</b> untuk baris baru</span>
              </div>
              <textarea
                rows={3}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full bg-paper border border-rule rounded-input p-2.5 text-xs text-ink focus:outline-none focus:border-brass font-bold resize-y"
                placeholder="Tulis judul yang memicu rasa penasaran penonton... (Enter untuk ganti baris)"
              />
            </div>

            {/* 6.1. TATA LETAK & WARNA MANUAL HEADLINE */}
            <div className="p-3.5 bg-paper2 rounded-card border border-rule space-y-3">
              <div className="flex items-center justify-between">
                <label className="eyebrow text-brass flex items-center gap-1.5 font-bold">
                  <Sliders size={13} /> ATUR TATA LETAK & WARNA HEADLINE (MANUAL)
                </label>
                {(headlinePosY !== 0 || headlinePosX !== 0 || headlineAlign !== 'auto' || customHeadlineColor || customBgColor || customBgBox) && (
                  <button
                    type="button"
                    onClick={resetHeadlineLayout}
                    className="text-[10px] text-muted hover:text-ink flex items-center gap-1 cursor-pointer underline"
                  >
                    <RotateCcw size={10} /> Reset Default
                  </button>
                )}
              </div>

              {/* A. Posisi Y & X Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Posisi Y */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted font-medium">Posisi Vertikal (Y):</span>
                    <span className="font-mono text-brass text-[11px]">
                      {headlinePosY === 0 ? '0 (Auto)' : `${headlinePosY > 0 ? '+' : ''}${headlinePosY}px`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-400"
                    max="700"
                    step="10"
                    value={headlinePosY}
                    onChange={(e) => setHeadlinePosY(parseInt(e.target.value))}
                    className="w-full accent-brass cursor-pointer"
                  />
                  <div className="flex justify-between gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setHeadlinePosY(-180)}
                      className={`btn-quiet py-0.5 px-1.5 text-[10px] rounded cursor-pointer ${
                        headlinePosY === -180 ? 'bg-brass/20 text-brass border border-brass' : ''
                      }`}
                    >
                      ⬆️ Atas
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeadlinePosY(0)}
                      className={`btn-quiet py-0.5 px-1.5 text-[10px] rounded cursor-pointer ${
                        headlinePosY === 0 ? 'bg-brass/20 text-brass border border-brass' : ''
                      }`}
                    >
                      Auto
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeadlinePosY(280)}
                      className={`btn-quiet py-0.5 px-1.5 text-[10px] rounded cursor-pointer ${
                        headlinePosY === 280 ? 'bg-brass/20 text-brass border border-brass' : ''
                      }`}
                    >
                      ⏺️ Tengah
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeadlinePosY(650)}
                      className={`btn-quiet py-0.5 px-1.5 text-[10px] rounded cursor-pointer ${
                        headlinePosY === 650 ? 'bg-brass/20 text-brass border border-brass' : ''
                      }`}
                    >
                      ⬇️ Bawah
                    </button>
                  </div>
                </div>

                {/* Posisi X & Alignment */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted font-medium">Posisi Horizontal (X):</span>
                    <span className="font-mono text-brass text-[11px]">
                      {headlinePosX === 0 ? '0 (Tengah)' : `${headlinePosX > 0 ? '+' : ''}${headlinePosX}px`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-300"
                    max="300"
                    step="10"
                    value={headlinePosX}
                    onChange={(e) => setHeadlinePosX(parseInt(e.target.value))}
                    className="w-full accent-brass cursor-pointer"
                  />
                  {/* Alignment buttons */}
                  <div className="grid grid-cols-4 gap-1 pt-0.5">
                    {[
                      { id: 'auto', label: 'Auto' },
                      { id: 'left', label: '⬅️ Kiri' },
                      { id: 'center', label: '↔️ Tengah' },
                      { id: 'right', label: '➡️ Kanan' },
                    ].map((al) => (
                      <button
                        key={al.id}
                        type="button"
                        onClick={() => setHeadlineAlign(al.id)}
                        className={`py-0.5 px-1 text-[10px] rounded border transition-all cursor-pointer text-center font-medium ${
                          headlineAlign === al.id
                            ? 'border-brass bg-brass/20 text-brass font-bold'
                            : 'border-rule bg-paper text-muted hover:text-ink'
                        }`}
                      >
                        {al.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* B. Warna Teks & Warna Background */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-rule/60">
                {/* Warna Teks */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted font-medium">🎨 Warna Teks:</span>
                    {customHeadlineColor && (
                      <button
                        type="button"
                        onClick={() => setCustomHeadlineColor('')}
                        className="text-[10px] text-brass hover:underline cursor-pointer"
                      >
                        Reset Auto
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="relative w-8 h-8 rounded-input border border-rule cursor-pointer overflow-hidden shrink-0 shadow-xs">
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: customHeadlineColor || selectedColor.text || '#FFFFFF' }}
                      />
                      <input
                        type="color"
                        value={customHeadlineColor || selectedColor.text || '#FFFFFF'}
                        onChange={(e) => setCustomHeadlineColor(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </label>
                    <input
                      type="text"
                      value={customHeadlineColor}
                      onChange={(e) => setCustomHeadlineColor(e.target.value)}
                      placeholder="Auto (dari tema)"
                      className="flex-1 bg-paper border border-rule rounded-input px-2.5 py-1.5 text-xs text-ink font-mono"
                    />
                  </div>
                  {/* Fast Text Swatches */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {['#FFFFFF', '#FFE600', '#F59E0B', '#EF4444', '#10B981', '#06B6D4', '#000000'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCustomHeadlineColor(c)}
                        className={`w-5 h-5 rounded-full border border-white/30 cursor-pointer transition-transform hover:scale-110 ${
                          customHeadlineColor === c ? 'ring-2 ring-brass ring-offset-1 ring-offset-paper' : ''
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                {/* Warna Background */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted font-medium">🖼️ Warna Background Box/Banner:</span>
                    {customBgColor && (
                      <button
                        type="button"
                        onClick={() => setCustomBgColor('')}
                        className="text-[10px] text-brass hover:underline cursor-pointer"
                      >
                        Reset Auto
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="relative w-8 h-8 rounded-input border border-rule cursor-pointer overflow-hidden shrink-0 shadow-xs">
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: customBgColor || selectedColor.color || '#000000' }}
                      />
                      <input
                        type="color"
                        value={customBgColor || selectedColor.color || '#000000'}
                        onChange={(e) => setCustomBgColor(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </label>
                    <input
                      type="text"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      placeholder="Auto (dari tema)"
                      className="flex-1 bg-paper border border-rule rounded-input px-2.5 py-1.5 text-xs text-ink font-mono"
                    />
                  </div>
                  {/* Fast Background Swatches */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {['#000000', '#0F172A', '#1E3A8A', '#991B1B', '#065F46', '#7C3AED', '#F59E0B'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCustomBgColor(c)}
                        className={`w-5 h-5 rounded-full border border-white/30 cursor-pointer transition-transform hover:scale-110 ${
                          customBgColor === c ? 'ring-2 ring-brass ring-offset-1 ring-offset-paper' : ''
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* C. Kotak Highlight / Background Box Teks Toggle & Opacity */}
              <div className="pt-2 border-t border-rule/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-ink font-semibold">
                  <input
                    type="checkbox"
                    checked={customBgBox}
                    onChange={(e) => setCustomBgBox(e.target.checked)}
                    className="rounded text-brass focus:ring-brass cursor-pointer"
                  />
                  <span>Tampilkan Kotak Background di Belakang Teks</span>
                </label>

                {customBgBox && (
                  <div className="flex items-center gap-2 animate-fade">
                    <span className="text-muted text-[11px]">Transparansi Box:</span>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={bgBoxOpacity}
                      onChange={(e) => setBgBoxOpacity(parseInt(e.target.value))}
                      className="w-24 accent-brass cursor-pointer"
                    />
                    <span className="font-mono text-brass text-[11px] w-8">{bgBoxOpacity}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 7. KARTU PENGUMUMAN / SUB-HOOK */}
          <div className="p-3.5 bg-paper2 rounded-card border border-rule space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="eyebrow flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBottomCard}
                  onChange={(e) => setShowBottomCard(e.target.checked)}
                  className="rounded text-brass focus:ring-brass"
                />
                <span>TAMPILKAN KARTU BAWAH / SUB-HOOK</span>
              </label>
            </div>

            {showBottomCard && (
              <div className="space-y-2 pt-1">
                <div>
                  <span className="text-[10px] uppercase font-mono text-muted">Label Eyebrow:</span>
                  <input
                    type="text"
                    value={cardEyebrow}
                    onChange={(e) => setCardEyebrow(e.target.value)}
                    className="w-full bg-paper border border-rule rounded-input px-2.5 py-1.5 text-xs text-ink mt-0.5"
                    placeholder="Contoh: ANNOUNCEMENTS, TIPS, KESIMPULAN..."
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-muted">Isi Hook Bawah:</span>
                  <textarea
                    rows={2}
                    value={cardText}
                    onChange={(e) => setCardText(e.target.value)}
                    className="w-full bg-paper border border-rule rounded-input p-2.5 text-xs text-ink mt-0.5"
                    placeholder="Ringkasan atau kalimat penutup video..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* 8. CHANNEL LOGO */}
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
                <p className="text-[10px] text-muted mt-1">Logo tersimpan otomatis untuk seluruh klip berikutnya.</p>
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

        </div>
      </div>
    </Modal>
  );
}
