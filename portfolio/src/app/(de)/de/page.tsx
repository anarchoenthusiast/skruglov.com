import { HomePage } from "@/components/pages/HomePage";
import { getPageMetadata } from "@/content/page-seo";
export const metadata = getPageMetadata("home", "de");
export default function Page() { return <HomePage locale="de" />; }
