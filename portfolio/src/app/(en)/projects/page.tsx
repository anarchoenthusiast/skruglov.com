import { ProjectsPage } from "@/components/pages/ProjectsPage";
import { getPageMetadata } from "@/content/page-seo";
export const metadata = getPageMetadata("projects", "en");
export default function Page() { return <ProjectsPage locale="en" />; }
