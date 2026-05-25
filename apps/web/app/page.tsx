"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type SubmissionPayload = {
  client: { name: string; email: string; businessType: string };
  policyType: string;
  payload: Record<string, string>;
  additionalNotes: string;
};

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeView, setActiveView] = useState("dashboard"); 
  const [hasClient, setHasClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [form, setForm] = useState<SubmissionPayload>({
    client: { name: "", email: "", businessType: "" },
    policyType: "Responsabilidad Civil",
    payload: {},
    additionalNotes: ""
  });
  
  // M2
  const insurers = [
    { id: "INS-1", name: "Chubb Seguros" },
    { id: "INS-2", name: "Mapfre" },
    { id: "INS-3", name: "Zurich" },
    { id: "INS-4", name: "AIG" },
    { id: "INS-5", name: "Liberty Mutual" }
  ];
  const [selectedInsurers, setSelectedInsurers] = useState<string[]>([]);
  const [rfqSent, setRfqSent] = useState(false);

  // M3
  const [quotesUploaded, setQuotesUploaded] = useState<Record<string, boolean>>({});
  const [presentationGenerated, setPresentationGenerated] = useState(false);

  // M4
  const [policyUploaded, setPolicyUploaded] = useState(false);
  const [evaluationDone, setEvaluationDone] = useState(false);

  const dynamicFields = useMemo(() => {
    if (form.policyType === "Propiedad") {
      return ["direccionRiesgo", "valorAsegurado", "proteccionIncendio"];
    }
    if (form.policyType === "Salud Corporativo") {
      return ["numeroEmpleados", "siniestralidad3Anos", "coberturaInternacional"];
    }
    return ["actividadPrincipal", "limiteCobertura", "experienciaReclamos"];
  }, [form.policyType]);

  const formatCurrency = (val: string) => {
    const num = val.replace(/[^0-9]/g, "");
    if (!num) return "";
    return "$" + parseInt(num, 10).toLocaleString("en-US");
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "valorAsegurado" || field === "proteccionIncendio" || field === "limiteCobertura") {
      value = formatCurrency(value);
    }
    setForm(v => ({ ...v, payload: { ...v.payload, [field]: value } }));
  };

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (username === "user@admin.com" && password === "admin1236") {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Credenciales incorrectas");
    }
  }

  // --- Actions ---
  const delay = () => new Promise(r => setTimeout(r, 800));

  async function createSubmission() {
    setIsLoading(true);
    await delay();
    setHasClient(true);
    setIsLoading(false);
    setActiveView("m2");
  }

  async function producePDF() {
    setIsLoading(true);
    await delay();
    alert("PDF del RFQ estructurado y guardado en el expediente.");
    setIsLoading(false);
  }

  async function sendRfq() {
    if (selectedInsurers.length === 0) {
      alert("Selecciona al menos una aseguradora.");
      return;
    }
    setIsLoading(true);
    await delay();
    setRfqSent(true);
    setIsLoading(false);
    setActiveView("m3");
  }

  function handleQuoteUpload(id: string) {
    setQuotesUploaded(prev => ({ ...prev, [id]: true }));
  }

  async function createPresentation() {
    setIsLoading(true);
    await delay();
    setPresentationGenerated(true);
    setIsLoading(false);
  }

  async function analyzePolicy() {
    if (!policyUploaded) {
      alert("Sube la póliza primero.");
      return;
    }
    setIsLoading(true);
    await delay();
    setEvaluationDone(true);
    setIsLoading(false);
  }

  if (!isAuthenticated) {
    return (
      <main className="login-wrapper">
        <section className="login-box">
          <div className="login-logo">
             <Image src="/RiskOne-logo1.png" alt="Risk One Group" width={200} height={56} priority />
          </div>
          <h2>Acceso Corporativo</h2>
          <p>Portal Operativo de Seguros</p>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Correo Electrónico</label>
              <input type="email" placeholder="user@admin.com" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Contraseña</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {loginError && <div className="error-box">{loginError}</div>}
            <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '1rem'}}>Iniciar Sesión</button>
          </form>
        </section>
        <style dangerouslySetInnerHTML={{__html: `
          body { margin: 0; font-family: 'Inter', sans-serif; background: #e2e8f0; }
          .login-wrapper { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .login-box { background: white; padding: 3rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); width: 100%; max-width: 400px; }
          .login-logo { margin-bottom: 2rem; text-align: center; }
          .login-box h2 { margin: 0 0 0.5rem; font-size: 1.5rem; color: #0f172a; }
          .login-box p { color: #64748b; margin: 0 0 2rem; font-size: 0.9rem; }
          .input-group { margin-bottom: 1.5rem; }
          .input-group label { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.5rem; color: #1e293b; }
          input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95rem; box-sizing: border-box; color: #1e293b; background: white; }
          input::placeholder { color: #94a3b8; }
          .btn-primary { background: #0f172a; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 500; cursor: pointer; }
          .error-box { background: #fef2f2; border: 1px solid #fca5a5; color: #ef4444; padding: 0.5rem; border-radius: 6px; font-size: 0.85rem; margin-bottom: 1rem; }
        `}} />
      </main>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar Nav */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Image src="/RiskOne-logo1.png" alt="Risk One Group" width={150} height={42} priority />
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">PRINCIPAL</div>
          <button className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
            📊 Dashboard
          </button>
          
          <div className="nav-section" style={{marginTop: '2rem'}}>CLIENTES ACTIVOS</div>
          <div className="client-folder">
            <div className="client-name">
              📁 {form.client.name || "Nuevo Prospecto"}
            </div>
            <div className="client-modules">
              <button className={`nav-item sub-item ${activeView === 'm1' ? 'active' : ''}`} onClick={() => setActiveView('m1')}>
                1. Captación
              </button>
              <button disabled={!hasClient} className={`nav-item sub-item ${activeView === 'm2' ? 'active' : ''}`} onClick={() => setActiveView('m2')}>
                2. Generar RFQ
              </button>
              <button disabled={!rfqSent} className={`nav-item sub-item ${activeView === 'm3' ? 'active' : ''}`} onClick={() => setActiveView('m3')}>
                3. Presentación
              </button>
              <button disabled={!hasClient} className={`nav-item sub-item ${activeView === 'm4' ? 'active' : ''}`} onClick={() => setActiveView('m4')}>
                4. Auditoría IA
              </button>
            </div>
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">👤 {username}</div>
          <button onClick={() => setIsAuthenticated(false)} className="btn-logout">Cerrar Sesión</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <h2>
            {activeView === 'dashboard' && "Panel General"}
            {activeView === 'm1' && "Módulo 1: Datos Generales e Intake"}
            {activeView === 'm2' && "Módulo 2: Emisión de RFQ a Mercado"}
            {activeView === 'm3' && "Módulo 3: Análisis de Cotizaciones"}
            {activeView === 'm4' && "Módulo 4: Auditoría de Póliza Emitida"}
          </h2>
        </header>

        <div className="content-area">
          {activeView === 'dashboard' && (
            <div className="card fade-in">
              <h3 style={{marginTop: 0}}>Bienvenido al Portal Operativo</h3>
              <p className="text-muted">Selecciona un cliente en el panel izquierdo para gestionar su póliza, o inicia un nuevo expediente.</p>
              <button className="btn-primary" onClick={() => setActiveView('m1')} style={{marginTop: '1rem'}}>+ Nueva Captación de Cliente</button>
            </div>
          )}

          {activeView === 'm1' && (
            <div className="card fade-in">
              <div className="form-grid">
                <div className="input-group">
                  <label>Nombre del Cliente</label>
                  <input placeholder="Ej. Empresa SA" value={form.client.name} onChange={e => setForm(v => ({ ...v, client: { ...v.client, name: e.target.value } }))} />
                </div>
                <div className="input-group">
                  <label>Correo de Contacto</label>
                  <input type="email" placeholder="contacto@empresa.com" value={form.client.email} onChange={e => setForm(v => ({ ...v, client: { ...v.client, email: e.target.value } }))} />
                </div>
                <div className="input-group">
                  <label>Industria / Sector</label>
                  <input placeholder="Ej. Construcción" value={form.client.businessType} onChange={e => setForm(v => ({ ...v, client: { ...v.client, businessType: e.target.value } }))} />
                </div>
              </div>

              <hr className="divider" />
              
              <div className="input-group" style={{maxWidth: '300px', marginBottom: '1.5rem'}}>
                <label>Tipo de Póliza Requerida</label>
                <select value={form.policyType} onChange={e => setForm(v => ({ ...v, policyType: e.target.value }))}>
                  <option>Responsabilidad Civil</option>
                  <option>Propiedad</option>
                  <option>Salud Corporativo</option>
                </select>
              </div>

              <div className="form-grid">
                {dynamicFields.map(field => (
                  <div className="input-group" key={field}>
                    <label style={{textTransform: 'capitalize'}}>{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                    <input
                      placeholder={field === 'valorAsegurado' || field === 'proteccionIncendio' ? '$0' : `Ingresar ${field.toLowerCase()}`}
                      value={form.payload[field] || ""}
                      onChange={e => handleInputChange(field, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="input-group" style={{marginTop: '1.5rem'}}>
                <label>Especificaciones Adicionales / Notas</label>
                <textarea 
                  rows={4} 
                  placeholder="Escribe comentarios, requisitos especiales o exclusiones deseadas..."
                  value={form.additionalNotes}
                  onChange={e => setForm(v => ({ ...v, additionalNotes: e.target.value }))}
                />
              </div>

              <div className="actions-right">
                <button className="btn-primary" onClick={createSubmission} disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar Expediente →"}
                </button>
              </div>
            </div>
          )}

          {activeView === 'm2' && (
            <div className="card fade-in">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                <div>
                  <h3 style={{margin: 0}}>Generador de Solicitud de Cotización (RFQ)</h3>
                  <p className="text-muted" style={{marginTop: '5px', fontSize: '0.9rem'}}>Selecciona a qué aseguradoras deseas invitar a cotizar.</p>
                </div>
                <button className="btn-secondary" onClick={producePDF} disabled={isLoading}>📄 Producir PDF con el RFQ</button>
              </div>

              <h4 style={{marginBottom: '1rem'}}>Mercado Disponible</h4>
              <div className="insurer-list">
                {insurers.map(ins => (
                  <label key={ins.id} className="insurer-row">
                    <input 
                      type="checkbox" 
                      checked={selectedInsurers.includes(ins.id)}
                      onChange={e => {
                        if (e.target.checked) setSelectedInsurers([...selectedInsurers, ins.id]);
                        else setSelectedInsurers(selectedInsurers.filter(id => id !== ins.id));
                      }}
                    />
                    <span className="ins-name">{ins.name}</span>
                  </label>
                ))}
              </div>

              <div className="actions-right" style={{marginTop: '2rem'}}>
                <button className="btn-primary" onClick={sendRfq} disabled={isLoading || selectedInsurers.length === 0}>
                  {isLoading ? "Enviando..." : `✉️ Enviar RFQ a ${selectedInsurers.length} Aseguradoras`}
                </button>
              </div>
            </div>
          )}

          {activeView === 'm3' && (
            <div className="card fade-in">
              <h3 style={{marginTop: 0, marginBottom: '0.5rem'}}>Recepción de Cotizaciones</h3>
              <p className="text-muted" style={{marginBottom: '2rem'}}>Adjunta las cotizaciones recibidas de las aseguradoras seleccionadas.</p>

              <div className="quote-upload-list">
                {selectedInsurers.length === 0 && <p className="text-muted">No seleccionaste ninguna aseguradora en el Módulo 2.</p>}
                {selectedInsurers.map(insId => {
                  const ins = insurers.find(i => i.id === insId);
                  const isUploaded = quotesUploaded[insId];
                  return (
                    <div key={insId} className={`quote-row ${isUploaded ? 'uploaded' : ''}`}>
                      <div className="ins-name">🏢 {ins?.name}</div>
                      <div className="upload-action">
                        {isUploaded ? (
                          <span className="badge-success">✓ Cotización Adjunta</span>
                        ) : (
                          <button className="btn-outline" onClick={() => handleQuoteUpload(insId)}>📎 Adjuntar Cotización</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {presentationGenerated ? (
                <div className="success-panel" style={{marginTop: '2rem'}}>
                  <h4 style={{margin: '0 0 0.5rem', color: '#15803d'}}>¡Presentación Creada!</h4>
                  <p style={{margin: 0, fontSize: '0.9rem'}}>Se ha estructurado el comparativo visual para el cliente.</p>
                  <button className="btn-outline" style={{marginTop: '1rem'}}>Abrir Presentación ↗</button>
                </div>
              ) : (
                <div className="actions-right" style={{marginTop: '2rem'}}>
                  <button 
                    className="btn-primary" 
                    onClick={createPresentation} 
                    disabled={isLoading || Object.keys(quotesUploaded).length === 0}
                  >
                    {isLoading ? "Procesando..." : "📊 Crear Presentación Comparativa"}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeView === 'm4' && (
            <div className="card fade-in">
              <h3 style={{marginTop: 0, marginBottom: '0.5rem'}}>Auditoría de Póliza Emitida (IA)</h3>
              <p className="text-muted" style={{marginBottom: '2rem'}}>Sube el contrato final emitido por la aseguradora para validarlo contra el RFQ original.</p>

              {!policyUploaded ? (
                <div className="upload-zone" onClick={() => setPolicyUploaded(true)}>
                  <div style={{fontSize: '2rem', marginBottom: '1rem'}}>📄</div>
                  Haz clic aquí para adjuntar la Póliza Final (PDF)
                </div>
              ) : (
                <div className="upload-zone uploaded" onClick={() => setPolicyUploaded(false)}>
                  ✓ poliza_final_emitida.pdf adjunta
                </div>
              )}

              <div className="actions-right" style={{marginTop: '2rem'}}>
                <button className="btn-primary" onClick={analyzePolicy} disabled={isLoading || !policyUploaded}>
                  {isLoading ? "Analizando documento..." : "🔍 Analizar Póliza con IA"}
                </button>
              </div>

              {evaluationDone && (
                <div className="findings-panel" style={{marginTop: '2rem'}}>
                  <h4>📋 Resumen de Auditoría (Findings)</h4>
                  <ul className="findings-list">
                    <li><span className="status-ok">✓</span> <strong>Límite de Cobertura:</strong> Coincide perfectamente con lo solicitado en el Módulo 1.</li>
                    <li><span className="status-warn">!</span> <strong>Cláusula Adicional:</strong> Se identificó una exclusión no mencionada en el RFQ (Pág. 14 - Riesgos de la naturaleza).</li>
                    <li><span className="status-ok">✓</span> <strong>Datos del Asegurado:</strong> Razón social e industria correctos.</li>
                  </ul>
                  <p style={{marginTop: '1rem', fontSize: '0.85rem', color: '#64748b'}}>* Se recomienda revisar la exclusión en la página 14 antes de entregar el contrato físico al cliente.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Corporate CSS Inject */}
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --bg: #f8fafc;
          --surface: #ffffff;
          --primary: #0f172a;
          --primary-hover: #334155;
          --secondary: #e2e8f0;
          --text: #1e293b;
          --text-muted: #64748b;
          --border: #cbd5e1;
          --success: #10b981;
          --warning: #f59e0b;
        }
        
        * { box-sizing: border-box; font-family: 'Inter', -apple-system, sans-serif; }
        body { margin: 0; background: var(--bg); color: var(--text); }
        
        .dashboard-layout { display: flex; height: 100vh; overflow: hidden; }
        
        /* Sidebar */
        .sidebar { width: 260px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
        .sidebar-brand { padding: 1.5rem; border-bottom: 1px solid var(--border); }
        .sidebar-nav { flex: 1; padding: 1.5rem 0; overflow-y: auto; }
        .nav-section { padding: 0 1.5rem; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 0.5rem; }
        .nav-item { width: 100%; text-align: left; background: none; border: none; padding: 0.6rem 1.5rem; font-size: 0.95rem; color: var(--text); cursor: pointer; transition: background 0.2s; }
        .nav-item:hover:not(:disabled) { background: var(--bg); }
        .nav-item.active { background: var(--primary); color: white; font-weight: 500; }
        .nav-item:disabled { opacity: 0.4; cursor: not-allowed; }
        
        .client-folder { background: #f1f5f9; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin-bottom: 1rem; }
        .client-name { padding: 0.8rem 1.5rem; font-weight: 600; font-size: 0.85rem; color: var(--primary); border-bottom: 1px solid #e2e8f0; text-transform: uppercase; }
        .sub-item { padding-left: 2rem; font-size: 0.85rem; border-bottom: 1px solid #e2e8f0; }
        .sub-item:last-child { border-bottom: none; }
        
        .sidebar-footer { padding: 1.5rem; border-top: 1px solid var(--border); background: var(--bg); }
        .user-info { font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--primary); }
        .btn-logout { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.8rem; padding: 0; text-decoration: underline; }
        
        /* Main */
        .main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
        .topbar { padding: 1.5rem 3rem; border-bottom: 1px solid var(--border); background: var(--surface); }
        .topbar h2 { margin: 0; font-size: 1.4rem; font-weight: 600; color: var(--primary); }
        .content-area { padding: 2.5rem 3rem; max-width: 1000px; }
        
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 2.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        
        /* Forms & Inputs */
        .input-group { margin-bottom: 1.5rem; flex: 1; display: flex; flex-direction: column; }
        .input-group label { font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text); }
        input, select, textarea { width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border); border-radius: 6px; font-size: 0.95rem; background: var(--surface); color: var(--text); outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.1); }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
        .form-grid .input-group { margin-bottom: 0; }
        .divider { border: 0; height: 1px; background: var(--border); margin: 2rem 0; }
        
        /* Buttons */
        .btn-primary { background: var(--primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background 0.2s; font-size: 0.95rem; }
        .btn-primary:hover:not(:disabled) { background: var(--primary-hover); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary { background: var(--secondary); color: var(--text); border: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 500; cursor: pointer; font-size: 0.9rem; }
        .btn-secondary:hover:not(:disabled) { background: #cbd5e1; }
        .btn-outline { background: transparent; border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 0.85rem; }
        .btn-outline:hover { border-color: var(--primary); }
        .actions-right { display: flex; justify-content: flex-end; }
        
        /* Custom UI Elements */
        .insurer-list { border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
        .insurer-row { display: flex; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s; margin: 0; }
        .insurer-row:hover { background: var(--bg); }
        .insurer-row:last-child { border-bottom: none; }
        .insurer-row input { width: auto; margin-right: 1rem; transform: scale(1.2); }
        .ins-name { font-weight: 500; }
        
        .quote-upload-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .quote-row { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; border: 1px solid var(--border); border-radius: 6px; background: #f8fafc; }
        .quote-row.uploaded { background: #f0fdf4; border-color: #86efac; }
        .badge-success { color: var(--success); font-weight: 600; font-size: 0.85rem; }
        
        .upload-zone { border: 2px dashed var(--border); border-radius: 8px; padding: 3rem; text-align: center; cursor: pointer; color: var(--text-muted); transition: all 0.2s; background: var(--bg); }
        .upload-zone:hover { border-color: var(--primary); background: var(--secondary); }
        .upload-zone.uploaded { border-style: solid; border-color: var(--success); background: #f0fdf4; color: var(--success); font-weight: 600; }
        
        .success-panel { background: #f0fdf4; border: 1px solid #86efac; padding: 1.5rem; border-radius: 6px; }
        
        .findings-panel { background: #f8fafc; border: 1px solid var(--border); border-left: 4px solid var(--primary); padding: 1.5rem; border-radius: 6px; }
        .findings-panel h4 { margin: 0 0 1rem; color: var(--primary); }
        .findings-list { list-style: none; padding: 0; margin: 0; }
        .findings-list li { margin-bottom: 0.8rem; font-size: 0.95rem; }
        .status-ok { color: var(--success); font-weight: bold; margin-right: 0.5rem; }
        .status-warn { color: var(--warning); font-weight: bold; margin-right: 0.5rem; }
        
        .text-muted { color: var(--text-muted); }
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
