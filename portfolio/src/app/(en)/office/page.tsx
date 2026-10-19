import { OfficePage } from "@/components/pages/OfficePage";
import { getPageMetadata } from "@/content/page-seo";
export const metadata = getPageMetadata("office", "en");
export default function Page() { return <OfficePage locale="en" />; }
