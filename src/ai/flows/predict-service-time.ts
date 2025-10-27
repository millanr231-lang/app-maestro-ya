'use server';

/**
 * @fileOverview An AI agent to predict the service time for a service request.
 *
 * - predictServiceTime - A function that predicts the service time for a service request.
 * - PredictServiceTimeInput - The input type for the predictServiceTime function.
 * - PredictServiceTimeOutput - The return type for the predictServiceTime function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictServiceTimeInputSchema = z.object({
  serviceType: z.string().describe('The type of service requested.'),
  location: z.string().describe('The location of the service.'),
  problemDescription: z.string().describe('A description of the problem.'),
  urgency: z.enum(['low', 'medium', 'high']).describe('The urgency of the service request.'),
  historicalData: z.string().optional().describe('Historical data of similar service requests, if available.'),
});
export type PredictServiceTimeInput = z.infer<typeof PredictServiceTimeInputSchema>;

const PredictServiceTimeOutputSchema = z.object({
  predictedServiceTime: z
    .string()
    .describe('The predicted service time in minutes, e.g., "60 minutes"'),
  confidenceLevel: z
    .string()
    .describe('A description of how confident the prediction is, e.g., "high", "medium", or "low" confidence.'),
});
export type PredictServiceTimeOutput = z.infer<typeof PredictServiceTimeOutputSchema>;

export async function predictServiceTime(input: PredictServiceTimeInput): Promise<PredictServiceTimeOutput> {
  return predictServiceTimeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictServiceTimePrompt',
  input: {schema: PredictServiceTimeInputSchema},
  output: {schema: PredictServiceTimeOutputSchema},
  prompt: `You are an AI assistant that predicts the service time required for a service request.
  Consider the following information to predict the service time:

  Service Type: {{{serviceType}}}
  Location: {{{location}}}
  Problem Description: {{{problemDescription}}}
  Urgency: {{{urgency}}}

  {% if historicalData %}
  Historical Data: {{{historicalData}}}
  {% endif %}

  Based on this information, predict the service time required and the confidence level of your prediction.  The output MUST be in the format specified by the schema.`,
});

const predictServiceTimeFlow = ai.defineFlow(
  {
    name: 'predictServiceTimeFlow',
    inputSchema: PredictServiceTimeInputSchema,
    outputSchema: PredictServiceTimeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
