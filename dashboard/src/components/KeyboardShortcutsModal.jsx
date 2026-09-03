import React from 'react';
import Modal from './ui/Modal';
import { Keyboard, Play, FastForward, Rewind, Shield, Star, Copy, X, Camera } from 'lucide-react';

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'Playback & Review',
      items: [
        { key: 'Space', desc: 'Play / Pause video yang sedang aktif', icon: <Play size={13} /> },
        { key: 'J atau ←', desc: 'Mundur 3 detik', icon: <Rewind size={13} /> },
        { key: 'L atau →', desc: 'Maju 3 detik', icon: <FastForward size={13} /> },
        { key: '0', desc: 'Restart video ke awal', icon: null },
        { key: '[ dan ]', desc: 'Perlambat / Percepat pemutaran (1x - 2x)', icon: <FastForward size={13} /> },
      ],
    },
    {
      category: 'Clipper Actions',
      items: [
        { key: 'M', desc: 'Toggle Safe Zone (TikTok / Reels / Shorts / Off)', icon: <Shield size={13} /> },
        { key: 'S', desc: 'Star ⭐ / Prioritaskan klip aktif', icon: <Star size={13} /> },
        { key: 'C', desc: 'Salin Seluruh Metadata (Title + Hook + Caption)', icon: <Copy size={13} /> },
        { key: 'T', desc: 'Tangkap Frame HD Cover / Thumbnail (PNG)', icon: <Camera size={13} /> },
      ],
    },
    {
      category: 'Navigasi & Bantuan',
      items: [
        { key: '?', desc: 'Buka / Tutup panduan shortcut ini', icon: <Keyboard size={13} /> },
        { key: 'Esc', desc: 'Tutup modal / popup yang aktif', icon: <X size={13} /> },
      ],
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" eyebrow="PRODUCTIVITY · SHORTCUTS" title="keyboard shortcuts">
      <div className="space-y-5">
        <p className="text-xs text-muted">
          Pintasan keyboard untuk mempercepat alur kerja review dan editing klip tanpa perlu banyak mengklik mouse.
        </p>

        <div className="space-y-4">
          {shortcuts.map((sec) => (
            <div key={sec.category} className="space-y-2">
              <span className="eyebrow text-[10px] text-muted">{sec.category}</span>
              <div className="space-y-1.5 bg-paper rounded-card p-2 border border-rule">
                {sec.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-paper2 transition-colors">
                    <div className="flex items-center gap-2 text-ink">
                      {item.icon && <span className="text-muted">{item.icon}</span>}
                      <span>{item.desc}</span>
                    </div>
                    <kbd className="px-2 py-0.5 rounded bg-paper3 border border-rule2 font-mono text-[11px] text-ink font-semibold shadow-xs">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-rule flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary px-4 py-1.5 text-xs"
          >
            Mengerti (Tutup)
          </button>
        </div>
      </div>
    </Modal>
  );
}
