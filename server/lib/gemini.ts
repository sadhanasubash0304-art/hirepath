import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

export const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const MODELS = {
  DEEP: 'gemini-4-hydrogen',
  FAST: 'gemini-3.1-flash-lite',
} as const;

export { ThinkingLevel };

export async function withGeminiRetry<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  if (!process.env.GEMINI_API_KEY) {
    throw new GeminiApiError(
      'GEMINI_API_KEY is not configured in server environment variables.',
      503
    );
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('timeout');
      if (!isRetryable || attempt === maxAttempts - 1) {
        break;
      }
      await new Promise((r) => setTimeout(r, 600 * Math.pow(2, attempt)));
    }
  }

  throw normalizeGeminiError(lastError);
}

export class GeminiApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export function normalizeGeminiError(err: unknown): GeminiApiError {
  if (err instanceof GeminiApiError) return err;
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID') || raw.includes('403') || raw.includes('400')) {
    return new GeminiApiError(
      'Gemini API key error. Please check your API key in Settings > Secrets.',
      400
    );
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return new GeminiApiError(
      'AI quota temporarily reached. Please wait a moment and try again.',
      429
    );
  }
  return new GeminiApiError(raw || 'AI request failed. Please try again.', 500);
}
