let observer: IntersectionObserver | undefined;
let bootstrapped = false;

export function initProjectSlideVideos(root: ParentNode = document) {
  observer?.disconnect();

  const videos = root.querySelectorAll<HTMLVideoElement>("video[data-project-video]");
  if (!videos.length) return;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    },
    { threshold: 0.35 },
  );

  for (const video of videos) {
    observer.observe(video);
  }
}

if (typeof document !== "undefined" && !bootstrapped) {
  bootstrapped = true;
  initProjectSlideVideos();
  document.addEventListener("astro:page-load", () => initProjectSlideVideos());
}
