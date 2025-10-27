'use server';

/**
 * @fileOverview Suggests relevant knowledge base articles based on a service request description.
 *
 * - suggestKnowledgeBaseArticles - A function that suggests relevant articles from the knowledge base.
 * - SuggestKnowledgeBaseArticlesInput - The input type for the suggestKnowledgeBaseArticles function.
 * - SuggestKnowledgeBaseArticlesOutput - The return type for the suggestKnowledgeBaseArticles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestKnowledgeBaseArticlesInputSchema = z.object({
  serviceRequestDescription: z
    .string()
    .describe('The description of the service request.'),
});
export type SuggestKnowledgeBaseArticlesInput = z.infer<
  typeof SuggestKnowledgeBaseArticlesInputSchema
>;

const SuggestKnowledgeBaseArticlesOutputSchema = z.object({
  suggestedArticles: z
    .array(z.string())
    .describe(
      'An array of relevant knowledge base article titles or summaries.'
    ),
});
export type SuggestKnowledgeBaseArticlesOutput = z.infer<
  typeof SuggestKnowledgeBaseArticlesOutputSchema
>;

export async function suggestKnowledgeBaseArticles(
  input: SuggestKnowledgeBaseArticlesInput
): Promise<SuggestKnowledgeBaseArticlesOutput> {
  return suggestKnowledgeBaseArticlesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestKnowledgeBaseArticlesPrompt',
  input: {schema: SuggestKnowledgeBaseArticlesInputSchema},
  output: {schema: SuggestKnowledgeBaseArticlesOutputSchema},
  prompt: `You are an expert service technician. Based on the following service request description, suggest relevant articles from the knowledge base that could help the technician resolve the issue.\n\nService Request Description: {{{serviceRequestDescription}}}\n\nSuggested Articles (titles or summaries):`,
});

const suggestKnowledgeBaseArticlesFlow = ai.defineFlow(
  {
    name: 'suggestKnowledgeBaseArticlesFlow',
    inputSchema: SuggestKnowledgeBaseArticlesInputSchema,
    outputSchema: SuggestKnowledgeBaseArticlesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
