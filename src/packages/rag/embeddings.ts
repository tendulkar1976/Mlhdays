/**
 * Embedding Generator and Cosine Similarity Calculator
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getEnv } from '../../config/env.js';

export class EmbeddingService {
  private genAI: GoogleGenerativeAI | null = null;
  private embeddingModel: string;

  constructor() {
    const env = getEnv();
    this.embeddingModel = env.GEMINI_EMBEDDING_MODEL;
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'TEST_MOCK_GEMINI_API_KEY') {
      this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
  }

  /**
   * Compute cosine similarity between two numeric vectors
   */
  public cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generate text embedding via Gemini API or fallback deterministic bag-of-words vector
   */
  public async generateEmbedding(text: string): Promise<number[]> {
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: this.embeddingModel });
        const result = await model.embedContent(text);
        if (result.embedding?.values) {
          return result.embedding.values;
        }
      } catch (err) {
        // Fallback to local token representation if rate-limited or offline
      }
    }
    return this.generateDeterministicVector(text);
  }

  /**
   * Deterministic hash vectorizer fallback
   */
  public generateDeterministicVector(text: string, dimensions = 64): number[] {
    const vector = new Array(dimensions).fill(0);
    const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    for (const token of tokens) {
      if (!token) continue;
      let hash = 0;
      for (let i = 0; i < token.length; i++) {
        hash = (hash << 5) - hash + token.charCodeAt(i);
        hash |= 0;
      }
      const index = Math.abs(hash) % dimensions;
      vector[index] += 1;
    }
    // Normalize vector
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return norm > 0 ? vector.map(v => v / norm) : vector;
  }
}

export const embeddingService = new EmbeddingService();
