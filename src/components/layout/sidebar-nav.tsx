
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
  { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { href: '/projects', icon: Briefcase, label: 'Projects' },
  { href: '/bugs', icon: Bug, label: 'Bugs' },
  { href: '/timesheet', icon: Clock, label: 'Timesheet' },
  { href: '/reports', icon: BarChart, label: 'Reports' },
  { href: '/wiki', icon: BookText, label: 'Wiki' },
  { href: '/summarizer', icon: Sparkles, label: 'AI Summarizer' },
  { href: '/audit', icon: ShieldCheck, label: 'Audit Log' },
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
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  as="a"
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
            <Link href="/settings" passHref legacyBehavior>
              <SidebarMenuButton
                as="a"
                isActive={pathname === '/settings'}
                tooltip={{ children: 'Settings', side: 'right' }}
              >
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
