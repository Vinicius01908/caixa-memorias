"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [idosos, setIdosos] = useState([]);
  const [altoContraste, setAltoContraste] = useState(false);
  
  // Estado para controlar o Modal de Seleção do Morador
  const [modalAberto, setModalAberto] = useState(false);
  const [filtroSelecionado, setFiltroSelecionado] = useState("");
  const [tituloFiltro, setTituloFiltro] = useState("");

  useEffect(() => {
    // 1. Lista padrão de moradores
    const idososPadrao = [
      { id: 1, nome_completo: "Jose Antonio Pereira", idade: 83, quarto: "101A" },
      { id: 2, nome_completo: "Maria Helena Souza", idade: 80, quarto: "102B" },
      { id: 3, nome_completo: "Antonio Carlos Lima", idade: 87, quarto: "103A" },
      { id: 4, nome_completo: "Dona Raimunda Oliveira", idade: 86, quarto: "104C" },
    ];

    // 2. Lê os moradores cadastrados no localStorage
    const cadastrados = JSON.parse(localStorage.getItem("idosos_cadastrados") || "[]");
    setIdosos([...cadastrados, ...idososPadrao]);
  }, []);

  // Abre a janela para escolher o morador com base no botão clicado
  const handleAbrirSelecao = (tipoFiltro, nomeExibicao) => {
    setFiltroSelecionado(tipoFiltro);
    setTituloFiltro(nomeExibicao);
    setModalAberto(true);
  };

  // Redireciona para o idoso e aplica o filtro correspondente na URL
  const handleSelecionarIdosoFiltro = (idosoId) => {
    setModalAberto(false);
    router.push(`/idoso/${idosoId}?filtro=${filtroSelecionado}`);
  };

  return (
    <div style={{ backgroundColor: altoContraste ? "#000" : "#F8F5F0", color: altoContraste ? "#FFF" : "#000", minHeight: "100vh" }}>
      
      {/* Barra Superior */}
      <header style={{ backgroundColor: altoContraste ? "#111" : "#2A5D8A", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>Caixa de Memórias</h1>
        <button
          onClick={() => setAltoContraste(!altoContraste)}
          style={{ padding: "8px 16px", backgroundColor: altoContraste ? "#FFFF00" : "rgba(255,255,255,0.2)", color: altoContraste ? "#000" : "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
        >
          {altoContraste ? "Alto Contraste: ON" : "Alto Contraste"}
        </button>
      </header>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 16px", textAlign: "center" }}>
        
        {/* Escolha do Morador em Cards */}
        <h2 style={{ fontSize: "28px", color: altoContraste ? "#FFF" : "#264653", marginBottom: "24px", fontWeight: "bold" }}>
          Escolha um morador:
        </h2>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px", marginBottom: "40px" }}>
          {idosos.map((idoso) => (
            <Link key={idoso.id} href={`/idoso/${idoso.id}`} style={{ textDecoration: "none" }}>
              <div
                style={{
                  backgroundColor: altoContraste ? "#222" : "white",
                  border: altoContraste ? "2px solid #FFF" : "none",
                  borderRadius: "16px",
                  padding: "24px",
                  width: "200px",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", border: "2px solid #2A5D8A", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto", fontSize: "28px" }}>
                  👤
                </div>
                <h3 style={{ fontSize: "18px", color: altoContraste ? "#FFF" : "#264653", margin: "0 0 8px 0", fontWeight: "bold" }}>
                  {idoso.nome_completo}
                </h3>
                <p style={{ margin: "0 0 4px 0", color: "#666", fontSize: "14px" }}>
                  {idoso.idade} anos
                </p>
                <p style={{ margin: 0, color: "#E85D75", fontWeight: "bold", fontSize: "14px" }}>
                  Quarto {idoso.quarto}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Escolha por Tipo de Conteúdo */}
        <p style={{ color: "#666", fontWeight: "bold", marginBottom: "16px", fontSize: "14px" }}>
          Ou escolha por tipo de conteúdo:
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", marginBottom: "32px" }}>
          
          <button
            onClick={() => handleAbrirSelecao("foto", "Fotos")}
            style={{ backgroundColor: "#2A5D8A", color: "white", padding: "16px 24px", borderRadius: "12px", width: "160px", textAlign: "center", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "16px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
          >
            📷<br />Fotos
          </button>

          <button
            onClick={() => handleAbrirSelecao("musica", "Músicas e Áudios")}
            style={{ backgroundColor: "#E85D75", color: "white", padding: "16px 24px", borderRadius: "12px", width: "160px", textAlign: "center", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "16px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
          >
            🎵<br />Músicas
          </button>

          <button
            onClick={() => handleAbrirSelecao("familia", "Registros da Família")}
            style={{ backgroundColor: "#F4A261", color: "white", padding: "16px 24px", borderRadius: "12px", width: "160px", textAlign: "center", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "16px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
          >
            👨‍👩‍👧<br />Família
          </button>

          <button
            onClick={() => handleAbrirSelecao("linha_tempo", "Linha do Tempo")}
            style={{ backgroundColor: "#2A9D8F", color: "white", padding: "16px 24px", borderRadius: "12px", width: "160px", textAlign: "center", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "16px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
          >
            ⏰<br />Linha do Tempo
          </button>

        </div>

        {/* Links de Login */}
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "40px" }}>
          <Link href="/login" style={{ padding: "14px 28px", backgroundColor: "#264653", color: "white", borderRadius: "10px", textDecoration: "none", fontWeight: "bold", fontSize: "16px" }}>
            Área do Cuidador
          </Link>
          <Link href="/login" style={{ padding: "14px 28px", backgroundColor: "#E9C46A", color: "#264653", borderRadius: "10px", textDecoration: "none", fontWeight: "bold", fontSize: "16px" }}>
            Portal da Família
          </Link>
        </div>

      </main>

      {/* MODAL DE SELEÇÃO DO IDOSO ANTES DE EXIBIR O CONTEÚDO */}
      {modalAberto && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "32px", maxWidth: "500px", width: "100%", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", textAlign: "left" }}>
            <h2 style={{ fontSize: "22px", color: "#264653", marginTop: 0, marginBottom: "8px" }}>
              Ver {tituloFiltro}
            </h2>
            <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>
              Selecione de qual morador você deseja visualizar este conteúdo:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto", marginBottom: "20px" }}>
              {idosos.map((i) => (
                <button
                  key={i.id}
                  onClick={() => handleSelecionarIdosoFiltro(i.id)}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    border: "1px solid #ddd",
                    backgroundColor: "#F8F5F0",
                    color: "#264653",
                    fontWeight: "bold",
                    fontSize: "16px",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    justify: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>👤 {i.nome_completo}</span>
                  <span style={{ fontSize: "12px", color: "#2A5D8A" }}>Quarto {i.quarto} ➔</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setModalAberto(false)}
              style={{ width: "100%", padding: "12px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}