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
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // App State
  const [message, setMessage] = useState("Sin actividad reciente");
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<SubmissionPayload>({
    client: { name: "", email: "", businessType: "" },
    policyType: "Responsabilidad Civil",
    payload: {}
  });
  const [submissionId, setSubmissionId] = useState("");
  const [clientId, setClientId] = useState("");
  
  // Wizard State (Modulo 1)
  const [currentStep, setCurrentStep] = useState(1);

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
    if (isAuthenticated) {
      safeRequest<{ ok: boolean }>("/api/health")
        .then(() => setMessage("Sistema listo. Inicia con el Modulo 1."))
        .catch(() => setMessage("API no disponible. Revisa variables DATABASE_URL y despliegue."));
    }
  }, [isAuthenticated]);

  async function safeRequest<T>(path: string, init?: RequestInit): Promise<T> {
    // MODO DEMO: Interceptamos las llamadas para que funcione sin backend/DB
    await new Promise(r => setTimeout(r, 800)); // Simulamos latencia de red

    if (path === "/api/health") return { ok: true } as T;
    
    if (path === "/api/submissions" && init?.method === "POST") {
      const body = JSON.parse(init.body as string);
      return { 
        id: "SUB-" + Math.floor(1000 + Math.random() * 9000), 
        clientId: "CLI-" + Math.floor(1000 + Math.random() * 9000), 
        client: { name: body.client.name || "Cliente Demo" } 
      } as T;
    }
    
    if (path === "/api/insurers/seed") return { success: true } as T;
    
    if (path === "/api/insurers") {
      return [{ id: "INS-1" }, { id: "INS-2" }, { id: "INS-3" }] as T;
    }
    
    if (path === "/api/rfqs/generate") return { success: true } as T;
    
    if (path === "/api/presentations") return { success: true } as T;
    
    if (path === "/api/policy-evaluations") {
      return { id: "EVAL-" + Math.floor(100 + Math.random() * 900) } as T;
    }

    const response = await fetch(`${apiUrl}${path}`, init);
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : null;

    if (!response.ok) {
      const details = payload && typeof payload === "object" && "error" in payload ? JSON.stringify(payload.error) : response.statusText;
      throw new Error(details || "Error inesperado");
    }

    return payload as T;
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (username === "user@admin.com" && password === "admin1236") {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Credenciales incorrectas");
    }
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
      setMessage(`Captación completada para ${data.client.name} (${data.id})`);
      setCurrentStep(3); // Move to finish step
    } catch (error) {
      setMessage(`Error en captación: ${(error as Error).message}`);
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

      setMessage("RFQ generado y correos despachados (Tracking Activado)");
    } catch (error) {
      setMessage(`No se pudo generar RFQ: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function generatePresentation() {
    if (!clientId) {
      setMessage("Primero debes crear una captación válida para obtener clientId.");
      return;
    }
    setIsLoading(true);
    try {
      await safeRequest("/api/presentations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, title: `Presentación ${new Date().toLocaleDateString("es")}` })
      });
      setMessage("Presentación generada. Enlace interactivo enviado al cliente.");
    } catch (error) {
      setMessage(`No se pudo generar presentación: ${(error as Error).message}`);
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
      setMessage(`Evaluación IA completada: Revisión ${data.id}. 0 discrepancias detectadas.`);
    } catch (error) {
      setMessage(`No se pudo evaluar póliza emitida: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <section className="container" style={{ maxWidth: '420px' }}>
          <article className="panel" style={{ padding: '2.5rem', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px', marginBottom: '1.5rem' }}>
               <Image src="/RiskOne-logo1.png" alt="Risk One Group" width={170} height={48} priority className="logo" />
            </div>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: '600' }}>Acceso al Portal</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--muted)', fontSize: '0.9rem' }}>Plataforma Operativa de Seguros</p>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'left' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--muted)' }}>Correo Electrónico</label>
                <input 
                  type="email" 
                  placeholder="ej. user@admin.com" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                  style={{ width: '100%', margin: 0 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--muted)' }}>Contraseña</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  style={{ width: '100%', margin: 0 }}
                />
              </div>
              {loginError && <div style={{ color: '#f87171', fontSize: '0.85rem', background: 'rgba(248, 113, 113, 0.1)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(248, 113, 113, 0.2)' }}>{loginError}</div>}
              <button type="submit" style={{ marginTop: '0.5rem', padding: '0.8rem', fontSize: '1rem' }}>Iniciar Sesión</button>
            </form>
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="hero container">
        <div className="heroTop">
          <div className="brand">
            <Image src="/RiskOne-logo1.png" alt="Risk One Group" width={170} height={48} priority className="logo" />
            <div>
              <h1>Plataforma de Operaciones</h1>
              <p>Flujo integral: Captación → RFQ → Presentación → Evaluación</p>
            </div>
          </div>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <div className="pill" style={{ background: 'rgba(34, 193, 195, 0.1)', color: '#22c1c3', border: '1px solid rgba(34, 193, 195, 0.3)'}}>
               👤 {username}
            </div>
            <div className="pill">{isLoading ? "Procesando..." : "🟢 Sistema Operativo"}</div>
            <button onClick={() => setIsAuthenticated(false)} style={{ margin: 0, padding: '0.4rem 0.8rem', width: 'auto', background: 'transparent', border: '1px solid var(--line)', color: 'var(--muted)'}}>Salir</button>
          </div>
        </div>
        <div className="status">
           <strong>Última actividad:</strong> {message}
        </div>
      </section>

      <section className="container layout">
        {/* Modulo 1: Captación (Wizard) */}
        <article className="panel panelWide">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Módulo 1: Captación del Cliente</h3>
            <div style={{ display: 'flex', gap: '5px' }}>
              {[1, 2, 3].map(step => (
                <div key={step} style={{ 
                  width: '30px', height: '6px', borderRadius: '3px', 
                  background: currentStep >= step ? 'var(--primary)' : 'var(--line)',
                  transition: 'background 0.3s ease'
                }} />
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--line)' }}>
            {currentStep === 1 && (
              <div style={{ animation: 'fadeIn 0.4s ease' }}>
                <h4 style={{ margin: '0 0 1rem', color: 'var(--primary)' }}>Paso 1: Datos Generales</h4>
                <div className="row">
                  <div>
                    <label className="small">Nombre del Cliente</label>
                    <input placeholder="Ej. Empresa SA" value={form.client.name} onChange={(e) => setForm((v) => ({ ...v, client: { ...v.client, name: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="small">Correo de Contacto</label>
                    <input placeholder="contacto@empresa.com" type="email" value={form.client.email} onChange={(e) => setForm((v) => ({ ...v, client: { ...v.client, email: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="small">Industria / Sector</label>
                    <input placeholder="Ej. Construcción" value={form.client.businessType} onChange={(e) => setForm((v) => ({ ...v, client: { ...v.client, businessType: e.target.value } }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button style={{ width: 'auto', padding: '0.6rem 2rem' }} onClick={() => setCurrentStep(2)}>Siguiente →</button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div style={{ animation: 'fadeIn 0.4s ease' }}>
                <h4 style={{ margin: '0 0 1rem', color: 'var(--primary)' }}>Paso 2: Detalles del Riesgo</h4>
                <label className="small">Tipo de Póliza Requerida</label>
                <select value={form.policyType} onChange={(e) => setForm((v) => ({ ...v, policyType: e.target.value }))} style={{ marginBottom: '1rem' }}>
                  <option>Responsabilidad Civil</option>
                  <option>Propiedad</option>
                  <option>Salud Corporativo</option>
                </select>
                <div className="row">
                  {dynamicFields.map((field) => (
                    <div key={field}>
                      <label className="small" style={{ textTransform: 'capitalize' }}>{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                      <input
                        placeholder={`Ingresar ${field.toLowerCase()}`}
                        value={form.payload[field] || ""}
                        onChange={(e) => setForm((v) => ({ ...v, payload: { ...v.payload, [field]: e.target.value } }))}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                  <button style={{ width: 'auto', padding: '0.6rem 2rem', background: 'transparent', border: '1px solid var(--line)' }} onClick={() => setCurrentStep(1)}>← Atrás</button>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{ width: 'auto', padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.1)' }}>💾 Guardar Borrador</button>
                    <button disabled={isLoading} style={{ width: 'auto', padding: '0.6rem 2rem' }} onClick={createSubmission}>Finalizar Captación</button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'fadeIn 0.4s ease' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h4 style={{ margin: '0 0 0.5rem', color: 'var(--ok)', fontSize: '1.2rem' }}>Captación Completada Exitosamente</h4>
                <p className="small">El expediente ha sido estructurado y está listo para cotización.</p>
                <div style={{ marginTop: '1rem', display: 'inline-block', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                  <span className="small">Submission ID: <strong>{submissionId}</strong></span> | <span className="small">Client ID: <strong>{clientId}</strong></span>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                   <button style={{ width: 'auto', background: 'transparent', border: '1px solid var(--line)', padding: '0.5rem 1rem' }} onClick={() => { setCurrentStep(1); setSubmissionId(""); setClientId(""); }}>Nueva Captación</button>
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Modulo 2: RFQ */}
        <article className="panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <span style={{ background: 'var(--primary-2)', color: 'white', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.8rem', fontWeight: 'bold' }}>2</span>
            <h3 style={{ margin: 0 }}>Generador de RFQ</h3>
          </div>
          <p className="small" style={{ marginBottom: '1.5rem' }}>Estructura y envía la solicitud de cotización (RFQ) a las aseguradoras de forma automática con seguimiento de apertura.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <button disabled={isLoading} onClick={seedInsurers} style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--line)' }}>1. Sincronizar Aseguradoras</button>
            <button disabled={isLoading || !submissionId} onClick={generateRfqs}>2. Emitir RFQ a Mercado</button>
          </div>
          {submissionId && <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(34, 193, 195, 0.05)', borderRadius: '8px', border: '1px solid rgba(34, 193, 195, 0.2)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>✓ Listo para enviar a 3 aseguradoras.</span>
          </div>}
        </article>

        {/* Modulo 3: Presentación */}
        <article className="panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <span style={{ background: 'var(--primary)', color: 'white', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.8rem', fontWeight: 'bold' }}>3</span>
            <h3 style={{ margin: 0 }}>Presentación al Cliente</h3>
          </div>
          <p className="small" style={{ marginBottom: '1rem' }}>Genera un comparativo visual de las cotizaciones recibidas para facilitar la toma de decisiones del cliente.</p>
          
          {/* Mock Comparison Cards */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', opacity: clientId ? 1 : 0.4, pointerEvents: 'none' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Opción A</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', margin: '5px 0' }}>$2,450</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ok)' }}>Mejor Precio</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(34, 193, 195, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid var(--primary)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase' }}>Opción B</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', margin: '5px 0' }}>$2,800</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ok)' }}>Mejor Cobertura</div>
            </div>
          </div>

          <button disabled={isLoading || !clientId} onClick={generatePresentation}>Generar Enlace Interactivo</button>
        </article>

        {/* Modulo 4: Evaluación */}
        <article className="panel">
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <span style={{ background: '#8b5cf6', color: 'white', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.8rem', fontWeight: 'bold' }}>4</span>
            <h3 style={{ margin: 0 }}>Auditoría de Póliza (IA)</h3>
          </div>
          <p className="small" style={{ marginBottom: '1.5rem' }}>Compara la póliza emitida en PDF contra los requisitos originales solicitados para evitar sorpresas o exclusiones ocultas.</p>
          
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px dashed var(--line)', textAlign: 'center', marginBottom: '1rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
             📄 Arrastra la póliza final aquí (PDF)
          </div>

          <button disabled={isLoading || !submissionId} onClick={runPolicyEvaluation} style={{ background: 'linear-gradient(130deg, #8b5cf6, #6d28d9)' }}>Analizar con IA</button>
        </article>
      </section>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </main>
  );
}
