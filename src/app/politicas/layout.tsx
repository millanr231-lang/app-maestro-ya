
'use client';

import { MaestroYaLogo } from "@/components/logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PoliticasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <MaestroYaLogo className="h-8 w-8 text-primary" />
            <span className="font-bold text-lg">MaestroYa CRM</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 py-12">
        <div className="container">
          <div className="mb-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
          {children}
        </div>
      </main>
      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex items-center gap-2">
            <MaestroYaLogo className="h-6 w-6 text-primary" />
            <p className="text-sm text-foreground/80">
              &copy; {new Date().getFullYear()} MaestroYa CRM. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
