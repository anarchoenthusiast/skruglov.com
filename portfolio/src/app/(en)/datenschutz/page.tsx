import { PrivacyPage } from "@/components/LegalPage";
import { getPageMetadata } from "@/content/page-seo";
export const metadata = getPageMetadata("privacy", "en");
export default function Page() { return <PrivacyPage locale="en" />; }
