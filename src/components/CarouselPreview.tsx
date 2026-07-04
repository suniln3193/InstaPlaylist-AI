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
  onUpdateSlideImage: (slideIndex: number, url: string) => void;
}

export default function CarouselPreview({
  slides,
  keyword,
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

    return (
      <div
        ref={(el) => {
          slideRefs.current[index] = el;
        }}
        className="relative w-full aspect-[4/5] bg-[#08080a] text-white flex flex-col justify-between p-10 overflow-hidden border border-zinc-800 select-none"
        style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}
      >
        {/* Brand Header */}
        <div className="flex justify-between items-center text-xs tracking-widest text-zinc-500 font-mono uppercase">
          <span>@sunilcodecraft</span>
          <span>{index + 1} / {slides.length}</span>
        </div>

        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Ambient Glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none" />

        {/* Main Body */}
        <div className="flex-1 flex flex-col justify-center my-6 z-10">
          {/* Subtitle / Category Pill */}
          {slide.subtitle && (
            <div className="mb-4">
              <span className="px-3 py-1 text-[10px] font-bold tracking-widest uppercase bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded-full">
                {slide.subtitle}
              </span>
            </div>
          )}

          {/* Title */}
          <h2 className={`font-extrabold uppercase leading-none tracking-tight text-white mb-4 ${isHook ? 'text-4xl' : 'text-2xl'}`}>
            {slide.title.split(" ").map((word, idx) => {
              const highlight = word.toUpperCase() === "ILLEGAL" || word.toUpperCase() === "CHEATING" || word.toUpperCase() === "SECRET" || word.toUpperCase() === "AI" || word.toUpperCase() === "FREE";
              return (
                <span key={idx} className={highlight ? "text-yellow-400 text-glow" : ""}>
                  {word}{" "}
                </span>
              );
            })}
          </h2>

          {/* Description */}
          <p className="text-zinc-300 text-sm leading-relaxed mb-6 font-normal">
            {slide.description}
          </p>

          {/* Bullets or Mock Visual Elements */}
          {slide.bullets && slide.bullets.length > 0 && (
            <ul className="space-y-3">
              {slide.bullets.map((bullet, bIdx) => (
                <li key={bIdx} className="flex items-start text-xs text-zinc-200 leading-normal">
                  <span className="text-yellow-400 mr-2 mt-0.5 font-bold">✓</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Special Visual Render for Slide Types */}
          {isCTA && (
            <div className="mt-8 border border-zinc-800 bg-zinc-900/60 rounded-xl p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-black text-sm">
                  S
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-mono">SENDING RESOURCES</p>
                  <p className="text-xs font-bold text-white">Comment "{keyword || "CODE"}"</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-yellow-400 text-black text-[10px] font-bold rounded-lg animate-pulse">
                SENDING DM
              </span>
            </div>
          )}
        </div>

        {/* AI Background Image */}
        {slide.imageUrl && (
          <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.imageUrl} alt="AI Visual" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/70 to-[#08080a]/40" />
          </div>
        )}
        {/* Image loading placeholder */}
        {!slide.imageUrl && (
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_#eab308_0%,_transparent_70%)]" />
        )}

        {/* Footer */}
        <div className="flex justify-between items-center text-[10px] text-zinc-500 z-10">
          <span className="font-semibold text-yellow-400/60 font-mono">DEVELOPER ROADMAP</span>
          <span className="tracking-wide font-mono">SWIPE ➔</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode("single")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === "single"
                ? "bg-yellow-400 text-black shadow-lg"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5 inline mr-1.5" />
            Single Slide
          </button>
          <button
            onClick={() => setViewMode("deck")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === "deck"
                ? "bg-yellow-400 text-black shadow-lg"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 inline mr-1.5" />
            Deck View
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Download All PNGs — primary CTA */}
          <button
            disabled={isExporting}
            onClick={exportAllPngs}
            className="px-4 py-1.5 text-xs bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold rounded-lg transition-all flex items-center space-x-1.5 disabled:opacity-50 shadow-lg shadow-yellow-500/20"
          >
            <Package className="w-3.5 h-3.5" />
            <span>{isExporting && exportProgress ? exportProgress : `Download All ${slides.length} PNGs`}</span>
          </button>
          <button
            disabled={isExporting}
            onClick={() => exportSlidePng(activeSlide)}
            className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-all flex items-center space-x-1.5 disabled:opacity-50"
            title="Export current slide only"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>
          <button
            disabled={isExporting}
            onClick={exportAllPdf}
            className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-all flex items-center space-x-1.5 disabled:opacity-50"
            title="Export all slides as PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {viewMode === "single" ? (
        /* Slider View — renders ALL slides but only shows the active one.
           Hidden slides still mount their refs so exportAllPngs works correctly. */
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative w-full max-w-[400px] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl bg-zinc-950">
            {slides.map((slide, idx) => (
              <div key={idx} style={{ display: idx === activeSlide ? "block" : "none" }}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slides.map((slide, idx) => (
            <div key={idx} className="relative group border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950 shadow-lg">
              {renderSlideContent(slide, idx)}
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
