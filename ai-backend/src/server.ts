import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const TAX_ENGINE_URL = process.env.TAX_ENGINE_URL || 'http://localhost:3000';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors({ origin: '*' }));
app.use(express.json());

// 1. Health check
app.get('/health', (req, res) => {
  res.json({ service: 'ai-backend', status: 'OK', port: PORT, taxEngineUrl: TAX_ENGINE_URL });
});

// 2. Document Extraction & Conflict Detection (AIS vs Form 16)
app.post('/api/v1/ai/extract', async (req, res) => {
  try {
    const { documentType, declaredInterest, declaredSalary } = req.body;

    const docType = documentType || 'AIS_TIS';
    const declaredInt = declaredInterest ?? 12000;
    const declaredSal = declaredSalary ?? 1475000;

    // Simulate authoritative AIS extraction
    const aisInterest = 18500;
    const aisSalary = 1475000;
    const conflicts: any[] = [];

    if (declaredInt !== aisInterest) {
      conflicts.push({
        factKey: 'savings_interest',
        category: 'OTHER_SOURCES',
        userDeclared: declaredInt,
        extractedValue: aisInterest,
        source: 'AIS / Form 26AS (HDFC Bank)',
        status: 'CONFLICT',
        message: `AIS reports ₹${aisInterest.toLocaleString('en-IN')} savings interest from HDFC Bank, but Tax Twin records ₹${declaredInt.toLocaleString('en-IN')}. Reconciliation required.`,
      });
    }

    res.json({
      documentId: 'doc-' + Date.now(),
      documentType: docType,
      confidenceScore: 0.985,
      extractedFacts: {
        salaryGross: aisSalary,
        savingsInterest: aisInterest,
        tdsDeducted: 85000,
        tan: 'BLRT12345A',
      },
      conflictsDetected: conflicts,
      needsUserReconciliation: conflicts.length > 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Extraction failed', message: error.message });
  }
});

// 3. Reconciliation Action -> Triggers Member 1 Tax Twin Version Fork
app.post('/api/v1/ai/reconcile', async (req, res) => {
  try {
    const { taxTwinId, factKey, acceptedValue, reason } = req.body;

    if (!taxTwinId || !factKey || acceptedValue === undefined) {
      return res.status(400).json({ error: 'taxTwinId, factKey, and acceptedValue are required' });
    }

    // Call Member 1 Authoritative Tax Engine to create new version
    const payload = {
      changeSummary: reason || `Reconciled ${factKey} to ₹${acceptedValue} from AIS`,
      addedIncomeSources: [
        {
          category: 'OTHER_SOURCES',
          employerOrPayer: 'HDFC Bank (Reconciled AIS Interest)',
          grossAmount: Number(acceptedValue),
          verificationState: 'VERIFIED',
        },
      ],
    };

    const response = await fetch(`${TAX_ENGINE_URL}/api/v1/tax/twin/${taxTwinId}/version`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to update Tax Twin version in tax-engine');
    }

    res.json({
      success: true,
      message: 'Reconciliation completed and new Tax Twin version created in tax-engine',
      reconciledFact: { factKey, value: acceptedValue },
      newTaxTwin: data.twin,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Reconciliation error', message: error.message });
  }
});

// 4. Gemini AI Explanations & Copilot (Calling Member 1 Tax Engine for Arithmetic)
app.post('/api/v1/ai/explain', async (req, res) => {
  try {
    const { prompt, calculationData } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    if (!GEMINI_API_KEY) {
      return res.json({
        reply: `Based on the deterministic calculation for FY 2025-26:\n- New Regime Standard Deduction: ₹75,000\n- Section 87A Rebate: Full rebate up to ₹60,000 for income <= ₹12 Lakhs.\n(Set GEMINI_API_KEY in .env for full conversational responses)`,
        source: 'TaxEngineRuleBaseline',
      });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: 'You are an AI Personal Tax Copilot for Indian taxpayers for FY 2025-26 / AY 2026-27. Explain tax outcomes clearly in simple terms. Never invent numerical tax results; rely on the provided calculation facts.',
    });

    const contextPrompt = calculationData
      ? `User Prompt: ${prompt}\n\nAuthoritative Calculation Context:\n${JSON.stringify(calculationData, null, 2)}`
      : prompt;

    const result = await model.generateContent(contextPrompt);
    res.json({
      reply: result.response.text(),
      citations: ['Income Tax Department FY 2025-26', 'Section 87A Rebate Finance Act'],
    });
  } catch (error: any) {
    res.status(500).json({ error: 'AI generation failed', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[ai-backend] Member 2 AI & Document Intelligence listening on port ${PORT}`);
  console.log(`[ai-backend] Connected to tax-engine at: ${TAX_ENGINE_URL}`);
});
