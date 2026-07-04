"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, Download, Eye, FileText, Image as ImageIcon, Sparkles, Package } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import JSZip from "jszip";

interface Slide {
  slide_number: number;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  visual_suggestion: string;
  image_prompt: string;
  imageUrl?: string; // Cache generated images
}

interface CarouselPreviewProps {
  slides: Slide[];
  keyword: string;
  theme?: string;
  onUpdateSlideImage: (slideIndex: number, url: string) => void;
}

export default function CarouselPreview({
  slides,
  keyword,
  theme = "premium-dark",
  onUpdateSlideImage,
}: CarouselPreviewProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [viewMode, setViewMode] = useState<"single" | "deck">("single");
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Track generation identity by slide titles — changes when new content is generated
  const generationKey = slides.map((s) => s.title).join("|");
  const prevGenerationKey = useRef("");

  // Auto-generate background images for all slides when new content arrives
  useEffect(() => {
    if (!slides || slides.length === 0) return;
    if (generationKey === prevGenerationKey.current) return; // same content, skip
    prevGenerationKey.current = generationKey;

    slides.forEach((slide, index) => {
      const rawPrompt = slide.image_prompt ||
        `${slide.title} developer tools dark background yellow accents high contrast`;
      const prompt = encodeURIComponent(rawPrompt);
      // Use slide index + hash of title as seed for deterministic-but-unique images
      const seed = Math.abs([...slide.title].reduce((acc, c) => acc + c.charCodeAt(0), index * 997));
      const url = `https://image.pollinations.ai/prompt/${prompt}?width=1080&height=1350&nologo=true&model=flux&seed=${seed}`;
      onUpdateSlideImage(index, url);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationKey]);

  if (!slides || slides.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-zinc-800 text-zinc-400">
        <ImageIcon className="w-12 h-12 mx-auto mb-4 text-zinc-600 animate-pulse" />
        <p className="text-lg font-medium text-zinc-300">No slides generated yet</p>
        <p className="text-sm mt-1 text-zinc-500">Fill in the prompt details and generate to see preview.</p>
      </div>
    );
  }

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Generate Image via Pollinations.ai for a specific slide
  const generateSlideImage = async (index: number) => {
    const slide = slides[index];
    const prompt = encodeURIComponent(slide.image_prompt || `${slide.title} developer SaaS UI design`);
    const randomSeed = Math.floor(Math.random() * 100000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${prompt}?width=1080&height=1350&nologo=true&model=flux&seed=${randomSeed}`;
    
    onUpdateSlideImage(index, pollinationsUrl);
  };

  /** Fetch a cross-origin image URL and return it as a base64 data URL */
  const toDataUrl = async (src: string): Promise<string | null> => {
    try {
      const res = await fetch(src, { mode: "cors", credentials: "omit" });
      if (!res.ok) return null;
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  /** Capture a slide as a PNG data URL.
   *  Pre-fetches all external images and inlines them as base64 so
   *  html-to-image never makes cross-origin requests (avoids [object Event]). */
  const captureSlideCanvas = async (
    element: HTMLDivElement,
    scale: number
  ): Promise<string> => {
    // 1. Find all <img> tags and save original srcs
    const imgs = Array.from(element.querySelectorAll<HTMLImageElement>("img"));
    const originalSrcs = imgs.map((img) => img.src);

    // 2. Pre-fetch each image and swap in data URL (or hide if fetch fails)
    await Promise.all(
      imgs.map(async (img, i) => {
        const dataUrl = await toDataUrl(originalSrcs[i]);
        if (dataUrl) {
          img.src = dataUrl;
        } else {
          img.style.visibility = "hidden"; // hide but keep layout
        }
      })
    );

    try {
      // 3. Capture — html-to-image sees only local data URLs now
      return await toPng(element, {
        pixelRatio: scale,
        backgroundColor: "#08080a",
        cacheBust: false, // no cache busting needed, images are already inlined
        skipFonts: false,
      });
    } finally {
      // 4. Always restore original srcs and visibility
      imgs.forEach((img, i) => {
        img.src = originalSrcs[i];
        img.style.visibility = "";
      });
    }
  };





  // Export current slide as PNG
  const exportSlidePng = async (index: number) => {
    const element = slideRefs.current[index];
    if (!element) return;
    setIsExporting(true);
    try {
      const dataUrl = await captureSlideCanvas(element, 3); // 3× = ultra-HD PNG
      const link = document.createElement("a");
      link.download = `slide_${index + 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error: any) {
      console.error("Failed to export PNG:", error);
      alert(`Export failed: ${error?.message || error}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Export all slides as a multi-page PDF
  const exportAllPdf = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [800, 1000],
      });

      for (let i = 0; i < slides.length; i++) {
        const element = slideRefs.current[i];
        if (!element) continue;

        const imgData = await captureSlideCanvas(element, 2); // 2× = HD PDF
        if (i > 0) pdf.addPage([800, 1000], "portrait");
        pdf.addImage(imgData, "PNG", 0, 0, 800, 1000);
      }

      pdf.save("instagram_carousel.pdf");
    } catch (error: any) {
      console.error("Failed to export PDF:", error);
      alert(`PDF export failed: ${error?.message || error}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Download all slides as individual PNGs inside a ZIP file
  const exportAllPngs = async () => {
    setIsExporting(true);
    const zip = new JSZip();
    const folder = zip.folder("carousel-slides")!;

    try {
      for (let i = 0; i < slides.length; i++) {
        const element = slideRefs.current[i];
        if (!element) continue;

        setExportProgress(`Rendering slide ${i + 1} of ${slides.length}...`);
        const dataUrl = await captureSlideCanvas(element, 3);

        // Strip the data:image/png;base64, prefix
        const base64 = dataUrl.split(",")[1];
        const slideTitle = slides[i].title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 40);
        folder.file(`slide-${i + 1}-${slideTitle}.png`, base64, { base64: true });
      }

      setExportProgress("Zipping...");
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `carousel-${slides.length}-slides.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Failed to export all PNGs:", error);
      alert(`Export failed: ${error?.message || error}`);
    } finally {
      setIsExporting(false);
      setExportProgress("");
    }
  };

  const renderSlideContent = (slide: Slide, index: number) => {
    const isHook = index === 0;
    const isCuriosity = index === slides.length - 2;
    const isCTA = index === slides.length - 1;

    const isMinimal = theme === "clean-minimal";

    return (
      <div
        ref={(el) => {
          slideRefs.current[index] = el;
        }}
        className={`relative w-full aspect-[4/5] flex flex-col overflow-hidden border select-none font-sans ${
          isMinimal ? "bg-zinc-50 text-zinc-900 border-zinc-200" : "bg-[#0a0a0c] text-white border-zinc-800"
        }`}
        style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}
      >
        {/* Deep Background Layer */}
        {slide.imageUrl && (
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.imageUrl} alt="AI Visual" className={`w-full h-full object-cover opacity-50 mix-blend-luminosity ${isMinimal ? "opacity-20" : ""}`} />
            <div className={`absolute inset-0 bg-gradient-to-b ${isMinimal ? "from-zinc-50/90 via-zinc-50/70 to-zinc-50" : "from-[#0a0a0c]/90 via-[#0a0a0c]/60 to-[#0a0a0c]"}`} />
            <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${isMinimal ? "from-zinc-300/30" : "from-yellow-500/15"} via-transparent to-transparent`} />
          </div>
        )}
        <div className={`absolute inset-0 bg-[linear-gradient(${isMinimal ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.03)"}_1px,transparent_1px),linear-gradient(90deg,${isMinimal ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.03)"}_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0`} />

        {/* --- FIXED HEADER --- */}
        <div className={`absolute top-8 left-8 right-8 z-20 flex justify-between items-center text-[9px] sm:text-[10px] tracking-widest font-mono uppercase ${isMinimal ? "text-zinc-500" : "text-zinc-400"}`}>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full shadow-lg ${isMinimal ? "bg-black" : "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"}`}></span>
            <span className={`font-bold tracking-widest ${isMinimal ? "text-black" : "text-white"}`}>@sunilcodecraft</span>
          </div>
          <div className="flex space-x-1">
            {slides.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === index ? (isMinimal ? 'w-4 bg-black' : 'w-4 bg-yellow-400') : (isMinimal ? 'w-1.5 bg-zinc-300' : 'w-1.5 bg-zinc-700')}`} />
            ))}
          </div>
        </div>

        {/* --- CONSTRAINED MAIN BODY --- */}
        <div className="absolute top-[64px] bottom-[64px] left-8 right-8 z-10 flex flex-col justify-center">
          
          {/* Subtitle / Category Pill */}
          {slide.subtitle && (
            <div className="mb-5">
              <span className={`inline-block px-3 py-1.5 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase rounded-full backdrop-blur-md ${
                isMinimal 
                  ? "bg-zinc-900/5 text-zinc-800 border border-zinc-900/10 shadow-sm"
                  : "bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 shadow-[0_0_20px_rgba(250,204,21,0.15)]"
              }`}>
                {slide.subtitle}
              </span>
            </div>
          )}

          {/* Consistent Premium Title for all slides */}
          <h2 className={`
            font-black leading-[1.1] tracking-tight mb-6
            ${isHook ? 'text-[2rem] sm:text-[2.25rem]' : 'text-xl sm:text-2xl'}
            ${isMinimal 
              ? 'bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-500 bg-clip-text text-transparent' 
              : 'bg-gradient-to-br from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent'
            }
          `}>
            {slide.title}
          </h2>

          {/* Glassmorphism Card for Description & Bullets */}
          {(slide.description || (slide.bullets && slide.bullets.length > 0)) && !isCTA && (
            <div className={`backdrop-blur-xl border rounded-2xl p-5 shadow-2xl relative overflow-hidden ${
              isMinimal 
                ? "bg-white/80 border-black/10 shadow-black/5" 
                : "bg-zinc-950/60 border-white/10"
            }`}>
              {/* Card inner glow */}
              <div className={`absolute inset-0 bg-gradient-to-b ${isMinimal ? "from-black/5" : "from-white/5"} to-transparent pointer-events-none`} />
              
              {slide.description && (
                <p className={`relative text-xs sm:text-sm leading-relaxed font-medium ${isMinimal ? "text-zinc-700" : "text-zinc-300"}`}>
                  {slide.description}
                </p>
              )}

              {slide.bullets && slide.bullets.length > 0 && (
                <div className={`relative ${slide.description ? `mt-4 pt-4 border-t ${isMinimal ? "border-black/10" : "border-white/10"}` : ""}`}>
                  <ul className="space-y-3">
                    {slide.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className={`flex items-start text-[10px] sm:text-[11px] font-medium leading-relaxed ${isMinimal ? "text-zinc-800" : "text-zinc-100"}`}>
                        <div className={`mt-0.5 mr-3 flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                          isMinimal ? "bg-black/10 border-black/20" : "bg-yellow-400/20 border-yellow-400/50"
                        }`}>
                          <span className={`text-[8px] font-black ${isMinimal ? "text-black" : "text-yellow-400"}`}>✓</span>
                        </div>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Special Visual Render for CTA */}
          {isCTA && (
            <div className={`mt-2 border rounded-2xl p-5 flex items-center justify-between backdrop-blur-xl relative overflow-hidden shadow-2xl ${
              isMinimal 
                ? "bg-white/80 border-black/10 shadow-black/5" 
                : "bg-zinc-950/60 border-white/10"
            }`}>
              {/* Card inner glow */}
              <div className={`absolute inset-0 bg-gradient-to-b ${isMinimal ? "from-black/5" : "from-white/5"} to-transparent pointer-events-none`} />
              <div className="relative flex items-center space-x-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand-avatar.jpg" alt="Brand Avatar" className={`w-12 h-12 rounded-full border-2 object-cover ${
                  isMinimal ? "border-zinc-300 shadow-sm" : "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                }`} />
                <div>
                  <p className={`text-[9px] font-mono tracking-widest uppercase mb-1 ${isMinimal ? "text-zinc-500" : "text-zinc-400"}`}>Get the resource pack</p>
                  <p className={`text-sm font-black tracking-wide ${isMinimal ? "text-black" : "text-white"}`}>Comment "{keyword || "CODE"}"</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- FIXED FOOTER --- */}
        <div className={`absolute bottom-8 left-8 right-8 z-20 flex justify-between items-center text-[9px] font-bold uppercase tracking-widest border-t pt-4 ${
          isMinimal ? "text-zinc-500 border-zinc-200" : "text-zinc-600 border-zinc-800/50"
        }`}>
          <span className={isMinimal ? "text-zinc-500" : "text-zinc-500"}>SAVE FOR LATER 📌</span>
          <span className={isMinimal ? "text-black" : "text-yellow-400/80"}>SWIPE ➔</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-zinc-950/60 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
          <button
            onClick={() => setViewMode("single")}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center ${
              viewMode === "single"
                ? "bg-zinc-800 text-white shadow-md"
                : "bg-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Single Slide
          </button>
          <button
            onClick={() => setViewMode("deck")}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center ${
              viewMode === "deck"
                ? "bg-zinc-800 text-white shadow-md"
                : "bg-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
            Deck View
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download All PNGs — primary CTA */}
          <button
            disabled={isExporting}
            onClick={exportAllPngs}
            className="px-5 py-2.5 text-[10px] uppercase tracking-widest bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-xl transition-all flex items-center space-x-2 disabled:opacity-50 shadow-lg shadow-yellow-500/20 whitespace-nowrap"
          >
            <Package className="w-4 h-4" />
            <span>{isExporting && exportProgress ? exportProgress : `Download All ${slides.length} PNGs`}</span>
          </button>
          
          <div className="flex space-x-1 bg-black/40 p-1.5 rounded-xl border border-white/5 shrink-0">
            <button
              disabled={isExporting}
              onClick={() => exportSlidePng(activeSlide)}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all flex items-center space-x-1 disabled:opacity-50"
              title="Export current slide only"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG</span>
            </button>
            <button
              disabled={isExporting}
              onClick={exportAllPdf}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all flex items-center space-x-1 disabled:opacity-50"
              title="Export all slides as PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === "single" ? (
        /* Slider View — renders ALL slides but only shows the active one.
           Hidden slides still mount their refs so exportAllPngs works correctly. */
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative w-full max-w-[400px] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl bg-zinc-950">
            {slides.map((slide, idx) => (
              <div 
                key={idx} 
                className={idx === activeSlide ? "relative z-10 w-full" : "absolute inset-0 z-0 opacity-0 pointer-events-none"}
                aria-hidden={idx !== activeSlide}
              >
                {renderSlideContent(slide, idx)}
              </div>
            ))}

            {/* AI Image Generation Trigger button */}
            <button
              onClick={() => generateSlideImage(activeSlide)}
              className="absolute top-12 right-4 bg-black/80 hover:bg-black border border-yellow-400/40 text-yellow-400 p-2 rounded-full shadow-lg transition-all flex items-center space-x-1 text-[10px] font-bold z-20 group"
              title="Regenerate slide background image"
            >
              <Sparkles className="w-3.5 h-3.5 group-hover:animate-spin" />
              <span className="hidden group-hover:inline pr-1">Render Visual</span>
            </button>
          </div>

          {/* Slider Pagination */}
          <div className="flex items-center space-x-6">
            <button
              onClick={prevSlide}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-yellow-400/50 text-zinc-300 hover:text-yellow-400 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex space-x-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === activeSlide ? "bg-yellow-400 w-4" : "bg-zinc-700"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-yellow-400/50 text-zinc-300 hover:text-yellow-400 transition-all"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-zinc-500 text-[11px] font-mono border-t border-zinc-900 w-full text-center pt-2">
            Visual Prompt: <span className="italic text-zinc-400">{slides[activeSlide].visual_suggestion}</span>
          </div>
        </div>

      ) : (
        /* Full Deck Overview */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 max-w-full">
          {slides.map((slide, idx) => (
            <div key={idx} className="relative group border border-white/5 rounded-2xl overflow-hidden bg-black shadow-lg aspect-[4/5] @container">
              {/* Force the physical render to 400x500 and perfectly scale it down via CSS container queries */}
              <div className="w-[400px] h-[500px] origin-top-left" style={{ transform: 'scale(calc(100cqw / 400))' }}>
                {renderSlideContent(slide, idx)}
              </div>
              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 z-20">
                <button
                  onClick={() => generateSlideImage(idx)}
                  className="px-3 py-1.5 bg-yellow-400 text-black rounded-lg text-xs font-bold flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Image</span>
                </button>
                <button
                  onClick={() => exportSlidePng(idx)}
                  className="px-3 py-1.5 bg-zinc-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save PNG</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
