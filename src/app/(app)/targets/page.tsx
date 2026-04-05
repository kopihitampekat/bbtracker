"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Target as TargetIcon, Trash2, Pencil, ExternalLink } from "lucide-react";
import {
  getTargets,
  createTarget,
  updateTarget,
  deleteTarget,
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
import {
  PLATFORMS,
  TARGET_STATUSES,
  STATUS_COLORS,
} from "@/lib/utils";

type TargetWithCount = Awaited<ReturnType<typeof getTargets>>[number];

export default function TargetsPage() {
  const [targets, setTargets] = useState<TargetWithCount[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TargetWithCount | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const data = await getTargets();
      setTargets(data);
    });
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name") as string,
      platform: fd.get("platform") as string,
      url: (fd.get("url") as string) || undefined,
      scope: (fd.get("scope") as string) || undefined,
      status: fd.get("status") as string,
      notes: (fd.get("notes") as string) || undefined,
    };

    startTransition(async () => {
      if (editing) {
        await updateTarget(editing.id, data);
      } else {
        await createTarget(data);
      }
      setModalOpen(false);
      setEditing(null);
      load();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this target and all its findings?")) return;
    startTransition(async () => {
      await deleteTarget(id);
      load();
    });
  };

  const openEdit = (t: TargetWithCount) => {
    setEditing(t);
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Targets</h1>
          <p className="text-text-muted text-sm mt-1">
            Manage your bug bounty programs & targets
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Add Target
        </Button>
      </div>

      {targets.length === 0 ? (
        <EmptyState
          icon={TargetIcon}
          title="No targets yet"
          description="Add your first bug bounty target to get started"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {targets.map((t) => (
            <Card key={t.id} className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <Link href={`/targets/${t.id}`} className="font-semibold truncate hover:text-accent-green transition-colors block">{t.name}</Link>
                  <p className="text-text-muted text-xs capitalize mt-0.5">
                    {t.platform}
                  </p>
                </div>
                <Badge className={STATUS_COLORS[t.status]}>
                  {t.status}
                </Badge>
              </div>

              {t.scope && (
                <p className="text-xs text-text-secondary mb-3 line-clamp-2">
                  {t.scope}
                </p>
              )}

              <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  {t._count.findings} finding{t._count.findings !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-1">
                  {t.url && (
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => openEdit(t)}
                    className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 text-text-muted hover:text-accent-red transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit Target" : "Add Target"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="e.g. HackerOne - GitHub"
              defaultValue={editing?.name}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select id="platform" name="platform" defaultValue={editing?.platform || "independent"}>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={editing?.status || "recon"}>
                {TARGET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="url">Program URL</Label>
            <Input
              id="url"
              name="url"
              placeholder="https://hackerone.com/..."
              defaultValue={editing?.url || ""}
            />
          </div>
          <div>
            <Label htmlFor="scope">Scope</Label>
            <Textarea
              id="scope"
              name="scope"
              placeholder="*.example.com, api.example.com..."
              defaultValue={editing?.scope || ""}
            />
          </div>
          <div>
            <Label htmlFor="notes">Recon Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Tech stack, interesting endpoints, subdomains..."
              rows={4}
              defaultValue={editing?.notes || ""}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setEditing(null);
              }}
            >
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
