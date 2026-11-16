"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { photoUrl } from "@/lib/client";
import { ChevronLeftIcon, ChevronRightIcon, ImageIcon, XIcon } from "./icons";

/* eslint-disable @next/next/no-img-element */

/** Swipeable photo gallery (scroll-snap), with arrows, thumbnails and a full-screen viewer. */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDialogElement>(null);

  const goTo = useCallback(
    (target: number) => {
      const track = trackRef.current;
      if (!track) return;
      const next = Math.max(0, Math.min(images.length - 1, target));
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
      setIndex(next);
    },
    [images.length],
  );

  function onScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const current = Math.round(track.scrollLeft / track.clientWidth);
    if (current !== index) setIndex(current);
  }

  useEffect(() => {
    const dialog = viewerRef.current;
    if (!dialog) return;
    if (viewer && !dialog.open) dialog.showModal();
    if (!viewer && dialog.open) dialog.close();
  }, [viewer]);

  if (images.length === 0) {
    return (
      <div className="card grid aspect-[4/3] place-items-center text-muted">
        <div className="flex flex-col items-center gap-2">
          <ImageIcon width={36} height={36} />
          <span className="text-sm">No photos</span>
        </div>
      </div>
    );
  }

  const many = images.length > 1;

  return (
    <div>
      <div className="card relative overflow-hidden">
        <div
          ref={trackRef}
          onScroll={onScroll}
          dir="ltr"
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        >
          {images.map((name, i) => (
            <button
              key={name}
              type="button"
              onClick={() => setViewer(true)}
              className="grid aspect-[4/3] w-full shrink-0 snap-center place-items-center bg-surface-2"
              aria-label={`Open photo ${i + 1} full screen`}
            >
              <img
                src={photoUrl(name)}
                alt={`${alt} – photo ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
                className="size-full object-contain"
              />
            </button>
          ))}
        </div>

        {many ? (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-bg/80 shadow-card backdrop-blur disabled:opacity-30 sm:grid"
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index === images.length - 1}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-bg/80 shadow-card backdrop-blur disabled:opacity-30 sm:grid"
            >
              <ChevronRightIcon />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              {index + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {many ? (
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" dir="ltr">
          {images.map((name, i) => (
            <button
              key={name}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={`size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-surface-2 transition ${
                i === index ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={photoUrl(name)} alt="" loading="lazy" draggable={false} className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <dialog
        ref={viewerRef}
        className="lightbox"
        onClose={() => setViewer(false)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") goTo(index - 1);
          if (event.key === "ArrowRight") goTo(index + 1);
        }}
        onClick={(event) => {
          if (event.target === viewerRef.current) setViewer(false);
        }}
      >
        <div className="relative grid size-full place-items-center p-2 sm:p-8" onClick={() => setViewer(false)}>
          <img
            src={photoUrl(images[index] ?? images[0])}
            alt={`${alt} – photo ${index + 1}`}
            className="max-h-full max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setViewer(false)}
            aria-label="Close"
            className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] grid size-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur"
          >
            <XIcon />
          </button>
          {many ? (
            <>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); goTo(index - 1); }}
                disabled={index === 0}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur disabled:opacity-30"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); goTo(index + 1); }}
                disabled={index === images.length - 1}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur disabled:opacity-30"
              >
                <ChevronRightIcon />
              </button>
            </>
          ) : null}
        </div>
      </dialog>
    </div>
  );
}
