"use client";

import { useMemo, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

type SubmissionPayload = {
  client: { name: string; email: string; businessType: string };
  policyType: string;
  payload: Record<string, string>;
};

export default function HomePage() {
  const [message, setMessage] = useState("Sin actividad reciente");
  const [form, setForm] = useState<SubmissionPayload>({
    client: { name: "", email: "", businessType: "" },
    policyType: "Responsabilidad Civil",
    payload: {}
  });
  const [submissionId, setSubmissionId] = useState("");
  const [clientId, setClientId] = useState("");

  const dynamicFields = useMemo(() => {
    if (form.policyType === "Propiedad") {
      return ["direccionRiesgo", "valorAsegurado", "proteccionIncendio"];
    }
    if (form.policyType === "Salud Corporativo") {
      return ["numeroEmpleados", "siniestralidad3Anos", "coberturaInternacional"];
    }
    return ["actividadPrincipal", "limiteCobertura", "experienciaReclamos"];
  }, [form.policyType]);

  async function createSubmission() {
    const response = await fetch(`${apiUrl}/api/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(`Error en captacion: ${JSON.stringify(data.error)}`);
      return;
    }
    setSubmissionId(data.id);
    setClientId(data.clientId);
    setMessage(`Captacion completada para ${data.client.name} (${data.id})`);
  }

  async function seedInsurers() {
    const response = await fetch(`${apiUrl}/api/insurers/seed`, { method: "POST" });
    if (!response.ok) {
      setMessage("No se pudieron sembrar aseguradoras");
      return;
    }
    setMessage("Aseguradoras semilla listas");
  }

  async function generateRfqs() {
    const listResponse = await fetch(`${apiUrl}/api/insurers`);
    const insurers = await listResponse.json();

    const response = await fetch(`${apiUrl}/api/rfqs/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, insurerIds: insurers.map((i: { id: string }) => i.id) })
    });

    if (!response.ok) {
      setMessage("No se pudo generar RFQ. Verifica submission e insurers.");
      return;
    }
    setMessage("RFQ generado y correos despachados (si SMTP configurado)");
  }

  async function generatePresentation() {
    const response = await fetch(`${apiUrl}/api/presentations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, title: `Presentacion ${new Date().toLocaleDateString("es")}` })
    });

    if (!response.ok) {
      setMessage("No se pudo generar presentacion");
      return;
    }
    setMessage("Presentacion generada para cliente");
  }

  async function runPolicyEvaluation() {
    const response = await fetch(`${apiUrl}/api/policy-evaluations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId,
        issuedPolicyText:
          "This policy includes limitecobertura and actividadprincipal. No sections are excluded from standard accidental coverage.",
        requestedClauses: ["limitecobertura", "actividadprincipal", "cobertura internacional"]
      })
    });

    if (!response.ok) {
      setMessage("No se pudo evaluar poliza emitida");
      return;
    }
    const data = await response.json();
    setMessage(`Evaluacion completada: review ${data.id}`);
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>RISK ONE GROUP</h1>
        <p>Plataforma de Operaciones de Seguros en TypeScript</p>
        <span className="badge">Estado: {message}</span>
      </section>

      <section className="grid">
        <article className="card">
          <h3>Modulo 1 - Captacion</h3>
          <div className="row">
            <input placeholder="Nombre cliente" onChange={(e) => setForm((v) => ({ ...v, client: { ...v.client, name: e.target.value } }))} />
            <input placeholder="Email" onChange={(e) => setForm((v) => ({ ...v, client: { ...v.client, email: e.target.value } }))} />
            <input placeholder="Tipo negocio" onChange={(e) => setForm((v) => ({ ...v, client: { ...v.client, businessType: e.target.value } }))} />
          </div>
          <select value={form.policyType} onChange={(e) => setForm((v) => ({ ...v, policyType: e.target.value }))}>
            <option>Responsabilidad Civil</option>
            <option>Propiedad</option>
            <option>Salud Corporativo</option>
          </select>
          {dynamicFields.map((field) => (
            <input
              key={field}
              placeholder={field}
              onChange={(e) => setForm((v) => ({ ...v, payload: { ...v.payload, [field]: e.target.value } }))}
            />
          ))}
          <button onClick={createSubmission}>Guardar Captacion</button>
          <p className="small">Submission ID: {submissionId || "-"}</p>
        </article>

        <article className="card">
          <h3>Modulo 2 - RFQ</h3>
          <button onClick={seedInsurers}>Sembrar Aseguradoras</button>
          <button onClick={generateRfqs}>Generar RFQ y Enviar</button>
          <p className="small">Genera documentos y correos automaticos por aseguradora.</p>
        </article>

        <article className="card">
          <h3>Modulo 3 - Presentacion</h3>
          <button onClick={generatePresentation}>Crear Presentacion Cliente</button>
          <p className="small">Consolida cotizaciones y genera salida profesional.</p>
        </article>

        <article className="card">
          <h3>Modulo 4 - Evaluacion de Poliza</h3>
          <button onClick={runPolicyEvaluation}>Ejecutar Evaluacion</button>
          <p className="small">Detecta clausulas faltantes, lenguaje no conforme y contradicciones.</p>
        </article>
      </section>
    </main>
  );
}
