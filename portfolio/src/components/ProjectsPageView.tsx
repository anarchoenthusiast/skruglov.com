"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ProjectFigmaSlide } from "@/components/project-blocks/ProjectFigmaSlide";
import { getProjectGridTileKey, type ProjectGridTile } from "@/content/project-grid-assets";
import type { ProjectSummary } from "@/content/types";
import { localizePath, type Locale } from "@/content/locales";

type ProjectsView = "index" | "image";

type ProjectsPageViewProps = {
  projects: ProjectSummary[];
  tiles: ProjectGridTile[];
  locale: Locale;
  copy: {
    title: string;
    empty: string;
    index: string;
    image: string;
    colProject: string;
    colPartner: string;
    colType: string;
    colYear: string;
  };
  categories?: Record<string, string>;
};

function tilePreviewSrc(tile: ProjectGridTile): string | undefined {
  if (tile.src) return tile.src;
  if (tile.slideVideo?.poster) return tile.slideVideo.poster;
  const media = tile.figmaSlide?.media[0];
  if (!media) return undefined;
  return media.kind === "video" ? media.poster : media.src;
}

function ProjectTile({ tile }: { tile: ProjectGridTile }) {
  return (
    <Link href={tile.href} className="project-card__link">
      {tile.figmaSlide ? (
        <ProjectFigmaSlide {...tile.figmaSlide} radius={0} static />
      ) : tile.slideVideo?.poster ? (
        <div
          className="project-card__slide-video"
          style={{
            ["--slide-w" as string]: 960,
            aspectRatio: "960 / 640",
            backgroundColor: "var(--color-media-bg)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tile.slideVideo.poster} alt={tile.slideVideo.alt} loading="lazy" decoding="async" />
        </div>
      ) : tile.src ? (
        <Image
          src={tile.src}
          alt={tile.alt}
          width={tile.width}
          height={tile.height}
          quality={95}
          sizes="(max-width: 767px) 50vw, (max-width: 1023px) 20vw, 16.66vw"
          className="project-card__image"
        />
      ) : null}
    </Link>
  );
}

function sortProjectsByYear(projects: ProjectSummary[]) {
  return [...projects].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
}

function buildIndexListEntries(projects: ProjectSummary[]) {
  const sorted = sortProjectsByYear(projects);
  const entries: Array<{ type: "project"; project: ProjectSummary } | { type: "spacer"; key: string }> = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const project = sorted[index];
    const previous = sorted[index - 1];

    if (previous && previous.year !== project.year) {
      entries.push({ type: "spacer", key: `year-gap-${project.year}-${index}` });
    }

    entries.push({ type: "project", project });
  }

  return { sorted, entries };
}

export function ProjectsPageView({ projects, tiles, locale, copy, categories = {} }: ProjectsPageViewProps) {
  const { sorted: sortedProjects, entries: indexEntries } = useMemo(
    () => buildIndexListEntries(projects),
    [projects],
  );
  const [view, setView] = useState<ProjectsView>("index");
  const [activeSlug, setActiveSlug] = useState(sortedProjects[0]?.slug ?? "");

  const previewBySlug = useMemo(() => {
    const map = new Map<string, { src: string; alt: string; width: number; height: number }>();

    for (const project of projects) {
      map.set(project.slug, {
        src: project.coverImage,
        alt: project.name,
        width: project.coverWidth,
        height: project.coverHeight,
      });
    }

    for (const tile of tiles) {
      const src = tilePreviewSrc(tile);
      if (!src || map.has(tile.slug)) continue;
      map.set(tile.slug, {
        src,
        alt: tile.alt,
        width: tile.width,
        height: tile.height,
      });
    }

    return map;
  }, [projects, tiles]);

  const activePreview =
    previewBySlug.get(activeSlug) ?? previewBySlug.get(sortedProjects[0]?.slug ?? "");

  return (
    <>
      <div className="page-title projects-page-title">
        <h1 className="visually-hidden">{copy.title}</h1>
        <div className="projects-view-tabs" role="tablist" aria-label={copy.title} onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? "index" : event.key === "End" ? "image" : view === "index" ? "image" : "index";
          setView(next);
          event.currentTarget.querySelector<HTMLButtonElement>(`#projects-tab-${next}`)?.focus();
        }}>
        <button
          type="button"
          role="tab"
          id="projects-tab-index"
          aria-controls="projects-panel-index"
          tabIndex={view === "index" ? 0 : -1}
          aria-selected={view === "index"}
          className={`page-title__button${view === "index" ? " is-active" : ""}`}
          onClick={() => setView("index")}
        >
          {copy.index}
        </button>
        <button
          type="button"
          role="tab"
          id="projects-tab-image"
          aria-controls="projects-panel-image"
          tabIndex={view === "image" ? 0 : -1}
          aria-selected={view === "image"}
          className={`page-title__button${view === "image" ? " is-active" : ""}`}
          onClick={() => setView("image")}
        >
          {copy.image}
        </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <p className="projects-shell__empty">{copy.empty}</p>
      ) : null}

      <div id="projects-panel-index" role="tabpanel" aria-labelledby="projects-tab-index" hidden={view !== "index"}>
      {view === "index" && projects.length > 0 ? (
        <div className="project-index">
          <div className="project-index__list">
            <div className="project-index__row project-index__row--heading">
              <span className="project-index__col project-index__col--project">{copy.colProject}</span>
              <span className="project-index__col project-index__col--partner">{copy.colPartner}</span>
              <span className="project-index__col project-index__col--type">{copy.colType}</span>
              <span className="project-index__col project-index__col--year">{copy.colYear}</span>
            </div>

            <div className="project-index__row project-index__row--spacer" aria-hidden />

            {indexEntries.map((entry) => {
              if (entry.type === "spacer") {
                return <div key={entry.key} className="project-index__row project-index__row--spacer" aria-hidden />;
              }

              const project = entry.project;
              const href = localizePath(project.href ?? `/projects/${project.slug}/`, locale);
              const category = project.category
                ? (categories[project.category] ?? project.category)
                : "";

              return (
                <Link
                  key={project.slug}
                  href={href}
                  className={`project-index__row project-index__row--item${
                    activeSlug === project.slug ? " is-active" : ""
                  }`}
                  onMouseEnter={() => setActiveSlug(project.slug)}
                  onFocus={() => setActiveSlug(project.slug)}
                >
                  <span className="project-index__col project-index__col--project">{project.name}</span>
                  <span className="project-index__col project-index__col--partner">{project.client}</span>
                  <span className="project-index__col project-index__col--type">{category}</span>
                  <span className="project-index__col project-index__col--year">{project.year ?? ""}</span>
                </Link>
              );
            })}
          </div>

          {activePreview ? (
            <div className="project-index__preview" aria-hidden>
              <div className="project-index__preview-frame">
                <Image
                  src={activePreview.src}
                  alt={activePreview.alt}
                  width={activePreview.width}
                  height={activePreview.height}
                  quality={95}
                  sizes="(max-width: 1023px) 0px, 25vw"
                  className="project-index__preview-image"
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      </div>
      <div id="projects-panel-image" role="tabpanel" aria-labelledby="projects-tab-image" hidden={view !== "image"}>
      {view === "image" && tiles.length > 0 ? (
        <div className="projects-grid">
          {tiles.map((tile) => (
            <div key={`${tile.slug}-${getProjectGridTileKey(tile)}`}>
              <ProjectTile tile={tile} />
            </div>
          ))}
        </div>
      ) : null}
      </div>
    </>
  );
}
