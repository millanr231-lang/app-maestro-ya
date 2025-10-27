
'use client';

import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Header } from "@/components/layout/header";
import { UserNav } from "@/components/layout/user-nav";
import { MaestroYaLogo } from "@/components/logo";
import { useUser, useDoc } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, createContext, useContext, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useFirestore } from "@/firebase";

// 1. Create a context to hold the user profile
export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  roles: string[];
};

interface DashboardContextType {
  userProfile: UserProfile | null;
  loadingProfile: boolean;
}

const DashboardContext = createContext<DashboardContextType>({
  userProfile: null,
  loadingProfile: true,
});

// 2. Create a hook to access the context
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardLayout");
  }
  return context;
};


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: loadingUser } = useUser();
  const router = useRouter();

  // This is the critical change. We ensure the path is only constructed
  // when we have a valid user.uid. useDoc will not run if the path is null.
  const userDocPath = useMemo(() => {
    return user?.uid ? `users/${user.uid}` : null;
  }, [user?.uid]);

  const { data: userProfile, loading: loadingProfile } = useDoc<UserProfile>(userDocPath);


  useEffect(() => {
    if (!loadingUser && !user) {
      router.push("/login");
    }
  }, [user, loadingUser, router]);

  const isLoading = loadingUser || loadingProfile;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!userProfile) {
     // This can happen briefly or if the user document doesn't exist
     // You might want a more robust handling here, like showing an error
     // or redirecting. For now, we show loading.
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Cargando perfil de usuario...</p>
            <p className="text-sm text-muted-foreground/50 mt-2">Si esto tarda, verifica las reglas de Firestore.</p>
        </div>
      </div>
    );
  }

  const contextValue = {
    userProfile,
    loadingProfile,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <Link href="/dashboard" className="flex items-center gap-2">
               <MaestroYaLogo className="w-8 h-8 text-primary" />
              <span className="font-headline text-xl font-semibold">MaestroYa</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter>
            <UserNav userProfile={userProfile}/>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <Header />
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </DashboardContext.Provider>
  );
}
