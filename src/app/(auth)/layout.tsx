import React from "react";
import Link from 'next/link';
import { MaestroYaLogo } from '@/components/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Link href="/" className="absolute top-4 left-4 flex items-center gap-2 text-foreground">
        <MaestroYaLogo className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold">MaestroYa CRM</span>
      </Link>
      {children}
    </div>
  );
}
