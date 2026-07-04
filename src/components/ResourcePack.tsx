"use client";

import React, { useState } from "react";
import { Copy, Check, FileText, Download } from "lucide-react";

interface ResourcePackProps {
  markdown: string;
  onMarkdownChange: (newMarkdown: string) => void;
}

export default function ResourcePack({ markdown, onMarkdownChange }: ResourcePackProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdownFile = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resource-pack.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Simple Markdown to HTML parser
  const renderMarkdownAsHtml = (md: string) => {
    if (!md) return <p className="italic text-zinc-500 text-xs">No resources generated yet.</p>;

    const lines = md.split("\n");
    let inList = false;
    let listItems: string[] = [];

    return (
      <div className="space-y-4 text-zinc-300 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          // Headers
          if (trimmed.startsWith("# ")) {
            return (
              <h1 key={idx} className="text-xl font-extrabold text-white uppercase tracking-tight border-b border-zinc-900 pb-2 mt-4 text-glow">
                {trimmed.replace("# ", "")}
              </h1>
            );
          }
          if (trimmed.startsWith("## ")) {
            return (
              <h2 key={idx} className="text-sm font-bold text-yellow-400 uppercase tracking-wide mt-6">
                {trimmed.replace("## ", "")}
              </h2>
            );
          }
          if (trimmed.startsWith("### ")) {
            return (
              <h3 key={idx} className="text-xs font-semibold text-zinc-200 mt-4 border-l-2 border-yellow-400/50 pl-2">
                {trimmed.replace("### ", "")}
              </h3>
            );
          }

          // Horizontal Rule
          if (trimmed === "---") {
            return <hr key={idx} className="border-zinc-800 my-4" />;
          }

          // Bullet lists (group them if needed, or simple rendering)
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            const content = trimmed.substring(2);
            return (
              <div key={idx} className="flex items-start pl-3 text-zinc-300">
                <span className="text-yellow-400 mr-2">•</span>
                <span>{content}</span>
              </div>
            );
          }

          // Empty Lines
          if (trimmed === "") {
            return <div key={idx} className="h-2" />;
          }

          // Default Paragraph
          return (
            <p key={idx} className="text-zinc-400">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="glass-panel border border-zinc-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h3 className="text-md font-bold text-white flex items-center space-x-2">
          <FileText className="w-4.5 h-4.5 text-yellow-400" />
          <span>Resource Pack (.md)</span>
        </h3>
        <div className="flex items-center space-x-2">
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
                <span>Copy markdown</span>
              </>
            )}
          </button>
          <button
            onClick={downloadMarkdownFile}
            className="px-3 py-1.5 text-xs bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-yellow-400/50 text-zinc-300 hover:text-yellow-400 font-semibold rounded-lg transition-all flex items-center space-x-1.5"
            title="Download as Markdown file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Editor & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Raw Markdown Editor</label>
          <textarea
            value={markdown}
            onChange={(e) => onMarkdownChange(e.target.value)}
            rows={12}
            className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-yellow-400/50 rounded-xl px-4 py-3 text-xs text-zinc-300 focus:outline-none transition-all resize-none font-mono"
          />
        </div>

        {/* Live Preview */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Formatted Toolkit Preview</label>
          <div className="w-full h-[278px] bg-zinc-950/60 border border-zinc-900 rounded-xl px-6 py-4 overflow-y-auto border-t-2 border-t-yellow-400/30">
            {renderMarkdownAsHtml(markdown)}
          </div>
        </div>
      </div>
    </div>
  );
}
