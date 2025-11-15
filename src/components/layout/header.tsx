
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
import { Bell, Search, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Notification, getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

function NotificationPanel() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      const unsubscribe = getNotifications(user.uid, (newNotifications) => {
        setNotifications(newNotifications);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const hasUnread = notifications.some(n => !n.read);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markNotificationAsRead(id);
  };
  
  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.uid);
  }

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
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-4 font-medium border-b">
          <h4>Notificaciones</h4>
          {hasUnread && <Button variant="link" size="sm" onClick={handleMarkAllAsRead}>Marcar todas como leídas</Button>}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
             <div className="p-4 text-sm text-center text-muted-foreground">
                No tienes notificaciones nuevas.
             </div>
          ) : (
             <div className="divide-y">
              {notifications.map(n => (
                <div key={n.id} className={cn("p-4 hover:bg-muted/50", !n.read && "bg-primary/5")}>
                    <Link href={n.link} className="block">
                       <div className="flex items-start gap-3">
                         <div className="flex-shrink-0 pt-1">
                            <div className={cn("h-2.5 w-2.5 rounded-full", n.read ? "bg-transparent" : "bg-primary")}></div>
                         </div>
                         <div className="flex-1">
                            <p className="text-sm">{n.message}</p>
                             <p className="text-xs text-muted-foreground mt-1">
                               {n.createdAt && formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true, locale: es })}
                            </p>
                         </div>
                         {!n.read && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleMarkAsRead(n.id, e)} title="Marcar como leída">
                               <Mail className="h-4 w-4"/>
                            </Button>
                         )}
                       </div>
                    </Link>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t text-center">
            <Button variant="link" size="sm" disabled>Ver todas las notificaciones</Button>
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
          placeholder="Buscar..."
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
                alt="Avatar de usuario"
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
