import { PrivacyPage } from "@/components/LegalPage";
import { getPageMetadata } from "@/content/page-seo";
export const metadata = getPageMetadata("privacy", "de");
export default function Page() { return <PrivacyPage locale="de" />; }
