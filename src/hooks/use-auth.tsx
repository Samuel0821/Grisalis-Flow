'use client';

import {
  ReactNode,
  useEffect,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If we have a user, we can render the app.
  // The redirect logic inside useEffect will handle unauthenticated users.
  if (user) {
     return <>{children}</>;
  }

  // If there's no user and we are on the login page, allow rendering.
  if (!user && pathname === '/login') {
    return <>{children}</>;
  }

  return null;
}

    