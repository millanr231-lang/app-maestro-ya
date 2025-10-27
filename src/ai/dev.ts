import { config } from 'dotenv';
config();

import '@/ai/flows/predict-service-time.ts';
import '@/ai/flows/suggest-knowledge-base-articles.ts';
import '@/ai/flows/summarize-service-request.ts';
import '@/ai/flows/generate-quote-message.ts';
