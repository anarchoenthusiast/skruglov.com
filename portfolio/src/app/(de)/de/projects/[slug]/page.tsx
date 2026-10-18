import type { Metadata } from "next";
import {
  generateProjectMetadata,
  generateStaticParams,
  ProjectPage,
} from "@/components/pages/ProjectPage";

interface GermanProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export { generateStaticParams };
export const dynamicParams = false;

export async function generateMetadata({ params }: GermanProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateProjectMetadata({ slug, locale: "de" });
}

export default function GermanProjectRoute({ params }: GermanProjectPageProps) {
  return <ProjectPage locale="de" params={params} />;
}
