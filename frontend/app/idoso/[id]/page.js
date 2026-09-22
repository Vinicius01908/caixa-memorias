"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default function PerfilIdoso() {
  const params = useParams();
  const router = useRouter();
  const idosoId = params?.id;

  const [idoso, setIdoso] = useState(null);
  const [memorias, setMemorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // Filtro de Mídia e Modo Terapêutico
  const [filtroTipo, setFiltroTipo] = useState("todas"); // 'todas', 'foto', 'audio', 'video', 'texto'
  const [modoTerapeutico, setModoTerapeutico] = useState(false);
  const [indiceCarrossel, setIndiceCarrossel] = useState(0);

  useEffect(() => {
    if (idosoId) {
      carregarPerfilEMemorias(idosoId);
    }
  }, [idosoId]);

  async function carregarPerfilEMemorias(id) {
    setCarregando(true);
    setErro("");

    try {
      console.log(`🔍 Carregando perfil exato do morador ID: ${id}...`);

      // 1. Busca os dados do idoso no Supabase
      const { data: idosoDb, error: errIdoso } = await supabase
        .from("idosos")
        .select("*")
        .eq("id", id)
        .single();

      if (errIdoso || !idosoDb) {
        console.error("❌ Morador não encontrado no Supabase:", errIdoso);
        setErro(`Morador de ID ${id} não foi encontrado no banco de dados.`);
        setCarregando(false);
        return;
      }

      setIdoso(idosoDb);

      // 2. Busca as memórias anexadas ao morador
      const { data: memoriasDb, error: errMemorias } = await supabase
        .from("memorias")
        .select("*")
        .eq("idoso_id", String(id))
        .order("created_at", { ascending: false });

      if (!errMemorias && memoriasDb) {
        setMemorias(memoriasDb);
      }

    } catch (err) {
      console.error("💥 Exceção ao carregar perfil:", err);
      setErro("Falha ao carregar os dados do morador.");
    } finally {
      setCarregando(false);
    }
  }

  // Filtragem de mídias por categoria (Fotos, Áudios/Músicas, Vídeos)
  const memoriasFiltradas = memorias.filter((m) => {
    if (filtroTipo === "todas") return true;
    if (filtroTipo === "audio") return m.tipo_midia === "audio" || m.tipo_midia === "musica";
    return m.tipo_midia === filtroTipo;
  });

  // Funções do Modo Terapêutico Imersivo
  const proximaMemoria = () => {
    setIndiceCarrossel((prev) => (prev + 1) % memoriasFiltradas.length);
  };

  const memoriaAnterior = () => {
    setIndiceCarrossel((prev) => (prev - 1 + memoriasFiltradas.length) % memoriasFiltradas.length);
  };

  const handleLogoff = () => {
    localStorage.removeItem("usuario_logado");
    router.push("/login");
  };

  if (carregando) {
    return (
      <div style={{ padding: "48px", textAlign: "center", backgroundColor: "#F8F5F0", minHeight: "100vh" }}>
        <h2>⏳ Carregando Caixa de Memórias...</h2>
      </div>
    );
  }

  if (erro || !idoso) {
    return (
      <div style={{ padding: "48px", textAlign: "center", backgroundColor: "#F8F5F0", minHeight: "100vh" }}>
        <h2 style={{ color: "#E85D75" }}>⚠️ {erro || "Perfil não encontrado"}</h2>
        <Link href="/cuidador" style={{ display: "inline-block", marginTop: "20px", padding: "12px 24px", backgroundColor: "#2A5D8A", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
          ← Voltar para a Área do Cuidador
        </Link>
      </div>
    );
  }

  const memoriaAtualCarrossel = memoriasFiltradas[indiceCarrossel];

  return (
    <div style={{ backgroundColor: "#F8F5F0", minHeight: "100vh", padding: "24px" }}>
      <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
        
        {/* BARRA SUPERIOR DE NAVEGAÇÃO */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <Link href="/cuidador" style={{ visibility: "hidden", pointerEvents: "none", padding: "10px 18px", fontSize: "14px" }}>
            ← Voltar para a Área do Cuidador
          </Link>
          <button type="button" onClick={handleLogoff} style={{ padding: "10px 18px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
            Sair
          </button>
        </div>

        {/* CARTÃO DE PERFIL DO MORADOR */}
        <div style={{ backgroundColor: "white", padding: "28px", borderRadius: "20px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)", marginBottom: "24px", borderLeft: "8px solid #2A5D8A", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "30px", color: "#264653", margin: "0 0 6px 0", fontWeight: "bold" }}>
              👤 {idoso.nome_completo}
            </h1>
            <p style={{ fontSize: "15px", color: "#555", margin: 0 }}>
              {idoso.idade} anos • Quarto {idoso.quarto} • Diagnóstico: <strong>{idoso.diagnostico || "Não informado"}</strong>
            </p>
          </div>

          {/* BOTAO PARA ACIONAR O MODO TERAPÊUTICO TELA CHEIA */}
          {memoriasFiltradas.length > 0 && (
            <button
              onClick={() => { setIndiceCarrossel(0); setModoTerapeutico(true); }}
              style={{
                padding: "14px 24px",
                backgroundColor: "#E85D75",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: "bold",
                fontSize: "16px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(232, 93, 117, 0.3)",
              }}
            >
              🎬 Iniciar Modo Terapêutico (Carrossel)
            </button>
          )}
        </div>

        {/* FILTROS POR TIPO DE MÍDIA (FOTOS, MÚSICAS, VÍDEOS) */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
          <button onClick={() => setFiltroTipo("todas")} style={{ padding: "10px 18px", borderRadius: "8px", border: "none", backgroundColor: filtroTipo === "todas" ? "#264653" : "#FFF", color: filtroTipo === "todas" ? "#FFF" : "#264653", fontWeight: "bold", cursor: "pointer" }}>
            📂 Todas as Memórias ({memorias.length})
          </button>
          <button onClick={() => setFiltroTipo("foto")} style={{ padding: "10px 18px", borderRadius: "8px", border: "none", backgroundColor: filtroTipo === "foto" ? "#2A5D8A" : "#FFF", color: filtroTipo === "foto" ? "#FFF" : "#2A5D8A", fontWeight: "bold", cursor: "pointer" }}>
            🖼️ Fotos ({memorias.filter(m => m.tipo_midia === 'foto').length})
          </button>
          <button onClick={() => setFiltroTipo("audio")} style={{ padding: "10px 18px", borderRadius: "8px", border: "none", backgroundColor: filtroTipo === "audio" ? "#2A9D8F" : "#FFF", color: filtroTipo === "audio" ? "#FFF" : "#2A9D8F", fontWeight: "bold", cursor: "pointer" }}>
            🎵 Músicas e Áudios ({memorias.filter(m => m.tipo_midia === 'audio' || m.tipo_midia === 'musica').length})
          </button>
          <button onClick={() => setFiltroTipo("video")} style={{ padding: "10px 18px", borderRadius: "8px", border: "none", backgroundColor: filtroTipo === "video" ? "#F4A261" : "#FFF", color: filtroTipo === "video" ? "#FFF" : "#F4A261", fontWeight: "bold", cursor: "pointer" }}>
            🎥 Vídeos ({memorias.filter(m => m.tipo_midia === 'video').length})
          </button>
        </div>

        {/* GALERIA DE VISUALIZAÇÃO DAS MEMÓRIAS */}
        <div style={{ backgroundColor: "white", padding: "28px", borderRadius: "20px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
          {memoriasFiltradas.length === 0 ? (
            <p style={{ color: "#888", fontStyle: "italic", textAlign: "center", padding: "30px 0" }}>
              Nenhuma memória encontrada nesta categoria.
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
              {memoriasFiltradas.map((m) => (
                <div key={m.id} style={{ padding: "20px", borderRadius: "14px", border: "1px solid #E0E0E0", backgroundColor: "#F8F5F0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#264653", fontSize: "18px" }}>{m.titulo}</h3>
                    <p style={{ margin: "0 0 14px 0", color: "#555", fontSize: "14px", lineHeight: "1.4" }}>{m.descricao}</p>
                    
                    {/* VISUALIZADOR DE FOTOS */}
                    {m.tipo_midia === "foto" && m.arquivo_url && (
                      <div style={{ borderRadius: "10px", overflow: "hidden", marginBottom: "12px", border: "1px solid #CCC" }}>
                        <img src={m.arquivo_url} alt={m.titulo} style={{ width: "100%", height: "200px", objectFit: "cover" }} />
                      </div>
                    )}

                    {/* VISUALIZADOR E PLAYER DE ÁUDIO / MÚSICA */}
                    {(m.tipo_midia === "audio" || m.tipo_midia === "musica") && m.arquivo_url && (
                      <div style={{ backgroundColor: "#EAEAEA", padding: "12px", borderRadius: "10px", marginBottom: "12px" }}>
                        <p style={{ margin: "0 0 8px 0", fontSize: "13px", fontWeight: "bold", color: "#2A9D8F" }}>🎧 Reprodutor de Áudio</p>
                        <audio src={m.arquivo_url} controls style={{ width: "100%" }} />
                      </div>
                    )}

                    {/* VISUALIZADOR E PLAYER DE VÍDEO */}
                    {m.tipo_midia === "video" && m.arquivo_url && (
                      <div style={{ borderRadius: "10px", overflow: "hidden", marginBottom: "12px", backgroundColor: "#000" }}>
                        <video src={m.arquivo_url} controls style={{ width: "100%", maxHeight: "220px" }} />
                      </div>
                    )}
                  </div>

                  {m.autor_registro && (
                    <div style={{ fontSize: "12px", color: "#888", borderTop: "1px dashed #CCC", paddingTop: "8px", marginTop: "8px" }}>
                      Enviado por: <strong>{m.autor_registro}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL DO MODO TERAPÊUTICO IMERSIVO (CARROSSEL TELA CHEIA) */}
        {modoTerapeutico && memoriaAtualCarrossel && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.92)", zIndex: 2000, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "24px", color: "white" }}>
            
            {/* CABEÇALHO DO MODAL */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "18px", fontWeight: "bold", color: "#2A9D8F" }}>
                🎬 Modo Terapêutico — {indiceCarrossel + 1} de {memoriasFiltradas.length}
              </span>
              <button onClick={() => setModoTerapeutico(false)} style={{ padding: "10px 20px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
                ✖ Fechar (Sair)
              </button>
            </div>

            {/* ÁREA CENTRAL DE EXIBIÇÃO EM ALTA VISIBILIDADE */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, margin: "20px 0", textAlign: "center" }}>
              
              {memoriaAtualCarrossel.tipo_midia === "foto" && (
                <img src={memoriaAtualCarrossel.arquivo_url} alt={memoriaAtualCarrossel.titulo} style={{ maxHeight: "55vh", maxWidth: "90vw", objectFit: "contain", borderRadius: "12px", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }} />
              )}

              {(memoriaAtualCarrossel.tipo_midia === "audio" || memoriaAtualCarrossel.tipo_midia === "musica") && (
                <div style={{ backgroundColor: "#264653", padding: "32px", borderRadius: "20px", width: "100%", maxWidth: "500px", textAlign: "center" }}>
                  <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎵</div>
                  <audio src={memoriaAtualCarrossel.arquivo_url} controls autoPlay style={{ width: "100%" }} />
                </div>
              )}

              {memoriaAtualCarrossel.tipo_midia === "video" && (
                <video src={memoriaAtualCarrossel.arquivo_url} controls autoPlay style={{ maxHeight: "55vh", maxWidth: "90vw", borderRadius: "12px" }} />
              )}

              <h2 style={{ fontSize: "28px", marginTop: "20px", marginBottom: "8px", color: "#F4A261" }}>{memoriaAtualCarrossel.titulo}</h2>
              <p style={{ fontSize: "18px", maxWidth: "700px", color: "#DDD", margin: 0 }}>{memoriaAtualCarrossel.descricao}</p>
            </div>

            {/* CONTROLES NAVEGACIONAIS DO MODO TERAPÊUTICO */}
            <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
              <button onClick={memoriaAnterior} style={{ padding: "16px 32px", backgroundColor: "#2A5D8A", color: "white", border: "none", borderRadius: "12px", fontSize: "20px", fontWeight: "bold", cursor: "pointer" }}>
                ◀ Anterior
              </button>
              <button onClick={proximaMemoria} style={{ padding: "16px 32px", backgroundColor: "#2A9D8F", color: "white", border: "none", borderRadius: "12px", fontSize: "20px", fontWeight: "bold", cursor: "pointer" }}>
                Próximo ▶
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}