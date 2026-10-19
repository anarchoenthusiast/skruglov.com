"use client";

import { useEffect, useRef } from "react";
import { MEDIA_VIEWER_EVENT } from "@/lib/media-gallery";

type ProjectVideoProps = React.VideoHTMLAttributes<HTMLVideoElement>;

export function ProjectVideo({ muted = true, loop = true, playsInline = true, ...props }: ProjectVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let intersecting = false;
    const syncPlayback = () => {
      if (intersecting && !reducedMotion.matches && (!document.documentElement.dataset.mediaViewerOpen || video.closest("[data-media-dialog]"))) void video.play().catch(() => {});
      else video.pause();
    };
    reducedMotion.addEventListener("change", syncPlayback);
    window.addEventListener(MEDIA_VIEWER_EVENT,syncPlayback);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          intersecting = entry.isIntersecting;
          syncPlayback();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(video);
    return () => { observer.disconnect(); window.removeEventListener(MEDIA_VIEWER_EVENT,syncPlayback); reducedMotion.removeEventListener("change", syncPlayback); video.pause(); };
  }, []);

  return (
    <video
      ref={ref}
      data-project-video
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      {...props}
    />
  );
}
