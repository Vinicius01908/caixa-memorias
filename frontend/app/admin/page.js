"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function PainelAdmin() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [idosos, setIdosos] = useState([]);
  const [logStatus, setLogStatus] = useState("Carregando permissões...");
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [termoBusca, setTermoBusca] = useState("");

  // Modal de Edição de Permissões
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    validarAcessoAdmin();
  }, []);

  async function validarAcessoAdmin() {
    const sessao = localStorage.getItem("usuario_logado");
    if (!sessao) {
      router.push("/login");
      return;
    }

    const usuarioLogado = JSON.parse(sessao);
    if (!usuarioLogado.tipo || !usuarioLogado.tipo.includes("admin")) {
      alert("Acesso restrito a Administradores do sistema.");
      router.push("/cuidador");
      return;
    }

    carregarDados();
    setCarregando(false);
  }

  async function carregarDados() {
    setLogStatus("⏳ Buscando usuários e moradores...");
    try {
      // Busca todos os usuários cadastrados
      const { data: resUsuarios, error: errUsuarios } = await supabase
        .from("usuarios_sistema")
        .select("*")
        .order("id", { ascending: true });

      if (errUsuarios) throw errUsuarios;

      // Busca lista de moradores para o modal de vinculação
      const { data: resIdosos, error: errIdosos } = await supabase
        .from("idosos")
        .select("id, nome_completo, quarto")
        .order("id", { ascending: true });

      if (errIdosos) throw errIdosos;

      setUsuarios(resUsuarios || []);
      setIdosos(resIdosos || []);
      setLogStatus(`✅ Sucesso! Usuários: ${resUsuarios?.length || 0} | Moradores: ${resIdosos?.length || 0}`);
    } catch (err) {
      console.error("Erro ao carregar dados do admin:", err);
      setLogStatus(`❌ Falha: ${err.message}`);
    }
  }

  const handleAbrirEdicao = (usuario) => {
    setUsuarioEmEdicao({ ...usuario });
    setModalAberto(true);
  };

  const handleSalvarPermissao = async (e) => {
    e.preventDefault();
    if (!usuarioEmEdicao) return;

    try {
      const dadosAtualizacao = {
        tipo: usuarioEmEdicao.tipo,
        idoso_id: usuarioEmEdicao.tipo === "familiar" ? String(usuarioEmEdicao.idoso_id || "") : null,
      };

      if (usuarioEmEdicao.nova_senha && usuarioEmEdicao.nova_senha.trim() !== "") {
        dadosAtualizacao.senha = usuarioEmEdicao.nova_senha.trim();
      }

      const { error } = await supabase
        .from("usuarios_sistema")
        .update(dadosAtualizacao)
        .eq("id", usuarioEmEdicao.id);

      if (error) throw error;

      setMensagemSucesso(`Permissões do usuário "${usuarioEmEdicao.email}" alteradas para '${usuarioEmEdicao.tipo}'!`);
      setModalAberto(false);
      setUsuarioEmEdicao(null);
      carregarDados();
      setTimeout(() => setMensagemSucesso(""), 4000);
    } catch (err) {
      alert("Erro ao alterar permissões: " + err.message);
    }
  };

  const handleExcluirUsuario = async (id, email) => {
    if (confirm(`Tem certeza que deseja revogar o acesso do usuário "${email}"?`)) {
      try {
        const { error } = await supabase.from("usuarios_sistema").delete().eq("id", id);
        if (error) throw error;
        
        setMensagemSucesso(`Acesso do usuário ${email} revogado!`);
        carregarDados();
        setTimeout(() => setMensagemSucesso(""), 4000);
      } catch (err) {
        alert("Erro ao remover usuário: " + err.message);
      }
    }
  };

  const handleLogoff = () => {
    localStorage.removeItem("usuario_logado");
    router.push("/login");
  };

  const usuariosFiltrados = usuarios.filter((u) =>
    u.email.toLowerCase().includes(termoBusca.toLowerCase()) ||
    (u.tipo && u.tipo.toLowerCase().includes(termoBusca.toLowerCase()))
  );

  if (carregando) return <div style={{ padding: "48px", textAlign: "center", fontSize: "24px" }}>Verificando credenciais de Administrador...</div>;

  return (
    <div style={{ backgroundColor: "#F8F5F0", minHeight: "100vh", padding: "24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        
        {/* CABEÇALHO ADMIN */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#264653", margin: 0 }}>🛡️ Painel do Administrador</h1>
            <p style={{ color: "#666", margin: "4px 0 0 0" }}>Controle Central de Permissões de Cuidadores e Familiares</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Link href="/cuidador" style={{ padding: "12px 20px", backgroundColor: "#2A5D8A", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
              Área do Cuidador
            </Link>
            <button type="button" onClick={handleLogoff} style={{ padding: "12px 20px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              Sair
            </button>
          </div>
        </div>

        {/* BARRA DE STATUS */}
        <div style={{ padding: "12px 18px", backgroundColor: "#EAEAEA", border: "1px solid #CCC", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", fontFamily: "monospace", color: "#333" }}>
          Status do Sistema: <strong>{logStatus}</strong>
        </div>

        {mensagemSucesso && (
          <div style={{ padding: "16px", backgroundColor: "rgba(42, 157, 143, 0.15)", border: "2px solid #2A9D8F", borderRadius: "12px", marginBottom: "24px", color: "#2A9D8F", fontWeight: "bold" }}>
            ✅ {mensagemSucesso}
          </div>
        )}

        {/* TABELA DE USUÁRIOS E PERMISSÕES */}
        <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
            <h2 style={{ fontSize: "22px", color: "#264653", margin: 0, fontWeight: "bold" }}>
              Controle de Usuários e Níveis de Acesso ({usuariosFiltrados.length})
            </h2>
            <input
              type="text"
              placeholder="🔍 Buscar por e-mail ou tipo..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #ccc", width: "100%", maxWidth: "300px" }}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#264653", color: "white" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>ID</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>E-mail</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Nível de Permissão</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Morador Vinculado</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Ações de Gestão</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => {
                  const idosoVinculado = idosos.find((i) => String(i.id) === String(u.idoso_id));

                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid #E0E0E0" }}>
                      <td style={{ padding: "12px" }}><strong>#{u.id}</strong></td>
                      <td style={{ padding: "12px" }}>{u.email}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "white",
                          backgroundColor: u.tipo === "admin" ? "#E85D75" : u.tipo === "cuidador" ? "#2A5D8A" : "#F4A261"
                        }}>
                          {u.tipo ? u.tipo.toUpperCase() : "NÃO DEFINIDO"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", color: "#555" }}>
                        {idosoVinculado ? `👤 ${idosoVinculado.nome_completo} (Q. ${idosoVinculado.quarto})` : u.tipo === "familiar" ? "⚠️ Não Vinculado" : "N/A (Acesso Amplo)"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => handleAbrirEdicao(u)}
                            style={{ padding: "6px 12px", backgroundColor: "#2A9D8F", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}
                          >
                            ✏️ Editar Permissão
                          </button>
                          <button
                            onClick={() => handleExcluirUsuario(u.id, u.email)}
                            style={{ padding: "6px 12px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}
                          >
                            🗑️ Revogar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL DE EDIÇÃO DE PERMISSÃO */}
        {modalAberto && usuarioEmEdicao && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div style={{ backgroundColor: "white", padding: "32px", borderRadius: "20px", width: "100%", maxWidth: "480px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
              <h3 style={{ marginTop: 0, color: "#264653", fontSize: "22px" }}>🛡️ Alterar Permissões de Acesso</h3>
              <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>Usuário: <strong>{usuarioEmEdicao.email}</strong></p>
              
              <form onSubmit={handleSalvarPermissao} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "6px" }}>Nível de Permissão (Role)</label>
                  <select
                    value={usuarioEmEdicao.tipo || "cuidador"}
                    onChange={(e) => setUsuarioEmEdicao({ ...usuarioEmEdicao, tipo: e.target.value })}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                    required
                  >
                    <option value="admin">🛡️ Administrador (Acesso Total + Gestão de Permissões)</option>
                    <option value="cuidador">👨‍⚕️ Cuidador / Equipe (Gestão da Casa + Telemetria)</option>
                    <option value="familiar">👨‍👩‍👧 Familiar (Acesso Restrito ao Idoso Vinculado)</option>
                  </select>
                </div>

                {usuarioEmEdicao.tipo === "familiar" && (
                  <div>
                    <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "6px" }}>Vincular ao Morador</label>
                    <select
                      value={usuarioEmEdicao.idoso_id || ""}
                      onChange={(e) => setUsuarioEmEdicao({ ...usuarioEmEdicao, idoso_id: e.target.value })}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                      required
                    >
                      <option value="">Selecione o morador...</option>
                      {idosos.map((i) => (
                        <option key={i.id} value={String(i.id)}>👤 {i.nome_completo} (Quarto {i.quarto})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "6px" }}>Redefinir Senha (opcional)</label>
                  <input
                    type="password"
                    value={usuarioEmEdicao.nova_senha || ""}
                    onChange={(e) => setUsuarioEmEdicao({ ...usuarioEmEdicao, nova_senha: e.target.value })}
                    placeholder="Digite para alterar a senha..."
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                  <button type="submit" style={{ flex: 1, padding: "14px", backgroundColor: "#2A9D8F", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                    Salvar Alterações
                  </button>
                  <button type="button" onClick={() => { setModalAberto(false); setUsuarioEmEdicao(null); }} style={{ flex: 1, padding: "14px", backgroundColor: "#ccc", color: "#333", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}