"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PortalFamilia() {
  const router = useRouter();
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [idosoParente, setIdosoParente] = useState(null);
  const [enviado, setEnviado] = useState(false);
  const [arquivoBase64, setArquivoBase64] = useState(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [form, setForm] = useState({ tipo: "texto", conteudo: "" });

  useEffect(() => {
    // Checa autenticação
    const sessao = localStorage.getItem("usuario_logado");
    if (!sessao) {
      router.push("/login");
      return;
    }

    const usuario = JSON.parse(sessao);
    if (usuario.tipo !== "familiar") {
      router.push("/login");
      return;
    }

    setUsuarioLogado(usuario);

    // Busca apenas o idoso vinculado a este familiar
    fetch(`/api/idosos/${usuario.idoso_id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.idoso) {
          setIdosoParente(data.idoso);
        } else {
          carregarIdosoPadrao(usuario.idoso_id);
        }
      })
      .catch(() => carregarIdosoPadrao(usuario.idoso_id));
  }, [router]);

  function carregarIdosoPadrao(idosoId) {
    const listaMock = [
      { id: 1, nome_completo: "Jose Antonio Pereira" },
      { id: 2, nome_completo: "Maria Helena Souza" },
    ];
    setIdosoParente(listaMock.find((i) => i.id === idosoId) || listaMock[0]);
  }

  const handleLogoff = () => {
    localStorage.removeItem("usuario_logado");
    router.push("/login");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNomeArquivo(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setArquivoBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      idoso_id: usuarioLogado.idoso_id,
      titulo: `${form.tipo.toUpperCase()} de ${usuarioLogado.nome}`,
      descricao: form.conteudo,
      categoria_id: 1,
      tipo_midia: form.tipo === "texto" ? "audio" : form.tipo,
      arquivo_url: arquivoBase64,
      thumbnail_url: form.tipo === "foto" ? arquivoBase64 : null,
      emocao: "Carinho da Família",
      autor_registro: usuarioLogado.nome,
      data_aproximada: new Date().toISOString().split("T")[0],
    };

    try {
      await fetch("/api/memorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.log("Modo offline");
    }

    setEnviado(true);
    setForm({ tipo: "texto", conteudo: "" });
    setArquivoBase64(null);
    setNomeArquivo("");
    setTimeout(() => setEnviado(false), 5000);
  };

  if (!usuarioLogado || !idosoParente) {
    return <div style={{ padding: "48px", textAlign: "center", fontSize: "20px" }}>Verificando credenciais...</div>;
  }

  return (
    <div style={{ backgroundColor: "#F8F5F0", minHeight: "100vh", padding: "24px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Barra de Saída / Logoff */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", color: "#264653", margin: 0 }}>Portal da Família</h1>
            <p style={{ color: "#666", margin: "4px 0 0 0" }}>Olá, <strong>{usuarioLogado.nome}</strong></p>
          </div>
          <button
            onClick={handleLogoff}
            style={{ padding: "10px 20px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
          >
            Sair da Conta (Logoff)
          </button>
        </div>

        {enviado && (
          <div style={{ marginBottom: "24px", padding: "20px", backgroundColor: "rgba(42, 157, 143, 0.15)", border: "2px solid #2A9D8F", borderRadius: "16px", color: "#2A9D8F", fontWeight: "bold" }}>
            Mensagem enviada com sucesso para o perfil de {idosoParente.nome_completo}!
          </div>
        )}

        {/* Formulário travado exclusivamente para o idoso associado */}
        <form onSubmit={handleSubmit} style={{ backgroundColor: "white", borderRadius: "24px", padding: "32px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ padding: "16px", backgroundColor: "rgba(42, 93, 138, 0.1)", borderRadius: "12px", borderLeft: "4px solid #2A5D8A" }}>
            <span style={{ color: "#666", fontSize: "14px" }}>Destinatário Vinculado:</span>
            <div style={{ fontSize: "22px", fontWeight: "bold", color: "#2A5D8A" }}>👤 {idosoParente.nome_completo}</div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Tipo de Mídia</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "10px" }}>
              {[
                { tipo: "texto", label: "💬 Texto" },
                { tipo: "foto", label: "📷 Foto" },
                { tipo: "audio", label: "🎙️ Áudio" },
                { tipo: "video", label: "🎬 Vídeo" },
              ].map(({ tipo, label }) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => { setForm({ ...form, tipo }); setArquivoBase64(null); setNomeArquivo(""); }}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: form.tipo === tipo ? "2px solid #2A5D8A" : "1px solid #ccc",
                    backgroundColor: form.tipo === tipo ? "rgba(42, 93, 138, 0.1)" : "#fff",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {form.tipo !== "texto" && (
            <div style={{ padding: "20px", border: "2px dashed #2A5D8A", borderRadius: "12px", textAlign: "center", backgroundColor: "rgba(42, 93, 138, 0.05)" }}>
              <label style={{ cursor: "pointer" }}>
                <span style={{ fontWeight: "bold", color: "#2A5D8A" }}>Selecionar arquivo de {form.tipo.toUpperCase()}</span>
                <input
                  type="file"
                  accept={form.tipo === "foto" ? "image/*" : form.tipo === "audio" ? "audio/*" : "video/*"}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  required
                />
              </label>
              {nomeArquivo && <p style={{ marginTop: "8px", color: "#2A9D8F", fontWeight: "bold" }}>{nomeArquivo}</p>}
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "16px", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Mensagem</label>
            <textarea
              value={form.conteudo}
              onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
              rows={4}
              placeholder="Escreva sua mensagem com carinho..."
              style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
              required
            />
          </div>

          <button type="submit" style={{ padding: "16px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "12px", fontSize: "18px", fontWeight: "bold", cursor: "pointer" }}>
            Enviar para {idosoParente.nome_completo}
          </button>
        </form>
      </div>
    </div>
  );
}