"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Plus,
  ClipboardCheck,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  Target,
  X,
} from "lucide-react";
import {
  getChecklists,
  getTargets,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  assignChecklist,
  getChecklistsByTarget,
  updateChecklistInstance,
  deleteChecklistInstance,
} from "@/app/actions";
import {
  Button,
  Card,
  Badge,
  Modal,
  Input,
  Select,
  Label,
  EmptyState,
} from "@/components/ui";
import { cn, VULN_TYPES } from "@/lib/utils";

type ChecklistWithCount = Awaited<ReturnType<typeof getChecklists>>[number];
type TargetOption = Awaited<ReturnType<typeof getTargets>>[number];
type InstanceWithChecklist = Awaited<ReturnType<typeof getChecklistsByTarget>>[number];

const DEFAULT_TEMPLATES: Record<string, string[]> = {
  xss: [
    "Test all input fields for reflected XSS",
    "Check stored XSS in user-generated content",
    "Test DOM-based XSS via URL fragments",
    "Check CSP headers",
    "Test XSS in file upload names",
    "Check for XSS in error messages",
    "Test SVG/HTML file upload for stored XSS",
    "Bypass WAF with encoding (double URL, Unicode)",
  ],
  idor: [
    "Map all endpoints with IDs/UUIDs",
    "Test horizontal privilege escalation",
    "Test vertical privilege escalation",
    "Check direct object references in API",
    "Test with different user roles",
    "Check for predictable IDs",
    "Test bulk operations for IDOR",
    "Check file download/access endpoints",
  ],
  ssrf: [
    "Find URL input parameters",
    "Test with internal IPs (127.0.0.1, 169.254.x)",
    "Test DNS rebinding",
    "Check for blind SSRF via callbacks",
    "Test URL schema (file://, gopher://)",
    "Check cloud metadata endpoints",
    "Test redirect-based SSRF",
    "Bypass filters with URL encoding",
  ],
  sqli: [
    "Test all input fields with single quote",
    "Check for error-based injection",
    "Test boolean-based blind SQLi",
    "Test time-based blind SQLi",
    "Check for UNION-based injection",
    "Test ORDER BY injection",
    "Check for second-order injection",
    "Test with sqlmap for automation",
  ],
  "auth-bypass": [
    "Test default credentials",
    "Check for auth bypass via direct URL access",
    "Test password reset flow",
    "Check JWT token manipulation",
    "Test OAuth flow for misconfigs",
    "Check for rate limiting on login",
    "Test 2FA bypass techniques",
    "Check session fixation/hijacking",
  ],
};

function parseJSON<T>(str: string, fallback: T): T {
  try { return JSON.parse(str); } catch { return fallback; }
}

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<ChecklistWithCount[]>([]);
  const [targets, setTargets] = useState<TargetOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChecklistWithCount | null>(null);
  const [itemsText, setItemsText] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignChecklistId, setAssignChecklistId] = useState("");
  // Active hunting view
  const [activeTargetId, setActiveTargetId] = useState<string>("");
  const [instances, setInstances] = useState<InstanceWithChecklist[]>([]);
  const [isPending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const [c, t] = await Promise.all([getChecklists(), getTargets()]);
      setChecklists(c);
      setTargets(t);
    });
  };

  useEffect(() => { load(); }, []);

  const loadInstances = (targetId: string) => {
    if (!targetId) { setInstances([]); return; }
    startTransition(async () => {
      const data = await getChecklistsByTarget(targetId);
      setInstances(data);
    });
  };

  useEffect(() => {
    loadInstances(activeTargetId);
  }, [activeTargetId]);

  const toggleCheck = (instance: InstanceWithChecklist, index: number) => {
    const items = parseJSON<string[]>(instance.checklist.items, []);
    const checked = parseJSON<boolean[]>(instance.checked, new Array(items.length).fill(false));
    checked[index] = !checked[index];

    // Optimistic update
    setInstances((prev) =>
      prev.map((inst) =>
        inst.id === instance.id ? { ...inst, checked: JSON.stringify(checked) } : inst
      )
    );

    startTransition(async () => {
      await updateChecklistInstance(instance.id, JSON.stringify(checked));
    });
  };

  const handleRemoveInstance = (id: string) => {
    if (!confirm("Remove this checklist from target?")) return;
    startTransition(async () => {
      await deleteChecklistInstance(id);
      loadInstances(activeTargetId);
      load();
    });
  };

  const openModal = (cl: ChecklistWithCount | null) => {
    setEditing(cl);
    if (cl) {
      const items = parseJSON<string[]>(cl.items, []);
      setItemsText(items.join("\n"));
    } else {
      setItemsText("");
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setItemsText("");
  };

  const handleTemplate = (vulnType: string) => {
    const tmpl = DEFAULT_TEMPLATES[vulnType];
    if (tmpl) setItemsText(tmpl.join("\n"));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const items = itemsText.split("\n").map((s) => s.trim()).filter(Boolean);
    const data = {
      name: fd.get("name") as string,
      vulnType: (fd.get("vulnType") as string) || undefined,
      items: JSON.stringify(items),
    };
    startTransition(async () => {
      if (editing) { await updateChecklist(editing.id, data); }
      else { await createChecklist(data); }
      closeModal();
      load();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this checklist template?")) return;
    startTransition(async () => {
      await deleteChecklist(id);
      load();
    });
  };

  const handleAssign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const targetId = fd.get("targetId") as string;
    startTransition(async () => {
      await assignChecklist(assignChecklistId, targetId);
      setAssignModalOpen(false);
      if (activeTargetId === targetId) loadInstances(targetId);
      load();
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Methodology Checklists</h1>
          <p className="text-text-muted text-sm mt-1">
            Track your hunting methodology per target
          </p>
        </div>
        <Button onClick={() => openModal(null)}>
          <Plus className="w-4 h-4" /> New Template
        </Button>
      </div>

      {/* Active Hunt View */}
      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-accent-green" />
          <h2 className="font-semibold">Hunt Mode</h2>
        </div>
        <div className="mb-4">
          <Label>Select Target</Label>
          <Select
            value={activeTargetId}
            onChange={(e) => setActiveTargetId(e.target.value)}
          >
            <option value="">Choose a target...</option>
            {targets.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </div>

        {activeTargetId && instances.length === 0 && (
          <div className="text-center py-8">
            <p className="text-text-muted text-sm mb-3">No checklists assigned to this target</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setAssignChecklistId("");
                setAssignModalOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" /> Assign Checklist
            </Button>
          </div>
        )}

        {activeTargetId && instances.length > 0 && (
          <div className="space-y-4">
            {instances.map((instance) => {
              const items = parseJSON<string[]>(instance.checklist.items, []);
              const checked = parseJSON<boolean[]>(instance.checked, new Array(items.length).fill(false));
              const doneCount = checked.filter(Boolean).length;
              const progress = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

              return (
                <div key={instance.id} className="border border-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm">{instance.checklist.name}</h3>
                      {instance.checklist.vulnType && (
                        <Badge className="bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30">
                          {instance.checklist.vulnType}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-xs font-medium",
                        progress === 100 ? "text-accent-green" : "text-text-muted"
                      )}>
                        {doneCount}/{items.length} ({progress}%)
                      </span>
                      <button
                        onClick={() => handleRemoveInstance(instance.id)}
                        className="text-text-muted hover:text-accent-red transition-colors"
                        title="Remove from target"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden mb-3">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        progress === 100 ? "bg-accent-green" : "bg-accent-cyan"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Checklist items */}
                  <div className="space-y-1">
                    {items.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => toggleCheck(instance, i)}
                        className="flex items-center gap-2.5 w-full text-left py-1.5 px-2 rounded-md hover:bg-white/5 transition-colors group"
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                          checked[i]
                            ? "bg-accent-green border-accent-green"
                            : "border-white/20 group-hover:border-white/40"
                        )}>
                          {checked[i] && (
                            <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={cn(
                          "text-sm transition-colors",
                          checked[i] ? "text-text-muted line-through" : "text-text-secondary"
                        )}>
                          {item}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setAssignChecklistId("");
                setAssignModalOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" /> Assign Another Checklist
            </Button>
          </div>
        )}
      </Card>

      {/* Templates */}
      <h2 className="font-semibold mb-3 text-text-secondary">Templates</h2>
      {checklists.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No templates yet"
          description="Create your first methodology checklist template"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {checklists.map((cl) => {
            const items = parseJSON<string[]>(cl.items, []);
            return (
              <Card key={cl.id} className="flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{cl.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {cl.vulnType && (
                        <Badge className="bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30">
                          {cl.vulnType}
                        </Badge>
                      )}
                      <span className="text-xs text-text-muted">
                        {items.length} items
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setAssignChecklistId(cl.id);
                        setAssignModalOpen(true);
                      }}
                      className="p-1.5 text-text-muted hover:text-accent-green transition-colors"
                      title="Assign to target"
                    >
                      <Target className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openModal(cl)}
                      className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cl.id)}
                      className="p-1.5 text-text-muted hover:text-accent-red transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-auto pt-2 border-t border-white/5 text-xs text-text-muted">
                  {cl._count.instances} target{cl._count.instances !== 1 ? "s" : ""} using this
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Template Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? "Edit Template" : "New Template"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required placeholder="e.g. XSS Hunting Methodology" defaultValue={editing?.name} />
          </div>
          <div>
            <Label htmlFor="vulnType">Vulnerability Type</Label>
            <Select id="vulnType" name="vulnType" defaultValue={editing?.vulnType || ""} onChange={(e) => { if (!editing && e.target.value) handleTemplate(e.target.value); }}>
              <option value="">General</option>
              {VULN_TYPES.map((v) => (<option key={v} value={v}>{v}</option>))}
            </Select>
            {!editing && <p className="text-xs text-text-muted mt-1">Selecting a type will auto-fill a template</p>}
          </div>
          <div>
            <Label htmlFor="items">Checklist Items (one per line) *</Label>
            <textarea id="items" value={itemsText} onChange={(e) => setItemsText(e.target.value)} required placeholder={"Test all input fields\nCheck for reflected XSS\nTest stored XSS..."} rows={10} className="w-full rounded-lg bg-bg-tertiary border border-white/10 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-colors resize-y" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>

      {/* Assign to Target Modal */}
      <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign Checklist to Target">
        <form onSubmit={handleAssign} className="space-y-4">
          {!assignChecklistId && (
            <div>
              <Label>Checklist *</Label>
              <Select name="checklistIdSelect" required onChange={(e) => setAssignChecklistId(e.target.value)}>
                <option value="">Select a checklist</option>
                {checklists.map((cl) => (<option key={cl.id} value={cl.id}>{cl.name}</option>))}
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="targetId">Target *</Label>
            <Select id="targetId" name="targetId" required defaultValue={activeTargetId}>
              <option value="">Select a target</option>
              {targets.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>Assign</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
