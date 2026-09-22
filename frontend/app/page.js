"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [idosos, setIdosos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarMoradores();
  }, []);

  async function carregarMoradores() {
    setCarregando(true);
    setErro("");

    try {
      console.log("🔄 Buscando lista completa de moradores no Supabase...");

      // Traz TODOS os moradores ordenados pelo ID sem limitação
      const { data, error } = await supabase
        .from("idosos")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error("❌ Erro ao buscar idosos:", error);
        setErro("Erro ao carregar moradores: " + error.message);
      } else {
        console.log(`✅ ${data?.length || 0} moradores encontrados:`, data);
        setIdosos(data || []);
      }
    } catch (err) {
      console.error("💥 Exceção ao buscar moradores:", err);
      setErro("Falha de conexão ao carregar moradores.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ backgroundColor: "#F8F5F0", minHeight: "100vh", padding: "32px 16px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        
        {/* CABEÇALHO COM FACHADA E BOTÕES */}
        <div style={{ backgroundColor: "white", padding: "32px", borderRadius: "20px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)", marginBottom: "32px", overflow: "hidden" }}>
          <div style={{ width: "100%", height: "200px", position: "relative", marginBottom: "24px", borderRadius: "12px", overflow: "hidden", backgroundColor: "#EAEAEA" }}>
            <Image
              src="/fachada.png"
              alt="Fachada do Residencial Senior"
              fill
              priority
              sizes="(max-width: 1100px) 100vw, 1100px"
              style={{ objectFit: "cover" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#264653", margin: 0 }}>Caixa de Memórias</h1>
              <p style={{ color: "#666", marginTop: "6px", fontSize: "16px" }}>Selecione um morador para visualizar seu perfil e memórias afetuosas</p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <Link
                href="/cuidador"
                id="btn-voltar-cuidador"
                style={{
                  padding: "14px 24px",
                  backgroundColor: "#2A5D8A",
                  color: "white",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: "bold",
                  fontSize: "16px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(42, 93, 138, 0.2)",
                }}
              >
                ← Voltar à Área do Cuidador
              </Link>
              <Link
                href="/login"
                id="btn-login"
                style={{
                  padding: "14px 24px",
                  backgroundColor: "#2A9D8F",
                  color: "white",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: "bold",
                  fontSize: "16px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(42, 157, 143, 0.2)",
                }}
              >
                🔑 Acesso ao Sistema (Login)
              </Link>
            </div>
          </div>
        </div>

        {/* MENSAGEM DE ERRO OU CARREGAMENTO */}
        {carregando && (
          <div style={{ textAlign: "center", padding: "48px", fontSize: "20px", color: "#264653" }}>
            ⏳ Carregando moradores...
          </div>
        )}

        {erro && (
          <div style={{ padding: "16px", backgroundColor: "#FFD1D1", border: "1px solid #E85D75", borderRadius: "12px", color: "#900", marginBottom: "24px", fontWeight: "bold", textAlign: "center" }}>
            ⚠️ {erro}
          </div>
        )}

        {/* LISTA DE MORADORES */}
        {!carregando && !erro && (
          <div>
            <h2 style={{ fontSize: "24px", color: "#264653", marginBottom: "20px", fontWeight: "bold" }}>
              Moradores Cadastrados ({idosos.length})
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
              {idosos.map((morador) => (
                <div
                  key={morador.id}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                    borderTop: "6px solid #2A5D8A",
                    display: "flex",
                    flexDirection: "column",
                    justify: "space-between",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  {/* FOTO DO MORADOR (COM AVATAR PADRÃO DE FALLBACK) */}
                  <div style={{ width: "110px", height: "110px", borderRadius: "50%", overflow: "hidden", marginBottom: "16px", backgroundColor: "#E0E0E0", border: "3px solid #2A5D8A", position: "relative" }}>
                    <img
                      src={morador.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(morador.nome_completo)}&background=2A5D8A&color=fff&size=128`}
                      alt={morador.nome_completo}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  <h3 style={{ fontSize: "20px", color: "#264653", margin: "0 0 8px 0", fontWeight: "bold" }}>
                    {morador.nome_completo}
                  </h3>

                  <p style={{ color: "#666", fontSize: "14px", margin: "0 0 16px 0" }}>
                    {morador.idade ? `${morador.idade} anos` : 'Idade não informada'} • Quarto {morador.quarto || 'N/A'}
                  </p>

                  <Link
                    href={`/idoso/${morador.id}`}
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor: "#2A5D8A",
                      color: "white",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontWeight: "bold",
                      fontSize: "15px",
                      display: "block",
                      boxSizing: "border-box",
                    }}
                  >
                    📖 Abrir Caixa de Memórias
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}