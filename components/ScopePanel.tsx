'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, FileText, Loader2, Lock, Wallet, Sparkles, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LiveApiLogs } from '@/components/LiveApiLogs';
import type { GeneratedScope, LogEntry } from '@/lib/types';

interface Props {
  scope: GeneratedScope | null;
  loading: boolean;
  error: string | null;
  logs: LogEntry[];
  onLogs: (logs: LogEntry[]) => void;
  onClearLogs: () => void;
  paid: boolean;
  setPaid: (v: boolean) => void;
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function ScopePanel({ scope, loading, error, logs, onLogs, onClearLogs, paid, setPaid }: Props) {
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  async function payMilestone1() {
    if (!scope) return;
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUSD: scope.milestones[0]?.amountUSD,
          description: `Milestone 1: ${scope.milestones[0]?.title ?? scope.projectTitle}`,
        }),
      });
      const data = await res.json();
      if (data.logs) onLogs([...logs, ...data.logs]);
      if (!res.ok) throw new Error(data.error || 'Failed to create PayPal order');

      // In a full integration we'd redirect to approveLink; for the demo flow
      // we simulate the client approving and capture the order server-side.
      const captureRes = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderId }),
      });
      const captureData = await captureRes.json();
      if (captureData.logs) onLogs(captureData.logs);
      if (!captureRes.ok || captureData.status !== 'COMPLETED') {
        throw new Error(captureData.error || `Capture returned ${captureData.status ?? 'unknown status'}`);
      }
      setPaid(true);
    } catch (e) {
      setPayError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <Card className="flex-1 border-slate-800 bg-slate-900/60 shadow-xl shadow-black/20">
        <CardContent className="p-6">
          {loading && (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-4 text-center">
              <div className="relative">
                <Sparkles className="h-10 w-10 animate-pulse text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-slate-300">AI is scoping your project...</p>
              <p className="max-w-xs text-xs text-slate-500">
                Structuring deliverables, pricing 3 milestones, and estimating the timeline.
              </p>
            </div>
          )}

          {!loading && !scope && !error && (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 text-center">
              <FileText className="h-10 w-10 text-slate-700" />
              <p className="text-sm font-medium text-slate-400">Your generated SOW will appear here</p>
              <p className="max-w-xs text-xs text-slate-600">
                Fill in the brief on the left (or use a preset) and click Generate to see the itemized milestones.
              </p>
            </div>
          )}

          {!loading && error && !scope && (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 text-center">
              <div className="rounded-full border border-rose-500/30 bg-rose-500/10 p-3">
                <Zap className="h-6 w-6 text-rose-400" />
              </div>
              <p className="text-sm font-medium text-rose-300">Could not generate scope</p>
              <p className="max-w-sm text-xs text-slate-400">{error}</p>
              <p className="max-w-sm text-xs text-slate-600">
                Check the Live API Logs below for the full request and response details.
              </p>
            </div>
          )}

          {!loading && scope && (
            <div className="space-y-6">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Badge variant="outline" className="mb-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                      <Sparkles className="mr-1 h-3 w-3" /> AI Generated SOW
                    </Badge>
                    <h2 className="text-xl font-semibold tracking-tight text-white">{scope.projectTitle}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Total</p>
                    <p className="text-2xl font-bold text-emerald-400">{fmt(scope.totalUSD)}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{scope.summary}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="h-4 w-4 text-sky-400" />
                  Estimated timeline: <span className="font-semibold text-slate-200">{scope.timelineWeeks} weeks</span>
                </div>
              </div>

              <div className="space-y-3">
                {scope.milestones.map((m) => {
                  const isM1 = m.id === 1;
                  const unlocked = isM1 && !paid;
                  return (
                    <div
                      key={m.id}
                      className={`rounded-xl border p-4 transition-all ${
                        paid && isM1
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : unlocked
                            ? 'border-emerald-500/30 bg-slate-950/60'
                            : 'border-slate-800 bg-slate-950/40 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                            {m.id}
                          </span>
                          <h3 className="text-sm font-semibold text-white">{m.title}</h3>
                        </div>
                        <span className="text-sm font-bold text-slate-100">{fmt(m.amountUSD)}</span>
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {m.deliverables.map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/70" />
                            {d}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4">
                        {paid && isM1 ? (
                          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" /> Milestone 1 paid — captured via PayPal Orders v2
                          </div>
                        ) : unlocked ? (
                          <div className="space-y-2">
                            <button
                              onClick={payMilestone1}
                              disabled={paying}
                              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {paying ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Wallet className="h-4 w-4" />
                              )}
                              Pay Milestone 1 via PayPal
                            </button>
                            {payError && <p className="text-xs text-rose-400">{payError}</p>}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-500">
                            <Lock className="h-3.5 w-3.5" />
                            Locked until M1 completes
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <LiveApiLogs logs={logs} onClear={onClearLogs} />
    </div>
  );
}
