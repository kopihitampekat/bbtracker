"use client";

import { useEffect, useState, useTransition } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { getAnalytics } from "@/app/actions";
import { Card, Badge, StatCard, EmptyState } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Analytics = Awaited<ReturnType<typeof getAnalytics>>;

const SEVERITY_ORDER = ["critical", "high", "medium", "low", "info"];
const SEVERITY_BAR_COLORS: Record<string, string> = {
  critical: "#ff4757",
  high: "#ffa502",
  medium: "#ffd93d",
  low: "#3742fa",
  info: "#94a3b8",
};

export default function StatsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const d = await getAnalytics();
      setData(d);
    });
  }, []);

  if (!data) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Loading...</div>;
  }

  if (data.totalFindings === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-2">Statistics</h1>
        <EmptyState icon={BarChart3} title="No data yet" description="Start logging findings to see your analytics" />
      </div>
    );
  }

  const severityData = SEVERITY_ORDER
    .filter((s) => data.severityStats[s])
    .map((s) => ({
      severity: s,
      count: data.severityStats[s].count,
      bounty: data.severityStats[s].bounty,
    }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Statistics</h1>
        <p className="text-text-muted text-sm mt-1">Deep dive into your bug bounty performance</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Bounty" value={formatCurrency(data.totalBounty)} />
        <StatCard label="Total Findings" value={data.totalFindings} />
        <StatCard
          label="Avg Triage Time"
          value={data.avgTriageDays !== null ? `${data.avgTriageDays}d` : "N/A"}
          sub="days from report to triage"
        />
        <StatCard
          label="Top Vuln Type"
          value={data.vulnTypeStats[0]?.type?.toUpperCase() || "N/A"}
          sub={data.vulnTypeStats[0] ? `${data.vulnTypeStats[0].count} findings` : ""}
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Finding trend */}
        <Card>
          <h3 className="font-semibold mb-4">Findings Over Time</h3>
          {data.findingTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.findingTrend}>
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#16162a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0" }} />
                <Line type="monotone" dataKey="count" stroke="#00ff88" strokeWidth={2} dot={{ fill: "#00ff88", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-text-muted text-sm text-center py-16">Not enough data</p>
          )}
        </Card>

        {/* Severity distribution */}
        <Card>
          <h3 className="font-semibold mb-4">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={severityData}>
              <XAxis dataKey="severity" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#16162a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0" }} formatter={(value: number, name: string) => [name === "bounty" ? formatCurrency(value) : value, name === "bounty" ? "Bounty" : "Count"]} />
              <Bar dataKey="count" fill="#00d2d3" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Target performance table */}
      <Card className="mb-6">
        <h3 className="font-semibold mb-4">Target Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-2 px-3 text-text-muted font-medium">Target</th>
                <th className="text-left py-2 px-3 text-text-muted font-medium">Platform</th>
                <th className="text-right py-2 px-3 text-text-muted font-medium">Findings</th>
                <th className="text-right py-2 px-3 text-text-muted font-medium">Accepted</th>
                <th className="text-right py-2 px-3 text-text-muted font-medium">Dupes</th>
                <th className="text-right py-2 px-3 text-text-muted font-medium">Success %</th>
                <th className="text-right py-2 px-3 text-text-muted font-medium">Total Bounty</th>
                <th className="text-right py-2 px-3 text-text-muted font-medium">Avg Bounty</th>
              </tr>
            </thead>
            <tbody>
              {data.targetStats.map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2.5 px-3 font-medium">{t.name}</td>
                  <td className="py-2.5 px-3 text-text-muted capitalize">{t.platform}</td>
                  <td className="py-2.5 px-3 text-right">{t.totalFindings}</td>
                  <td className="py-2.5 px-3 text-right text-accent-green">{t.accepted}</td>
                  <td className="py-2.5 px-3 text-right text-accent-orange">{t.duplicates}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={t.successRate >= 50 ? "text-accent-green" : t.successRate >= 25 ? "text-accent-orange" : "text-text-muted"}>
                      {t.successRate}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-accent-green font-medium">{formatCurrency(t.totalBounty)}</td>
                  <td className="py-2.5 px-3 text-right text-text-secondary">{formatCurrency(t.avgBounty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Vuln type performance */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold mb-4">Vulnerability Type Performance</h3>
          <div className="space-y-3">
            {data.vulnTypeStats.map((v) => (
              <div key={v.type} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm text-text-secondary uppercase w-28 shrink-0">{v.type}</span>
                  <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-cyan rounded-full"
                      style={{ width: `${(v.count / data.totalFindings) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-3 shrink-0">
                  <span className="text-xs text-text-muted w-8 text-right">{v.count}</span>
                  <span className="text-xs text-accent-green w-16 text-right">{formatCurrency(v.bounty)}</span>
                  <span className="text-xs text-text-muted w-12 text-right">
                    {v.count > 0 ? Math.round((v.accepted / v.count) * 100) : 0}% acc
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Platform breakdown */}
        <Card>
          <h3 className="font-semibold mb-4">Platform Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(data.platformStats).map(([platform, stats]) => (
              <div key={platform} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium capitalize">{platform}</p>
                  <p className="text-xs text-text-muted">{stats.count} findings, {stats.accepted} accepted</p>
                </div>
                <p className="text-accent-green font-semibold">{formatCurrency(stats.bounty)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
