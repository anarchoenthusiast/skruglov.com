import { fallbackCopy } from "@/content/project-fallback";
import Image from "next/image";
import { mediaAttributes } from "@/lib/media-gallery";
import type { ProjectSummary } from "@/content/types";
import type { Locale } from "@/content/locales";


export function FallbackProjectPage({
  project,
  locale = "en",
}: {
  project: ProjectSummary;
  locale?: Locale;
}) {
  return (
    <>
      <div
        className="fallback-project-wrap"
        style={{
          marginRight: "auto",
          marginLeft: "auto",
          width: "calc(100% - var(--page-gutter) * 2)",
          marginTop: "var(--page-content-space)",
        }}
      >
        <h1 data-type-role="display"
          style={{
            marginBottom: "var(--space-4)",
          }}
        >
          {project.name}
        </h1>

        <p data-type-role="body" style={{ marginBottom: "var(--space-8)" }}>
          {project.client}
          {project.category ? ` / ${project.category}` : ""}
        </p>

        <Image
          className="template-media-frame"
          {...mediaAttributes({type:"image",src:project.coverImage,alt:project.name,width:project.coverWidth,height:project.coverHeight})}
          src={project.coverImage}
          alt={project.name}
          width={project.coverWidth}
          height={project.coverHeight}
          style={{ display: "block", width: "100%", height: "auto", marginBottom: "var(--space-8)" }}
        />

        <p data-type-role="body" style={{ maxWidth: "var(--fallback-content-max)", marginBottom: "var(--section-space)" }}>
          {fallbackCopy[locale]}
        </p>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .fallback-project-wrap {
            width: calc(100% - var(--page-gutter) * 2) !important;
          }
        }
      `}</style>
    </>
  );
}
