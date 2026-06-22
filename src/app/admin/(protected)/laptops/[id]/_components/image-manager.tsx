"use client";

import { useEffect, useRef, useState } from "react";
import { Star, Trash2, Upload } from "lucide-react";

import { imageService } from "@/shared/api/image-service";
import { laptopService } from "@/shared/api/laptop-service";
import { getErrorMessage } from "@/shared/api/error";
import { cardClass } from "@/shared/ui/form";
import { ImageLightbox } from "@/shared/ui/image-lightbox";
import type { Image } from "@/shared/domain/image";
import type { Laptop } from "@/shared/domain/laptop";

interface ImageManagerProps {
  laptop: Laptop;
  onChange: (laptop: Laptop) => void;
}

export function ImageManager({ laptop, onChange }: ImageManagerProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    imageService
      .list(laptop._id)
      .then((list) => {
        if (active) setImages(list);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [laptop._id]);

  async function reloadImages() {
    setImages(await imageService.list(laptop._id));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        await imageService.upload(laptop._id, file);
      }
      await reloadImages();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(image: Image) {
    setBusy(true);
    setError(null);
    try {
      await imageService.remove(image.id);
      await reloadImages();
      // Clear the main reference if we just deleted it.
      if (laptop.imageUrl === image.s3Url) {
        const updated = await laptopService.update({ id: laptop._id, imageUrl: "" });
        onChange(updated);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function setMain(image: Image) {
    setBusy(true);
    setError(null);
    try {
      const updated = await laptopService.update({
        id: laptop._id,
        imageUrl: image.s3Url,
      });
      onChange(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
          Фото
        </h2>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-paper-line bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload className="size-4" strokeWidth={2} />
          {busy ? "Завантаження…" : "Завантажити"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="font-mono text-sm tracking-[0.1em] text-ink-soft uppercase">
          Завантаження…
        </p>
      ) : images.length === 0 ? (
        <p className="text-sm text-ink-soft">Фото ще не завантажено.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image, index) => {
            const isMain = laptop.imageUrl === image.s3Url;
            return (
              <div
                key={image.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-paper-line"
              >
                <button
                  type="button"
                  onClick={() => setPreviewIndex(index)}
                  aria-label="Відкрити фото"
                  className="size-full cursor-zoom-in"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.s3Url}
                    alt=""
                    className="size-full object-cover"
                  />
                </button>
                {isMain && (
                  <span className="pointer-events-none absolute top-1 left-1 rounded-full bg-amber p-1 text-white">
                    <Star className="size-3" strokeWidth={2.5} fill="currentColor" />
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-graphite/60 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void setMain(image);
                    }}
                    disabled={busy || isMain}
                    aria-label="Зробити головним"
                    className="rounded p-1 text-white transition-colors hover:text-amber disabled:opacity-40"
                  >
                    <Star className="size-3.5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void remove(image);
                    }}
                    disabled={busy}
                    aria-label="Видалити"
                    className="rounded p-1 text-white transition-colors hover:text-red-400 disabled:opacity-40"
                  >
                    <Trash2 className="size-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ImageLightbox
        images={images.map((image) => image.s3Url)}
        initialIndex={previewIndex ?? 0}
        open={previewIndex !== null}
        onClose={() => setPreviewIndex(null)}
      />
    </section>
  );
}
