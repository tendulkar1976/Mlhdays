/**
 * AI Tax Copilot — Member 2: Gemini AI, RAG & Document Intelligence Subsystem
 * Entry point and public module exports
 */

export * from './types/shared.js';
export * from './config/env.js';
export * from './packages/ai/gemini-client.js';
export * from './packages/ai/prompts.js';
export * from './packages/ai/orchestrator.js';
export * from './packages/ai/tools/index.js';
export * from './packages/rag/knowledge-base.js';
export * from './packages/rag/retriever.js';
export * from './packages/rag/embeddings.js';
export * from './packages/tax-engine/deterministic-calculator.js';
export * from './packages/document-processing/confidence-evaluator.js';
export * from './packages/document-processing/form16-parser.js';
export * from './packages/document-processing/reconciliation-assistant.js';
