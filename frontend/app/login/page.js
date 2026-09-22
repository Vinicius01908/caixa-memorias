"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState("cuidador"); // "cuidador" ou "familiar"
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (carregando) return;

    setErro("");
    setCarregando(true);

    const emailTratado = email.trim().toLowerCase();
    const senhaTratada = senha.trim();

    try {
      console.log(`🔍 Buscando usuário: ${emailTratado}...`);

      // Consulta no Supabase ignorando maiúsculas/minúsculas no e-mail
      const { data: usuarios, error } = await supabase
        .from("usuarios_sistema")
        .select("id, email, senha, tipo, idoso_id")
        .ilike("email", emailTratado)
        .eq("senha", senhaTratada);

      if (error) {
        console.error("❌ Erro de conexão Supabase:", error);
        setErro("Erro de conexão com o banco de dados: " + error.message);
        setCarregando(false);
        return;
      }

      if (!usuarios || usuarios.length === 0) {
        setErro("E-mail ou senha incorretos. Verifique os dados digitados.");
        setCarregando(false);
        return;
      }

      // Validação flexível do tipo de perfil
      const usuarioEncontrado = usuarios.find((u) => {
        if (!u.tipo) return false;
        const tipoDb = u.tipo.toLowerCase();

        if (tipo === "cuidador") {
          // Permite qualquer perfil gestor, cuidador ou admin no banco
          return (
            tipoDb.includes("cuidador") ||
            tipoDb.includes("admin") ||
            tipoDb.includes("equipe")
          );
        } else {
          return tipoDb.includes("fam");
        }
      });

      if (!usuarioEncontrado) {
        setErro(
          `E-mail e senha corretos, mas este usuário não está cadastrado como '${
            tipo === "cuidador" ? "Cuidador / Admin" : "Família"
          }'.`
        );
        setCarregando(false);
        return;
      }

      // Prepara objeto de sessão
      const sessaoUsuario = {
        id: usuarioEncontrado.id,
        email: usuarioEncontrado.email,
        tipo: usuarioEncontrado.tipo.toLowerCase(),
        idoso_id: usuarioEncontrado.idoso_id || null,
      };

      // Salva sessão local no navegador
      localStorage.setItem("usuario_logado", JSON.stringify(sessaoUsuario));
      console.log("✅ Login bem-sucedido:", sessaoUsuario);

      // Lógica de Redirecionamento por Nível de Permissão
      if (sessaoUsuario.tipo.includes("admin")) {
        router.push("/admin");
      } else if (sessaoUsuario.tipo.includes("cuidador") || sessaoUsuario.tipo.includes("equipe")) {
        router.push("/cuidador");
      } else if (sessaoUsuario.idoso_id) {
        router.push(`/idoso/${sessaoUsuario.idoso_id}`);
      } else {
        router.push("/");
      }

    } catch (err) {
      console.error("💥 Exceção no login:", err);
      setErro("Falha ao realizar login: " + err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#F8F5F0", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "24px" }}>
      <div style={{ backgroundColor: "white", padding: "32px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", width: "100%", maxWidth: "420px", overflow: "hidden" }}>
        
        {/* Imagem da Fachada */}
        <div style={{ width: "100%", height: "180px", position: "relative", marginBottom: "20px", borderRadius: "12px", overflow: "hidden", backgroundColor: "#EAEAEA" }}>
          <Image
            src="/fachada.png"
            alt="Fachada do Residencial Senior"
            fill
            priority
            sizes="(max-width: 420px) 100vw, 420px"
            style={{ objectFit: "cover" }}
          />
        </div>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#264653", margin: 0 }}>Caixa de Memórias</h1>
          <p style={{ color: "#666", marginTop: "6px", fontSize: "14px" }}>Acesse seu painel do sistema</p>
        </div>

        {erro && (
          <div style={{ padding: "12px 16px", backgroundColor: "#FFD1D1", border: "1px solid #E85D75", borderRadius: "10px", color: "#900", marginBottom: "20px", fontSize: "14px", fontWeight: "bold" }}>
            ⚠️ {erro}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          
          <div>
            <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px", fontSize: "14px" }}>Perfil de Acesso</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setTipo("cuidador")}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "2px solid #2A5D8A",
                  backgroundColor: tipo === "cuidador" ? "#2A5D8A" : "transparent",
                  color: tipo === "cuidador" ? "white" : "#2A5D8A",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                👨‍⚕️ Cuidador / Admin
              </button>
              <button
                type="button"
                onClick={() => setTipo("familiar")}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "2px solid #F4A261",
                  backgroundColor: tipo === "familiar" ? "#F4A261" : "transparent",
                  color: tipo === "familiar" ? "white" : "#F4A261",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                👨‍👩‍👧 Família
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "6px", fontSize: "14px" }}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "6px", fontSize: "14px" }}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            style={{
              padding: "16px",
              backgroundColor: carregando ? "#aaa" : "#2A9D8F",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: carregando ? "not-allowed" : "pointer",
              marginTop: "8px",
            }}
          >
            {carregando ? "Autenticando..." : "Entrar no Sistema"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link href="/" style={{ color: "#2A5D8A", textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>
            ← Voltar para a Página Inicial
          </Link>
        </div>

      </div>
    </div>
  );
}