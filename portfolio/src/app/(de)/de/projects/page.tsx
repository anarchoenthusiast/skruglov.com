import { ProjectsPage } from "@/components/pages/ProjectsPage";
import { getPageMetadata } from "@/content/page-seo";
export const metadata = getPageMetadata("projects", "de");
export default function Page() { return <ProjectsPage locale="de" />; }
