
'use client';

import {
  Briefcase,
  Bug,
  Clock,
  BookText,
  LayoutGrid,
  Sparkles,
  Settings,
  BarChart,
  ShieldCheck,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import { Logo } from '@/components/icons/logo';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Panel' },
  { href: '/projects', icon: Briefcase, label: 'Proyectos' },
  { href: '/bugs', icon: Bug, label: 'Bugs' },
  { href: '/timesheet', icon: Clock, label: 'Horas' },
  { href: '/reports', icon: BarChart, label: 'Informes' },
  { href: '/wiki', icon: BookText, label: 'Wiki' },
  { href: '/summarizer', icon: Sparkles, label: 'Resumidor IA' },
  { href: '/audit', icon: ShieldCheck, label: 'Auditoría' },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-sidebar-primary" />
          <span className="font-headline text-xl font-semibold text-sidebar-foreground">
            Grisalis
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{ children: item.label, side: 'right' }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Separator className="my-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/settings" passHref>
              <SidebarMenuButton
                isActive={pathname === '/settings'}
                tooltip={{ children: 'Configuración', side: 'right' }}
              >
                <Settings />
                <span>Configuración</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
