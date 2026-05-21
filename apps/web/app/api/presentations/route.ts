import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const createPresentationSchema = z.object({
  clientId: z.string().min(3),
  title: z.string().min(3)
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createPresentationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { clientId, title } = parsed.data;
  const rfqs = await prisma.rfq.findMany({
    where: { submission: { clientId } },
    include: { insurer: true, quotes: true }
  });

  const comparison = rfqs.map((item) => ({
    insurer: item.insurer.name,
    status: item.status,
    quotes: item.quotes.map((q) => ({
      premium: q.premium,
      deductible: q.deductible,
      coverageSummary: q.coverageSummary
    }))
  }));

  const presentation = await prisma.presentation.create({
    data: {
      clientId,
      title,
      fileUrl: `generated://presentations/${randomUUID()}.pdf`,
      comparisonJson: comparison
    }
  });

  return NextResponse.json(presentation, { status: 201 });
}
