"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

function PerfilConteudo() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const idParam = params?.id ? String(params.id) : "";
  const filtro = searchParams ? searchParams.get("filtro") : null;

  const [idoso, setIdoso] = useState(null);
  const [memorias, setMemorias] = useState([]);
  const [modoTerapeutico, setModoTerapeutico] = useState(false);
  const [modoVideoAberto, setModoVideoAberto] = useState(false);
  
  const [memoriaAtual, setMemoriaAtual] = useState(0);
  const [videosDisponiveis, setVideosDisponiveis] = useState([]);
  const [indiceVideoAtual, setIndiceVideoAtual] = useState(0);

  useEffect(() => {
    if (!idParam) return;

    // 1. Moradores padrão
    const bancoIdososPadrao = [
      { id: 1, nome_completo: "Jose Antonio Pereira", idade: 83, quarto: "101A", diagnostico: "Demência Vascular Leve" },
      { id: 2, nome_completo: "Maria Helena Souza", idade: 80, quarto: "102B", diagnostico: "Alzheimer Moderado" },
      { id: 3, nome_completo: "Antonio Carlos Lima", idade: 87, quarto: "103A", diagnostico: "Alzheimer Leve" },
      { id: 4, nome_completo: "Dona Raimunda Oliveira", idade: 86, quarto: "104C", diagnostico: "Corpos de Lewy" },
    ];

    const cadastrados = JSON.parse(localStorage.getItem("idosos_cadastrados") || "[]");
    const todosIdosos = [...cadastrados, ...bancoIdososPadrao];

    const idosoEncontrado = todosIdosos.find((i) => String(i.id) === idParam);

    if (idosoEncontrado) {
      setIdoso(idosoEncontrado);
    } else {
      setIdoso({
        id: idParam,
        nome_completo: "Morador Cadastrado",
        idade: "--",
        quarto: "--",
        diagnostico: "Perfil em acompanhamento",
      });
    }

    // 2. Carrega as mídias salvas para este idoso
    const memoriasAnexadas = JSON.parse(localStorage.getItem(`memorias_idoso_${idParam}`) || "[]");

    const memoriasPadrao = [
      { id: 991, titulo: "Retrato Familiar", descricao: "Foto da família reunida no final de semana com mensagem de carinho.", tipo_midia: "foto", arquivo_url: null },
      { id: 992, titulo: "Mensagem em Áudio", descricao: "Depoimento gravado com votos de saúde e saudades.", tipo_midia: "audio", arquivo_url: null },
      { id: 993, titulo: "Vídeo Institucional / Familiar", descricao: "Registro audiovisual enviado pela família.", tipo_midia: "video", arquivo_url: null },
    ];

    let todasMemorias = memoriasAnexadas.length > 0 ? memoriasAnexadas : memoriasPadrao;

    // Filtra apenas vídeos para o Modo de Vídeo
    const vids = todasMemorias.filter((m) => m.tipo_midia === "video");
    setVideosDisponiveis(vids.length > 0 ? vids : [
      { id: 999, titulo: "Vídeo Demonstrativo", descricao: "Apresentação em vídeo do morador e recordações familiares.", tipo_midia: "video", arquivo_url: null }
    ]);

    // Aplicador de Filtros na galeria
    if (filtro === "foto") todasMemorias = todasMemorias.filter((m) => m.tipo_midia === "foto");
    if (filtro === "musica") todasMemorias = todasMemorias.filter((m) => m.tipo_midia === "musica" || m.tipo_midia === "audio");
    if (filtro === "familia") todasMemorias = todasMemorias.filter((m) => m.tipo_midia === "video" || m.tipo_midia === "foto");

    setMemorias(todasMemorias);
  }, [idParam, filtro]);

  if (!idoso) return <div style={{ padding: "48px", fontSize: "24px", textAlign: "center" }}>Carregando perfil do morador...</div>;

  const memoria = memorias[memoriaAtual];
  const videoAtualObj = videosDisponiveis[indiceVideoAtual];

  return (
    <div style={{ backgroundColor: "#F8F5F0", minHeight: "100vh", padding: "24px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        {/* TOPO */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/cuidador" style={{ color: "#2A5D8A", fontWeight: "bold", textDecoration: "none", fontSize: "18px" }}>← Voltar para Área do Cuidador</Link>
          <Link href="/" style={{ color: "#666", textDecoration: "none", fontSize: "16px" }}>Início</Link>
        </div>

        {/* CARD DO MORADOR COM DOIS MODOS TERAPÊUTICOS */}
        <div style={{ backgroundColor: "white", borderRadius: "24px", padding: "32px", margin: "24px 0", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", borderLeft: "8px solid #2A5D8A" }}>
          <h1 style={{ fontSize: "36px", color: "#264653", margin: "0 0 8px 0" }}>👤 {idoso.nome_completo}</h1>
          <p style={{ fontSize: "20px", color: "#666", margin: "0 0 8px 0" }}>{idoso.idade} anos • Quarto {idoso.quarto}</p>
          <p style={{ fontSize: "18px", color: "#E85D75", fontWeight: "bold", margin: "0 0 20px 0" }}>{idoso.diagnostico || "Sem diagnóstico cadastrado"}</p>
          
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <button onClick={() => { setMemoriaAtual(0); setModoTerapeutico(true); }} style={{ padding: "16px 28px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "12px", fontSize: "18px", fontWeight: "bold", cursor: "pointer" }}>
              ▶️ Modo Terapêutico (Fotos & Áudios)
            </button>
            <button onClick={() => { setIndiceVideoAtual(0); setModoVideoAberto(true); }} style={{ padding: "16px 28px", backgroundColor: "#2A9D8F", color: "white", border: "none", borderRadius: "12px", fontSize: "18px", fontWeight: "bold", cursor: "pointer" }}>
              🎬 Modo Terapêutico de Vídeos
            </button>
          </div>
        </div>

        {/* GALERIA DE MEMÓRIAS */}
        <h2 style={{ fontSize: "28px", color: "#264653", marginBottom: "16px" }}>Galeria de Memórias e Anexos Multimídia</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {memorias.length > 0 ? (
            memorias.map((mem, idx) => (
              <div key={idx} style={{ backgroundColor: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <h3 style={{ fontSize: "18px", color: "#2A5D8A", margin: 0 }}>{mem.titulo}</h3>
                    <span style={{ fontSize: "12px", padding: "4px 8px", backgroundColor: "rgba(42, 93, 138, 0.1)", color: "#2A5D8A", borderRadius: "6px", fontWeight: "bold" }}>
                      {mem.tipo_midia.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ color: "#444", fontSize: "15px", marginBottom: "12px" }}>{mem.descricao}</p>
                  
                  {mem.tipo_midia === "foto" && mem.arquivo_url && (
                    <img src={mem.arquivo_url} alt={mem.titulo} style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "8px" }} />
                  )}
                  {(mem.tipo_midia === "audio" || mem.tipo_midia === "musica") && mem.arquivo_url && (
                    <audio src={mem.arquivo_url} controls style={{ width: "100%", marginTop: "8px" }} />
                  )}
                  {mem.tipo_midia === "video" && mem.arquivo_url && (
                    <video src={mem.arquivo_url} controls style={{ width: "100%", height: "180px", borderRadius: "8px" }} />
                  )}
                </div>

                {mem.autor_registro && (
                  <span style={{ fontSize: "12px", color: "#888", marginTop: "12px", display: "block" }}>
                    Enviado por: <strong>{mem.autor_registro}</strong>
                  </span>
                )}
              </div>
            ))
          ) : (
            <p style={{ color: "#666", fontSize: "18px" }}>Nenhuma memória registrada ainda para este morador.</p>
          )}
        </div>

      </div>

      {/* 1. MODO TERAPÊUTICO TRADICIONAL (FOTOS & ÁUDIOS) */}
      {modoTerapeutico && memoria && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "#111", color: "white", zIndex: 1000, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "16px", color: "#2A9D8F", fontWeight: "bold" }}>PERFIL TERAPÊUTICO: {idoso.nome_completo.toUpperCase()}</span>
              <h2 style={{ fontSize: "28px", fontWeight: "bold", margin: "4px 0 0 0" }}>{memoria.titulo}</h2>
            </div>
            <button onClick={() => setModoTerapeutico(false)} style={{ padding: "12px 24px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "12px", fontSize: "18px", cursor: "pointer", fontWeight: "bold" }}>
              Fechar [X]
            </button>
          </div>

          <div style={{ textAlign: "center", margin: "auto 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {memoria.tipo_midia === "foto" && memoria.arquivo_url && (
              <img src={memoria.arquivo_url} alt={memoria.titulo} style={{ maxHeight: "55vh", maxWidth: "90vw", borderRadius: "16px" }} />
            )}
            {(memoria.tipo_midia === "audio" || memoria.tipo_midia === "musica") && memoria.arquivo_url && (
              <div style={{ padding: "30px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "20px" }}>
                <p style={{ fontSize: "24px", marginBottom: "16px" }}>🔊 Reproduzindo registro sonoro...</p>
                <audio src={memoria.arquivo_url} controls autoPlay style={{ width: "100%", maxWidth: "500px" }} />
              </div>
            )}
            {memoria.descricao && (
              <p style={{ fontSize: "24px", color: "#FFF", marginTop: "20px", maxWidth: "800px" }}>"{memoria.descricao}"</p>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "24px" }}>
            <button onClick={() => setMemoriaAtual((prev) => (prev - 1 + memorias.length) % memorias.length)} style={{ padding: "16px 36px", fontSize: "20px", borderRadius: "12px", backgroundColor: "#2A5D8A", color: "white", border: "none", cursor: "pointer" }}>
              ⬅️ Anterior
            </button>
            <button onClick={() => setMemoriaAtual((prev) => (prev + 1) % memorias.length)} style={{ padding: "16px 36px", fontSize: "20px", borderRadius: "12px", backgroundColor: "#2A5D8A", color: "white", border: "none", cursor: "pointer" }}>
              Próximo ➡️
            </button>
          </div>
        </div>
      )}

      {/* 2. MODO TERAPÊUTICO DE VÍDEOS (INSPIRADO NO SEU SIMULADOR) */}
      {modoVideoAberto && videoAtualObj && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "#0f172a", color: "#f8fafc", zIndex: 1000, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "24px" }}>
          
          {/* Cabeçalho */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ padding: "8px 16px", backgroundColor: "#2A9D8F", color: "#000", fontWeight: "bold", borderRadius: "8px", fontSize: "14px" }}>
                VC
              </div>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>Cine-Memória: {idoso.nome_completo}</h2>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>Exibição de Registros em Vídeo Anexados</p>
              </div>
            </div>
            <button onClick={() => setModoVideoAberto(false)} style={{ padding: "12px 24px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer" }}>
              Fechar [X]
            </button>
          </div>

          {/* Área do Player de Vídeo */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
            <div style={{ width: "100%", maxWidth: "850px", backgroundColor: "#020617", borderRadius: "24px", overflow: "hidden", border: "1px solid #1e293b", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", position: "relative" }}>
              
              {videoAtualObj.arquivo_url ? (
                <video src={videoAtualObj.arquivo_url} controls autoPlay style={{ width: "100%", maxHeight: "55vh", objectFit: "contain" }} />
              ) : (
                <div style={{ height: "350px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#1e293b", padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎬</div>
                  <h3 style={{ fontSize: "22px", color: "#FFF", margin: "0 0 8px 0" }}>{videoAtualObj.titulo}</h3>
                  <p style={{ color: "#94a3b8", maxWidth: "500px" }}>{videoAtualObj.descricao}</p>
                </div>
              )}

              {/* Legenda Dinâmica na Parte Inferior do Vídeo */}
              <div style={{ padding: "16px", backgroundColor: "rgba(15, 23, 42, 0.9)", borderTop: "1px solid #1e293b", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "18px", color: "#fde68a", fontWeight: "500" }}>
                  "{videoAtualObj.descricao || "Sem mensagem anexada."}"
                </p>
              </div>

            </div>
          </div>

          {/* Seletor de Cenas / Vídeos Anexados */}
          <div style={{ maxWidth: "850px", width: "100%", margin: "0 auto" }}>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "8px", fontWeight: "bold" }}>VÍDEOS DISPONÍVEIS ({videosDisponiveis.length})</p>
            <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "8px" }}>
              {videosDisponiveis.map((vid, idx) => (
                <button
                  key={idx}
                  onClick={() => setIndiceVideoAtual(idx)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    backgroundColor: indiceVideoAtual === idx ? "#2A9D8F" : "#1e293b",
                    color: indiceVideoAtual === idx ? "#000" : "#FFF",
                    border: "none",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                  }}
                >
                  📹 Vídeo {idx + 1}: {vid.titulo.substring(0, 20)}...
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: "48px", textAlign: "center", fontSize: "24px" }}>Carregando perfil...</div>}>
      <PerfilConteudo />
    </Suspense>
  );
}