import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";

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

export const policyEvaluationRouter = Router();

policyEvaluationRouter.post("/policy-evaluations", async (req, res) => {
  const parsed = evaluationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
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

  return res.status(201).json(review);
});

policyEvaluationRouter.get("/policy-evaluations/:submissionId", async (req, res) => {
  const reviews = await prisma.policyReview.findMany({
    where: { submissionId: req.params.submissionId },
    orderBy: { createdAt: "desc" }
  });

  return res.json(reviews);
});
