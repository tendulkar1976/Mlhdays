/**
 * Metadata-Filtered Hybrid RAG Retriever for Tax Knowledge
 */

import { STATUTORY_TAX_KNOWLEDGE_BASE, STATUTORY_DEADLINES } from './knowledge-base.js';
import { embeddingService } from './embeddings.js';
import { TaxKnowledgeChunk, TaxKnowledgeSearchFilter, StatutoryDeadline } from '../../types/shared.js';

export interface ScoredKnowledgeChunk {
  chunk: TaxKnowledgeChunk;
  relevanceScore: number; // 0.0 to 1.0
  matchedKeywords: string[];
}

export class TaxKnowledgeRetriever {
  private knowledgeBase: TaxKnowledgeChunk[];

  constructor(customKnowledge?: TaxKnowledgeChunk[]) {
    this.knowledgeBase = customKnowledge || STATUTORY_TAX_KNOWLEDGE_BASE;
  }

  /**
   * Search knowledge base with metadata filtering and relevance scoring
   */
  public async searchKnowledge(filter: TaxKnowledgeSearchFilter): Promise<ScoredKnowledgeChunk[]> {
    const query = filter.query.toLowerCase().trim();
    const queryTokens = query.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    const topK = filter.top_k || 3;

    // Filter by financial/assessment year if provided
    let candidateChunks = this.knowledgeBase;
    if (filter.financial_year) {
      candidateChunks = candidateChunks.filter(c => c.financial_year === filter.financial_year);
    }
    if (filter.assessment_year) {
      candidateChunks = candidateChunks.filter(c => c.assessment_year === filter.assessment_year);
    }
    if (filter.section_or_topic) {
      const secLower = filter.section_or_topic.toLowerCase();
      candidateChunks = candidateChunks.filter(c =>
        c.section_or_topic.toLowerCase().includes(secLower) || c.title.toLowerCase().includes(secLower)
      );
    }

    const queryVector = embeddingService.generateDeterministicVector(query);

    const scoredResults: ScoredKnowledgeChunk[] = [];

    for (const chunk of candidateChunks) {
      let score = 0;
      const matchedKeywords: string[] = [];

      // 1. Exact Section / Title matching boost
      const titleLower = chunk.title.toLowerCase();
      const sectionLower = chunk.section_or_topic.toLowerCase();
      const contentLower = chunk.content.toLowerCase();

      if (query.includes(sectionLower) || sectionLower.includes(query)) {
        score += 0.40;
      }

      // 2. Keyword overlap
      for (const kw of chunk.keywords) {
        if (query.includes(kw.toLowerCase())) {
          score += 0.25;
          matchedKeywords.push(kw);
        }
      }

      // 3. Token frequency
      let tokenMatches = 0;
      for (const token of queryTokens) {
        if (token.length > 2 && (contentLower.includes(token) || titleLower.includes(token))) {
          tokenMatches++;
        }
      }
      score += Math.min(0.20, (tokenMatches / Math.max(1, queryTokens.length)) * 0.20);

      // 4. Vector cosine similarity
      const chunkVector = embeddingService.generateDeterministicVector(`${chunk.title} ${chunk.content}`);
      const similarity = embeddingService.cosineSimilarity(queryVector, chunkVector);
      score += similarity * 0.15;

      const normalizedScore = Math.min(1.0, Math.max(0.0, score));
      if (normalizedScore > 0.10) {
        scoredResults.push({
          chunk,
          relevanceScore: Number(normalizedScore.toFixed(3)),
          matchedKeywords,
        });
      }
    }

    // Sort descending by relevance score
    scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return scoredResults.slice(0, topK);
  }

  /**
   * Search statutory deadlines
   */
  public getDeadlines(category?: string, year?: string): StatutoryDeadline[] {
    let deadlines = STATUTORY_DEADLINES;
    if (category) {
      deadlines = deadlines.filter(d => d.category.toLowerCase() === category.toLowerCase());
    }
    if (year) {
      deadlines = deadlines.filter(d => d.financial_year === year || d.assessment_year === year);
    }
    return deadlines;
  }
}

export const taxKnowledgeRetriever = new TaxKnowledgeRetriever();
