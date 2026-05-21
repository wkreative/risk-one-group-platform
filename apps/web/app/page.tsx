"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

type SubmissionPayload = {
  client: { name: string; email: string; businessType: string };
  policyType: string;
  payload: Record<string, string>;
};

export default function HomePage() {
  const [message, setMessage] = useState("Sin actividad reciente");
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    safeRequest<{ ok: boolean }>("/api/health")
      .then(() => setMessage("Sistema listo. Inicia con el Modulo 1."))
      .catch(() => setMessage("API no disponible. Revisa variables DATABASE_URL y despliegue."));
  }, []);

  async function safeRequest<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${apiUrl}${path}`, init);
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : null;

    if (!response.ok) {
      const details = payload && typeof payload === "object" && "error" in payload ? JSON.stringify(payload.error) : response.statusText;
      throw new Error(details || "Error inesperado");
    }

    return payload as T;
  }

  function requireSubmission() {
    if (!submissionId) {
      setMessage("Primero debes completar el Modulo 1 para crear un submission.");
      return false;
    }
    return true;
  }

  async function createSubmission() {
    setIsLoading(true);
    try {
      const data = await safeRequest<{ id: string; clientId: string; client: { name: string } }>("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      setSubmissionId(data.id);
      setClientId(data.clientId);
      setMessage(`Captacion completada para ${data.client.name} (${data.id})`);
    } catch (error) {
      setMessage(`Error en captacion: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function seedInsurers() {
    setIsLoading(true);
    try {
      await safeRequest("/api/insurers/seed", { method: "POST" });
      setMessage("Aseguradoras semilla listas");
    } catch (error) {
      setMessage(`No se pudieron sembrar aseguradoras: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function generateRfqs() {
    if (!requireSubmission()) return;
    setIsLoading(true);
    try {
      const insurers = await safeRequest<Array<{ id: string }>>("/api/insurers");
      if (insurers.length === 0) {
        setMessage("No hay aseguradoras cargadas. Usa primero 'Sembrar Aseguradoras'.");
        return;
      }

      await safeRequest("/api/rfqs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, insurerIds: insurers.map((i) => i.id) })
      });

      setMessage("RFQ generado y correos despachados (si SMTP esta configurado)");
    } catch (error) {
      setMessage(`No se pudo generar RFQ: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function generatePresentation() {
    if (!clientId) {
      setMessage("Primero debes crear una captacion valida para obtener clientId.");
      return;
    }
    setIsLoading(true);
    try {
      await safeRequest("/api/presentations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, title: `Presentacion ${new Date().toLocaleDateString("es")}` })
      });
      setMessage("Presentacion generada para cliente");
    } catch (error) {
      setMessage(`No se pudo generar presentacion: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function runPolicyEvaluation() {
    if (!requireSubmission()) return;
    setIsLoading(true);
    try {
      const data = await safeRequest<{ id: string }>("/api/policy-evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          issuedPolicyText:
            "This policy includes limitecobertura and actividadprincipal. No sections are excluded from standard accidental coverage.",
          requestedClauses: ["limitecobertura", "actividadprincipal", "cobertura internacional"]
        })
      });
      setMessage(`Evaluacion completada: review ${data.id}`);
    } catch (error) {
      setMessage(`No se pudo evaluar poliza emitida: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero container">
        <div className="heroTop">
          <div className="brand">
            <Image src="/RiskOne-logo1.png" alt="Risk One Group" width={170} height={48} priority className="logo" />
            <div>
              <h1>Plataforma de Operaciones</h1>
              <p>Flujo integral de seguros: captacion, RFQ, presentacion y evaluacion</p>
            </div>
          </div>
          <div className="pill">{isLoading ? "Procesando..." : "Operativa"}</div>
        </div>
        <div className="status">{message}</div>
      </section>

      <section className="container layout">
        <article className="panel panelWide">
          <h3>Modulo 1 - Captacion del cliente</h3>
          <div className="row">
            <input placeholder="Nombre del cliente" onChange={(e) => setForm((v) => ({ ...v, client: { ...v.client, name: e.target.value } }))} />
            <input placeholder="Email" type="email" onChange={(e) => setForm((v) => ({ ...v, client: { ...v.client, email: e.target.value } }))} />
            <input placeholder="Tipo de negocio" onChange={(e) => setForm((v) => ({ ...v, client: { ...v.client, businessType: e.target.value } }))} />
          </div>
          <select value={form.policyType} onChange={(e) => setForm((v) => ({ ...v, policyType: e.target.value }))}>
            <option>Responsabilidad Civil</option>
            <option>Propiedad</option>
            <option>Salud Corporativo</option>
          </select>
          <div className="row">
            {dynamicFields.map((field) => (
              <input
                key={field}
                placeholder={field}
                onChange={(e) => setForm((v) => ({ ...v, payload: { ...v.payload, [field]: e.target.value } }))}
              />
            ))}
          </div>
          <button disabled={isLoading} onClick={createSubmission}>Guardar Captacion</button>
          <p className="small">Submission ID: {submissionId || "-"} | Client ID: {clientId || "-"}</p>
        </article>

        <article className="panel">
          <h3>Modulo 2 - RFQ</h3>
          <button disabled={isLoading} onClick={seedInsurers}>Sembrar Aseguradoras</button>
          <button disabled={isLoading} onClick={generateRfqs}>Generar RFQ y Enviar</button>
          <p className="small">El sistema construye la solicitud y dispara envio automatico por aseguradora.</p>
        </article>

        <article className="panel">
          <h3>Modulo 3 - Presentacion</h3>
          <button disabled={isLoading} onClick={generatePresentation}>Crear Presentacion Cliente</button>
          <p className="small">Consolida alternativas de cobertura y prepara una salida profesional.</p>
        </article>

        <article className="panel">
          <h3>Modulo 4 - Evaluacion de Poliza</h3>
          <button disabled={isLoading} onClick={runPolicyEvaluation}>Ejecutar Evaluacion</button>
          <p className="small">Detecta clausulas faltantes, lenguaje no conforme y contradicciones.</p>
        </article>
      </section>
    </main>
  );
}
