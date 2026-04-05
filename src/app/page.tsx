"use client";

import { useEffect, useState, useTransition } from "react";
import { getDashboardStats } from "@/app/actions";
import { StatCard, Card, Badge } from "@/components/ui";
import {
  formatCurrency,
  formatDate,
  SEVERITY_COLORS,
  STATUS_COLORS,
} from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Stats = Awaited<ReturnType<typeof getDashboardStats>>;

const PIE_COLORS = ["#ff4757", "#ffa502", "#ffd93d", "#3742fa", "#94a3b8"];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const data = await getDashboardStats();
      setStats(data);
    });
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        Loading...
      </div>
    );
  }

  const severityData = Object.entries(stats.severityBreakdown).map(
    ([name, value]) => ({ name, value })
  );

  const vulnData = Object.entries(stats.vulnTypeBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">
          Your bug bounty journey at a glance
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Earnings"
          value={formatCurrency(stats.totalBounty)}
          sub={`${formatCurrency(stats.acceptedBounty)} accepted`}
        />
        <StatCard
          label="Findings"
          value={stats.totalFindings}
          sub={`across ${stats.totalTargets} targets`}
        />
        <StatCard
          label="Active Targets"
          value={stats.activeTargets}
          sub={`of ${stats.totalTargets} total`}
        />
        <StatCard
          label="Journal Entries"
          value={stats.journalEntries}
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Earnings chart */}
        <Card>
          <h3 className="font-semibold mb-4">Monthly Earnings</h3>
          {stats.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.chartData}>
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#16162a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#e2e8f0",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Earnings"]}
                />
                <Bar dataKey="amount" fill="#00ff88" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-text-muted text-sm text-center py-16">
              No earnings data yet
            </p>
          )}
        </Card>

        {/* Severity breakdown */}
        <Card>
          <h3 className="font-semibold mb-4">Severity Breakdown</h3>
          {severityData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {severityData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#16162a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "#e2e8f0",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {severityData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-text-secondary capitalize">{d.name}</span>
                    <span className="text-text-muted">({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-16">
              No findings data yet
            </p>
          )}
        </Card>
      </div>

      {/* Vuln types & recent findings */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top vuln types */}
        <Card>
          <h3 className="font-semibold mb-4">Top Vulnerability Types</h3>
          {vulnData.length > 0 ? (
            <div className="space-y-3">
              {vulnData.map((d) => {
                const max = Math.max(...vulnData.map((v) => v.value));
                const pct = (d.value / max) * 100;
                return (
                  <div key={d.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary uppercase text-xs">
                        {d.name}
                      </span>
                      <span className="text-text-muted">{d.value}</span>
                    </div>
                    <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-cyan rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-10">
              No findings data yet
            </p>
          )}
        </Card>

        {/* Recent findings */}
        <Card>
          <h3 className="font-semibold mb-4">Recent Findings</h3>
          {stats.recentFindings.length > 0 ? (
            <div className="space-y-3">
              {stats.recentFindings.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{f.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={SEVERITY_COLORS[f.severity]}>
                        {f.severity}
                      </Badge>
                      <Badge className={STATUS_COLORS[f.status]}>
                        {f.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    {f.bounty > 0 && (
                      <p className="text-accent-green text-sm font-semibold">
                        {formatCurrency(f.bounty)}
                      </p>
                    )}
                    <p className="text-xs text-text-muted">
                      {formatDate(f.foundAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm text-center py-10">
              No findings yet
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
