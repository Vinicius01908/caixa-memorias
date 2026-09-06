"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function TelaLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("cuidador");
  const [erro, setErro] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setErro("");

    const emailLimpo = email.trim().toLowerCase();

    const usuariosSalvos = JSON.parse(localStorage.getItem("usuarios_sistema") || "[]");

    const usuariosPadrao = [
      { email: "cuidador@villa.com", senha: "123", tipo: "cuidador", idoso_id: null, nome: "Equipe de Enfermagem / Cuidador" },
      { email: "familiar1@villa.com", senha: "123", tipo: "familiar", idoso_id: 1, nome: "João Antonio (Família do José)" },
      { email: "familiar2@villa.com", senha: "123", tipo: "familiar", idoso_id: 2, nome: "Família da Maria Helena" },
      { email: "familiar3@villa.com", senha: "123", tipo: "familiar", idoso_id: 3, nome: "Família do Antonio Carlos" },
      { email: "familiar4@villa.com", senha: "123", tipo: "familiar", idoso_id: 4, nome: "Família da Dona Raimunda" },
    ];

    const todosUsuarios = [...usuariosSalvos, ...usuariosPadrao];

    const usuarioEncontrado = todosUsuarios.find(
      (u) => u.email.trim().toLowerCase() === emailLimpo && u.senha === senha && u.tipo === tipoUsuario
    );

    if (usuarioEncontrado) {
      localStorage.setItem("usuario_logado", JSON.stringify(usuarioEncontrado));

      if (usuarioEncontrado.tipo === "cuidador") {
        router.push("/cuidador");
      } else {
        const idosoIdTarget = String(usuarioEncontrado.idoso_id) || "1";
        router.push(`/idoso/${idosoIdTarget}`);
      }
    } else {
      setErro("E-mail, senha ou perfil incorretos. Certifique-se de selecionar 'Cuidador' ou 'Família' corretamente.");
    }
  };

  return (
    <div
      style={{
        backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/fachada.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justify: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(5px)",
          borderRadius: "24px",
          padding: "40px",
          width: "100%",
          maxWidth: "450px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        }}
      >
        <h1 style={{ fontSize: "32px", color: "#264653", textAlign: "center", marginBottom: "4px", fontWeight: "bold" }}>
          Caixa de Memórias
        </h1>
        <p style={{ color: "#2A5D8A", textAlign: "center", marginBottom: "28px", fontWeight: "bold", fontSize: "14px" }}>
          Villa do Conde • Residencial Sênior
        </p>

        {erro && (
          <div style={{ padding: "12px", backgroundColor: "rgba(232, 93, 117, 0.15)", border: "1px solid #E85D75", color: "#E85D75", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Tipo de Perfil</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setTipoUsuario("cuidador")}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: tipoUsuario === "cuidador" ? "2px solid #2A5D8A" : "1px solid #ccc",
                  backgroundColor: tipoUsuario === "cuidador" ? "rgba(42, 93, 138, 0.1)" : "#fff",
                  color: tipoUsuario === "cuidador" ? "#2A5D8A" : "#666",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                🩺 Cuidador
              </button>
              <button
                type="button"
                onClick={() => setTipoUsuario("familiar")}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: tipoUsuario === "familiar" ? "2px solid #2A5D8A" : "1px solid #ccc",
                  backgroundColor: tipoUsuario === "familiar" ? "rgba(42, 93, 138, 0.1)" : "#fff",
                  color: tipoUsuario === "familiar" ? "#2A5D8A" : "#666",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                👨‍👩‍👧 Família
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
              required
            />
          </div>

          <button
            type="submit"
            style={{ padding: "16px", backgroundColor: "#2A5D8A", color: "white", border: "none", borderRadius: "8px", fontSize: "18px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" }}
          >
            Entrar no Sistema
          </button>
        </form>

        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #eee", fontSize: "12px", color: "#666" }}>
          <strong>Credenciais do Cuidador:</strong><br />
          • E-mail: <code>cuidador@villa.com</code> | Senha: <code>123</code>
        </div>
      </div>
    </div>
  );
}

export default TelaLogin;