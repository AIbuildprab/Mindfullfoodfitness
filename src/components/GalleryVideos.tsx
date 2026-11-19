"use client";

import { useEffect, useRef } from "react";

export function GalleryVideos({ sources }: { sources: readonly string[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const videos = [...root.querySelectorAll("video")];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.muted = true;
            void video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0.45 },
    );

    videos.forEach((video) => observer.observe(video));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="scroll-row -mx-5 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
      {sources.map((src) => (
        <video
          key={src}
          src={src}
          controls
          muted
          loop
          playsInline
          preload="metadata"
          className="aspect-[9/16] w-[68%] shrink-0 snap-center rounded-2xl bg-black object-cover sm:w-[44%] md:w-full"
        />
      ))}
    </div>
  );
}
