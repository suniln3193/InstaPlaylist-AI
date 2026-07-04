"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Settings, Eye, Send, ShieldAlert, Cpu } from "lucide-react";
import { CAROUSEL_TEMPLATES } from "@/lib/templates";
import CarouselPreview from "@/components/CarouselPreview";
import SlideEditor from "@/components/SlideEditor";
import PublishPack from "@/components/PublishPack";

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

interface SeoMetadata {
  title: string;
  description: string;
  keywords: string;
  slug: string;
  og_title: string;
  og_description: string;
}

export default function Home() {
  // Input fields
  const [topic, setTopic] = useState("");
  const [playlist, setPlaylist] = useState("Developer Hacks");
  const [keyword, setKeyword] = useState("CODE");
  const [slideCount, setSlideCount] = useState(6);
  const [templateId, setTemplateId] = useState("things-illegal");

  // API Config
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("google/gemma-2-9b-it:free");
  const [isClientSideKey, setIsClientSideKey] = useState(false);

  // Output States
  const [slides, setSlides] = useState<Slide[]>([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [resourcesMarkdown, setResourcesMarkdown] = useState("");
  const [seo, setSeo] = useState<SeoMetadata | null>(null);

  // App UI State
  const [activeTab, setActiveTab] = useState<"carousel" | "publish">("carousel");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");
  const [debugRaw, setDebugRaw] = useState("");

  // Load saved API key
  useEffect(() => {
    const savedKey = localStorage.getItem("openrouter_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsClientSideKey(true);
    }
  }, []);

  const saveKeyToLocal = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem("openrouter_api_key", key);
      setIsClientSideKey(true);
    } else {
      localStorage.removeItem("openrouter_api_key");
      setIsClientSideKey(false);
    }
  };

  const handleUpdateSlideImage = (index: number, url: string) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], imageUrl: url };
    setSlides(updated);
  };

  const handleGenerate = async () => {
    if (!topic) {
      setError("Please enter a topic to research!");
      return;
    }
    setError("");
    setDebugRaw("");
    setIsLoading(true);

    try {
      // Step 1: Carousel Slides (critical)
      setLoadingStep("Step 1/4: Researching & Generating Carousel Slides...");
      const carouselRes = await fetch("/api/generate-carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, playlist, keyword, slideCount, templateId, apiKey, model }),
      });

      const carouselData = await carouselRes.json();
      if (!carouselRes.ok) {
        if (carouselData.rawOutput) setDebugRaw(carouselData.rawOutput);
        throw new Error(carouselData.error || "Failed to generate carousel slides");
      }

      const generatedSlides = carouselData.slides;
      if (!Array.isArray(generatedSlides) || generatedSlides.length === 0) {
        throw new Error("No slides returned. The AI may have returned empty content — please try again.");
      }
      setSlides(generatedSlides);
      setActiveTab("carousel");

      // Steps 2–4: Non-blocking — failures won't hide the carousel
      // Step 2: Caption
      setLoadingStep("Step 2/4: Drafting Viral Instagram Caption...");
      try {
        const captionRes = await fetch("/api/generate-caption", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, playlist, keyword, slides: generatedSlides, apiKey, model }),
        });
        const captionData = await captionRes.json();
        if (captionRes.ok) {
          setCaption(captionData.caption || "");
          setHashtags(captionData.hashtags || []);
        }
      } catch (e) { console.warn("Caption generation failed (non-fatal):", e); }

      // Step 3: Resources
      setLoadingStep("Step 3/4: Creating Developer Resource Pack...");
      try {
        const resourcesRes = await fetch("/api/generate-resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, slides: generatedSlides, apiKey, model }),
        });
        const resourcesData = await resourcesRes.json();
        if (resourcesRes.ok) setResourcesMarkdown(resourcesData.markdown || "");
      } catch (e) { console.warn("Resources generation failed (non-fatal):", e); }

      // Step 4: SEO
      setLoadingStep("Step 4/4: Optimizing SEO Metadata...");
      try {
        const seoRes = await fetch("/api/generate-seo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, apiKey, model }),
        });
        const seoData = await seoRes.json();
        if (seoRes.ok) setSeo(seoData);
      } catch (e) { console.warn("SEO generation failed (non-fatal):", e); }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during generation.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <main className="min-h-screen bg-[#08080a] text-zinc-100 selection:bg-yellow-400 selection:text-black pb-24">
      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-md font-extrabold uppercase tracking-widest text-white">InstaPlaylist AI</h1>
              <p className="text-[10px] text-zinc-500 font-mono">@sunilcodecraft Engine</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 font-mono text-[10px] text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
            <span>SYSTEM ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT PANEL ── */}
          <div className="lg:col-span-4 space-y-6">

            {/* API Settings */}
            <div className="glass-panel border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-2">
                <Settings className="w-4 h-4 text-yellow-400" />
                <span>API Settings</span>
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    OpenRouter API Key (Optional) {isClientSideKey && "🔑"}
                  </label>
                  <input
                    type="password"
                    placeholder="Leave blank for Free Keyless Mode"
                    value={apiKey}
                    onChange={(e) => saveKeyToLocal(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-yellow-400/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all font-mono"
                  />
                  <p className="text-[9px] text-zinc-500 leading-normal">
                    {!apiKey ? (
                      <span className="text-yellow-400/80 font-semibold">⚡ Running in 100% Free Keyless Mode (Pollinations.ai)</span>
                    ) : (
                      <span>Using custom OpenRouter key (stored locally).</span>
                    )}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Model (Free Tier)</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl px-3 py-2 focus:border-yellow-400/50 focus:outline-none"
                  >
                    <option value="google/gemma-2-9b-it:free">google/gemma-2-9b-it:free</option>
                    <option value="meta-llama/llama-3-8b-instruct:free">meta-llama/llama-3-8b-instruct:free</option>
                    <option value="qwen/qwen-2-7b-instruct:free">qwen/qwen-2-7b-instruct:free</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Carousel Prompts */}
            <div className="glass-panel border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-yellow-400" />
                <span>Carousel Prompts</span>
              </h3>

              <div className="space-y-4">
                {/* Topic */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Topic *</label>
                  <input
                    type="text"
                    placeholder="e.g. VS Code Extensions for AI Speed"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-yellow-400/50 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
                  />
                </div>

                {/* Playlist Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Playlist Name</label>
                  <input
                    type="text"
                    value={playlist}
                    onChange={(e) => setPlaylist(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-yellow-400/50 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
                  />
                </div>

                {/* CTA Keyword (full width — episode removed) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">CTA Keyword</label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. CODE"
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-yellow-400/50 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all font-mono"
                  />
                </div>

                {/* Template Preset */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Template Preset</label>
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl px-3.5 py-2.5 focus:border-yellow-400/50 focus:outline-none"
                  >
                    {CAROUSEL_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Slides Count */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    <span>Slides Count</span>
                    <span className="text-yellow-400 font-mono">{slideCount} Slides</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="10"
                    value={slideCount}
                    onChange={(e) => setSlideCount(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                  />
                </div>

                {/* Generate Button */}
                <button
                  disabled={isLoading}
                  onClick={handleGenerate}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-300 text-black font-extrabold text-xs uppercase tracking-widest py-3 px-4 rounded-xl shadow-lg hover:shadow-yellow-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>{isLoading ? "Generating Package..." : "Generate Carousel Bundle"}</span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-xl space-y-2">
                <div className="flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </div>
                {debugRaw && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-zinc-500 text-[10px] font-mono hover:text-zinc-300">▶ Show AI raw output (debug)</summary>
                    <pre className="mt-2 text-[10px] text-zinc-400 bg-zinc-950 p-3 rounded-lg overflow-auto max-h-40 font-mono whitespace-pre-wrap">{debugRaw}</pre>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="lg:col-span-8 space-y-6">

            {/* 2-Tab Header */}
            <div className="flex space-x-2 border-b border-zinc-900 pb-3">
              <button
                onClick={() => setActiveTab("carousel")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center space-x-1.5 ${
                  activeTab === "carousel"
                    ? "border-yellow-400 text-yellow-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Carousel Simulator</span>
              </button>

              <button
                disabled={slides.length === 0}
                onClick={() => setActiveTab("publish")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center space-x-1.5 disabled:opacity-30 disabled:pointer-events-none ${
                  activeTab === "publish"
                    ? "border-yellow-400 text-yellow-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Pack</span>
                {slides.length > 0 && caption && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
              </button>
            </div>

            {/* Loader */}
            {isLoading && (
              <div className="glass-panel border border-zinc-800 rounded-3xl p-16 flex flex-col items-center justify-center space-y-6">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-zinc-800"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-yellow-400 animate-spin"></div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-zinc-300">Generating Viral Assets...</p>
                  <p className="text-xs text-yellow-400/80 font-mono animate-pulse">{loadingStep}</p>
                </div>
              </div>
            )}

            {/* Output Panels */}
            {!isLoading && (
              <div className="space-y-6">
                {activeTab === "carousel" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    <div className="md:col-span-7">
                      <CarouselPreview
                        slides={slides}
                        keyword={keyword}
                        onUpdateSlideImage={handleUpdateSlideImage}
                      />
                    </div>
                    <div className="md:col-span-5">
                      <SlideEditor slides={slides} onSlidesChange={setSlides} />
                    </div>
                  </div>
                )}

                {activeTab === "publish" && (
                  <PublishPack
                    caption={caption}
                    hashtags={hashtags}
                    resourcesMarkdown={resourcesMarkdown}
                    seo={seo}
                    topic={topic}
                    keyword={keyword}
                    onCaptionChange={setCaption}
                    onHashtagsChange={setHashtags}
                    onResourcesChange={setResourcesMarkdown}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
