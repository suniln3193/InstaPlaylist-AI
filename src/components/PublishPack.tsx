"use client";

import React, { useState } from "react";
import {
  Copy, Check, MessageSquare, FileText, Search,
  Download, ChevronDown, ChevronUp, Zap
} from "lucide-react";

interface SeoMetadata {
  title: string;
  description: string;
  keywords: string;
  slug: string;
  og_title: string;
  og_description: string;
}

interface PublishPackProps {
  caption: string;
  hashtags: string[];
  resourcesMarkdown: string;
  seo: SeoMetadata | null;
  topic: string;
  keyword: string;
  onCaptionChange: (v: string) => void;
  onHashtagsChange: (v: string[]) => void;
  onResourcesChange: (v: string) => void;
}

export default function PublishPack({
  caption,
  hashtags,
  resourcesMarkdown,
  seo,
  topic,
  keyword,
  onCaptionChange,
  onHashtagsChange,
  onResourcesChange,
}: PublishPackProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [copiedResources, setCopiedResources] = useState(false);
  const [copiedSeo, setCopiedSeo] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showSeo, setShowSeo] = useState(false);

  const hashtagStr = hashtags.map((h) => `#${h.replace("#", "")}`).join(" ");

  const fullPublishText = [
    caption,
    "",
    hashtagStr,
    resourcesMarkdown ? `\n---\n📚 RESOURCE PACK\n${resourcesMarkdown}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const copy = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const downloadMarkdown = () => {
    const content = `# Instagram Post — ${topic}\n\n## Caption\n${caption}\n\n## Hashtags\n${hashtagStr}\n\n## Resources\n${resourcesMarkdown}`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.replace(/\s+/g, "-").toLowerCase()}-publish-pack.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleHashtagsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(",")
      .map((t) => t.trim().replace("#", ""))
      .filter((t) => t.length > 0);
    onHashtagsChange(tags);
  };

  const charCount = caption.length;

  return (
    <div className="space-y-4">
      {/* Master Copy Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-yellow-400/10 border border-yellow-400/30 rounded-2xl">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">
            Publish Pack — All Content Ready
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={downloadMarkdown}
            className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-700 hover:border-yellow-400/50 text-zinc-300 hover:text-yellow-400 font-semibold rounded-lg transition-all flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </button>
          <button
            onClick={() => copy(fullPublishText, setCopiedAll)}
            className="px-4 py-1.5 text-xs bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold rounded-lg transition-all flex items-center space-x-1.5 shadow-lg shadow-yellow-500/20"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Everything</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── SECTION 1: Caption ── */}
      <div className="glass-panel border border-zinc-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
              Instagram Caption
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                charCount > 2200
                  ? "text-red-400 border-red-400/30 bg-red-400/5"
                  : "text-zinc-500 border-zinc-800 bg-zinc-900/50"
              }`}
            >
              {charCount} / 2,200
            </span>
          </div>
          <button
            onClick={() => copy(caption, setCopiedCaption)}
            className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 hover:border-yellow-400/50 text-zinc-400 hover:text-yellow-400 font-semibold rounded-lg transition-all flex items-center space-x-1.5"
          >
            {copiedCaption ? (
              <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">Copied</span></>
            ) : (
              <><Copy className="w-3 h-3" /><span>Copy</span></>
            )}
          </button>
        </div>
        <textarea
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          rows={9}
          placeholder="Caption will appear here after generation..."
          className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-yellow-400/50 rounded-xl px-4 py-3 text-xs leading-relaxed text-zinc-200 focus:outline-none transition-all resize-none font-sans"
        />
      </div>

      {/* ── SECTION 2: Hashtags ── */}
      <div className="glass-panel border border-zinc-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
            # Hashtags
            <span className="ml-2 text-zinc-500 font-normal font-mono">({hashtags.length}/30)</span>
          </span>
          <button
            onClick={() => copy(hashtagStr, setCopiedHashtags)}
            className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 hover:border-yellow-400/50 text-zinc-400 hover:text-yellow-400 font-semibold rounded-lg transition-all flex items-center space-x-1.5"
          >
            {copiedHashtags ? (
              <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">Copied</span></>
            ) : (
              <><Copy className="w-3 h-3" /><span>Copy</span></>
            )}
          </button>
        </div>

        {/* Hashtag Pills Display */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-3 bg-zinc-950/60 border border-zinc-900 rounded-xl min-h-[48px]">
            {hashtags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-yellow-400 text-[10px] font-mono rounded-full"
              >
                #{tag.replace("#", "")}
              </span>
            ))}
          </div>
        )}

        {/* Edit input */}
        <input
          type="text"
          value={hashtags.join(", ")}
          onChange={handleHashtagsInput}
          placeholder="webdevelopment, coding, programming"
          className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-yellow-400/50 rounded-xl px-4 py-2.5 text-xs text-zinc-400 focus:outline-none transition-all font-mono"
        />
      </div>

      {/* ── SECTION 3: Resources (collapsible) ── */}
      <div className="glass-panel border border-zinc-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowResources((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-900/40 transition-all"
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
              Resource Pack
            </span>
            {resourcesMarkdown && (
              <span className="text-[10px] px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full font-mono">
                Ready
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {resourcesMarkdown && (
              <button
                onClick={(e) => { e.stopPropagation(); copy(resourcesMarkdown, setCopiedResources); }}
                className="px-3 py-1 text-xs bg-zinc-900 border border-zinc-800 hover:border-yellow-400/50 text-zinc-400 hover:text-yellow-400 font-semibold rounded-lg transition-all flex items-center space-x-1.5"
              >
                {copiedResources ? (
                  <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">Copied</span></>
                ) : (
                  <><Copy className="w-3 h-3" /><span>Copy</span></>
                )}
              </button>
            )}
            {showResources ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
          </div>
        </button>

        {showResources && (
          <div className="px-5 pb-5 border-t border-zinc-900">
            <textarea
              value={resourcesMarkdown}
              onChange={(e) => onResourcesChange(e.target.value)}
              rows={10}
              placeholder="Resources will appear here after generation..."
              className="w-full mt-4 bg-zinc-950/80 border border-zinc-800 focus:border-yellow-400/50 rounded-xl px-4 py-3 text-xs text-zinc-300 focus:outline-none transition-all resize-none font-mono"
            />
          </div>
        )}
      </div>

      {/* ── SECTION 4: SEO (collapsible) ── */}
      {seo && (
        <div className="glass-panel border border-zinc-800 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowSeo((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-900/40 transition-all"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
                SEO Metadata
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full font-mono">
                Ready
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const seoText = `Title: ${seo.title}\nDescription: ${seo.description}\nKeywords: ${seo.keywords}\nSlug: ${seo.slug}\nOG Title: ${seo.og_title}\nOG Desc: ${seo.og_description}`;
                  copy(seoText, setCopiedSeo);
                }}
                className="px-3 py-1 text-xs bg-zinc-900 border border-zinc-800 hover:border-yellow-400/50 text-zinc-400 hover:text-yellow-400 font-semibold rounded-lg transition-all flex items-center space-x-1.5"
              >
                {copiedSeo ? (
                  <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">Copied</span></>
                ) : (
                  <><Copy className="w-3 h-3" /><span>Copy SEO</span></>
                )}
              </button>
              {showSeo ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </div>
          </button>

          {showSeo && (
            <div className="px-5 pb-5 border-t border-zinc-900 grid grid-cols-1 gap-3 mt-4 font-mono text-xs">
              {[
                { label: "Meta Title", value: seo.title },
                { label: "Meta Description", value: seo.description },
                { label: "Keywords", value: seo.keywords },
                { label: "URL Slug", value: seo.slug },
                { label: "OG Title", value: seo.og_title },
                { label: "OG Description", value: seo.og_description },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-1">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{label}</p>
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900 text-zinc-300 select-all leading-relaxed">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
