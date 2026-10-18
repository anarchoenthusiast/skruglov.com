import { ProjectPage, generateProjectMetadata } from "@/components/pages/ProjectPage";
import { getPublishedProjects } from "@/lib/content";
export const dynamicParams = false;
export function generateStaticParams() { return getPublishedProjects().map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { return generateProjectMetadata(await params); }
export default function Project({ params }: { params: Promise<{ slug: string }> }) { return <ProjectPage params={params} />; }
