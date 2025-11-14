
'use client';

import { useEffect, useState } from 'react';
import { getWikiPageBySlug, WikiPage, getWikiPageVersions, WikiPageVersion } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Edit, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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

    return <div className="prose dark:prose-invert max-w-none text-base" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

function HistoryDialog({ pageId }: { pageId: string }) {
    const [versions, setVersions] = useState<WikiPageVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVersion, setSelectedVersion] = useState<WikiPageVersion | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        if (isDialogOpen) {
            const fetchVersions = async () => {
                setLoading(true);
                try {
                    const versionData = await getWikiPageVersions(pageId);
                    setVersions(versionData);
                } catch (error) {
                    console.error("Failed to fetch page history", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchVersions();
        }
    }, [pageId, isDialogOpen]);

    return (
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setSelectedVersion(null); }}>
            <DialogTrigger asChild>
                <Button variant="outline"><History className="mr-2"/> View History</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Article History</DialogTitle>
                    <DialogDescription>Showing past versions of this article.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden">
                    <div className="col-span-1 flex flex-col border-r pr-4">
                        <h4 className="font-semibold mb-2">Versions</h4>
                        {loading ? <Loader2 className="animate-spin" /> : (
                            <ScrollArea className="flex-1">
                                <div className="flex flex-col gap-1">
                                {versions.map(version => (
                                    <Button
                                        key={version.versionId}
                                        variant={selectedVersion?.versionId === version.versionId ? "secondary" : "ghost"}
                                        className="justify-start h-auto py-2"
                                        onClick={() => setSelectedVersion(version)}
                                    >
                                        <div className="text-left">
                                            <p className="font-semibold">{format(version.updatedAt.toDate(), 'PPP p')}</p>
                                            <p className="text-xs text-muted-foreground">by {version.lastEditedBy.displayName || 'System'}</p>
                                        </div>
                                    </Button>
                                ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                    <div className="col-span-2 flex flex-col overflow-hidden">
                         <h4 className="font-semibold mb-2">
                           Version Preview
                         </h4>
                         <ScrollArea className="flex-1 border rounded-md bg-muted/50 p-4">
                            {selectedVersion ? (
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">{selectedVersion.title}</h2>
                                    <MarkdownRenderer content={selectedVersion.content} />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <p>Select a version to preview its content.</p>
                                </div>
                            )}
                         </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}


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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
         <Button variant="outline" asChild>
            <Link href="/wiki">
              &larr; Back to Wiki
            </Link>
          </Button>
          <div className="flex items-center gap-2">
             <HistoryDialog pageId={page.id} />
             <Button asChild>
                 <Link href={`/wiki/edit/${page.id}`}>
                     <Edit className="mr-2"/>
                     Edit Article
                 </Link>
             </Button>
          </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-4xl font-bold">{page.title}</CardTitle>
          <CardDescription>
            Last updated by {page.lastEditedBy?.displayName || 'System'} {page.updatedAt && formatDistanceToNow(page.updatedAt.toDate(), { addSuffix: true })}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <MarkdownRenderer content={page.content} />
        </CardContent>
      </Card>
    </div>
  );
}
