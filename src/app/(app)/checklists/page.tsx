"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Plus,
  ClipboardCheck,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  Target,
} from "lucide-react";
import {
  getChecklists,
  getTargets,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  assignChecklist,
  getChecklistInstances,
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
import { VULN_TYPES } from "@/lib/utils";

type ChecklistWithCount = Awaited<ReturnType<typeof getChecklists>>[number];
type TargetOption = Awaited<ReturnType<typeof getTargets>>[number];
type Instance = Awaited<ReturnType<typeof getChecklistInstances>>[number];

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

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<ChecklistWithCount[]>([]);
  const [targets, setTargets] = useState<TargetOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChecklistWithCount | null>(null);
  const [itemsText, setItemsText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignChecklistId, setAssignChecklistId] = useState("");
  const [isPending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const [c, t] = await Promise.all([getChecklists(), getTargets()]);
      setChecklists(c);
      setTargets(t);
    });
  };

  useEffect(() => { load(); }, []);

  const openModal = (cl: ChecklistWithCount | null) => {
    setEditing(cl);
    if (cl) {
      try {
        const items = JSON.parse(cl.items) as string[];
        setItemsText(items.join("\n"));
      } catch { setItemsText(""); }
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
    const items = itemsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const data = {
      name: fd.get("name") as string,
      vulnType: (fd.get("vulnType") as string) || undefined,
      items: JSON.stringify(items),
    };

    startTransition(async () => {
      if (editing) {
        await updateChecklist(editing.id, data);
      } else {
        await createChecklist(data);
      }
      closeModal();
      load();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this checklist?")) return;
    startTransition(async () => {
      await deleteChecklist(id);
      load();
    });
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setInstances([]);
    } else {
      setExpandedId(id);
      // We don't have a target-specific view here, so we show the checklist items
    }
  };

  const openAssign = (checklistId: string) => {
    setAssignChecklistId(checklistId);
    setAssignModalOpen(true);
  };

  const handleAssign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const targetId = fd.get("targetId") as string;
    startTransition(async () => {
      await assignChecklist(assignChecklistId, targetId);
      setAssignModalOpen(false);
      load();
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Methodology Checklists</h1>
          <p className="text-text-muted text-sm mt-1">
            Reusable checklists per vulnerability type
          </p>
        </div>
        <Button onClick={() => openModal(null)}>
          <Plus className="w-4 h-4" /> New Checklist
        </Button>
      </div>

      {checklists.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No checklists yet"
          description="Create your first methodology checklist"
        />
      ) : (
        <div className="space-y-3">
          {checklists.map((cl) => {
            const items: string[] = (() => {
              try { return JSON.parse(cl.items); } catch { return []; }
            })();
            const isExpanded = expandedId === cl.id;

            return (
              <Card key={cl.id}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleExpand(cl.id)}
                    className="text-text-muted hover:text-text-primary transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{cl.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {cl.vulnType && (
                        <Badge className="bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30">
                          {cl.vulnType}
                        </Badge>
                      )}
                      <span className="text-xs text-text-muted">
                        {items.length} items
                      </span>
                      <span className="text-xs text-text-muted">
                        {cl._count.instances} target{cl._count.instances !== 1 ? "s" : ""} assigned
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openAssign(cl.id)}
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

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                        <Square className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Checklist Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? "Edit Checklist" : "New Checklist"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="e.g. XSS Hunting Methodology"
              defaultValue={editing?.name}
            />
          </div>
          <div>
            <Label htmlFor="vulnType">Vulnerability Type</Label>
            <Select
              id="vulnType"
              name="vulnType"
              defaultValue={editing?.vulnType || ""}
              onChange={(e) => {
                if (!editing && e.target.value) handleTemplate(e.target.value);
              }}
            >
              <option value="">General</option>
              {VULN_TYPES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Select>
            {!editing && (
              <p className="text-xs text-text-muted mt-1">
                Selecting a type will auto-fill a template
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="items">Checklist Items (one per line) *</Label>
            <textarea
              id="items"
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              required
              placeholder={"Test all input fields\nCheck for reflected XSS\nTest stored XSS..."}
              rows={10}
              className="w-full rounded-lg bg-bg-tertiary border border-white/10 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-colors resize-y"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {editing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign to Target Modal */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign to Target"
      >
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <Label htmlFor="targetId">Target *</Label>
            <Select id="targetId" name="targetId" required>
              <option value="">Select a target</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              Assign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
