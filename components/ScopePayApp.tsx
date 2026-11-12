'use client';

import { useState } from 'react';
import { Briefcase, Loader2, Mail, ScrollText, Send, Sparkles, ShoppingCart, Bot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScopePanel } from '@/components/ScopePanel';
import { SAMPLE_PRESETS, type GeneratedScope, type LogEntry } from '@/lib/types';

export function ScopePayApp() {
  const [projectTitle, setProjectTitle] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<GeneratedScope | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [paid, setPaid] = useState(false);

  function applyPreset(key: keyof typeof SAMPLE_PRESETS) {
    const p = SAMPLE_PRESETS[key];
    setProjectTitle(p.title);
    setClientEmail(p.email);
    setBrief(p.brief);
    setScope(null);
    setError(null);
    setPaid(false);
  }

  async function generate() {
    setLoading(true);
    setError(null);
    setScope(null);
    setPaid(false);
    try {
      const res = await fetch('/api/generate-scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectTitle, clientEmail, brief }),
      });
      const data = await res.json();
      if (data.logs) setLogs((prev) => [...prev, ...data.logs]);
      if (!res.ok) throw new Error(data.error || 'Failed to generate scope');
      setScope(data.scope);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = brief.trim().length >= 10 && !loading;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
              <Briefcase className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">ScopePay AI</h1>
              <p className="text-[11px] text-slate-500">Plain-English brief → itemized SOW → milestone payments</p>
            </div>
          </div>
          <Badge variant="outline" className="hidden border-slate-700 text-slate-400 sm:flex">
            <Sparkles className="mr-1.5 h-3 w-3 text-emerald-400" />
            AI Scope + PayPal Milestones
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left panel: Client Brief */}
          <Card className="h-fit border-slate-800 bg-slate-900/60 shadow-xl shadow-black/20">
            <CardContent className="space-y-5 p-6">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  <ScrollText className="h-4 w-4" /> Client Brief
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Describe the project in plain English. The AI turns it into a priced Statement of Work.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">Sample presets</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => applyPreset('ecommerce')}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> E-commerce Mobile App
                  </button>
                  <button
                    onClick={() => applyPreset('supportbot')}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
                  >
                    <Bot className="h-3.5 w-3.5" /> AI Customer Support Bot
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="mb-1.5 block text-xs font-medium text-slate-300">
                    Project Title
                  </label>
                  <Input
                    id="title"
                    placeholder="e.g. E-commerce Mobile App"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-300">
                    <Mail className="h-3 w-3" /> Client Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="client@company.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label htmlFor="brief" className="mb-1.5 block text-xs font-medium text-slate-300">
                    Describe what you need built
                  </label>
                  <Textarea
                    id="brief"
                    placeholder="Example: We need a booking platform for our dental clinics. Patients should be able to pick a clinic, see available slots, and pay a deposit online..."
                    rows={8}
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    className="resize-none border-slate-700 bg-slate-950/60 text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500/40"
                  />
                </div>
              </div>

              <button
                onClick={generate}
                disabled={!canGenerate}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate AI Scope &amp; Milestones
              </button>
              {!canGenerate && !loading && brief.trim().length > 0 && (
                <p className="text-center text-xs text-slate-500">Add a bit more detail to the brief (10+ characters).</p>
              )}
            </CardContent>
          </Card>

          {/* Right panel: AI Generated SOW + PayPal checkout */}
          <ScopePanel
            scope={scope}
            loading={loading}
            error={error}
            logs={logs}
            onLogs={(newLogs) => setLogs((prev) => [...prev, ...newLogs])}
            onClearLogs={() => setLogs([])}
            paid={paid}
            setPaid={setPaid}
          />
        </div>
      </main>
    </div>
  );
}
