"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
  alt?: string;
}

/** Fullscreen image preview with keyboard navigation (Esc, arrows). */
export function ImageLightbox({
  images,
  initialIndex,
  open,
  onClose,
  alt = "",
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft" && images.length > 1) {
        setIndex((current) => (current - 1 + images.length) % images.length);
      } else if (event.key === "ArrowRight" && images.length > 1) {
        setIndex((current) => (current + 1) % images.length);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, images.length]);

  if (!open || images.length === 0) return null;

  function showPrev() {
    setIndex((current) => (current - 1 + images.length) % images.length);
  }

  function showNext() {
    setIndex((current) => (current + 1) % images.length);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Перегляд фото"
    >
      <button
        type="button"
        aria-label="Закрити"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-graphite/90 backdrop-blur-sm"
      />

      <button
        type="button"
        onClick={onClose}
        aria-label="Закрити"
        className="absolute top-4 right-4 z-20 rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="size-6" strokeWidth={2} />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={showPrev}
            aria-label="Попереднє фото"
            className="absolute top-1/2 left-4 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <ChevronLeft className="size-6" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label="Наступне фото"
            className="absolute top-1/2 right-4 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <ChevronRight className="size-6" strokeWidth={2} />
          </button>
        </>
      )}

      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-[min(100vw-2rem,80rem)] items-center justify-center px-14 py-16"
        onClick={(event) => event.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index]}
          alt={alt}
          className="max-h-[90vh] max-w-full object-contain"
        />
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-graphite/70 px-4 py-1.5 font-mono text-xs tracking-wider text-white">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
