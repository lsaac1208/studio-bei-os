import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { type Faq, faqs } from "@/db/schema";

export async function listFaqs(opts: { includeUnpublished?: boolean } = {}): Promise<Faq[]> {
  if (opts.includeUnpublished) {
    return db.select().from(faqs).orderBy(asc(faqs.order), asc(faqs.createdAt));
  }
  return db
    .select()
    .from(faqs)
    .where(eq(faqs.published, true))
    .orderBy(asc(faqs.order), asc(faqs.createdAt));
}

export async function getFaqById(id: string): Promise<Faq | null> {
  const [row] = await db.select().from(faqs).where(eq(faqs.id, id)).limit(1);
  return row ?? null;
}
