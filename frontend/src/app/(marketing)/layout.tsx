import { MobileActionBar } from "@/components/site/MobileActionBar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      {/* Bottom padding clears the mobile action bar. */}
      <main id="main" className="flex-1 pb-20 lg:pb-0">
        {children}
      </main>
      <SiteFooter />
      <MobileActionBar />
    </div>
  );
}
