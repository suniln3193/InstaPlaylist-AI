"use client";

import React, { useState } from "react";
import { Copy, Check, MessageSquare, AlertCircle } from "lucide-react";

interface CaptionEditorProps {
  caption: string;
  hashtags: string[];
  onCaptionChange: (caption: string) => void;
  onHashtagsChange: (hashtags: string[]) => void;
}

export default function CaptionEditor({
  caption,
  hashtags,
  onCaptionChange,
  onHashtagsChange,
}: CaptionEditorProps) {
  const [copied, setCopied] = useState(false);

  const characterCount = caption.length;
  const lineCount = caption.split("\n").length;
  const hashtagCount = hashtags.length;

  const copyToClipboard = () => {
    const fullText = `${caption}\n\n${hashtags.map((h) => `#${h.replace("#", "")}`).join(" ")}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleHashtagsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(",")
      .map((t) => t.trim().replace("#", ""))
      .filter((t) => t.length > 0);
    onHashtagsChange(tags);
  };

  return (
    <div className="glass-panel border border-zinc-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h3 className="text-md font-bold text-white flex items-center space-x-2">
          <MessageSquare className="w-4.5 h-4.5 text-yellow-400" />
          <span>Instagram Caption</span>
        </h3>
        <button
          onClick={copyToClipboard}
          className="px-3 py-1.5 text-xs bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-yellow-400/50 text-zinc-300 hover:text-yellow-400 font-semibold rounded-lg transition-all flex items-center space-x-1.5"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Full Caption</span>
            </>
          )}
        </button>
      </div>

      {/* Editor Block */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Caption Text</label>
          <textarea
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            rows={10}
            className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-yellow-400/50 rounded-xl px-4 py-3 text-xs leading-relaxed text-zinc-200 focus:outline-none transition-all resize-none font-sans"
          />
        </div>

        {/* Hashtags Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Hashtags (Comma Separated)</label>
          <input
            type="text"
            value={hashtags.join(", ")}
            onChange={handleHashtagsInputChange}
            className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-yellow-400/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all font-mono"
            placeholder="webdevelopment, programming, coding"
          />
        </div>
      </div>

      {/* Caption Health Stats */}
      <div className="grid grid-cols-3 gap-4 border-t border-zinc-900 pt-4 text-center">
        <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Characters</p>
          <p className={`text-md font-extrabold mt-0.5 ${characterCount > 2200 ? "text-red-400" : "text-white"}`}>
            {characterCount} <span className="text-[10px] text-zinc-500 font-normal">/ 2,200</span>
          </p>
        </div>
        <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Line Breaks</p>
          <p className="text-md font-extrabold text-white mt-0.5">
            {lineCount}
          </p>
        </div>
        <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Hashtags</p>
          <p className={`text-md font-extrabold mt-0.5 ${hashtagCount > 30 ? "text-red-400" : "text-white"}`}>
            {hashtagCount} <span className="text-[10px] text-zinc-500 font-normal">/ 30</span>
          </p>
        </div>
      </div>

      {/* Optimization Alert */}
      {characterCount > 1500 && (
        <div className="p-3 bg-yellow-400/5 border border-yellow-400/10 rounded-xl flex items-start space-x-2 text-[11px] text-yellow-400/80">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-400" />
          <span>
            <strong>Optimization Tip:</strong> Keeping your captions under 1,500 characters generally increases readability and encourages users to read the full message without scroll fatigue.
          </span>
        </div>
      )}
    </div>
  );
}
