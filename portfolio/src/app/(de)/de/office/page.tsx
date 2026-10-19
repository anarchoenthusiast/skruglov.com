import { OfficePage } from "@/components/pages/OfficePage";
import { getPageMetadata } from "@/content/page-seo";
export const metadata = getPageMetadata("office", "de");
export default function Page() { return <OfficePage locale="de" />; }
