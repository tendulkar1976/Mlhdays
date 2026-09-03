import { GoogleGenerativeAI, GenerativeModel, EnhancedGenerateContentResponse, FunctionDeclaration } from '@google/generative-ai';
import { getEnv } from '../../config/env.js';

export class GeminiError extends Error {
  constructor(message: string, public statusCode?: number, public originalError?: unknown) {
    super(message);
    this.name = 'GeminiError';
  }
}

export class GeminiRateLimitError extends GeminiError {
  constructor(message = 'Gemini API Rate Limit Exceeded (429). Please retry after a brief moment.') {
    super(message, 429);
    this.name = 'GeminiRateLimitError';
  }
}

export class GeminiTimeoutError extends GeminiError {
  constructor(message = 'Gemini API request timed out.') {
    super(message, 408);
    this.name = 'GeminiTimeoutError';
  }
}

export class GeminiAuthError extends GeminiError {
  constructor(message = 'Invalid or missing GEMINI_API_KEY.') {
    super(message, 401);
    this.name = 'GeminiAuthError';
  }
}

export interface GeminiClientOptions {
  modelName?: string;
  timeoutMs?: number;
  maxRetries?: number;
  systemInstruction?: string;
  tools?: FunctionDeclaration[];
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI | null = null;
  private defaultModel: string;
  private defaultTimeoutMs: number;
  private maxRetries: number;

  constructor() {
    const env = getEnv();
    this.defaultModel = env.GEMINI_MODEL;
    this.defaultTimeoutMs = 25000;
    this.maxRetries = 3;

    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'TEST_MOCK_GEMINI_API_KEY') {
      this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
  }

  public getModel(options?: GeminiClientOptions): GenerativeModel {
    if (!this.genAI) {
      // In mock/test environments
      throw new GeminiAuthError('GEMINI_API_KEY is not configured or in test mock mode.');
    }

    const modelName = options?.modelName || this.defaultModel;
    return this.genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: options?.systemInstruction,
      tools: options?.tools ? [{ functionDeclarations: options.tools }] : undefined,
    });
  }

  public async generateWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = this.maxRetries,
    timeoutMs = this.defaultTimeoutMs
  ): Promise<T> {
    let attempt = 0;
    let delay = 1000;

    while (attempt < maxRetries) {
      attempt++;
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new GeminiTimeoutError(`Request exceeded ${timeoutMs}ms timeout.`)), timeoutMs)
        );

        return await Promise.race([operation(), timeoutPromise]);
      } catch (err: unknown) {
        const error = err as { status?: number; message?: string; code?: string };
        const isRateLimit = error.status === 429 || (error.message && error.message.includes('429')) || (error.message && error.message.toLowerCase().includes('quota'));
        const isTransient = error.status === 503 || error.status === 500 || (error.message && error.message.includes('temporarily unavailable'));

        if (isRateLimit && attempt < maxRetries) {
          const jitter = Math.random() * 500;
          await new Promise(r => setTimeout(r, delay + jitter));
          delay *= 2;
          continue;
        }

        if (isTransient && attempt < maxRetries) {
          await new Promise(r => setTimeout(r, delay));
          delay *= 1.5;
          continue;
        }

        if (isRateLimit) {
          throw new GeminiRateLimitError();
        }

        if (err instanceof GeminiTimeoutError) {
          throw err;
        }

        throw new GeminiError(
          error.message || 'Gemini API call failed',
          error.status || 500,
          err
        );
      }
    }

    throw new GeminiError('Maximum retry attempts exhausted.');
  }

  public isLiveClientAvailable(): boolean {
    return this.genAI !== null;
  }
}

export const geminiClient = new GeminiClient();
