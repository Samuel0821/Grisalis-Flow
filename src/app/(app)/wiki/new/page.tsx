
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createWikiPage } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function NewWikiPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'No autenticado' });
      return;
    }
    if (!title.trim() || !content.trim()) {
      toast({ variant: 'destructive', title: 'Título y contenido son requeridos' });
      return;
    }

    setIsSubmitting(true);
    try {
      const newPage = await createWikiPage({
        title,
        content,
        createdBy: user.uid,
      }, { uid: user.uid, displayName: user.displayName });
      toast({ title: '¡Éxito!', description: 'Página de wiki creada.' });
      router.push(`/wiki/${newPage.slug}`);
    } catch (error) {
      console.error('Error creating wiki page:', error);
      toast({
        variant: 'destructive',
        title: 'Error al crear la página',
        description: 'No se pudo crear la página de wiki. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Crear Nuevo Artículo de Wiki</h1>
        <p className="text-muted-foreground">Comparte tu conocimiento con el equipo.</p>
      </div>

      <form onSubmit={handleCreatePage}>
        <Card>
          <CardHeader>
            <CardTitle>Editor de Artículo</CardTitle>
            <CardDescription>Usa markdown para el formato.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Ej: Cómo configurar el entorno de desarrollo"
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
                placeholder="Escribe el contenido de tu artículo aquí. Se soporta Markdown."
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
              <Link href="/wiki">Cancelar</Link>
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
                  Guardar Artículo
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
