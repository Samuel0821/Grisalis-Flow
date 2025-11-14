
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
    // If not loading and no user, redirect to login, unless already on login or signup page.
    if (!isUserLoading && !user && pathname !== '/login' && pathname !== '/signup') {
      router.push('/login');
    }
    // If user is logged in and tries to access login/signup, redirect to dashboard.
    if (!isUserLoading && user && (pathname === '/login' || pathname === '/signup')) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router, pathname]);

  // While checking auth state, show a loader.
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If there's a user, render the children.
  if (user) {
     return <>{children}</>;
  }

  // If no user and on a public route, allow rendering.
  if (!user && (pathname === '/login' || pathname === '/signup')) {
    return <>{children}</>;
  }

  // Otherwise, render nothing to avoid flicker during redirect.
  return null;
}

export const useAuth = () => {
    return useUser();
}
