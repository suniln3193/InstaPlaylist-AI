"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Settings, Eye, Send, ShieldAlert, Cpu } from "lucide-react";
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
  const [theme, setTheme] = useState("premium-dark");

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
        body: JSON.stringify({ topic, playlist, keyword, slideCount, apiKey, model }),
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
      <header className="sticky top-6 z-50 px-4 md:px-6 w-full">
        <div className="max-w-7xl mx-auto rounded-2xl border border-white/5 bg-zinc-950/60 backdrop-blur-xl shadow-2xl p-3 flex items-center justify-between">
          <div className="flex items-center space-x-4 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-zinc-900 to-zinc-800 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest text-white uppercase">
                InstaPlaylist <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">AI</span>
              </h1>
              <p className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">@sunilcodecraft Engine</p>
            </div>
          </div>
          <div className="flex items-center px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 shadow-inner">
            <div className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </div>
            <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest font-bold">System Active</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 md:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* ── LEFT PANEL ── */}
          <div className="lg:col-span-3 space-y-6 md:space-y-8">

            {/* API Settings */}
            <div className="bg-zinc-950/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center space-x-2 mb-6">
                <Settings className="w-3.5 h-3.5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                <span>Engine Configuration</span>
              </h3>
              
              <div className="space-y-5 relative z-10">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                    OpenRouter API Key (Optional) {isClientSideKey && "🔑"}
                  </label>
                  <input
                    type="password"
                    placeholder="Leave blank for Free Keyless Mode"
                    value={apiKey}
                    onChange={(e) => saveKeyToLocal(e.target.value)}
                    className="w-full min-h-[44px] bg-black/40 border border-white/5 focus:border-yellow-400/50 focus:bg-zinc-900/60 focus:ring-2 focus:ring-yellow-400/20 rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-all font-mono placeholder:text-zinc-700"
                  />
                  <p className="text-[9px] text-zinc-500 leading-normal">
                    {!apiKey ? (
                      <span className="text-yellow-400/80 font-semibold flex items-center"><Sparkles className="w-3 h-3 mr-1"/> Running in Free Keyless Mode</span>
                    ) : (
                      <span>Using custom OpenRouter key (stored locally).</span>
                    )}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Inference Model</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full min-h-[44px] bg-black/40 border border-white/5 text-zinc-300 text-xs font-semibold rounded-xl px-4 py-3 focus:border-yellow-400/50 focus:bg-zinc-900/60 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none transition-all appearance-none"
                  >
                    <option value="google/gemma-2-9b-it:free">google/gemma-2-9b-it:free</option>
                    <option value="meta-llama/llama-3-8b-instruct:free">meta-llama/llama-3-8b-instruct:free</option>
                    <option value="qwen/qwen-2-7b-instruct:free">qwen/qwen-2-7b-instruct:free</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Carousel Prompts */}
            <div className="bg-zinc-950/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center space-x-2 mb-6">
                <Cpu className="w-3.5 h-3.5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                <span>Carousel Parameters</span>
              </h3>

              <div className="space-y-5 relative z-10">
                {/* Topic */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Topic *</label>
                  <input
                    type="text"
                    placeholder="e.g. Next.js App Router Masterclass"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    className="w-full min-h-[44px] bg-black/40 border border-white/5 focus:border-yellow-400/50 focus:bg-zinc-900/60 focus:ring-2 focus:ring-yellow-400/20 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none transition-all placeholder:text-zinc-700"
                  />
                </div>

                {/* Playlist Name */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Category Badge</label>
                  <input
                    type="text"
                    value={playlist}
                    placeholder="e.g. System Design"
                    onChange={(e) => setPlaylist(e.target.value)}
                    className="w-full min-h-[44px] bg-black/40 border border-white/5 focus:border-yellow-400/50 focus:bg-zinc-900/60 focus:ring-2 focus:ring-yellow-400/20 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none transition-all placeholder:text-zinc-700"
                  />
                </div>

                {/* CTA Keyword */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">CTA Keyword</label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. CODE"
                    className="w-full min-h-[44px] bg-black/40 border border-white/5 focus:border-yellow-400/50 focus:bg-zinc-900/60 focus:ring-2 focus:ring-yellow-400/20 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none transition-all font-mono placeholder:text-zinc-700 uppercase"
                  />
                </div>

                {/* Visual Theme Selector */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Visual Theme</label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full min-h-[44px] bg-black/40 border border-white/5 text-zinc-300 text-sm font-semibold rounded-xl px-4 py-3 focus:border-yellow-400/50 focus:bg-zinc-900/60 focus:ring-2 focus:ring-yellow-400/20 focus:outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="premium-dark">Premium Dark</option>
                    <option value="clean-minimal">Clean Minimal</option>
                    <option value="bold-creator">Bold Creator</option>
                    <option value="dark-3d-gradient">Dark 3D Gradient</option>
                  </select>
                </div>

                {/* Slides Count */}
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <span>Deck Length</span>
                    <span className="bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-mono border border-yellow-400/20">
                      {slideCount} Slides
                    </span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="10"
                    value={slideCount}
                    onChange={(e) => setSlideCount(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-400 outline-none focus:ring-2 focus:ring-yellow-400/20"
                  />
                </div>

                {/* Generate Button */}
                <div className="pt-4">
                  <button
                    disabled={isLoading}
                    onClick={handleGenerate}
                    className="w-full min-h-[52px] bg-gradient-to-r from-yellow-400 to-yellow-300 text-black font-extrabold text-[11px] uppercase tracking-widest py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 fill-black" />
                    )}
                    <span>{isLoading ? "Generating Deck..." : "Generate Deck"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-200 text-xs rounded-2xl shadow-lg backdrop-blur-xl space-y-2">
                <div className="flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span className="font-medium leading-relaxed">{error}</span>
                </div>
                {debugRaw && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-zinc-500 text-[10px] font-mono hover:text-zinc-300 tracking-wider">▶ SHOW TRACE</summary>
                    <pre className="mt-2 text-[10px] text-zinc-400 bg-black/50 border border-white/5 p-3 rounded-xl overflow-auto max-h-40 font-mono whitespace-pre-wrap">{debugRaw}</pre>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="lg:col-span-9 space-y-6">

            {/* 2-Tab Header */}
            <div className="flex space-x-2 bg-zinc-950/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-2 w-max shadow-xl">
              <button
                onClick={() => setActiveTab("carousel")}
                className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center space-x-2 ${
                  activeTab === "carousel"
                    ? "bg-yellow-400 text-black shadow-lg shadow-yellow-500/20"
                    : "bg-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Carousel Simulator</span>
              </button>

              <button
                disabled={slides.length === 0}
                onClick={() => setActiveTab("publish")}
                className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center space-x-2 disabled:opacity-30 disabled:pointer-events-none ${
                  activeTab === "publish"
                    ? "bg-yellow-400 text-black shadow-lg shadow-yellow-500/20"
                    : "bg-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }`}
              >
                <Send className="w-4 h-4" />
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
                        theme={theme}
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
