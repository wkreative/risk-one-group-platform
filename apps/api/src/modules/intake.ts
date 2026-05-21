import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";

const intakeSchema = z.object({
  client: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    businessType: z.string().min(2)
  }),
  policyType: z.string().min(2),
  payload: z.record(z.any())
});

export const intakeRouter = Router();

intakeRouter.post("/submissions", async (req, res) => {
  const result = intakeSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }

  const { client, policyType, payload } = result.data;

  const dbClient = await prisma.client.upsert({
    where: { email: client.email },
    update: { name: client.name, businessType: client.businessType },
    create: client
  });

  const submission = await prisma.submission.create({
    data: {
      clientId: dbClient.id,
      policyType,
      payload,
      status: "SUBMITTED"
    },
    include: { client: true }
  });

  return res.status(201).json(submission);
});

intakeRouter.get("/submissions", async (_req, res) => {
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true }
  });
  return res.json(submissions);
});
