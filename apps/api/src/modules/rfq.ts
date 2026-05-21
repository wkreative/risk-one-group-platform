import { Router } from "express";
import nodemailer from "nodemailer";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../db.js";

const rfqSchema = z.object({
  submissionId: z.string().min(3),
  insurerIds: z.array(z.string().min(3)).min(1)
});

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: false,
  auth: config.smtpUser && config.smtpPass ? { user: config.smtpUser, pass: config.smtpPass } : undefined
});

export const rfqRouter = Router();

rfqRouter.post("/rfqs/generate", async (req, res) => {
  const parsed = rfqSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { submissionId, insurerIds } = parsed.data;

  const submission = await prisma.submission.findUnique({ where: { id: submissionId }, include: { client: true } });
  if (!submission) {
    return res.status(404).json({ error: "Submission not found" });
  }

  const insurers = await prisma.insurer.findMany({ where: { id: { in: insurerIds } } });
  const createdRfqs = [];

  for (const insurer of insurers) {
    const rfqDocument = `RFQ for ${submission.client.name} - ${submission.policyType}`;
    const rfq = await prisma.rfq.create({
      data: {
        submissionId,
        insurerId: insurer.id,
        documentUrl: `generated://${submissionId}/${insurer.id}.txt`,
        status: "DRAFT"
      }
    });

    try {
      await transporter.sendMail({
        from: config.smtpFrom,
        to: insurer.email,
        subject: `RFQ - ${submission.client.name} - ${submission.policyType}`,
        text: `${rfqDocument}\n\nPlease provide your quote response.`
      });

      const sent = await prisma.rfq.update({
        where: { id: rfq.id },
        data: { status: "SENT", emailSentTo: insurer.email }
      });
      createdRfqs.push(sent);
    } catch {
      createdRfqs.push(rfq);
    }
  }

  return res.status(201).json(createdRfqs);
});

rfqRouter.get("/insurers", async (_req, res) => {
  const insurers = await prisma.insurer.findMany({ orderBy: { name: "asc" } });
  return res.json(insurers);
});

rfqRouter.post("/insurers/seed", async (_req, res) => {
  const seeds = [
    { name: "Aseguradora Atlas", email: "rfq@atlas.com", rfqTemplate: "standard" },
    { name: "Proteccion Segura", email: "cotizaciones@proteccion.com", rfqTemplate: "enterprise" },
    { name: "Global Coverage", email: "underwriting@globalcoverage.com", rfqTemplate: "premium" }
  ];
  const created = [];
  for (const insurer of seeds) {
    const item = await prisma.insurer.upsert({
      where: { name: insurer.name },
      update: insurer,
      create: insurer
    });
    created.push(item);
  }
  return res.status(201).json(created);
});
