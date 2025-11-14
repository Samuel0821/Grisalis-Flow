import { SummarizerForm } from './summarizer-form';

export default function SummarizerPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          AI Smart Summarizer
        </h1>
        <p className="text-muted-foreground">
          Distill key information from large blocks of text using AI.
        </p>
      </div>
      <SummarizerForm />
    </div>
  );
}
