"use client";
import React, { useState, useEffect } from "react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Folder = { id: string; name: string; };
type RequestItem = {
  id: string; folderId: string; name: string; method: string; url: string;
  headers: { key: string; value: string }[]; body: string; response: any | null;
};

export default function Dashboard() {
  const [folders, setFolders] = useState<Folder[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("sirioFolders");
      if (saved) return JSON.parse(saved);
    }
    return [{ id: "f1", name: "Actualizacion WEB Datos Basicos" }];
  });

  const [requests, setRequests] = useState<RequestItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("sirioRequests");
      if (saved) return JSON.parse(saved);
    }
    return [{ id: "1", folderId: "f1", name: "Token", method: "POST", url: "", headers: [{ key: "Content-Type", value: "application/json" }], body: "", response: null }];
  });

  const [activeFolderId, setActiveFolderId] = useState<string>("f1");
  const [activeReqId, setActiveReqId] = useState<string>("1");
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'headers' | 'body'>('body');

  const [fieldDatabase, setFieldDatabase] = useState<Record<string, any>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<string>("");
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);

  useEffect(() => {
    fetch("/api/metadata").then(res => res.json()).then(data => {
      if (!data.error) setFieldDatabase(data);
    }).catch(console.error);
  }, []);

  // Guardar en LocalStorage cada vez que cambian
  useEffect(() => {
    localStorage.setItem("sirioFolders", JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem("sirioRequests", JSON.stringify(requests));
  }, [requests]);

  const activeReq = requests.find(r => r.id === activeReqId);

  const updateActiveReq = (updates: Partial<RequestItem>) => {
    setRequests(prev => prev.map(r => r.id === activeReqId ? { ...r, ...updates } : r));
  };

  const addFolder = () => {
    const newName = prompt("Nombre de la nueva carpeta/requerimiento:");
    if (!newName) return;
    const newId = `f${Date.now()}`;
    setFolders([...folders, { id: newId, name: newName }]);
    setActiveFolderId(newId);
  };

  const addRequestToFolder = (folderId: string) => {
    const newId = Date.now().toString();
    setRequests([...requests, { id: newId, folderId, name: "Nuevo Endpoint", method: "POST", url: "", headers: [{ key: "Content-Type", value: "application/json" }], body: "", response: null }]);
    setActiveFolderId(folderId);
    setActiveReqId(newId);
  };

  const sendRequest = async () => {
    if (!activeReq || !activeReq.url) return;
    setIsSending(true);
    updateActiveReq({ response: null });
    const headersObj: Record<string, string> = {};
    activeReq.headers.forEach(h => { if (h.key.trim()) headersObj[h.key.trim()] = h.value; });
    try {
      const res = await fetch("/api/proxy", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: activeReq.url, method: activeReq.method, headers: headersObj, body: activeReq.body ? JSON.parse(activeReq.body) : null })
      });
      const data = await res.json();
      updateActiveReq({ response: data });
    } catch (error: any) { updateActiveReq({ response: { error: true, body: error.message } }); } finally { setIsSending(false); }
  };

  const saveMetadata = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSavingMetadata(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      fieldName: selectedField, description: formData.get("desc"), dataType: formData.get("type"),
      isMandatory: formData.get("mandatory") === "on", businessValue: formData.get("businessValue")
    };
    try {
      const res = await fetch("/api/metadata", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Error guardando");
      setFieldDatabase(prev => ({ ...prev, [selectedField]: { desc: payload.description, type: payload.dataType, mandatory: payload.isMandatory } }));
      setIsModalOpen(false);
    } catch (error: any) { alert(error.message); } finally { setIsSavingMetadata(false); }
  };

  const extractFieldsFromObj = (obj: any): string[] => {
    if (!obj || typeof obj !== 'object') return [];
    let fields: string[] = [];
    Object.keys(obj).forEach(k => {
      fields.push(k);
      if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
        Object.keys(obj[k]).forEach(subK => fields.push(`${k}.${subK}`));
      }
    });
    return Array.from(new Set(fields));
  };

  const generateFolderPDF = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    const folderReqs = requests.filter(r => r.folderId === folderId);
    
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(242, 101, 34); doc.text("Diccionario de Datos", 14, 30);
    doc.setFontSize(16); doc.setTextColor(40, 40, 40); doc.text(`Proyecto: ${folder.name}`, 14, 40);
    doc.setFontSize(11); doc.setTextColor(100, 100, 100); doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 48);

    let startY = 60;

    folderReqs.forEach((req) => {
      if (startY > 250) { doc.addPage(); startY = 20; }
      doc.setFontSize(14); doc.setTextColor(40, 40, 40); doc.text(`Módulo: ${req.name}`, 14, startY); startY += 8;

      // ENTRADA
      let inFields: string[] = [];
      try { if (req.body) inFields = extractFieldsFromObj(JSON.parse(req.body)); } catch(e){}
      
      if (inFields.length > 0) {
        doc.setFontSize(11); doc.text("Parámetros de Entrada", 14, startY); startY += 5;
        const tableBody = inFields.map(f => {
          const meta = fieldDatabase[f] || fieldDatabase[f.split('.').pop() || ''];
          return [f, meta?.type || 'Alfanumérico', meta?.mandatory ? 'Sí' : 'No', meta?.desc || 'Sin documentar'];
        });
        autoTable(doc, { startY, head: [['Campo', 'Tipo', 'Requerido', 'Descripción']], body: tableBody, headStyles: { fillColor: [242, 101, 34] }, styles: { fontSize: 9 } });
        startY = (doc as any).lastAutoTable.finalY + 10;
      }

      // SALIDA
      let outFields: string[] = [];
      try { if (req.response?.body && !req.response.error) outFields = extractFieldsFromObj(req.response.body); } catch(e){}
      
      if (outFields.length > 0) {
        if (startY > 250) { doc.addPage(); startY = 20; }
        doc.setFontSize(11); doc.text("Parámetros de Salida", 14, startY); startY += 5;
        const tableBody = outFields.map(f => {
          const meta = fieldDatabase[f] || fieldDatabase[f.split('.').pop() || ''];
          return [f, meta?.type || 'Alfanumérico', meta?.desc || 'Sin documentar'];
        });
        autoTable(doc, { startY, head: [['Campo', 'Tipo', 'Descripción']], body: tableBody, headStyles: { fillColor: [44, 62, 80] }, styles: { fontSize: 9 } });
        startY = (doc as any).lastAutoTable.finalY + 15;
      }
    });

    // EVIDENCIAS
    doc.addPage(); startY = 20;
    doc.setFontSize(22); doc.setTextColor(242, 101, 34); doc.text("Evidencias de Ejecución", 14, startY); startY += 15;

    folderReqs.forEach((req) => {
      if (startY > 250) { doc.addPage(); startY = 20; }
      doc.setFontSize(14); doc.setTextColor(40, 40, 40); doc.text(`Petición: ${req.name}`, 14, startY); startY += 6;
      doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.text(`${req.method} ${req.url}`, 14, startY); startY += 10;

      // Evidencia Entrada
      if (req.body) {
        doc.setFontSize(11); doc.setTextColor(242, 101, 34); doc.text("Payload de Entrada (Request):", 14, startY); startY += 6;
        let bodyTxt = req.body;
        try { bodyTxt = JSON.stringify(JSON.parse(req.body), null, 2); } catch(e){}
        const splitText = doc.splitTextToSize(bodyTxt, 180);
        doc.setFont("courier"); doc.setFontSize(8); doc.setTextColor(60, 60, 60);
        const textHeight = splitText.length * 3.5;
        if (startY + textHeight > 280) { doc.addPage(); startY = 20; }
        doc.text(splitText, 14, startY); startY += textHeight + 8;
      }

      // Evidencia Salida
      if (req.response && !req.response.error) {
        if (startY > 260) { doc.addPage(); startY = 20; }
        doc.setFont("helvetica"); doc.setFontSize(11); doc.setTextColor(44, 62, 80); doc.text(`Payload de Salida (Response - ${req.response.status}):`, 14, startY); startY += 6;
        let respTxt = JSON.stringify(req.response.body, null, 2) || "";
        const splitText = doc.splitTextToSize(respTxt, 180);
        doc.setFont("courier"); doc.setFontSize(8); doc.setTextColor(60, 60, 60);
        const textHeight = splitText.length * 3.5;
        if (startY + textHeight > 280) { doc.addPage(); startY = 20; }
        doc.text(splitText, 14, startY); startY += textHeight + 15;
      }
    });

    doc.save(`Diccionario_${folder.name.replace(/\s+/g, '_')}.pdf`);
  };

  const notifyChat = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    setIsNotifying(true);
    const folderReqs = requests.filter(r => r.folderId === folderId);
    
    // Armar Colección Postman v2.1.0
    const collectionJson = {
      info: { name: folder.name, schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
      item: folderReqs.map(req => ({
        name: req.name,
        request: {
          method: req.method,
          header: req.headers.filter(h => h.key.trim() !== "").map(h => ({ key: h.key, value: h.value })),
          body: req.body ? { mode: "raw", raw: req.body, options: { raw: { language: "json" } } } : undefined,
          url: { raw: req.url, host: req.url.split('/') }
        }
      }))
    };

    try {
      const res = await fetch("/api/chat/share", {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: folder.name, collectionJson, origin: window.location.origin })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("¡Colección enviada a Google Chat exitosamente!");
    } catch (e: any) { alert("Error enviando al chat: " + e.message); } finally { setIsNotifying(false); }
  };

  // Obtener campos de la petición activa para documentar en el panel derecho
  let activeInFields: string[] = [];
  let activeOutFields: string[] = [];
  try { if (activeReq?.body) activeInFields = extractFieldsFromObj(JSON.parse(activeReq.body)); } catch(e){}
  try { if (activeReq?.response?.body && !activeReq.response.error) activeOutFields = extractFieldsFromObj(activeReq.response.body); } catch(e){}

  return (
    <div className="flex h-screen bg-[#212121] font-sans text-slate-200 overflow-hidden">
      
      {/* MODAL */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#2B2B2B] rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-[#3A3A3A]">
            <div className="bg-[#1C1C1C] px-6 py-4 flex justify-between items-center border-b border-[#3A3A3A]">
              <h3 className="text-white font-semibold">Documentar Campo</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={saveMetadata} className="p-6 space-y-4">
              <div><label className="text-xs font-bold text-slate-400">CAMPO</label><div className="mt-1 bg-[#1C1C1C] px-3 py-2 rounded text-[#FF6C37] font-mono">{selectedField}</div></div>
              <div><label className="text-xs font-bold text-slate-400">DESCRIPCIÓN</label><input name="desc" type="text" required defaultValue={fieldDatabase[selectedField] ? fieldDatabase[selectedField].desc : fieldDatabase[selectedField.split('.').pop() || '']?.desc || ""} className="mt-1 w-full bg-[#1C1C1C] px-3 py-2 border border-[#3A3A3A] rounded text-white outline-none focus:border-[#FF6C37]" /></div>
              <div className="flex gap-4">
                <div className="flex-1"><label className="text-xs font-bold text-slate-400">TIPO DE DATO</label><select name="type" defaultValue={fieldDatabase[selectedField]?.type || "Alfanumérico"} className="mt-1 w-full bg-[#1C1C1C] px-3 py-2 border border-[#3A3A3A] rounded text-white outline-none"><option>Alfanumérico</option><option>Numérico</option><option>Booleano</option></select></div>
                <div className="flex flex-col justify-center pt-5"><label className="flex items-center gap-2 cursor-pointer"><input name="mandatory" type="checkbox" defaultChecked={fieldDatabase[selectedField] ? fieldDatabase[selectedField].mandatory : true} className="w-4 h-4 accent-[#FF6C37]" /><span className="text-sm font-medium">Requerido</span></label></div>
              </div>
              <div className="pt-4"><button type="submit" disabled={isSavingMetadata} className="w-full bg-[#FF6C37] hover:bg-[#E55B2B] text-white font-bold py-2.5 rounded">{isSavingMetadata ? 'Guardando...' : 'Guardar'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar - Carpetas y Colecciones */}
      <aside className="w-64 bg-[#1C1C1C] flex flex-col border-r border-[#3A3A3A] shrink-0">
        <div className="p-4 border-b border-[#3A3A3A] flex justify-between items-center">
          <h1 className="text-[#FF6C37] font-bold tracking-wide">Sirio QA Hub</h1>
          <button onClick={addFolder} className="text-slate-400 hover:text-white text-xl" title="Nueva Carpeta">+</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {folders.map(f => (
            <div key={f.id} className="mb-2">
              <div className="flex justify-between items-center px-2 mb-1 group">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{f.name}</h3>
                <button onClick={() => addRequestToFolder(f.id)} className="text-slate-500 hover:text-white opacity-0 group-hover:opacity-100">+</button>
              </div>
              <ul className="space-y-0.5">
                {requests.filter(r => r.folderId === f.id).map(r => (
                  <li key={r.id}>
                    <button onClick={() => {setActiveReqId(r.id); setActiveFolderId(f.id);}} className={`w-full text-left px-3 py-1.5 rounded flex items-center gap-2 text-sm ${activeReqId === r.id ? 'bg-[#3A3A3A] text-white' : 'text-slate-300 hover:bg-[#2B2B2B]'}`}>
                      <span className={`text-[10px] font-bold ${r.method==='GET'?'text-green-500':r.method==='POST'?'text-orange-500':'text-blue-500'}`}>{r.method}</span>
                      <span className="truncate">{r.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {activeFolderId === f.id && (
                <div className="mt-2 flex flex-col gap-1 px-2 border-l-2 border-[#3A3A3A] ml-2 pl-2">
                  <button onClick={() => notifyChat(f.id)} disabled={isNotifying} className="text-[10px] font-bold text-[#007fd4] hover:text-[#3399ff] text-left">↗ Enviar Colección a Chat</button>
                  <button onClick={() => generateFolderPDF(f.id)} className="text-[10px] font-bold text-[#FF6C37] hover:text-[#ff8f66] text-left">↓ Descargar Diccionario y Evidencia</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Panel - REST Client */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#212121]">
        {activeReq ? (
          <>
            {/* Header / URL Bar */}
            <div className="p-4 border-b border-[#3A3A3A] bg-[#2B2B2B]">
              <input type="text" value={activeReq.name} onChange={e => updateActiveReq({name: e.target.value})} className="bg-transparent text-lg font-bold text-white outline-none mb-3 w-full border-b border-transparent focus:border-[#FF6C37]" />
              <div className="flex border border-[#3A3A3A] rounded overflow-hidden">
                <select value={activeReq.method} onChange={e => updateActiveReq({method: e.target.value})} className="bg-[#1C1C1C] text-white font-bold px-4 py-2 outline-none border-r border-[#3A3A3A]">
                  <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
                </select>
                <input type="text" value={activeReq.url} onChange={e => updateActiveReq({url: e.target.value})} placeholder="http://linkagems-testing-dev..." className="flex-1 bg-[#1C1C1C] text-white px-4 py-2 outline-none font-mono text-sm" />
                <button onClick={sendRequest} disabled={isSending} className="bg-[#007fd4] hover:bg-[#006bb3] text-white font-bold px-8 py-2 disabled:opacity-50">
                  {isSending ? 'Enviando...' : 'Send'}
                </button>
              </div>
            </div>

            {/* Middle Section (Split horizontally) */}
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Request Builder */}
              <div className="flex-1 flex flex-col border-b border-[#3A3A3A] min-h-0">
                <div className="flex bg-[#2B2B2B] px-4 pt-2 gap-4">
                  <button onClick={() => setActiveTab('headers')} className={`pb-2 text-sm font-medium border-b-2 ${activeTab === 'headers' ? 'border-[#FF6C37] text-white' : 'border-transparent text-slate-400'}`}>Headers</button>
                  <button onClick={() => setActiveTab('body')} className={`pb-2 text-sm font-medium border-b-2 ${activeTab === 'body' ? 'border-[#FF6C37] text-white' : 'border-transparent text-slate-400'}`}>Body</button>
                </div>
                
                <div className="flex-1 bg-[#1E1E1E] overflow-y-auto p-4">
                  {activeTab === 'headers' && (
                    <div className="space-y-2">
                      {activeReq.headers.map((h, i) => (
                        <div key={i} className="flex gap-2">
                          <input type="text" value={h.key} onChange={e => { const hds = [...activeReq.headers]; hds[i].key = e.target.value; updateActiveReq({headers: hds}); }} placeholder="Key" className="w-1/3 bg-[#2B2B2B] border border-[#3A3A3A] px-3 py-1.5 rounded text-sm text-white font-mono outline-none" />
                          <input type="text" value={h.value} onChange={e => { const hds = [...activeReq.headers]; hds[i].value = e.target.value; updateActiveReq({headers: hds}); }} placeholder="Value" className="flex-1 bg-[#2B2B2B] border border-[#3A3A3A] px-3 py-1.5 rounded text-sm text-white font-mono outline-none" />
                          <button onClick={() => { const hds = activeReq.headers.filter((_, idx) => idx !== i); updateActiveReq({headers: hds}); }} className="text-red-500 px-2 hover:text-red-400">✕</button>
                        </div>
                      ))}
                      <button onClick={() => updateActiveReq({headers: [...activeReq.headers, {key: "", value: ""}]})} className="text-[#FF6C37] text-sm mt-2 font-medium">+ Añadir Header</button>
                    </div>
                  )}
                  {activeTab === 'body' && (
                    <textarea value={activeReq.body} onChange={e => updateActiveReq({body: e.target.value})} className="w-full h-full bg-transparent text-white font-mono text-sm outline-none resize-none" placeholder="{\n  \n}" spellCheck="false" />
                  )}
                </div>
              </div>

              {/* Response Viewer */}
              <div className="flex-1 flex flex-col min-h-0 bg-[#1E1E1E]">
                <div className="bg-[#2B2B2B] px-4 py-2 border-b border-[#3A3A3A] flex justify-between items-center">
                  <span className="text-sm font-medium text-white">Respuesta Viva</span>
                  {activeReq.response && !activeReq.response.error && (
                    <div className="flex gap-4 text-xs font-mono">
                      <span className={activeReq.response.status >= 200 && activeReq.response.status < 300 ? "text-green-400" : "text-red-400"}>Status: {activeReq.response.status} {activeReq.response.statusText}</span>
                      <span className="text-blue-400">Time: {activeReq.response.timeMs} ms</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                  {!activeReq.response ? (
                    <div className="text-slate-500 flex items-center justify-center h-full">Dale a SEND para ver la respuesta real</div>
                  ) : activeReq.response.error ? (
                    <div className="text-red-400 whitespace-pre-wrap">{activeReq.response.body}</div>
                  ) : (
                    <pre className="text-[#9CDCFE]">{JSON.stringify(activeReq.response.body, null, 2)}</pre>
                  )}
                </div>
              </div>

            </div>
          </>
        ) : null}
      </main>

      {/* Right Sidebar - Panel Dinámico de Documentación */}
      <aside className="w-80 bg-[#1C1C1C] flex flex-col border-l border-[#3A3A3A] shrink-0">
        <div className="p-4 border-b border-[#3A3A3A] bg-[#2B2B2B]">
          <h2 className="text-white font-bold text-sm">Documentación en Vivo</h2>
          <p className="text-xs text-slate-400 mt-1">Los campos se detectan automáticamente al editar el Body o recibir Respuesta.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-bold text-[#FF6C37] mb-3 uppercase border-b border-[#3A3A3A] pb-1">Campos de Entrada (Body)</h3>
          {activeInFields.length === 0 ? <p className="text-xs text-slate-500 mb-6">No hay JSON en el Body</p> : (
            <ul className="space-y-2 mb-6">
              {activeInFields.map((f, i) => {
                const meta = fieldDatabase[f] || fieldDatabase[f.split('.').pop() || ''];
                return (
                  <li key={i} onClick={() => { setSelectedField(f); setIsModalOpen(true); }} className="bg-[#2B2B2B] border border-[#3A3A3A] p-2 rounded cursor-pointer hover:border-[#FF6C37]">
                    <div className="font-mono text-xs font-bold text-[#FF6C37] mb-1">{f}</div>
                    <div className="text-xs text-slate-400 truncate">{meta ? meta.desc : <span className="italic">Clic para documentar...</span>}</div>
                  </li>
                );
              })}
            </ul>
          )}

          <h3 className="text-xs font-bold text-green-500 mb-3 uppercase border-b border-[#3A3A3A] pb-1">Campos de Salida (Response)</h3>
          {activeOutFields.length === 0 ? <p className="text-xs text-slate-500">Haz SEND para obtener campos</p> : (
            <ul className="space-y-2">
              {activeOutFields.map((f, i) => {
                const meta = fieldDatabase[f] || fieldDatabase[f.split('.').pop() || ''];
                return (
                  <li key={i} onClick={() => { setSelectedField(f); setIsModalOpen(true); }} className="bg-[#2B2B2B] border border-[#3A3A3A] p-2 rounded cursor-pointer hover:border-green-500">
                    <div className="font-mono text-xs font-bold text-green-500 mb-1">{f}</div>
                    <div className="text-xs text-slate-400 truncate">{meta ? meta.desc : <span className="italic">Clic para documentar...</span>}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

    </div>
  );
}
