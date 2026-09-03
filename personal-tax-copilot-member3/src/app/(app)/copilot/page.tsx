"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getApiClient } from "@/lib/api/client";
import { TaxTwin } from "@/types/schema";
import { AIChatMessage } from "@/types/tax";
import { formatDateIN } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  Send,
  Loader2,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  Scale,
  FlaskConical,
  FileText,
  User,
  Bot,
} from "lucide-react";

export default function CopilotPage() {
  const [loading, setLoading] = useState(false);
  const [inputPrompt, setInputPrompt] = useState("");
  const [activeTwin, setActiveTwin] = useState<TaxTwin | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: "msg_welcome",
      role: "assistant",
      content:
        "Hello! I am your **Personal AI Tax Copilot** for Indian taxpayers.\n\nI have continuous context from your **Tax Twin v2** for **FY 2025-26 / AY 2026-27**. I can explain your statutory tax computation, guide you between the Old and New regimes, clarify document discrepancies, and help you model What-If scenarios.\n\nHow can I assist your tax planning today?",
      timestamp: new Date().toISOString(),
      tool_execution: {
        tool_name: "get_tax_twin_context",
        status: "completed",
        summary: "Synchronized with active Tax Twin v2 (6 verified facts)",
      },
      citations: [
        {
          source_title: "Income Tax Department Statutory Slabs (AY 2026-27)",
          section: "Section 115BAC & Section 87A",
        },
      ],
    },
  ]);

  const suggestedQuestions = [
    "Which tax regime is better for me?",
    "Explain my tax calculation.",
    "What does my AIS conflict mean?",
    "What happens if I invest ₹50,000 in NPS?",
    "What do I need to complete before filing?",
  ];

  useEffect(() => {
    async function loadTwinMeta() {
      try {
        const client = getApiClient();
        const twins = await client.getTaxTwins();
        const baseline = twins.find((t) => t.is_active_baseline) || twins[0];
        if (baseline) setActiveTwin(baseline);
      } catch (err) {
        console.error("Failed to load twin context for copilot:", err);
      }
    }
    loadTwinMeta();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || loading) return;

    const userMessage: AIChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt("");
    setLoading(true);

    try {
      const client = getApiClient();
      const updatedConversation = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const aiResponse = await client.sendAIChat(updatedConversation);
      setMessages((prev) => [...prev, aiResponse]);
    } catch (err: any) {
      const errorMessage: AIChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: "I encountered a communication issue connecting to the AI service. Please retry your question.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Page Header with Twin Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Gemini AI Tax Copilot
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">AY 2026-27</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Personal Tax Guidance &amp; Explanations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ask questions about your tax slabs, deductions, reconciliation conflicts, and regime comparisons.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
            <Layers className="h-3.5 w-3.5 text-teal-600" />
            <span>Twin v{activeTwin?.version || 2} Connected</span>
          </div>
        </div>
      </div>

      {/* 2. Core Architectural Guarantee Banner */}
      <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-purple-950">
          <ShieldCheck className="h-5 w-5 text-purple-700 shrink-0" />
          <div>
            <span className="font-bold text-slate-900">Core Product Guarantee: </span>
            <span className="text-slate-600">
              <strong>Gemini explains</strong> your tax situation. The <strong>deterministic tax engine calculates</strong> it.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="bg-white border-purple-200 text-purple-800 font-mono text-[10px]">
            Server-Side Gemini API
          </Badge>
        </div>
      </div>

      {/* 3. Conversation Window */}
      <Card className="border bg-white shadow-sm flex flex-col min-h-[500px]">
        <CardContent className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[600px]">
          {messages.map((msg) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-purple-600 font-bold text-white shadow-xs">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 space-y-3 text-xs leading-relaxed ${
                    isUser
                      ? "bg-slate-900 text-white rounded-tr-none shadow-xs"
                      : "bg-slate-50 border border-slate-200 text-slate-900 rounded-tl-none"
                  }`}
                >
                  {/* Tool Execution Notification Chip */}
                  {!isUser && msg.tool_execution && (
                    <div className="rounded-lg border border-purple-200 bg-purple-100/60 px-2.5 py-1.5 text-[11px] text-purple-900 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Cpu className="h-3.5 w-3.5 text-purple-700" />
                        <span>Tool: <code className="font-mono">{msg.tool_execution.tool_name}</code></span>
                      </div>
                      <span className="text-purple-700 text-[10px] font-semibold">{msg.tool_execution.summary}</span>
                    </div>
                  )}

                  {/* Message Body with clean paragraphs */}
                  <div className="space-y-2 whitespace-pre-line text-xs sm:text-sm font-normal">
                    {msg.content}
                  </div>

                  {/* Citations & References */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        <BookOpen className="h-3 w-3 text-slate-400" />
                        Statutory References &amp; Citations
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, idx) => (
                          <span
                            key={idx}
                            className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-mono text-slate-700 shadow-2xs"
                          >
                            {c.source_title} {c.section && `• ${c.section}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Footer */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>{formatDateIN(msg.timestamp)}</span>
                    {!isUser && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="hover:text-slate-600 flex items-center gap-1 transition"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-slate-200 font-bold text-slate-700 text-xs shadow-xs">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white shadow-xs">
                <Sparkles className="h-4 w-4 animate-spin" />
              </div>
              <div className="max-w-md rounded-2xl rounded-tl-none bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                <span>Gemini is evaluating Tax Twin v2 with deterministic rules...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* 4. Suggested Questions & Composer */}
        <CardFooter className="p-4 sm:p-6 border-t border-slate-100 flex flex-col space-y-4 bg-slate-50/50">
          {/* Suggested Prompt Chips */}
          <div className="w-full space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Suggested Taxpayer Questions
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 font-medium hover:border-purple-300 hover:bg-purple-50/60 hover:text-purple-900 transition shadow-2xs text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Form Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="w-full flex gap-2"
          >
            <Input
              type="text"
              placeholder="Ask a tax question, e.g. 'Why is New Regime cheaper for me?'"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={loading}
              className="flex-1 bg-white border-slate-300 text-xs sm:text-sm h-10 shadow-xs focus:ring-purple-500"
            />
            <Button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="bg-purple-700 hover:bg-purple-800 text-white h-10 px-4 shrink-0 shadow-xs"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Send <Send className="h-3.5 w-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </form>

          {/* Connected Route Shortcuts */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <Link href="/regime-comparison" className="hover:text-teal-700 flex items-center gap-1 font-medium">
                <Scale className="h-3 w-3 text-teal-600" /> Compare Regimes
              </Link>
              <Link href="/what-if" className="hover:text-teal-700 flex items-center gap-1 font-medium">
                <FlaskConical className="h-3 w-3 text-teal-600" /> What-If Lab
              </Link>
              <Link href="/documents" className="hover:text-teal-700 flex items-center gap-1 font-medium">
                <FileText className="h-3 w-3 text-teal-600" /> Reconcile AIS
              </Link>
            </div>

            <div className="text-[10px] text-slate-400">
              Tax rules verified for AY 2026-27
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* 5. Safety Disclaimer Footer */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-500 leading-relaxed text-center">
        <strong>Statutory Notice:</strong> AI-generated explanations are informational and educational. Numerical tax calculations, slabs, and rebate amounts are generated strictly by the deterministic tax calculation engine according to official Income Tax Department rules.
      </div>
    </div>
  );
}