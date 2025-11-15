
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getWikiPageById, updateWikiPage, WikiPage } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function EditWikiPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pageId = params.id as string;
  const { toast } = useToast();

  const [page, setPage] = useState<WikiPage | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!pageId) return;
    const fetchPage = async () => {
      setIsLoading(true);
      try {
        const pageData = await getWikiPageById(pageId);
        if (pageData) {
          setPage(pageData);
          setTitle(pageData.title);
          setContent(pageData.content);
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Página de wiki no encontrada.' });
          router.push('/wiki');
        }
      } catch (error) {
        console.error('Error fetching wiki page:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos de la página.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPage();
  }, [pageId, router, toast]);

  const handleUpdatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !page) {
      toast({ variant: 'destructive', title: 'Faltan datos de autenticación o de página' });
      return;
    }
    if (!title.trim() || !content.trim()) {
      toast({ variant: 'destructive', title: 'Título y contenido son requeridos' });
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedPage = await updateWikiPage(page.id, { title, content }, { uid: user.uid, displayName: user.displayName });
      toast({ title: '¡Éxito!', description: 'Página de wiki actualizada.' });
      router.push(`/wiki/${updatedPage.slug}`);
    } catch (error) {
      console.error('Error updating wiki page:', error);
      toast({
        variant: 'destructive',
        title: 'Error al actualizar la página',
        description: 'No se pudieron guardar los cambios. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>
  }

  if (!page) {
    return <div className="text-center text-muted-foreground">Página no encontrada.</div>
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Editar Artículo de Wiki</h1>
        <p className="text-muted-foreground">Modifica el contenido del artículo.</p>
      </div>

      <form onSubmit={handleUpdatePage}>
        <Card>
          <CardHeader>
            <CardTitle>Editor de Artículo</CardTitle>
            <CardDescription>Usa markdown para el formato. Tu versión anterior se guardará en el historial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Contenido</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
                required
                rows={15}
                className="font-code"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href={`/wiki/${page.slug}`}>Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
