
'use client';

import { useEffect, useState } from 'react';
import { getWikiPageBySlug, WikiPage } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Basic markdown to HTML renderer
const MarkdownRenderer = ({ content }: { content: string }) => {
    // This is a very basic renderer for demonstration.
    // For a real app, you'd want a more robust library like 'react-markdown'.
    const htmlContent = content
        .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold my-4">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold my-3">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold my-2">$1</h3>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/`([^`]+)`/gim, '<code class="bg-muted text-foreground font-code px-1 rounded">$1</code>')
        .replace(/\n/g, '<br />');

    return <div className="prose" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};


export default function WikiArticlePage({ params }: { params: { slug: string } }) {
  const { user } = useAuth();
  const [page, setPage] = useState<WikiPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && params.slug) {
      const fetchPage = async () => {
        setLoading(true);
        try {
          const pageData = await getWikiPageBySlug(params.slug);
          if (pageData) {
            setPage(pageData);
          } else {
            setError('Article not found.');
          }
        } catch (e) {
          console.error(e);
          setError('An error occurred while loading the article.');
        } finally {
          setLoading(false);
        }
      };
      fetchPage();
    }
  }, [user, params.slug]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!page) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
       <Button variant="outline" className="w-fit" asChild>
          <Link href="/wiki">
            &larr; Back to Wiki
          </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-4xl font-bold">{page.title}</CardTitle>
          <CardDescription>
            Last updated on {page.updatedAt && format(page.updatedAt.toDate(), 'PPP')}
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none text-base">
            <MarkdownRenderer content={page.content} />
        </CardContent>
      </Card>
    </div>
  );
}

