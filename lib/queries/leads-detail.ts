import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { type Lead, leadActivities, leadNotes, leads } from "@/db/schema";

// ─────────────────────────────────────────────────────────────
// 单条线索 + 时间线（M7 详情页用）
// ─────────────────────────────────────────────────────────────

export async function getLeadById(id: string): Promise<Lead | null> {
  const [row] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return row ?? null;
}

export type TimelineItem =
  | {
      kind: "activity";
      id: string;
      type: string; // CREATE | STATUS_CHANGE | PRIORITY_CHANGE | NOTE_ADDED | FEISHU_CARD_ACTION ...
      content: string;
      actor: string | null;
      createdAt: Date;
    }
  | {
      kind: "note";
      id: string;
      content: string;
      nextFollowUpAt: Date | null;
      completedAt: Date | null;
      createdAt: Date;
    };

export async function getLeadTimeline(leadId: string): Promise<TimelineItem[]> {
  const [activities, notes] = await Promise.all([
    db
      .select()
      .from(leadActivities)
      .where(eq(leadActivities.leadId, leadId))
      .orderBy(desc(leadActivities.createdAt)),
    db
      .select()
      .from(leadNotes)
      .where(eq(leadNotes.leadId, leadId))
      .orderBy(desc(leadNotes.createdAt)),
  ]);

  const items: TimelineItem[] = [
    ...activities.map(
      (a): TimelineItem => ({
        kind: "activity",
        id: a.id,
        type: a.type,
        content: a.content,
        actor: a.actor,
        createdAt: a.createdAt,
      }),
    ),
    ...notes.map(
      (n): TimelineItem => ({
        kind: "note",
        id: n.id,
        content: n.content,
        nextFollowUpAt: n.nextFollowUpAt,
        completedAt: n.completedAt,
        createdAt: n.createdAt,
      }),
    ),
  ];

  // 合并后按 createdAt 倒序
  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return items;
}
