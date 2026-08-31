let playObserver: IntersectionObserver | undefined;
let loadObserver: IntersectionObserver | undefined;
let bootstrapped = false;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function resolveSource(video: HTMLVideoElement) {
  return video.dataset.src || video.getAttribute("src") || "";
}

function loadVideo(video: HTMLVideoElement) {
  const src = video.dataset.src;
  if (!src) return;
  if (video.getAttribute("src") === src) return;

  video.preload = "auto";
  video.src = src;
}

async function playVideo(video: HTMLVideoElement) {
  loadVideo(video);
  try {
    await video.play();
  } catch {
    // Autoplay can fail before the first frame is ready; ignore.
  }
}

export function initProjectSlideVideos(root: ParentNode = document) {
  playObserver?.disconnect();
  loadObserver?.disconnect();

  const videos = [...root.querySelectorAll<HTMLVideoElement>("video[data-project-video]")];
  if (!videos.length) return;

  loadObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        loadVideo(entry.target as HTMLVideoElement);
        loadObserver?.unobserve(entry.target);
      }
    },
    { rootMargin: "400px 0px", threshold: 0.01 },
  );

  playObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          if (prefersReducedMotion()) continue;
          for (const other of videos) {
            if (other !== video) other.pause();
          }
          void playVideo(video);
        } else {
          video.pause();
        }
      }
    },
    { threshold: 0.35 },
  );

  for (const video of videos) {
    if (!video.dataset.src && video.src) {
      video.dataset.src = resolveSource(video);
    }
    video.preload = "none";
    loadObserver.observe(video);
    playObserver.observe(video);
  }
}

if (typeof document !== "undefined" && !bootstrapped) {
  bootstrapped = true;
  initProjectSlideVideos();
  document.addEventListener("astro:page-load", () => initProjectSlideVideos());
}
