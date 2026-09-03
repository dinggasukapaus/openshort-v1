import React from 'react';
import { Heart, MessageCircle, Bookmark, Share2, Music2, Disc, User, Compass } from 'lucide-react';

/**
 * SafeZoneOverlay component for 9:16 vertical video previews.
 * Highlights TikTok, Instagram Reels, and YouTube Shorts UI safe zones
 * so clippers can avoid placing subtitles, hooks, or key faces where
 * native social media buttons and captions will cover them.
 * 
 * @param {string} mode - 'tiktok' | 'reels' | 'shorts' | 'off'
 * @param {boolean} showGuides - whether grid lines are shown
 */
export default function SafeZoneOverlay({ mode = 'tiktok', showGuides = true }) {
  if (mode === 'off' || !mode) return null;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden flex flex-col justify-between font-mono text-[9px] tracking-wider text-white/80">
      {/* 1. TOP SAFE LINE (Header, Search, Following/For You) */}
      <div className="w-full pt-3 px-3 pb-2 border-b border-dashed border-red-500/60 bg-gradient-to-b from-black/50 via-black/20 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-1 text-red-400 font-bold bg-black/60 px-1.5 py-0.5 rounded">
          <Compass size={11} />
          <span>{mode.toUpperCase()} TOP BOUNDARY</span>
        </div>
        <span className="text-[8px] text-white/60 bg-black/40 px-1 rounded">DO NOT PLACE HOOKS HIGHER</span>
      </div>

      {/* 2. OPTIMAL SUBTITLE & FACE ZONE (Center Sweet Spot) */}
      {showGuides && (
        <div className="absolute top-[22%] left-[10%] right-[22%] bottom-[24%] border-2 border-dashed border-emerald-400/40 rounded-lg flex flex-col items-center justify-between p-2 pointer-events-none">
          <span className="bg-emerald-950/80 text-emerald-300 font-semibold px-2 py-0.5 rounded text-[8px] border border-emerald-500/30">
            ✓ OPTIMAL HOOK & SUBTITLE ZONE
          </span>
          <span className="text-emerald-400/50 text-[8px] uppercase">
            CLEAR OF ALL SOCIAL UI ICONS
          </span>
        </div>
      )}

      {/* 3. RIGHT ACTION BAR (TikTok / Reels / Shorts buttons) */}
      <div className="absolute right-1 bottom-[18%] flex flex-col items-center gap-3 w-12 bg-black/40 backdrop-blur-[1px] py-2 rounded-l-md border-l border-y border-red-500/40">
        {mode === 'tiktok' && (
          <>
            <div className="w-7 h-7 rounded-full border border-dashed border-red-400/70 flex items-center justify-center bg-black/50">
              <User size={13} className="text-red-300" />
            </div>
            <div className="flex flex-col items-center">
              <Heart size={15} className="text-red-400 fill-red-500/30" />
              <span className="text-[7px] text-white/70">89.4K</span>
            </div>
            <div className="flex flex-col items-center">
              <MessageCircle size={15} className="text-red-400" />
              <span className="text-[7px] text-white/70">1.2K</span>
            </div>
            <div className="flex flex-col items-center">
              <Bookmark size={15} className="text-red-400" />
              <span className="text-[7px] text-white/70">5.8K</span>
            </div>
            <div className="flex flex-col items-center">
              <Share2 size={15} className="text-red-400" />
              <span className="text-[7px] text-white/70">Share</span>
            </div>
            <div className="w-6 h-6 rounded-full border border-red-400 animate-spin flex items-center justify-center bg-black/60">
              <Disc size={13} className="text-red-300" />
            </div>
          </>
        )}

        {mode === 'reels' && (
          <>
            <div className="flex flex-col items-center mt-2">
              <Heart size={16} className="text-pink-400" />
              <span className="text-[7px] text-white/70">Like</span>
            </div>
            <div className="flex flex-col items-center">
              <MessageCircle size={16} className="text-pink-400" />
              <span className="text-[7px] text-white/70">Comment</span>
            </div>
            <div className="flex flex-col items-center">
              <Share2 size={16} className="text-pink-400" />
              <span className="text-[7px] text-white/70">Share</span>
            </div>
            <div className="w-6 h-6 rounded border border-pink-400/60 flex items-center justify-center">
              <Music2 size={12} className="text-pink-300" />
            </div>
          </>
        )}

        {mode === 'shorts' && (
          <>
            <div className="flex flex-col items-center mt-2">
              <Heart size={16} className="text-red-500" />
              <span className="text-[7px]">Like</span>
            </div>
            <div className="flex flex-col items-center">
              <MessageCircle size={16} className="text-red-400" />
              <span className="text-[7px]">Dislike</span>
            </div>
            <div className="flex flex-col items-center">
              <MessageCircle size={16} className="text-white/80" />
              <span className="text-[7px]">Comments</span>
            </div>
            <div className="flex flex-col items-center">
              <Share2 size={16} className="text-white/80" />
              <span className="text-[7px]">Remix</span>
            </div>
          </>
        )}
      </div>

      {/* 4. BOTTOM CAPTION & AUDIO OVERLAY (Bottom 18%) */}
      <div className="w-full pt-2 pb-2 px-3 border-t border-dashed border-red-500/60 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[8px] text-red-400 font-bold bg-black/60 px-1 rounded">
            ⚠ {mode.toUpperCase()} CAPTION & SOUND ZONE
          </span>
          <span className="text-[7px] text-white/60">Captions here will be obscured</span>
        </div>
        <div className="w-[75%] h-2 bg-white/20 rounded-sm mt-0.5" />
        <div className="w-[60%] h-2 bg-white/15 rounded-sm" />
        <div className="flex items-center gap-1 text-[8px] text-white/50 mt-0.5">
          <Music2 size={10} />
          <span className="truncate">Original audio - {mode} sound track</span>
        </div>
      </div>
    </div>
  );
}
