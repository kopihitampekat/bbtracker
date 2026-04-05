"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Bug, Trash2, Pencil, ExternalLink, ImageIcon } from "lucide-react";
import {
  getFindings,
  getTargets,
  createFinding,
  updateFinding,
  deleteFinding,
} from "@/app/actions";
import {
  Button,
  Card,
  Badge,
  Modal,
  Input,
  Select,
  Textarea,
  Label,
  EmptyState,
} from "@/components/ui";
import { ImageUpload } from "@/components/image-upload";
import {
  VULN_TYPES,
  SEVERITIES,
  FINDING_STATUSES,
  SEVERITY_COLORS,
  STATUS_COLORS,
  formatCurrency,
  formatDate,
} from "@/lib/utils";

type FindingWithTarget = Awaited<ReturnType<typeof getFindings>>[number];
type TargetOption = Awaited<ReturnType<typeof getTargets>>[number];

function parseImages(images: string | null | undefined): string[] {
  if (!images) return [];
  try { return JSON.parse(images); } catch { return []; }
}

export default function FindingsPage() {
  const [findings, setFindings] = useState<FindingWithTarget[]>([]);
  const [targets, setTargets] = useState<TargetOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FindingWithTarget | null>(null);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [images, setImages] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const [f, t] = await Promise.all([getFindings(), getTargets()]);
      setFindings(f);
      setTargets(t);
    });
  };

  useEffect(() => { load(); }, []);

  const filtered = findings.filter((f) => {
    if (filterSeverity !== "all" && f.severity !== filterSeverity) return false;
    if (filterStatus !== "all" && f.status !== filterStatus) return false;
    return true;
  });

  const openModal = (finding: FindingWithTarget | null) => {
    setEditing(finding);
    setImages(finding ? parseImages(finding.images) : []);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setImages([]);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      title: fd.get("title") as string,
      targetId: fd.get("targetId") as string,
      vulnType: fd.get("vulnType") as string,
      severity: fd.get("severity") as string,
      status: fd.get("status") as string,
      bounty: parseFloat((fd.get("bounty") as string) || "0"),
      endpoint: (fd.get("endpoint") as string) || undefined,
      reportUrl: (fd.get("reportUrl") as string) || undefined,
      poc: (fd.get("poc") as string) || undefined,
      images: images.length > 0 ? JSON.stringify(images) : undefined,
      tags: (fd.get("tags") as string) || undefined,
    };

    startTransition(async () => {
      if (editing) {
        await updateFinding(editing.id, data);
      } else {
        await createFinding(data);
      }
      closeModal();
      load();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this finding?")) return;
    startTransition(async () => {
      await deleteFinding(id);
      load();
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Findings</h1>
          <p className="text-text-muted text-sm mt-1">
            Track your vulnerability discoveries
          </p>
        </div>
        <Button onClick={() => openModal(null)}>
          <Plus className="w-4 h-4" /> Add Finding
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <Select
          className="w-40"
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
        >
          <option value="all">All Severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select
          className="w-40"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {FINDING_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <span className="text-text-muted text-sm flex items-center ml-auto">
          {filtered.length} finding{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bug}
          title="No findings"
          description={findings.length > 0 ? "No findings match your filters" : "Log your first vulnerability finding"}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => {
            const imgs = parseImages(f.images);
            return (
              <Card key={f.id} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/findings/${f.id}`} className="font-medium truncate hover:text-accent-green transition-colors">
                      {f.title}
                    </Link>
                    {imgs.length > 0 && (
                      <ImageIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={SEVERITY_COLORS[f.severity]}>
                      {f.severity}
                    </Badge>
                    <Badge className={STATUS_COLORS[f.status]}>
                      {f.status}
                    </Badge>
                    <span className="text-xs text-text-muted uppercase">
                      {f.vulnType}
                    </span>
                    <span className="text-xs text-text-muted">
                      {f.target?.name}
                    </span>
                    {f.tags && f.tags.split(",").map((tag) => (
                      <Badge key={tag.trim()} className="bg-accent-purple/20 text-accent-purple border-accent-purple/30">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                  {imgs.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {imgs.slice(0, 4).map((url) => (
                        <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt="evidence"
                            className="w-16 h-16 rounded-md object-cover border border-white/10 hover:border-accent-green/30 transition-colors"
                          />
                        </a>
                      ))}
                      {imgs.length > 4 && (
                        <span className="text-xs text-text-muted flex items-center">
                          +{imgs.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  {f.bounty > 0 && (
                    <p className="text-accent-green font-semibold">
                      {formatCurrency(f.bounty)}
                    </p>
                  )}
                  <p className="text-xs text-text-muted">{formatDate(f.foundAt)}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {f.reportUrl && (
                    <a
                      href={f.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => openModal(f)}
                    className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="p-1.5 text-text-muted hover:text-accent-red transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editing ? "Edit Finding" : "Add Finding"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="e.g. Stored XSS in comment field"
              defaultValue={editing?.title}
            />
          </div>
          <div>
            <Label htmlFor="targetId">Target *</Label>
            <Select id="targetId" name="targetId" required defaultValue={editing?.targetId}>
              <option value="">Select a target</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="vulnType">Type</Label>
              <Select id="vulnType" name="vulnType" defaultValue={editing?.vulnType || "xss"}>
                {VULN_TYPES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select id="severity" name="severity" defaultValue={editing?.severity || "medium"}>
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={editing?.status || "draft"}>
                {FINDING_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bounty">Bounty ($)</Label>
              <Input
                id="bounty"
                name="bounty"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                defaultValue={editing?.bounty || ""}
              />
            </div>
            <div>
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input
                id="endpoint"
                name="endpoint"
                placeholder="/api/users/:id"
                defaultValue={editing?.endpoint || ""}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="reportUrl">Report URL</Label>
            <Input
              id="reportUrl"
              name="reportUrl"
              placeholder="https://hackerone.com/reports/..."
              defaultValue={editing?.reportUrl || ""}
            />
          </div>
          <div>
            <Label htmlFor="poc">Proof of Concept</Label>
            <Textarea
              id="poc"
              name="poc"
              placeholder="Steps to reproduce..."
              rows={5}
              defaultValue={editing?.poc || ""}
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              name="tags"
              placeholder="needs-retest, escalatable, collab (comma-separated)"
              defaultValue={editing?.tags || ""}
            />
          </div>
          <div>
            <Label>Screenshots / Evidence</Label>
            <ImageUpload images={images} onChange={setImages} />
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
    </div>
  );
}
