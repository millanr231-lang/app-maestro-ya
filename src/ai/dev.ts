import { config } from 'dotenv';
config();

import './flows/predict-service-time.ts';
import './flows/suggest-knowledge-base-articles.ts';
import './flows/summarize-service-request.ts';
import './flows/generate-quote-message.ts';
