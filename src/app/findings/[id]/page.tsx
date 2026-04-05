"use client";

import { useEffect, useState, useTransition, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  Send,
  CheckCircle2,
  CircleDot,
  AlertCircle,
} from "lucide-react";
import { getFinding } from "@/app/actions";
import { Card, Badge } from "@/components/ui";
import {
  SEVERITY_COLORS,
  STATUS_COLORS,
  formatCurrency,
  formatDate,
} from "@/lib/utils";

type FindingDetail = NonNullable<Awaited<ReturnType<typeof getFinding>>>;

function parseImages(images: string | null | undefined): string[] {
  if (!images) return [];
  try { return JSON.parse(images); } catch { return []; }
}

const TIMELINE_STEPS = [
  { key: "foundAt", label: "Discovered", icon: AlertCircle, color: "text-accent-cyan" },
  { key: "reportedAt", label: "Reported", icon: Send, color: "text-accent-blue" },
  { key: "triagedAt", label: "Triaged", icon: CircleDot, color: "text-accent-purple" },
  { key: "resolvedAt", label: "Resolved", icon: CheckCircle2, color: "text-accent-green" },
] as const;

export default function FindingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [finding, setFinding] = useState<FindingDetail | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const data = await getFinding(id);
      setFinding(data as FindingDetail);
    });
  }, [id]);

  if (!finding) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        Loading...
      </div>
    );
  }

  const images = parseImages(finding.images);

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/findings"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Findings
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{finding.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={SEVERITY_COLORS[finding.severity]}>
                {finding.severity}
              </Badge>
              <Badge className={STATUS_COLORS[finding.status]}>
                {finding.status}
              </Badge>
              <span className="text-sm text-text-muted uppercase">
                {finding.vulnType}
              </span>
              <span className="text-sm text-text-muted">
                {finding.target.name}
              </span>
            </div>
          </div>
          {finding.bounty > 0 && (
            <p className="text-2xl font-bold text-accent-green">
              {formatCurrency(finding.bounty)}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Endpoint */}
          {finding.endpoint && (
            <Card>
              <h3 className="text-sm font-semibold text-text-muted mb-2">Endpoint</h3>
              <code className="text-sm text-accent-cyan bg-bg-tertiary px-2 py-1 rounded">
                {finding.endpoint}
              </code>
            </Card>
          )}

          {/* PoC */}
          {finding.poc && (
            <Card>
              <h3 className="text-sm font-semibold text-text-muted mb-3">Proof of Concept</h3>
              <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed bg-bg-tertiary rounded-lg p-4 border border-white/5">
                {finding.poc}
              </div>
            </Card>
          )}

          {/* Screenshots */}
          {images.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-text-muted mb-3">
                Evidence ({images.length} image{images.length !== 1 ? "s" : ""})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {images.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden border border-white/10 hover:border-accent-green/30 transition-colors"
                  >
                    <img
                      src={url}
                      alt="evidence"
                      className="w-full h-48 object-cover"
                    />
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Timeline */}
          <Card>
            <h3 className="text-sm font-semibold text-text-muted mb-4">Timeline</h3>
            <div className="space-y-0">
              {TIMELINE_STEPS.map((step, i) => {
                const date = finding[step.key];
                const isActive = !!date;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`p-1 rounded-full ${
                          isActive ? step.color : "text-text-muted"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div
                          className={`w-px h-8 ${
                            isActive ? "bg-white/20" : "bg-white/5"
                          }`}
                        />
                      )}
                    </div>
                    <div className="pb-6">
                      <p
                        className={`text-sm font-medium ${
                          isActive ? "text-text-primary" : "text-text-muted"
                        }`}
                      >
                        {step.label}
                      </p>
                      {date && (
                        <p className="text-xs text-text-muted mt-0.5">
                          {formatDate(date)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Info */}
          <Card>
            <h3 className="text-sm font-semibold text-text-muted mb-3">Details</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-text-muted">Target</dt>
                <dd className="text-text-primary">{finding.target.name}</dd>
              </div>
              {finding.reportUrl && (
                <div>
                  <dt className="text-text-muted">Report</dt>
                  <dd>
                    <a
                      href={finding.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-cyan hover:underline inline-flex items-center gap-1"
                    >
                      View Report <ExternalLink className="w-3 h-3" />
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-text-muted">Created</dt>
                <dd className="text-text-primary">{formatDate(finding.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Last Updated</dt>
                <dd className="text-text-primary">{formatDate(finding.updatedAt)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
