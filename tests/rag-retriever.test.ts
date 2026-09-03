import { describe, it, expect } from 'vitest';
import { taxKnowledgeRetriever } from '../src/packages/rag/retriever.js';

describe('Tax Knowledge RAG & Retriever', () => {
  it('should retrieve Section 87A rebate rules when queried about rebate or zero tax', async () => {
    const results = await taxKnowledgeRetriever.searchKnowledge({
      query: 'Section 87A rebate zero tax up to 12 lakh',
      financial_year: '2025-2026',
    });

    expect(results.length).toBeGreaterThan(0);
    const topResult = results[0];
    expect(topResult.chunk.section_or_topic).toContain('87A');
    expect(topResult.chunk.financial_year).toBe('2025-2026');
    expect(topResult.relevanceScore).toBeGreaterThan(0.3);
  });

  it('should filter knowledge by section and assessment year', async () => {
    const results = await taxKnowledgeRetriever.searchKnowledge({
      query: 'standard deduction limit',
      section_or_topic: 'Section 16(ia)',
      assessment_year: '2026-2027',
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].chunk.content).toContain('75,000');
  });

  it('should return official statutory deadlines for ITR filing and advance tax', () => {
    const itrDeadlines = taxKnowledgeRetriever.getDeadlines('ITR_FILING');
    expect(itrDeadlines.length).toBe(1);
    expect(itrDeadlines[0].due_date).toBe('2026-07-31');

    const advanceTaxDeadlines = taxKnowledgeRetriever.getDeadlines('ADVANCE_TAX');
    expect(advanceTaxDeadlines.length).toBe(4);
  });
});
