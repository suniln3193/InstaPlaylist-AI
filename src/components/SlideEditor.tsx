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
    <div className="glass-panel border border-zinc-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h3 className="text-md font-bold text-white flex items-center space-x-2">
          <Edit2 className="w-4.5 h-4.5 text-yellow-400" />
          <span>Edit Slide Content</span>
        </h3>
        <select
          value={editingIndex}
          onChange={(e) => setEditingIndex(Number(e.target.value))}
          className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg px-3 py-1.5 focus:border-yellow-400 focus:outline-none"
        >
          {slides.map((slide, idx) => (
            <option key={idx} value={idx}>
              Slide {slide.slide_number}: {slide.title.substring(0, 18)}...
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {/* Slide Title */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Title</label>
          <input
            type="text"
            value={slides[editingIndex].title}
            onChange={(e) => updateSlideField("title", e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-yellow-400/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all"
          />
        </div>

        {/* Slide Subtitle */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Subtitle</label>
          <input
            type="text"
            value={slides[editingIndex].subtitle}
            onChange={(e) => updateSlideField("subtitle", e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-yellow-400/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all"
          />
        </div>

        {/* Slide Description */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Description</label>
          <textarea
            value={slides[editingIndex].description}
            onChange={(e) => updateSlideField("description", e.target.value)}
            rows={3}
            className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-yellow-400/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all resize-none"
          />
        </div>

        {/* Slide Bullet points */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Bullet Points</label>
            <button
              onClick={addBullet}
              className="text-[10px] text-yellow-400 font-bold hover:text-yellow-300 transition-all flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Bullet</span>
            </button>
          </div>
          <div className="space-y-2">
            {slides[editingIndex].bullets?.map((bullet, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => updateBullet(idx, e.target.value)}
                  className="flex-1 bg-zinc-950/80 border border-zinc-800 focus:border-yellow-400/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all"
                />
                <button
                  onClick={() => removeBullet(idx)}
                  className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-500 hover:text-red-400 transition-all"
                  title="Delete bullet"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {(!slides[editingIndex].bullets || slides[editingIndex].bullets.length === 0) && (
              <p className="text-xs text-zinc-500 italic">No bullet points added.</p>
            )}
          </div>
        </div>

        {/* Slide Image Generator Prompt */}
        <div className="space-y-1.5 border-t border-zinc-900 pt-4">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            <span>AI Visual Prompt</span>
          </label>
          <textarea
            value={slides[editingIndex].image_prompt}
            onChange={(e) => updateSlideField("image_prompt", e.target.value)}
            rows={3}
            className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-yellow-400/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all resize-none font-mono"
          />
        </div>
      </div>
    </div>
  );
}
