import type { FigmaSlideBlock } from "@/content/types";
import { ProjectVideo } from "@/components/project-blocks/ProjectVideo";

export function ProjectFigmaSlide({
  background = "var(--color-media-bg)",
  radius = 12,
  slideWidth = 960,
  slideHeight = 640,
  media,
  static: staticPreview = false,
}: Omit<FigmaSlideBlock, "kind" | "marginTop"> & { static?: boolean }) {
  const pctW = (value: number) => `${(value / slideWidth) * 100}%`;
  const pctH = (value: number) => `${(value / slideHeight) * 100}%`;
  const toRadius = (value: number) => `calc(${value} * 100cqw / ${slideWidth})`;

  const singleVideo =
    media.length === 1 && media[0].kind === "video" ? media[0] : null;

  if (staticPreview && singleVideo?.poster && singleVideo.clipBackground) {
    return (
      <div
        className="project-figma-slide project-figma-slide--grid-poster"
        style={{
          position: "relative",
          width: "100%",
          overflow: "hidden",
          containerType: "size",
          aspectRatio: `${slideWidth} / ${slideHeight}`,
          backgroundColor: background,
        }}
      >
        <div
          className="project-figma-slide__item"
          style={{
            position: "absolute",
            boxSizing: "border-box",
            left: pctW(singleVideo.x),
            top: pctH(singleVideo.y),
            width: pctW(singleVideo.w),
            height: pctH(singleVideo.h),
          }}
        >
          <div
            className="project-figma-slide__clip"
            data-fit={singleVideo.fit ?? "contain"}
            style={{
              width: "100%",
              height: "100%",
              overflow: "hidden",
              backgroundColor: singleVideo.clipBackground,
              isolation: "isolate",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={singleVideo.poster}
              alt={singleVideo.alt}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
        <style>{`
          .project-figma-slide--grid-poster .project-figma-slide__clip :is(video, img) {
            display: block;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            max-width: none;
            object-position: center;
          }
          .project-figma-slide--grid-poster .project-figma-slide__clip[data-fit="contain"] :is(video, img) {
            object-fit: contain;
          }
        `}</style>
      </div>
    );
  }

  if (staticPreview && singleVideo?.poster) {
    return (
      <div
        className="project-figma-slide project-figma-slide--grid-poster"
        style={{
          position: "relative",
          width: "100%",
          overflow: "hidden",
          containerType: "size",
          aspectRatio: `${slideWidth} / ${slideHeight}`,
          backgroundColor: background,
          borderRadius: toRadius(radius),
        }}
      >
        <div
          className="project-figma-slide__item"
          style={{
            position: "absolute",
            boxSizing: "border-box",
            left: pctW(singleVideo.x),
            top: pctH(singleVideo.y),
            width: pctW(singleVideo.w),
            height: pctH(singleVideo.h),
          }}
        >
          <div
            className="project-figma-slide__clip"
            data-fit={singleVideo.fit ?? "fill"}
            style={{
              width: "100%",
              height: "100%",
              overflow: "hidden",
              borderRadius: toRadius(singleVideo.radius ?? 16),
              backgroundColor: background,
              isolation: "isolate",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={singleVideo.poster}
              alt={singleVideo.alt}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
        <style>{`
          .project-figma-slide--grid-poster .project-figma-slide__clip :is(video, img) {
            display: block;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            max-width: none;
            object-position: center;
            border-radius: inherit;
          }
          .project-figma-slide--grid-poster .project-figma-slide__clip[data-fit="contain"] :is(video, img) {
            object-fit: contain;
          }
          .project-figma-slide--grid-poster .project-figma-slide__clip[data-fit="cover"] :is(video, img) {
            object-fit: cover;
          }
          .project-figma-slide--grid-poster .project-figma-slide__clip[data-fit="fill"] :is(video, img) {
            object-fit: fill;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div
        className="project-figma-slide"
        style={{
          position: "relative",
          width: "100%",
          overflow: "hidden",
          containerType: "size",
          aspectRatio: `${slideWidth} / ${slideHeight}`,
          backgroundColor: background,
          borderRadius: toRadius(radius),
        }}
      >
        {media.map((item, index) => (
          <div
            key={index}
            className="project-figma-slide__item"
            style={{
              position: "absolute",
              boxSizing: "border-box",
              left: pctW(item.x),
              top: pctH(item.y),
              width: pctW(item.w),
              height: pctH(item.h),
            }}
          >
            <div
              className={
                item.kind === "video" && item.controls
                  ? "project-figma-slide__clip project-figma-slide__clip--controls"
                  : "project-figma-slide__clip"
              }
              data-fit={item.fit ?? "fill"}
              style={{
                width: "100%",
                height: "100%",
                overflow: item.kind === "video" && item.controls ? "visible" : "hidden",
                borderRadius: toRadius(item.radius ?? 16),
                backgroundColor: item.clipBackground ?? background,
                isolation: "isolate",
              }}
            >
              {item.kind === "video" ? (
                staticPreview && item.poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.poster}
                    alt={item.alt}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <ProjectVideo
                    src={item.src}
                    poster={item.poster}
                    preload="metadata"
                    controls={item.controls}
                    muted={item.controls ? (item.muted ?? true) : true}
                    loop={item.loop ?? true}
                    aria-label={item.alt}
                  />
                )
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .project-figma-slide__clip :is(video, img) {
          display: block;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          max-width: none;
          object-position: center;
          border-radius: inherit;
        }
        .project-figma-slide__clip[data-fit="contain"] :is(video, img) {
          object-fit: contain;
        }
        .project-figma-slide__clip[data-fit="cover"] :is(video, img) {
          object-fit: cover;
        }
        .project-figma-slide__clip[data-fit="fill"] :is(video, img) {
          object-fit: fill;
        }
        .project-figma-slide__clip--controls {
          overflow: visible;
        }
      `}</style>
    </>
  );
}
