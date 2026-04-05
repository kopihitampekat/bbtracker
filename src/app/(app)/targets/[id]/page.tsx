"use client";

import { useEffect, useState, useTransition, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bug,
  ExternalLink,
  ClipboardCheck,
  X,
} from "lucide-react";
import {
  getTargetDetail,
  getChecklists,
  assignChecklist,
  updateChecklistInstance,
  deleteChecklistInstance,
} from "@/app/actions";
import { Card, Badge, Button, Modal, Select, Label } from "@/components/ui";
import {
  cn,
  SEVERITY_COLORS,
  STATUS_COLORS,
  formatCurrency,
  formatDate,
} from "@/lib/utils";

type TargetDetail = NonNullable<Awaited<ReturnType<typeof getTargetDetail>>>;
type ChecklistOption = Awaited<ReturnType<typeof getChecklists>>[number];

function parseJSON<T>(str: string, fallback: T): T {
  try { return JSON.parse(str); } catch { return fallback; }
}

export default function TargetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [target, setTarget] = useState<TargetDetail | null>(null);
  const [checklists, setChecklists] = useState<ChecklistOption[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const [t, c] = await Promise.all([getTargetDetail(id), getChecklists()]);
      setTarget(t as TargetDetail);
      setChecklists(c);
    });
  };

  useEffect(() => { load(); }, [id]);

  const toggleCheck = (instanceId: string, checkedStr: string, itemCount: number, index: number) => {
    const checked = parseJSON<boolean[]>(checkedStr, new Array(itemCount).fill(false));
    checked[index] = !checked[index];
    const newChecked = JSON.stringify(checked);

    // Optimistic update
    setTarget((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        checklistInstances: prev.checklistInstances.map((inst) =>
          inst.id === instanceId ? { ...inst, checked: newChecked } : inst
        ),
      };
    });

    startTransition(async () => {
      await updateChecklistInstance(instanceId, newChecked);
    });
  };

  const handleRemoveInstance = (instanceId: string) => {
    if (!confirm("Remove this checklist?")) return;
    startTransition(async () => {
      await deleteChecklistInstance(instanceId);
      load();
    });
  };

  const handleAssign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const checklistId = fd.get("checklistId") as string;
    startTransition(async () => {
      await assignChecklist(checklistId, id);
      setAssignOpen(false);
      load();
    });
  };

  if (!target) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Loading...</div>;
  }

  const totalBounty = target.findings.reduce((sum, f) => sum + f.bounty, 0);

  return (
    <div className="max-w-4xl">
      <Link href="/targets" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Targets
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{target.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={STATUS_COLORS[target.status]}>{target.status}</Badge>
            <span className="text-sm text-text-muted capitalize">{target.platform}</span>
            {target.url && (
              <a href={target.url} target="_blank" rel="noopener noreferrer" className="text-accent-cyan text-sm hover:underline inline-flex items-center gap-1">
                Program <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        {totalBounty > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-accent-green">{formatCurrency(totalBounty)}</p>
            <p className="text-xs text-text-muted">total bounty</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Scope & Notes */}
          {(target.scope || target.notes) && (
            <Card>
              {target.scope && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-text-muted mb-2">Scope</h3>
                  <div className="text-sm text-text-secondary whitespace-pre-wrap">{target.scope}</div>
                </div>
              )}
              {target.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-text-muted mb-2">Recon Notes</h3>
                  <div className="text-sm text-text-secondary whitespace-pre-wrap bg-bg-tertiary rounded-lg p-3 border border-white/5">{target.notes}</div>
                </div>
              )}
            </Card>
          )}

          {/* Findings */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Bug className="w-4 h-4" /> Findings ({target.findings.length})
              </h3>
            </div>
            {target.findings.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">No findings for this target yet</p>
            ) : (
              <div className="space-y-2">
                {target.findings.map((f) => (
                  <Link key={f.id} href={`/findings/${f.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{f.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={SEVERITY_COLORS[f.severity]}>{f.severity}</Badge>
                        <Badge className={STATUS_COLORS[f.status]}>{f.status}</Badge>
                        <span className="text-xs text-text-muted uppercase">{f.vulnType}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      {f.bounty > 0 && <p className="text-accent-green text-sm font-semibold">{formatCurrency(f.bounty)}</p>}
                      <p className="text-xs text-text-muted">{formatDate(f.foundAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar: Checklists */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" /> Checklists
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setAssignOpen(true)}>
                + Add
              </Button>
            </div>

            {target.checklistInstances.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">No checklists assigned</p>
            ) : (
              <div className="space-y-4">
                {target.checklistInstances.map((instance) => {
                  const items = parseJSON<string[]>(instance.checklist.items, []);
                  const checked = parseJSON<boolean[]>(instance.checked, new Array(items.length).fill(false));
                  const doneCount = checked.filter(Boolean).length;
                  const progress = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

                  return (
                    <div key={instance.id} className="border border-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{instance.checklist.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs", progress === 100 ? "text-accent-green" : "text-text-muted")}>
                            {progress}%
                          </span>
                          <button onClick={() => handleRemoveInstance(instance.id)} className="text-text-muted hover:text-accent-red transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="h-1 bg-bg-tertiary rounded-full overflow-hidden mb-2">
                        <div className={cn("h-full rounded-full transition-all", progress === 100 ? "bg-accent-green" : "bg-accent-cyan")} style={{ width: `${progress}%` }} />
                      </div>

                      <div className="space-y-0.5">
                        {items.map((item, i) => (
                          <button key={i} onClick={() => toggleCheck(instance.id, instance.checked, items.length, i)} className="flex items-center gap-2 w-full text-left py-1 px-1 rounded hover:bg-white/5 transition-colors">
                            <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors", checked[i] ? "bg-accent-green border-accent-green" : "border-white/20")}>
                              {checked[i] && (
                                <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={cn("text-xs transition-colors", checked[i] ? "text-text-muted line-through" : "text-text-secondary")}>{item}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Checklist">
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <Label>Checklist *</Label>
            <Select name="checklistId" required>
              <option value="">Select a checklist</option>
              {checklists.map((cl) => (<option key={cl.id} value={cl.id}>{cl.name}</option>))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>Assign</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
