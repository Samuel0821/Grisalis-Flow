
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
          toast({ variant: 'destructive', title: 'Error', description: 'Wiki page not found.' });
          router.push('/wiki');
        }
      } catch (error) {
        console.error('Error fetching wiki page:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load page data.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPage();
  }, [pageId, router, toast]);

  const handleUpdatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !page) {
      toast({ variant: 'destructive', title: 'Authentication or page data missing' });
      return;
    }
    if (!title.trim() || !content.trim()) {
      toast({ variant: 'destructive', title: 'Title and content are required' });
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedPage = await updateWikiPage(page.id, { title, content }, { uid: user.uid, displayName: user.displayName });
      toast({ title: 'Success!', description: 'Wiki page updated.' });
      router.push(`/wiki/${updatedPage.slug}`);
    } catch (error) {
      console.error('Error updating wiki page:', error);
      toast({
        variant: 'destructive',
        title: 'Error updating page',
        description: 'Could not save the changes. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>
  }

  if (!page) {
    return <div className="text-center text-muted-foreground">Page not found.</div>
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Edit Wiki Article</h1>
        <p className="text-muted-foreground">Modify the content of the article.</p>
      </div>

      <form onSubmit={handleUpdatePage}>
        <Card>
          <CardHeader>
            <CardTitle>Article Editor</CardTitle>
            <CardDescription>Use markdown for formatting. Your previous version will be saved in history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
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
              <Link href={`/wiki/${page.slug}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
