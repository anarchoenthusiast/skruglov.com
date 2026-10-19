import { ImpressumPage } from "@/components/LegalPage";
import { getPageMetadata } from "@/content/page-seo";
export const metadata = getPageMetadata("imprint", "en");
export default function Page() { return <ImpressumPage locale="en" />; }
