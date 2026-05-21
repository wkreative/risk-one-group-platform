import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { authRouter } from "./modules/auth.js";
import { intakeRouter } from "./modules/intake.js";
import { policyEvaluationRouter } from "./modules/policy-evaluation.js";
import { presentationRouter } from "./modules/presentation.js";
import { rfqRouter } from "./modules/rfq.js";

const app = express();

app.use(cors({ origin: config.appUrl }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "risk-one-group-api" });
});

app.use("/api", intakeRouter);
app.use("/api", authRouter);
app.use("/api", rfqRouter);
app.use("/api", presentationRouter);
app.use("/api", policyEvaluationRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ error: err.message });
});

app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
