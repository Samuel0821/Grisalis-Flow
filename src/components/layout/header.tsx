'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

function NotificationPanel() {
  // This is a placeholder. In the future, we'll fetch real notifications.
  const notifications: any[] = [];
  const hasUnread = notifications.some(n => !n.read);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4 font-medium border-b">
          <h4>Notifications</h4>
        </div>
        <div className="p-4 text-sm text-center text-muted-foreground">
          {notifications.length === 0
            ? 'You have no new notifications.'
            : 'Notification list will go here.'
            // We will map over notifications here in a future step.
            }
        </div>
        <div className="p-2 border-t text-center">
            <Button variant="link" size="sm">View all notifications</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}


const userAvatar = PlaceHolderImages.find((p) => p.id === 'user-avatar');

export function Header() {
  const { user } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await getAuth().signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <SidebarTrigger className="flex" />
      <div className="flex-1" />
      <div className="relative flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px]"
        />
      </div>
      <NotificationPanel />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="overflow-hidden rounded-full">
            <Avatar>
              <AvatarImage
                src={user?.photoURL || userAvatar?.imageUrl}
                alt="User avatar"
                data-ai-hint={userAvatar?.imageHint}
              />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">Configuración</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>Soporte</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Cerrar sesión</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

    