"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==================== TARGETS ====================

export async function getTargets() {
  return prisma.target.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { findings: true } } },
  });
}

export async function getTarget(id: string) {
  return prisma.target.findUnique({
    where: { id },
    include: { findings: true },
  });
}

export async function createTarget(data: {
  name: string;
  platform: string;
  url?: string;
  scope?: string;
  status: string;
  notes?: string;
}) {
  await prisma.target.create({ data });
  revalidatePath("/targets");
  revalidatePath("/");
}

export async function updateTarget(
  id: string,
  data: {
    name?: string;
    platform?: string;
    url?: string;
    scope?: string;
    status?: string;
    notes?: string;
  }
) {
  await prisma.target.update({ where: { id }, data });
  revalidatePath("/targets");
  revalidatePath("/");
}

export async function deleteTarget(id: string) {
  await prisma.target.delete({ where: { id } });
  revalidatePath("/targets");
  revalidatePath("/");
}

// ==================== FINDINGS ====================

export async function getFindings() {
  return prisma.finding.findMany({
    orderBy: { createdAt: "desc" },
    include: { target: { select: { name: true } } },
  });
}

export async function createFinding(data: {
  title: string;
  targetId: string;
  vulnType: string;
  severity: string;
  status: string;
  bounty?: number;
  poc?: string;
  endpoint?: string;
  reportUrl?: string;
  reportedAt?: Date | null;
  images?: string;
}) {
  await prisma.finding.create({ data });
  revalidatePath("/findings");
  revalidatePath("/");
}

export async function updateFinding(
  id: string,
  data: {
    title?: string;
    targetId?: string;
    vulnType?: string;
    severity?: string;
    status?: string;
    bounty?: number;
    poc?: string;
    endpoint?: string;
    reportUrl?: string;
    reportedAt?: Date | null;
    triagedAt?: Date | null;
    resolvedAt?: Date | null;
    images?: string;
  }
) {
  await prisma.finding.update({ where: { id }, data });
  revalidatePath("/findings");
  revalidatePath("/");
}

export async function deleteFinding(id: string) {
  await prisma.finding.delete({ where: { id } });
  revalidatePath("/findings");
  revalidatePath("/");
}

// ==================== JOURNAL ====================

export async function getJournals() {
  return prisma.journal.findMany({
    orderBy: { date: "desc" },
    include: { target: { select: { name: true } } },
  });
}

export async function createJournal(data: {
  content: string;
  targetId?: string | null;
  tags?: string;
  date?: Date;
  images?: string;
}) {
  await prisma.journal.create({ data });
  revalidatePath("/journal");
  revalidatePath("/");
}

export async function updateJournal(
  id: string,
  data: {
    content?: string;
    targetId?: string | null;
    tags?: string;
    date?: Date;
    images?: string;
  }
) {
  await prisma.journal.update({ where: { id }, data });
  revalidatePath("/journal");
}

export async function deleteJournal(id: string) {
  await prisma.journal.delete({ where: { id } });
  revalidatePath("/journal");
}

// ==================== DASHBOARD ====================

export async function getDashboardStats() {
  const [targets, findings, journals, earningsByMonth] = await Promise.all([
    prisma.target.findMany({
      include: { _count: { select: { findings: true } } },
    }),
    prisma.finding.findMany({
      include: { target: { select: { name: true } } },
    }),
    prisma.journal.count(),
    prisma.finding.groupBy({
      by: ["status"],
      _sum: { bounty: true },
      _count: true,
    }),
  ]);

  const totalBounty = findings.reduce((sum, f) => sum + f.bounty, 0);
  const acceptedFindings = findings.filter((f) => f.status === "accepted" || f.status === "resolved");
  const acceptedBounty = acceptedFindings.reduce((sum, f) => sum + f.bounty, 0);

  const severityBreakdown = findings.reduce(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const vulnTypeBreakdown = findings.reduce(
    (acc, f) => {
      acc[f.vulnType] = (acc[f.vulnType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const recentFindings = findings.slice(0, 5);

  // Monthly earnings for chart
  const monthlyEarnings = findings
    .filter((f) => f.bounty > 0)
    .reduce(
      (acc, f) => {
        const month = new Date(f.foundAt).toISOString().slice(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + f.bounty;
        return acc;
      },
      {} as Record<string, number>
    );

  const chartData = Object.entries(monthlyEarnings)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  return {
    totalTargets: targets.length,
    activeTargets: targets.filter((t) => t.status === "hunting" || t.status === "recon").length,
    totalFindings: findings.length,
    totalBounty,
    acceptedBounty,
    journalEntries: journals,
    severityBreakdown,
    vulnTypeBreakdown,
    recentFindings,
    chartData,
    statusBreakdown: earningsByMonth,
  };
}
