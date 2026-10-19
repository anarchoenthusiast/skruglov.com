import "../globals.css";
import type { ReactNode } from "react";
import { SiteDocument } from "@/components/SiteDocument";
import { buildMetadata } from "@/content/site";
export const metadata = buildMetadata({ path: "/" });
export default function Layout({ children }: { children: ReactNode }) { return <SiteDocument locale="en">{children}</SiteDocument>; }
