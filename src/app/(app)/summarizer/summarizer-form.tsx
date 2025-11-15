
'use client';
import { useState } from 'react';
import {
  smartSummarization,
  type SmartSummarizationOutput,
} from '@/ai/flows/ai-smart-summarization-tool';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export function SummarizerForm() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<SmartSummarizationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const summary = await smartSummarization({ text });
      setResult(summary);
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
      toast({
        variant: 'destructive',
        title: 'Falló la Sumarización',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="shadow-lg">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Resumidor Inteligente</CardTitle>
            <CardDescription>
              Pega tu documentación o brief de proyecto a continuación para obtener un
              resumen conciso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full gap-2">
              <Label htmlFor="text-input" className="sr-only">
                Tu Texto
              </Label>
              <Textarea
                id="text-input"
                placeholder="Pega tu texto aquí..."
                className="min-h-[300px] text-base font-code"
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || !text.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resumiendo...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Resumir
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-lg flex flex-col">
        <CardHeader>
          <CardTitle>Resumen Generado</CardTitle>
          <CardDescription>
            El resumen generado por IA aparecerá a continuación.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          {isLoading && (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {result && (
            <div className="space-y-4 text-sm text-foreground">
              <p className="leading-relaxed">{result.summary}</p>
            </div>
          )}
          {!isLoading && !result && (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-center text-muted-foreground">
              <p>Tu resumen está esperando ser generado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
