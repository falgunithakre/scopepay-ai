'use client';

import { useState } from 'react';
import { ChevronDown, Terminal, Trash2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { LogEntry } from '@/lib/types';

const sourceColor: Record<LogEntry['source'], string> = {
  AI: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  PAYPAL: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  SYSTEM: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

function statusStyle(status: number | string) {
  const s = String(status);
  if (/^2|OK|200|201/.test(s)) return 'text-emerald-400';
  if (/CONFIG|PARSE|ERROR|4|5/.test(s) && !/^2/.test(s)) return 'text-rose-400';
  return 'text-slate-400';
}

export function LiveApiLogs({ logs, onClear }: { logs: LogEntry[]; onClear: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-slate-200 hover:text-white transition-colors">
          <Terminal className="h-4 w-4 text-emerald-400" />
          Live API Logs
          <Badge variant="outline" className="ml-1 border-slate-700 text-slate-400">
            {logs.length}
          </Badge>
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>
        {logs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 gap-1.5 text-xs text-slate-500 hover:text-slate-300"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
      <CollapsibleContent>
        <div className="max-h-72 overflow-y-auto border-t border-slate-800 px-4 py-3 font-mono text-xs">
          {logs.length === 0 ? (
            <p className="py-6 text-center text-slate-600">
              No API calls yet. Generate a scope or pay a milestone to see live request/response JSON here.
            </p>
          ) : (
            <div className="space-y-4">
              {logs.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${sourceColor[entry.source]}`}>
                      {entry.source}
                    </span>
                    <span className="text-slate-300">{entry.label}</span>
                    {entry.method && (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{entry.method}</span>
                    )}
                    <span className={`text-[11px] font-semibold ${statusStyle(entry.status)}`}>{entry.status}</span>
                    {entry.durationMs !== undefined && (
                      <span className="text-[11px] text-slate-500">{entry.durationMs}ms</span>
                    )}
                    <span className="ml-auto text-[10px] text-slate-600">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-950 p-2.5 text-[11px] leading-relaxed text-slate-400">
                    {JSON.stringify(entry.body, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
