"use client";

import React, { useState } from "react";
import { Edit2, Sparkles, Trash2, Plus } from "lucide-react";

interface Slide {
  slide_number: number;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  visual_suggestion: string;
  image_prompt: string;
  imageUrl?: string;
}

interface SlideEditorProps {
  slides: Slide[];
  onSlidesChange: (newSlides: Slide[]) => void;
}

export default function SlideEditor({ slides, onSlidesChange }: SlideEditorProps) {
  const [editingIndex, setEditingIndex] = useState(0);

  if (!slides || slides.length === 0) {
    return null;
  }

  const updateSlideField = (field: keyof Slide, value: any) => {
    const updated = [...slides];
    updated[editingIndex] = {
      ...updated[editingIndex],
      [field]: value,
    };
    onSlidesChange(updated);
  };

  const updateBullet = (bulletIndex: number, value: string) => {
    const updatedBullets = [...slides[editingIndex].bullets];
    updatedBullets[bulletIndex] = value;
    updateSlideField("bullets", updatedBullets);
  };

  const addBullet = () => {
    const updatedBullets = [...slides[editingIndex].bullets, "New feature or point"];
    updateSlideField("bullets", updatedBullets);
  };

  const removeBullet = (bulletIndex: number) => {
    const updatedBullets = slides[editingIndex].bullets.filter((_, idx) => idx !== bulletIndex);
    updateSlideField("bullets", updatedBullets);
  };

  return (
    <div className="bg-zinc-950/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden group space-y-6">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="flex sm:items-center justify-between border-b border-white/5 pb-5 relative z-10 gap-4">
        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center space-x-2 shrink-0">
          <Edit2 className="w-3.5 h-3.5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
          <span>Edit Slide Content</span>
        </h3>
        <select
          value={editingIndex}
          onChange={(e) => setEditingIndex(Number(e.target.value))}
          className="w-full sm:w-auto bg-black/40 border border-white/5 text-zinc-300 text-[10px] font-bold uppercase tracking-widest rounded-xl px-3 py-2.5 focus:border-yellow-400/50 focus:bg-zinc-900/60 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none transition-all cursor-pointer truncate"
        >
          {slides.map((slide, idx) => (
            <option key={idx} value={idx}>
              Slide {slide.slide_number}: {slide.title.substring(0, 25)}...
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-5 relative z-10">
        {/* Slide Title */}
        <div className="space-y-2">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Title</label>
          <input
            type="text"
            value={slides[editingIndex].title}
            onChange={(e) => updateSlideField("title", e.target.value)}
            className="w-full min-h-[44px] bg-black/40 border border-white/5 focus:border-yellow-400/50 focus:bg-zinc-900/60 focus:ring-2 focus:ring-yellow-400/20 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none transition-all"
          />
        </div>

        {/* Slide Subtitle */}
        <div className="space-y-2">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Subtitle</label>
          <input
            type="text"
            value={slides[editingIndex].subtitle}
            onChange={(e) => updateSlideField("subtitle", e.target.value)}
            className="w-full min-h-[44px] bg-black/40 border border-white/5 focus:border-yellow-400/50 focus:bg-zinc-900/60 focus:ring-2 focus:ring-yellow-400/20 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none transition-all"
          />
        </div>

        {/* Slide Description */}
        <div className="space-y-2">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Description</label>
          <textarea
            value={slides[editingIndex].description}
            onChange={(e) => updateSlideField("description", e.target.value)}
            rows={3}
            className="w-full bg-black/40 border border-white/5 focus:border-yellow-400/50 focus:bg-zinc-900/60 focus:ring-2 focus:ring-yellow-400/20 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Slide Bullet points */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Bullet Points</label>
            <button
              onClick={addBullet}
              className="text-[9px] text-yellow-400 font-bold uppercase tracking-widest hover:text-yellow-300 transition-all flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Bullet</span>
            </button>
          </div>
          <div className="space-y-3">
            {slides[editingIndex].bullets?.map((bullet, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => updateBullet(idx, e.target.value)}
                  className="flex-1 min-h-[44px] bg-black/40 border border-white/5 focus:border-yellow-400/50 focus:bg-zinc-900/60 focus:ring-2 focus:ring-yellow-400/20 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none transition-all"
                />
                <button
                  onClick={() => removeBullet(idx)}
                  className="p-3 bg-black/40 border border-white/5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all shadow-sm"
                  title="Delete bullet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!slides[editingIndex].bullets || slides[editingIndex].bullets.length === 0) && (
              <p className="text-xs text-zinc-500 italic p-4 text-center border border-dashed border-white/5 rounded-xl">No bullet points added.</p>
            )}
          </div>
        </div>

        {/* Slide Image Generator Prompt */}
        <div className="space-y-2 border-t border-white/5 pt-5 mt-2">
          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            <span>AI Visual Prompt</span>
          </label>
          <textarea
            value={slides[editingIndex].image_prompt}
            onChange={(e) => updateSlideField("image_prompt", e.target.value)}
            rows={2}
            className="w-full bg-black/40 border border-white/5 focus:border-yellow-400/50 focus:bg-zinc-900/60 focus:ring-2 focus:ring-yellow-400/20 rounded-xl px-4 py-3 text-[11px] font-medium text-white focus:outline-none transition-all resize-none font-mono"
          />
        </div>
      </div>
    </div>
  );
}
