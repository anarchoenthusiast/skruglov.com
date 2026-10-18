import { ContactPage } from "@/components/ContactPage";
import { getPageMetadata } from "@/content/page-seo";
export const metadata = getPageMetadata("contact", "en");
export default function Page() { return <ContactPage locale="en" />; }
