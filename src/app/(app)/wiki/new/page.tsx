
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
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }
    if (!title.trim() || !content.trim()) {
      toast({ variant: 'destructive', title: 'Title and content are required' });
      return;
    }

    setIsSubmitting(true);
    try {
      const newPage = await createWikiPage({
        title,
        content,
        createdBy: user.uid,
      });
      toast({ title: 'Success!', description: 'Wiki page created.' });
      router.push(`/wiki/${newPage.slug}`);
    } catch (error) {
      console.error('Error creating wiki page:', error);
      toast({
        variant: 'destructive',
        title: 'Error creating page',
        description: 'Could not create the wiki page. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Create New Wiki Article</h1>
        <p className="text-muted-foreground">Share your knowledge with the team.</p>
      </div>

      <form onSubmit={handleCreatePage}>
        <Card>
          <CardHeader>
            <CardTitle>Article Editor</CardTitle>
            <CardDescription>Use markdown for formatting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="E.g., How to set up the development environment"
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
                placeholder="Write your article content here. Markdown is supported."
                value={content}
                onChange={(e) => setContent(e.g.target.value)}
                disabled={isSubmitting}
                required
                rows={15}
                className="font-code"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/wiki">Cancel</Link>
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
                  Save Article
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
