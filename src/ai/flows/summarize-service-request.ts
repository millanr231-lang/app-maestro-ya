'use server';
/**
 * @fileOverview Summarizes the key details of a service request using AI.
 *
 * - summarizeServiceRequest - A function that summarizes a service request.
 * - SummarizeServiceRequestInput - The input type for the summarizeServiceRequest function.
 * - SummarizeServiceRequestOutput - The return type for the summarizeServiceRequest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeServiceRequestInputSchema = z.object({
  customerName: z.string().describe('The name of the customer requesting the service.'),
  serviceType: z.string().describe('The type of service requested (e.g., plumbing, electrical).'),
  problemDescription: z.string().describe('A detailed description of the problem reported by the customer.'),
  assignedTechnician: z.string().describe('The name of the technician assigned to the service request.'),
  requestDate: z.string().describe('The date the service request was submitted.'),
  priority: z.string().describe('The priority level of the service request (e.g., high, medium, low).'),
});
export type SummarizeServiceRequestInput = z.infer<typeof SummarizeServiceRequestInputSchema>;

const SummarizeServiceRequestOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the service request details.'),
});
export type SummarizeServiceRequestOutput = z.infer<typeof SummarizeServiceRequestOutputSchema>;

export async function summarizeServiceRequest(input: SummarizeServiceRequestInput): Promise<SummarizeServiceRequestOutput> {
  return summarizeServiceRequestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeServiceRequestPrompt',
  input: {schema: SummarizeServiceRequestInputSchema},
  output: {schema: SummarizeServiceRequestOutputSchema},
  prompt: `You are an AI assistant that summarizes service requests for a CRM system.

  Given the following details of a service request, create a concise summary that includes the customer's name, the service type, a brief description of the problem, and the assigned technician.

  Customer Name: {{{customerName}}}
  Service Type: {{{serviceType}}}
  Problem Description: {{{problemDescription}}}
  Assigned Technician: {{{assignedTechnician}}}
  Request Date: {{{requestDate}}}
  Priority: {{{priority}}}

  Summary:`,
});

const summarizeServiceRequestFlow = ai.defineFlow(
  {
    name: 'summarizeServiceRequestFlow',
    inputSchema: SummarizeServiceRequestInputSchema,
    outputSchema: SummarizeServiceRequestOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
