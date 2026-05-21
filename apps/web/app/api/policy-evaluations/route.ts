import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const evaluationSchema = z.object({
  submissionId: z.string().min(3),
  issuedPolicyText: z.string().min(30),
  requestedClauses: z.array(z.string().min(3)).min(1)
});

function evaluatePolicy(issuedPolicyText: string, requestedClauses: string[]) {
  const normalized = issuedPolicyText.toLowerCase();
  const missingClauses = requestedClauses.filter((clause) => !normalized.includes(clause.toLowerCase()));
  const contradictoryMarkers = ["excluded", "not covered", "void", "invalid"];
  const contradictions = contradictoryMarkers.filter((token) => normalized.includes(token));

  return {
    missingClauses,
    contradictions,
    isCompliant: missingClauses.length === 0 && contradictions.length === 0
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = evaluationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { submissionId, issuedPolicyText, requestedClauses } = parsed.data;
  const findings = evaluatePolicy(issuedPolicyText, requestedClauses);

  const review = await prisma.policyReview.create({
    data: {
      submissionId,
      issuedPolicyText,
      requestedClauses,
      findingsJson: findings
    }
  });

  return NextResponse.json(review, { status: 201 });
}
