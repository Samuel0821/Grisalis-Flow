'use server';
/**
 * @fileOverview An AI-powered smart summarization tool for lengthy documentation or project briefs.
 *
 * - smartSummarization - A function that handles the summarization process.
 * - SmartSummarizationInput - The input type for the smartSummarization function.
 * - SmartSummarizationOutput - The return type for the smartSummarization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartSummarizationInputSchema = z.object({
  text: z
    .string()
    .describe('The text to summarize. This could be a documentation page or project brief.'),
});
export type SmartSummarizationInput = z.infer<typeof SmartSummarizationInputSchema>;

const SmartSummarizationOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the input text.'),
});
export type SmartSummarizationOutput = z.infer<typeof SmartSummarizationOutputSchema>;

export async function smartSummarization(input: SmartSummarizationInput): Promise<SmartSummarizationOutput> {
  return smartSummarizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartSummarizationPrompt',
  input: {schema: SmartSummarizationInputSchema},
  output: {schema: SmartSummarizationOutputSchema},
  prompt: `You are an expert summarizer, able to distill key information from large blocks of text.

  Please provide a concise summary of the following text, identifying the most important elements and insights:

  {{text}}`,
});

const smartSummarizationFlow = ai.defineFlow(
  {
    name: 'smartSummarizationFlow',
    inputSchema: SmartSummarizationInputSchema,
    outputSchema: SmartSummarizationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
