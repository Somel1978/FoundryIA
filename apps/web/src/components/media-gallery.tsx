"use client";

import { ChevronLeft, ChevronRight, Expand, Play, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SafeImg } from "./safe-img";

export interface GalleryItem {
  id: string;
  kind: "image" | "video" | "embed";
  caption: string;
  /** Image/video URL, or the embed (iframe) URL. */
  src: string;
  /** Preview for the thumbnail strip (null → icon tile). */
  thumb: string | null;
}

export function MediaGallery({ items, title }: { items: GalleryItem[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const item = items[index];
  const go = useCallback((d: number) => setIndex((i) => (i + d + items.length) % items.length), [items.length]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, go]);

  if (!item) return null;

  return (
    <section aria-label={`${title} gallery`} className="mx-auto max-w-4xl space-y-3">
      <div className="group relative aspect-video overflow-hidden rounded-2xl border border-border bg-black shadow-xl shadow-black/10">
        {item.kind === "image" && (
          <button type="button" className="block size-full cursor-zoom-in" onClick={() => setLightbox(true)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt={item.caption || title} className="size-full object-contain" />
            <span className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
              <Expand className="size-4" />
            </span>
          </button>
        )}
        {item.kind === "video" && (
          <video key={item.id} src={item.src} controls preload="metadata" playsInline className="size-full object-contain" />
        )}
        {item.kind === "embed" && (
          <iframe
            key={item.id}
            src={item.src}
            title={item.caption || title}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {item.caption && <p className="text-center text-sm text-muted">{item.caption}</p>}

      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show item ${i + 1}`}
              className={`relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg border-2 bg-surface-2 transition ${
                i === index ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {m.thumb ? (
                <SafeImg src={m.thumb} alt="" className="size-full object-cover" loading="lazy" />
              ) : m.kind === "video" ? (
                <video src={`${m.src}#t=0.5`} preload="metadata" muted className="size-full object-cover" />
              ) : null}
              {m.kind !== "image" && (
                <span className="absolute inset-0 grid place-items-center bg-black/30 text-white">
                  <Play className="size-5 fill-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {lightbox && item.kind === "image" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.src} alt={item.caption || title} className="max-h-full max-w-full rounded-lg object-contain" />
          <button
            type="button"
            aria-label="Close"
            className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
          {item.caption && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm text-white">
              {item.caption}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
