
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getWikiPages, WikiPage } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, PlusCircle, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function WikiPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchPages = async () => {
        setIsLoading(true);
        try {
          const wikiPages = await getWikiPages();
          setPages(wikiPages);
        } catch (error) {
          console.error('Error fetching wiki pages:', error);
          toast({
            variant: 'destructive',
            title: 'Error al cargar las páginas del wiki',
            description: 'No se pudieron cargar las páginas del wiki. Por favor, inténtalo de nuevo.',
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchPages();
    }
  }, [user, toast]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-headline text-3xl font-bold tracking-tight">Wiki Interna</h1>
          <p className="text-muted-foreground">La base de conocimientos central de tu equipo.</p>
        </div>
        <Button asChild>
          <Link href="/wiki/new">
            <PlusCircle className="mr-2" />
            Crear Artículo
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : pages.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Link href={`/wiki/${page.slug}`} key={page.id} className="block hover:shadow-lg transition-shadow rounded-lg">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span>{page.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                   <p className="text-sm text-muted-foreground line-clamp-3">
                     {page.content.substring(0, 150) || 'Sin vista previa de contenido.'}
                   </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <h2 className="text-lg font-semibold">Aún no hay artículos</h2>
            <p className="text-sm">¡Crea el primer artículo para empezar a construir tu base de conocimientos!</p>
          </div>
        </div>
      )}
    </div>
  );
}
