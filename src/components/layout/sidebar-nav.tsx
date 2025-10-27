'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  Wrench,
  Users,
  HardHat,
  BookOpen,
  BarChart2,
  DollarSign,
  Shield,
  Settings,
  LucideIcon,
  FileText,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/app/dashboard/layout';

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  roles: string[]; // Roles that can see this item
};

const allNavItems: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Inicio', roles: ['SuperAdmin', 'Gerente', 'Dispatcher', 'Técnico', 'Cliente', 'Maestro', 'Auditor', 'AdministradorClientes'] },
  { href: '/dashboard/servicios', icon: Wrench, label: 'Servicios', roles: ['SuperAdmin', 'Gerente', 'Dispatcher', 'Técnico', 'Cliente'] },
  { href: '/dashboard/cotizaciones', icon: FileText, label: 'Cotizaciones', roles: ['SuperAdmin', 'Gerente', 'Técnico'] },
  { href: '/dashboard/clientes', icon: Users, label: 'Clientes', roles: ['SuperAdmin', 'Gerente', 'Dispatcher', 'AdministradorClientes'] },
  { href: '/dashboard/tecnicos', icon: HardHat, label: 'Técnicos', roles: ['SuperAdmin', 'Gerente', 'Dispatcher'] },
  { href: '/dashboard/conocimiento', icon: BookOpen, label: 'Conocimiento', roles: ['SuperAdmin', 'Gerente', 'Dispatcher', 'Técnico', 'Maestro'] },
  { href: '/dashboard/reportes', icon: BarChart2, label: 'Reportes', roles: ['SuperAdmin', 'Gerente', 'Auditor'] },
  { href: '/dashboard/facturacion', icon: DollarSign, label: 'Facturación', roles: ['SuperAdmin', 'Gerente'] },
  { href: '/dashboard/auditoria', icon: History, label: 'Auditoría', roles: ['SuperAdmin', 'Gerente', 'Auditor'] },
];

const settingsItem: NavItem = {
  href: '/dashboard/configuracion',
  icon: Settings,
  label: 'Configuración',
  roles: ['SuperAdmin', 'Gerente'],
};

export function SidebarNav() {
  const pathname = usePathname();
  const { userProfile } = useDashboard();
  const { setOpenMobile } = useSidebar();
  
  // Fallback to 'Cliente' role if roles array is not present or empty
  const userRoles = userProfile?.roles && userProfile.roles.length > 0 ? userProfile.roles : ['Cliente'];

  const canSee = (item: NavItem) => {
    // Super Admin can see everything
    if (userRoles.includes('SuperAdmin')) return true;
    // Check if user has at least one of the required roles
    return item.roles.some(role => userRoles.includes(role));
  };
  
  const visibleNavItems = allNavItems.filter(canSee);
  const canSeeSettings = canSee(settingsItem);

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <div className="flex flex-col justify-between flex-1">
      <SidebarMenu className="p-2">
        {visibleNavItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              className={cn(
                'group-data-[collapsible=icon]:justify-center'
              )}
              tooltip={{ children: item.label }}
              onClick={handleLinkClick}
            >
              <Link href={item.href}>
                <item.icon className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">
                  {item.label}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      
      <div className="mt-auto p-2">
         <SidebarMenu>
            {canSeeSettings && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === settingsItem.href}
                  className={cn('group-data-[collapsible=icon]:justify-center')}
                  tooltip={{ children: settingsItem.label }}
                  onClick={handleLinkClick}
                >
                  <Link href={settingsItem.href}>
                    <settingsItem.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {settingsItem.label}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
         </SidebarMenu>
      </div>
    </div>
  );
}
