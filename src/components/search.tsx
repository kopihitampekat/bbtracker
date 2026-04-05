"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Target, Bug, BookOpen, X } from "lucide-react";
import { globalSearch } from "@/app/actions";
import { Badge } from "@/components/ui";
import { SEVERITY_COLORS, formatDate } from "@/lib/utils";

type SearchResults = Awaited<ReturnType<typeof globalSearch>>;

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ targets: [], findings: [], journals: [] });
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ targets: [], findings: [], journals: [] });
      return;
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const data = await globalSearch(query);
        setResults(data);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const navigate = (path: string) => {
    router.push(path);
    close();
  };

  const hasResults =
    results.targets.length > 0 ||
    results.findings.length > 0 ||
    results.journals.length > 0;

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-white/10 text-sm text-text-muted hover:border-white/20 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-[10px] bg-bg-primary px-1.5 py-0.5 rounded border border-white/10">
          Ctrl+K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
          <div className="relative bg-bg-secondary border border-white/10 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
              <Search className="w-4 h-4 text-text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search targets, findings, journal..."
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {query.length >= 2 && (
              <div className="max-h-[50vh] overflow-y-auto scrollbar-thin p-2">
                {!hasResults && !isPending && (
                  <p className="text-sm text-text-muted text-center py-8">No results found</p>
                )}

                {results.targets.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-text-muted px-2 py-1 uppercase tracking-wider">Targets</p>
                    {results.targets.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => navigate("/targets")}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-colors"
                      >
                        <Target className="w-4 h-4 text-text-muted shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{t.name}</p>
                          <p className="text-xs text-text-muted capitalize">{t.platform}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.findings.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-text-muted px-2 py-1 uppercase tracking-wider">Findings</p>
                    {results.findings.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => navigate(`/findings/${f.id}`)}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-colors"
                      >
                        <Bug className="w-4 h-4 text-text-muted shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{f.title}</p>
                          <div className="flex items-center gap-2">
                            <Badge className={SEVERITY_COLORS[f.severity]}>{f.severity}</Badge>
                            <span className="text-xs text-text-muted">{f.target?.name}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {results.journals.length > 0 && (
                  <div>
                    <p className="text-xs text-text-muted px-2 py-1 uppercase tracking-wider">Journal</p>
                    {results.journals.map((j) => (
                      <button
                        key={j.id}
                        onClick={() => navigate("/journal")}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-text-muted shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm truncate">{j.content.slice(0, 80)}...</p>
                          <p className="text-xs text-text-muted">{formatDate(j.date)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
