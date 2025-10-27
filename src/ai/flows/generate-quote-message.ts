
'use server';
/**
 * @fileOverview Generates a customer-facing message for a service quote.
 *
 * - generateQuoteMessage - A function that creates a professional message for a quote.
 * - GenerateQuoteMessageInput - The input type for the function.
 * - GenerateQuoteMessageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


const QuoteItemSchema = z.object({
  description: z.string().describe('Description of the material or labor.'),
  quantity: z.number().describe('The quantity of the item.'),
  price: z.number().describe('The unit price of the item.'),
});

const GenerateQuoteMessageInputSchema = z.object({
  customerName: z.string().describe('The name of the customer.'),
  serviceRequestId: z.string().describe('The unique ID of the original service request.'),
  serviceAddress: z.string().optional().describe('The address for the service.'),
  serviceType: z.string().optional().describe('The type of service.'),
  urgency: z.string().optional().describe('The urgency level of the service.'),
  problemDescription: z.string().optional().describe('The problem description reported by the customer.'),
  quoteId: z.string().describe('The unique ID of the quote.'),
  items: z.array(QuoteItemSchema).describe('An array of items included in the quote.'),
  subtotal: z.number(),
  vatAmount: z.number(),
  vatPercentage: z.number(),
  totalAmount: z.number().describe('The total amount of the quote.'),
  validUntil: z.string().describe('The expiration date of the quote in ISO format.'),
  technicianName: z.string().describe('The name of the technician creating the quote.'),
});

export type GenerateQuoteMessageInput = z.infer<
  typeof GenerateQuoteMessageInputSchema
>;

const GenerateQuoteMessageOutputSchema = z.object({
  message: z
    .string()
    .describe(
      'A friendly, professional, and well-formatted message ready to be sent to the customer via WhatsApp or email.'
    ),
});
export type GenerateQuoteMessageOutput = z.infer<
  typeof GenerateQuoteMessageOutputSchema
>;

export async function generateQuoteMessage(
  input: GenerateQuoteMessageInput
): Promise<GenerateQuoteMessageOutput> {
  return generateQuoteMessageFlow(input);
}

const generateQuoteMessageFlow = ai.defineFlow(
  {
    name: 'generateQuoteMessageFlow',
    inputSchema: GenerateQuoteMessageInputSchema,
    outputSchema: GenerateQuoteMessageOutputSchema,
  },
  async input => {
    
    const handlebarsContext = {
      ...input,
      items: input.items.map(item => ({
        ...item,
        totalLine: (item.quantity * item.price).toFixed(2),
      })),
      subtotal: input.subtotal.toFixed(2),
      vatAmount: input.vatAmount.toFixed(2),
      totalAmount: input.totalAmount.toFixed(2),
      validUntil: format(new Date(input.validUntil), "PPP", { locale: es }),
      serviceType: input.serviceType || 'No especificado',
      urgency: input.urgency || 'No especificada',
      problemDescription: input.problemDescription || 'No especificado',
    };
    
    const prompt = ai.definePrompt({
        name: 'generateQuoteMessagePrompt',
        input: {schema: z.any()},
        output: {schema: GenerateQuoteMessageOutputSchema},
        prompt: `You are an expert assistant for a technical services company called "MaestroYa". Your task is to generate a clear, friendly, and professional message for a customer based on a service quote.

The message MUST be in Spanish and formatted for easy readability on WhatsApp, using markdown for bolding and italics.

Here is the template to follow exactly:

🔧 *COTIZACIÓN DE SERVICIO*

Estimado/a {{{customerName}}},

Le presentamos la cotización solicitada para el servicio N° {{{serviceRequestId}}} con la siguiente información:

📍 *Dirección:* {{{serviceAddress}}}
⚙️ *Descripción del servicio:* {{{serviceType}}}
🚨 *Nivel de urgencia:* {{{urgency}}}
📝 *Problema reportado:* {{{problemDescription}}}

🛠️ *Detalle de cotización:*
{{#each items}}
- {{{quantity}}} x {{{description}}} — \${{{price}}} cada uno — Subtotal: \${{{totalLine}}}
{{/each}}

💵 *Resumen de montos:*
Subtotal: \${{{subtotal}}}
IVA ({{{vatPercentage}}}%): \${{{vatAmount}}}
*TOTAL*: \${{{totalAmount}}}

🗓️ *Vigencia de esta cotización:* {{{validUntil}}}

✅ *Incluye garantía de satisfacción y materiales certificados.*
🔄 Si tiene dudas o desea hacer cambios, por favor comuníquese antes de la fecha de vigencia.

⚠️ *¿Cómo proceder?*
Responda este mismo mensaje para aprobar, rechazar o solicitar ajustes. Una vez aceptada, coordinaremos fecha y hora.

¡Gracias por confiar en MaestroYa CRM!
📞 Contacto técnico: {{{technicianName}}}

_MaestroYa CRM – Servicios Técnicos Garantizados_

Generate the message now based on the structure and data provided. Ensure all fields are filled, using "No especificado" if a value is missing.
`,
    });


    const {output} = await prompt(handlebarsContext);
    return output!;
  }
);
