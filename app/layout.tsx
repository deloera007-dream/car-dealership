import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { getPublicBranding } from "@/actions/settings/get-public-branding";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { SiteChrome } from "@/components/site-chrome";
import { DEALERSHIP_NAME } from "@/config/constants";
import { resolveIconHrefs } from "@/lib/branding/resolve-icon-hrefs";
import { prototypeMode } from "@/lib/prototype-mode";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Builds Next.js metadata from public branding data.
 *
 * Falls back to the configured dealership name when branding is missing and maps resolved icon URLs into the metadata icons field.
 *
 * @returns The page metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  if (prototypeMode)
    return {
      title: "Kavak Concept | Your next chapter",
      description: "A mobile car ownership prototype",
    };
  const branding = await getPublicBranding();
  const iconHrefs = resolveIconHrefs(branding);
  const name = branding.name || DEALERSHIP_NAME;

  return {
    title: {
      default: name,
      template: `%s | ${name}`,
    },
    description: `Find your Dream Car at ${name}`,
    icons: {
      icon: iconHrefs.map((href) => ({
        url: href,
      })),
    },
  };
}

/**
 * Renders the shared application shell.
 *
 * Provides Supabase and user context, then wraps the app route tree with the header, main content, footer, toast container, and sign-in modal.
 *
 * @param children Page content to render.
 * @returns The rendered root layout.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <SiteChrome
          header={prototypeMode ? null : <Header />}
          footer={<Footer />}
        >
          {children}
        </SiteChrome>
        <Toaster richColors />
      </body>
    </html>
  );
}
