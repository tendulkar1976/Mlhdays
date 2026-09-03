import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TaxCopilotToolDeclarations, executeTaxCopilotTool } from '@/lib/ai-tools/tax-copilot-tools';

/**
 * Server-Side Gemini AI Tax Copilot Endpoint
 * Strictly adheres to SHARED_CONTRACTS.md:
 * 1. GEMINI_API_KEY is kept strictly server-side (never exposed to browser / client code).
 * 2. Deterministic Tax Engine remains authoritative for numerical arithmetic.
 * 3. Gemini orchestrates tools, retrieves statutory facts, and explains calculations.
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your-server-side-gemini-api-key-here' || apiKey.trim() === '') {
      return NextResponse.json(
        {
          error: 'Missing GEMINI_API_KEY',
          message: 'Please set your GEMINI_API_KEY in .env file or environment variables.',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const userPrompt = body.prompt;

    if (!userPrompt || typeof userPrompt !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'prompt string is required' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `You are an authoritative, friendly AI Personal Tax Copilot for Indian taxpayers under FY 2025-26 / AY 2026-27.
You MUST NEVER compute tax arithmetic by yourself. Instead, ALWAYS use the provided tool "calculate_tax_stateless" or "get_statutory_tax_slabs" whenever numerical computation or statutory tax slab information is needed.
Explain deductions, slab breakdowns, Section 87A rebate rules (up to ₹60,000 for income <= ₹12L), and Old vs New regime tradeoffs clearly to the user in simple, friendly terms with INR (₹) formatting.`,
      tools: [
        {
          functionDeclarations: TaxCopilotToolDeclarations as any,
        },
      ],
    });

    // Start chat session with function calling enabled
    const chat = model.startChat();
    let result = await chat.sendMessage(userPrompt);
    let response = result.response;

    // Check if model called any tools
    const functionCalls = response.functionCalls();
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const toolResult = await executeTaxCopilotTool(call.name, call.args);

      // Feed deterministic tool calculation result back to Gemini for natural language explanation
      result = await chat.sendMessage([
        {
          functionResponse: {
            name: call.name,
            response: { output: toolResult },
          },
        },
      ]);
      response = result.response;
    }

    return NextResponse.json(
      {
        reply: response.text(),
        toolUsed: functionCalls && functionCalls.length > 0 ? functionCalls[0].name : null,
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Gemini AI Error',
        message: error?.message || 'Failed to generate AI tax response.',
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
