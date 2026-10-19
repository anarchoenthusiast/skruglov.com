import { HomePage } from "@/components/pages/HomePage";
import { getPageMetadata } from "@/content/page-seo";
export const metadata = getPageMetadata("home", "en");
export default function Page() { return <HomePage locale="en" />; }
