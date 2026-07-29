import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Starfield } from "@/components/starfield";

export default function FlatLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Starfield />
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
