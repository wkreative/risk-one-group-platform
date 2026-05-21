import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: { submissionId: string } }) {
  const reviews = await prisma.policyReview.findMany({
    where: { submissionId: context.params.submissionId },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(reviews);
}
