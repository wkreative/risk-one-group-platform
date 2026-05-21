import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../db.js";

const createPresentationSchema = z.object({
  clientId: z.string().min(3),
  title: z.string().min(3)
});

export const presentationRouter = Router();

presentationRouter.post("/presentations", async (req, res) => {
  const parsed = createPresentationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
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

  return res.status(201).json(presentation);
});

presentationRouter.get("/presentations/:clientId", async (req, res) => {
  const presentations = await prisma.presentation.findMany({
    where: { clientId: req.params.clientId },
    orderBy: { createdAt: "desc" }
  });
  return res.json(presentations);
});
