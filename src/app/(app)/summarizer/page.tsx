
import { SummarizerForm } from './summarizer-form';

export default function SummarizerPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Resumidor Inteligente con IA
        </h1>
        <p className="text-muted-foreground">
          Extrae la información clave de grandes bloques de texto usando IA.
        </p>
      </div>
      <SummarizerForm />
    </div>
  );
}
