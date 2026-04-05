"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, BookOpen, Trash2, Pencil } from "lucide-react";
import {
  getJournals,
  getTargets,
  createJournal,
  updateJournal,
  deleteJournal,
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
import { formatDate } from "@/lib/utils";

type JournalEntry = Awaited<ReturnType<typeof getJournals>>[number];
type TargetOption = Awaited<ReturnType<typeof getTargets>>[number];

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [targets, setTargets] = useState<TargetOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const [j, t] = await Promise.all([getJournals(), getTargets()]);
      setEntries(j);
      setTargets(t);
    });
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const targetId = fd.get("targetId") as string;
    const data = {
      content: fd.get("content") as string,
      targetId: targetId || null,
      tags: (fd.get("tags") as string) || undefined,
      date: new Date((fd.get("date") as string) || new Date().toISOString()),
    };

    startTransition(async () => {
      if (editing) {
        await updateJournal(editing.id, data);
      } else {
        await createJournal(data);
      }
      setModalOpen(false);
      setEditing(null);
      load();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this journal entry?")) return;
    startTransition(async () => {
      await deleteJournal(id);
      load();
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Journal</h1>
          <p className="text-text-muted text-sm mt-1">
            Document your daily hunting journey
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> New Entry
        </Button>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No journal entries"
          description="Start documenting your bug bounty journey"
        />
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-text-muted">
                    {formatDate(entry.date)}
                  </p>
                  {entry.target && (
                    <p className="text-xs text-accent-cyan mt-0.5">
                      {entry.target.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditing(entry);
                      setModalOpen(true);
                    }}
                    className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 text-text-muted hover:text-accent-red transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                {entry.content}
              </div>

              {entry.tags && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                  {entry.tags.split(",").map((tag) => (
                    <Badge
                      key={tag.trim()}
                      className="bg-accent-purple/20 text-accent-purple border-accent-purple/30"
                    >
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              )}
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
        title={editing ? "Edit Entry" : "New Journal Entry"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={
                  editing
                    ? new Date(editing.date).toISOString().split("T")[0]
                    : new Date().toISOString().split("T")[0]
                }
              />
            </div>
            <div>
              <Label htmlFor="targetId">Target (optional)</Label>
              <Select
                id="targetId"
                name="targetId"
                defaultValue={editing?.targetId || ""}
              >
                <option value="">No target</option>
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              name="content"
              required
              placeholder="What did you hunt today? What did you learn?"
              rows={8}
              defaultValue={editing?.content}
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              name="tags"
              placeholder="recon, xss, learning (comma-separated)"
              defaultValue={editing?.tags || ""}
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
