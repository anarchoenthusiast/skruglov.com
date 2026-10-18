import { ContactPage } from "@/components/ContactPage";
import { getPageMetadata } from "@/content/page-seo";
export const metadata = getPageMetadata("contact", "de");
export default function Page() { return <ContactPage locale="de" />; }
