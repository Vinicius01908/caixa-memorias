"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function DashboardCuidador() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [idosos, setIdosos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState("midia");

  // Formulários de Cadastro
  const [novoIdoso, setNovoIdoso] = useState({ nome_completo: "", idade: "", quarto: "", diagnostico: "" });
  const [novoFamiliar, setNovoFamiliar] = useState({ nome: "", email: "", senha: "", idoso_id: "" });
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  // ESTADOS DO FLUXO CLÍNICO DA TEA
  const [idosoTEASelecionado, setIdosoTEASelecionado] = useState("");
  const [historicoTEA, setHistoricoTEA] = useState([]);
  const [resultadoTEA, setResultadoTEA] = useState(null);
  
  const [formTEA, setFormTEA] = useState({
    idoso_id: "",
    memoria_titulo: "",
    cuidador_responsavel: "Enfermeira / Cuidador",
    nivel_engajamento: "5",
    reacao_observada: "1.2", // Multiplicador Ei
    rotulo_reacao: "Entusiasmo (Risos, palmas, beijar a tela)",
    observacoes_sessao: "",
  });

  // Gerenciamento de Mídias
  const [idosoMidiaSelecionado, setIdosoMidiaSelecionado] = useState("");
  const [listaMidiasMorador, setListaMidiasMorador] = useState([]);
  const [modalEdicaoMidiaAberto, setModalEdicaoMidiaAberto] = useState(false);
  const [midiaEmEdicao, setMidiaEmEdicao] = useState(null);

  // Modal de Edição de Idoso/Familiar
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [idosoEmEdicao, setIdosoEmEdicao] = useState(null);
  const [familiarEmEdicao, setFamiliarEmEdicao] = useState({ nome: "", email: "", senha: "" });

  // Anexo Múltiplo
  const [enviado, setEnviado] = useState(false);
  const [arquivosProcessados, setArquivosProcessados] = useState([]);
  const [formMidia, setFormMidia] = useState({ idoso_id: "", autor_nome: "Cuidador / Equipe", conteudo: "" });

  useEffect(() => {
    const sessao = localStorage.getItem("usuario_logado");
    if (!sessao) {
      router.push("/login");
      return;
    }

    const usuario = JSON.parse(sessao);
    if (usuario.tipo !== "cuidador") {
      router.push("/login");
      return;
    }

    carregarDados();
    setCarregando(false);
  }, [router]);

  function carregarDados() {
    const idososPadrao = [
      { id: 1, nome_completo: "Jose Antonio Pereira", idade: 83, quarto: "101A", diagnostico: "Demência Vascular Leve" },
      { id: 2, nome_completo: "Maria Helena Souza", idade: 80, quarto: "102B", diagnostico: "Alzheimer Moderado" },
      { id: 3, nome_completo: "Antonio Carlos Lima", idade: 87, quarto: "103A", diagnostico: "Alzheimer Leve" },
      { id: 4, nome_completo: "Dona Raimunda Oliveira", idade: 86, quarto: "104C", diagnostico: "Corpos de Lewy" },
    ];
    const idososSalvos = JSON.parse(localStorage.getItem("idosos_cadastrados") || "[]");
    setIdosos([...idososSalvos, ...idososPadrao]);

    const usuariosPadrao = [
      { email: "familiar1@villa.com", senha: "123", tipo: "familiar", idoso_id: 1, nome: "João Antonio (Família do José)" },
    ];
    const usuariosSalvos = JSON.parse(localStorage.getItem("usuarios_sistema") || "[]");
    setUsuarios([...usuariosSalvos, ...usuariosPadrao]);
  }

  // CÁLCULO E REGISTRO DA TAXA DE ENGAJAMENTO AFETIVO (TEA)
  const carregarHistoricoTEA = (idosoId) => {
    setIdosoTEASelecionado(idosoId);
    if (!idosoId) {
      setHistoricoTEA([]);
      setResultadoTEA(null);
      return;
    }

    const historicoSalvo = JSON.parse(localStorage.getItem(`telemetria_tea_idoso_${idosoId}`) || "[]");
    setHistoricoTEA(historicoSalvo);

    if (historicoSalvo.length > 0) {
      const somaPonderada = historicoSalvo.reduce((acc, sessao) => acc + (sessao.nivel_engajamento * sessao.multiplicador_emocao), 0);
      const valorTEA = (somaPonderada / historicoSalvo.length).toFixed(2);
      setResultadoTEA(valorTEA);
    } else {
      setResultadoTEA(null);
    }
  };

  const handleSalvarSessaoTEA = (e) => {
    e.preventDefault();
    const idosoId = String(formTEA.idoso_id);

    if (!idosoId) {
      alert("Selecione um morador.");
      return;
    }

    const novaSessao = {
      id: Date.now(),
      data_sessao: new Date().toLocaleDateString("pt-BR"),
      memoria_titulo: formTEA.memoria_titulo || "Sessão Terapêutica de Reminiscência",
      cuidador_responsavel: formTEA.cuidador_responsavel,
      nivel_engajamento: Number(formTEA.nivel_engajamento),
      multiplicador_emocao: Number(formTEA.reacao_observada),
      rotulo_reacao: formTEA.rotulo_reacao,
      subtotal: (Number(formTEA.nivel_engajamento) * Number(formTEA.reacao_observada)).toFixed(1),
      observacoes_sessao: formTEA.observacoes_sessao,
    };

    const chaveStorage = `telemetria_tea_idoso_${idosoId}`;
    const historicoAtual = JSON.parse(localStorage.getItem(chaveStorage) || "[]");
    const novoHistorico = [novaSessao, ...historicoAtual];

    localStorage.setItem(chaveStorage, JSON.stringify(novoHistorico));

    carregarHistoricoTEA(idosoId);
    setMensagemSucesso("Telemetria clínica registrada! Índice TEA recalculado automaticamente.");
    setFormTEA({
      idoso_id: formTEA.idoso_id,
      memoria_titulo: "",
      cuidador_responsavel: "Enfermeira / Cuidador",
      nivel_engajamento: "5",
      reacao_observada: "1.2",
      rotulo_reacao: "Entusiasmo (Risos, palmas, beijar a tela)",
      observacoes_sessao: "",
    });
    setTimeout(() => setMensagemSucesso(""), 4000);
  };

  // DEMAIS FUNÇÕES DE MANUTENÇÃO (COMPRESSÃO, MÍDIAS, CADASTROS)
  const comprimirImagem = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const scaleFactor = MAX_WIDTH / img.width;
          if (scaleFactor < 1) {
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleFactor;
          } else {
            canvas.width = img.width;
            canvas.height = img.height;
          }
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
      };
    });
  };

  const lerArquivoBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  };

  const handleMultipleFilesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const listaNovosArquivos = [];
    for (const file of files) {
      let tipoDetectado = "foto";
      if (file.type.startsWith("audio/")) tipoDetectado = "audio";
      if (file.type.startsWith("video/")) tipoDetectado = "video";

      let base64 = "";
      if (file.type.startsWith("image/")) {
        base64 = await comprimirImagem(file);
      } else {
        base64 = await lerArquivoBase64(file);
      }

      listaNovosArquivos.push({ nome: file.name, tipo: tipoDetectado, base64 });
    }
    setArquivosProcessados((prev) => [...prev, ...listaNovosArquivos]);
  };

  const handleSubmitMidia = (e) => {
    e.preventDefault();
    const idosoId = String(formMidia.idoso_id);

    if (!idosoId || arquivosProcessados.length === 0) {
      alert("Selecione um morador e ao menos um arquivo.");
      return;
    }

    try {
      const chaveStorage = `memorias_idoso_${idosoId}`;
      const memoriasExistentes = JSON.parse(localStorage.getItem(chaveStorage) || "[]");

      const novasMemorias = arquivosProcessados.map((item, idx) => ({
        id: Date.now() + idx,
        idoso_id: idosoId,
        titulo: `${item.tipo.toUpperCase()} adicionado por ${formMidia.autor_nome}`,
        descricao: formMidia.conteudo,
        tipo_midia: item.tipo,
        arquivo_url: item.base64,
        autor_registro: formMidia.autor_nome,
        data_aproximada: new Date().toISOString().split("T")[0],
      }));

      localStorage.setItem(chaveStorage, JSON.stringify([...novasMemorias, ...memoriasExistentes]));
      setEnviado(true);
      setArquivosProcessados([]);
      setFormMidia({ idoso_id: formMidia.idoso_id, autor_nome: "Cuidador / Equipe", conteudo: "" });
      setTimeout(() => setEnviado(false), 4000);
    } catch (error) {
      alert("Limite de memória atingido. Tente enviar arquivos menores.");
    }
  };

  const carregarMidiasDoMorador = (idosoId) => {
    setIdosoMidiaSelecionado(idosoId);
    if (!idosoId) {
      setListaMidiasMorador([]);
      return;
    }
    const chaveStorage = `memorias_idoso_${idosoId}`;
    setListaMidiasMorador(JSON.parse(localStorage.getItem(chaveStorage) || "[]"));
  };

  const handleExcluirMidia = (midiaId, tituloMidia) => {
    if (confirm(`Excluir a memória "${tituloMidia}"?`)) {
      const chaveStorage = `memorias_idoso_${idosoMidiaSelecionado}`;
      const memoriasExistentes = JSON.parse(localStorage.getItem(chaveStorage) || "[]");
      const memoriasFiltradas = memoriasExistentes.filter((m) => String(m.id) !== String(midiaId));
      localStorage.setItem(chaveStorage, JSON.stringify(memoriasFiltradas));
      setListaMidiasMorador(memoriasFiltradas);
      setMensagemSucesso("Arquivo excluído com sucesso!");
      setTimeout(() => setMensagemSucesso(""), 4000);
    }
  };

  const handleCadastrarIdoso = (e) => {
    e.preventDefault();
    const objetoIdoso = {
      id: Date.now(),
      nome_completo: novoIdoso.nome_completo,
      idade: Number(novoIdoso.idade),
      quarto: novoIdoso.quarto,
      diagnostico: novoIdoso.diagnostico,
    };
    const cadastrados = JSON.parse(localStorage.getItem("idosos_cadastrados") || "[]");
    cadastrados.push(objetoIdoso);
    localStorage.setItem("idosos_cadastrados", JSON.stringify(cadastrados));
    carregarDados();
    setNovoIdoso({ nome_completo: "", idade: "", quarto: "", diagnostico: "" });
    setMensagemSucesso(`Morador ${objetoIdoso.nome_completo} cadastrado!`);
    setTimeout(() => setMensagemSucesso(""), 4000);
  };

  const handleCadastrarFamiliar = (e) => {
    e.preventDefault();
    const objetoFamiliar = {
      email: novoFamiliar.email,
      senha: novoFamiliar.senha,
      tipo: "familiar",
      idoso_id: String(novoFamiliar.idoso_id),
      nome: novoFamiliar.nome,
    };
    const usuariosSalvos = JSON.parse(localStorage.getItem("usuarios_sistema") || "[]");
    usuariosSalvos.push(objetoFamiliar);
    localStorage.setItem("usuarios_sistema", JSON.stringify(usuariosSalvos));
    carregarDados();
    setNovoFamiliar({ nome: "", email: "", senha: "", idoso_id: "" });
    setMensagemSucesso("Familiar vinculado com sucesso!");
    setTimeout(() => setMensagemSucesso(""), 4000);
  };

  const handleAbrirEdicao = (idoso) => {
    const familiarVinculado = usuarios.find((u) => String(u.idoso_id) === String(idoso.id));
    setIdosoEmEdicao({ ...idoso });
    setFamiliarEmEdicao(
      familiarVinculado
        ? { ...familiarVinculado, emailOriginal: familiarVinculado.email }
        : { nome: "", email: "", senha: "", idoso_id: idoso.id, emailOriginal: "" }
    );
    setModalEdicaoAberto(true);
  };

  const handleSalvarEdicao = (e) => {
    e.preventDefault();
    const idososSalvos = JSON.parse(localStorage.getItem("idosos_cadastrados") || "[]");
    const idosoIndex = idososSalvos.findIndex((i) => String(i.id) === String(idosoEmEdicao.id));
    if (idosoIndex !== -1) {
      idososSalvos[idosoIndex] = idosoEmEdicao;
      localStorage.setItem("idosos_cadastrados", JSON.stringify(idososSalvos));
    }
    carregarDados();
    setModalEdicaoAberto(false);
    setMensagemSucesso(`Dados atualizados!`);
    setTimeout(() => setMensagemSucesso(""), 4000);
  };

  const handleExcluirIdosoEFamiliar = (idosoId, nomeIdoso) => {
    if (confirm(`Excluir o idoso "${nomeIdoso}"?`)) {
      const idososSalvos = JSON.parse(localStorage.getItem("idosos_cadastrados") || "[]");
      const idososFiltrados = idososSalvos.filter((i) => String(i.id) !== String(idosoId));
      localStorage.setItem("idosos_cadastrados", JSON.stringify(idososFiltrados));
      localStorage.removeItem(`memorias_idoso_${idosoId}`);
      localStorage.removeItem(`telemetria_tea_idoso_${idosoId}`);
      carregarDados();
      setMensagemSucesso(`Morador "${nomeIdoso}" removido!`);
      setTimeout(() => setMensagemSucesso(""), 4000);
    }
  };

  const handleLogoff = () => {
    localStorage.removeItem("usuario_logado");
    router.push("/login");
  };

  if (carregando) return <div style={{ padding: "48px", textAlign: "center", fontSize: "24px" }}>Carregando...</div>;

  return (
    <div style={{ backgroundColor: "#F8F5F0", minHeight: "100vh", padding: "24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        
        {/* Cabeçalho */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#264653", margin: 0 }}>Área do Cuidador</h1>
            <p style={{ color: "#666", margin: "4px 0 0 0" }}>Painel Integrado de Gestão, Mídias e Acompanhamento Clínico</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Link href="/" style={{ padding: "12px 20px", backgroundColor: "#2A5D8A", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
              Início
            </Link>
            <button onClick={handleLogoff} style={{ padding: "12px 20px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              Sair
            </button>
          </div>
        </div>

        {mensagemSucesso && (
          <div style={{ padding: "16px", backgroundColor: "rgba(42, 157, 143, 0.15)", border: "2px solid #2A9D8F", borderRadius: "12px", marginBottom: "24px", color: "#2A9D8F", fontWeight: "bold" }}>
            ✅ {mensagemSucesso}
          </div>
        )}

        {/* NAVEGAÇÃO POR ABAS */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <button onClick={() => setAbaAtiva("midia")} style={{ padding: "14px 20px", borderRadius: "12px", border: "none", backgroundColor: abaAtiva === "midia" ? "#2A5D8A" : "#fff", color: abaAtiva === "midia" ? "#fff" : "#264653", fontWeight: "bold", cursor: "pointer" }}>
            ➕ Anexar Memória
          </button>
          <button onClick={() => setAbaAtiva("telemetriaTEA")} style={{ padding: "14px 20px", borderRadius: "12px", border: "none", backgroundColor: abaAtiva === "telemetriaTEA" ? "#2A9D8F" : "#fff", color: abaAtiva === "telemetriaTEA" ? "#fff" : "#2A9D8F", fontWeight: "bold", cursor: "pointer" }}>
            📊 Avaliação Clínica (TEA)
          </button>
          <button onClick={() => setAbaAtiva("gerenciarMidias")} style={{ padding: "14px 20px", borderRadius: "12px", border: "none", backgroundColor: abaAtiva === "gerenciarMidias" ? "#2A5D8A" : "#fff", color: abaAtiva === "gerenciarMidias" ? "#fff" : "#264653", fontWeight: "bold", cursor: "pointer" }}>
            🖼️ Gerenciar Memórias
          </button>
          <button onClick={() => setAbaAtiva("cadastrarIdoso")} style={{ padding: "14px 20px", borderRadius: "12px", border: "none", backgroundColor: abaAtiva === "cadastrarIdoso" ? "#2A5D8A" : "#fff", color: abaAtiva === "cadastrarIdoso" ? "#fff" : "#264653", fontWeight: "bold", cursor: "pointer" }}>
            👤 Cadastrar Idoso
          </button>
          <button onClick={() => setAbaAtiva("cadastrarFamiliar")} style={{ padding: "14px 20px", borderRadius: "12px", border: "none", backgroundColor: abaAtiva === "cadastrarFamiliar" ? "#2A5D8A" : "#fff", color: abaAtiva === "cadastrarFamiliar" ? "#fff" : "#264653", fontWeight: "bold", cursor: "pointer" }}>
            👨‍👩‍👧 Cadastrar Familiar
          </button>
          <button onClick={() => setAbaAtiva("gerenciar")} style={{ padding: "14px 20px", borderRadius: "12px", border: "none", backgroundColor: abaAtiva === "gerenciar" ? "#E85D75" : "#fff", color: abaAtiva === "gerenciar" ? "#fff" : "#E85D75", fontWeight: "bold", cursor: "pointer" }}>
            📋 Gerenciar Perfis
          </button>
        </div>

        {/* ABA: AVALIAÇÃO CLÍNICA DA TAXA DE ENGAJAMENTO AFETIVO (TEA) */}
        {abaAtiva === "telemetriaTEA" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* 1. FORMULÁRIO DE TELEMETRIA PÓS-SESSÃO */}
            <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)", borderLeft: "8px solid #2A9D8F" }}>
              <h2 style={{ fontSize: "22px", color: "#264653", marginBottom: "8px", fontWeight: "bold" }}>
                🩺 Registro Clínico Pós-Sessão (Telemetria)
              </h2>
              <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>
                Preencha os indicadores observados imediatamente após a sessão de estimulação de 15 minutos à beira do leito.
              </p>

              <form onSubmit={handleSalvarSessaoTEA} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Morador Avaliado</label>
                    <select
                      value={formTEA.idoso_id}
                      onChange={(e) => {
                        setFormTEA({ ...formTEA, idoso_id: e.target.value });
                        carregarHistoricoTEA(e.target.value);
                      }}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                      required
                    >
                      <option value="">Selecione um morador...</option>
                      {idosos.map((i) => (
                        <option key={i.id} value={i.id}>
                          👤 {i.nome_completo} (Quarto {i.quarto})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Profissional Responsável</label>
                    <input
                      type="text"
                      value={formTEA.cuidador_responsavel}
                      onChange={(e) => setFormTEA({ ...formTEA, cuidador_responsavel: e.target.value })}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Memória / Tema Utilizado</label>
                  <input
                    type="text"
                    value={formTEA.memoria_titulo}
                    onChange={(e) => setFormTEA({ ...formTEA, memoria_titulo: e.target.value })}
                    placeholder="Ex: Foto do Casamento / Música dos Anos 60"
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  
                  {/* NIVEL DE ENGAJAMENTO (Ni) */}
                  <div>
                    <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>
                      Nível de Engajamento (Ni)
                    </label>
                    <select
                      value={formTEA.nivel_engajamento}
                      onChange={(e) => setFormTEA({ ...formTEA, nivel_engajamento: e.target.value })}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                      required
                    >
                      <option value="5">5 — Engajamento Máximo (Interação ativa, fala espontânea)</option>
                      <option value="4">4 — Engajamento Moderado Alto (Atenção sustentada, respostas diretas)</option>
                      <option value="3">3 — Engajamento Moderado (Atenção parcial, pouca fala)</option>
                      <option value="2">2 — Baixo Engajamento (Dispersão leve, sonolência)</option>
                      <option value="1">1 — Apatia / Desinteresse Total</option>
                    </select>
                  </div>

                  {/* MULTIPLICADOR DE EMOÇÃO (Ei) */}
                  <div>
                    <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>
                      Reação Observada / Peso Emocional (Ei)
                    </label>
                    <select
                      value={formTEA.reacao_observada}
                      onChange={(e) => {
                        const val = e.target.value;
                        let rotulo = "Entusiasmo (Risos, palmas, beijar a tela)";
                        if (val === "1.0") rotulo = "Contemplação Neutra-Agradável (Sorriso leve, foco)";
                        if (val === "0.5") rotulo = "Apatia, Estresse ou Rejeição (Agitação, olhar desviado)";
                        setFormTEA({ ...formTEA, reacao_observada: val, rotulo_reacao: rotulo });
                      }}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
                      required
                    >
                      <option value="1.2">1.2 — Entusiasmo (Risos, palmas, beijar a tela)</option>
                      <option value="1.0">1.0 — Contemplação Neutra-Agradável (Sorriso leve, foco calmo)</option>
                      <option value="0.5">0.5 — Apatia, Estresse ou Rejeição (Irritabilidade, olhar desviado)</option>
                    </select>
                  </div>

                </div>

                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Notas Qualitativas / Observações da Sessão</label>
                  <textarea
                    value={formTEA.observacoes_sessao}
                    onChange={(e) => setFormTEA({ ...formTEA, observacoes_sessao: e.target.value })}
                    rows={3}
                    placeholder="Ex: Lembrou do nome dos netos espontaneamente ao ver a foto do almoço..."
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
                  />
                </div>

                <button type="submit" style={{ padding: "16px", backgroundColor: "#2A9D8F", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
                  💾 Salvar Telemetria da Sessão
                </button>
              </form>
            </div>

            {/* 2. EXIBIÇÃO DO INDICADOR TEA E HISTÓRICO DAS SESSÕES */}
            {idosoTEASelecionado && (
              <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
                
                {/* DESTAQUE DA PONTUAÇÃO TEA */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#F8F5F0", padding: "20px", borderRadius: "16px", marginBottom: "24px", border: "2px solid #2A9D8F" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", color: "#264653", fontSize: "20px" }}>Taxa de Engajamento Afetivo (TEA)</h3>
                    <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Fórmula: TEA = Σ (Ni × Ei) / n • Avaliação da eficácia da terapia</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "36px", fontWeight: "black", color: "#2A9D8F" }}>
                      {resultadoTEA ? resultadoTEA : "--"}
                    </span>
                    <span style={{ display: "block", fontSize: "12px", color: "#666", fontWeight: "bold" }}>escala de 0.5 a 6.0</span>
                  </div>
                </div>

                {/* HISTÓRICO DE SESSÕES */}
                <h3 style={{ fontSize: "18px", color: "#264653", marginBottom: "16px" }}>Histórico de Sessões Registradas ({historicoTEA.length})</h3>
                
                {historicoTEA.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {historicoTEA.map((sessao) => (
                      <div key={sessao.id} style={{ padding: "16px", borderRadius: "12px", border: "1px solid #ddd", backgroundColor: "#FFF" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontWeight: "bold", color: "#2A5D8A" }}>📅 {sessao.data_sessao} — {sessao.memoria_titulo}</span>
                          <span style={{ padding: "4px 10px", backgroundColor: "rgba(42, 157, 143, 0.15)", color: "#2A9D8F", fontWeight: "bold", borderRadius: "6px" }}>
                            Subtotal: {sessao.subtotal} pts
                          </span>
                        </div>
                        <p style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#444" }}>
                          • <strong>Engajamento (Ni):</strong> {sessao.nivel_engajamento}/5 | <strong>Multiplicador (Ei):</strong> {sessao.multiplicador_emocao} ({sessao.rotulo_reacao})
                        </p>
                        {sessao.observacoes_sessao && (
                          <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#666", italic: "true" }}>
                            " {sessao.observacoes_sessao} "
                          </p>
                        )}
                        <span style={{ fontSize: "12px", color: "#888" }}>Responsável: {sessao.cuidador_responsavel}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#888" }}>Nenhuma sessão registrada ainda para este morador.</p>
                )}

              </div>
            )}

          </div>
        )}

        {/* OUTRAS ABAS PERMANECEM MANTIDAS */}
        {abaAtiva === "midia" && (
          <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "22px", color: "#264653", marginBottom: "16px", fontWeight: "bold" }}>Registrar Múltiplas Memórias para o Morador</h2>
            {enviado && <div style={{ padding: "12px", backgroundColor: "#2A9D8F", color: "white", borderRadius: "8px", marginBottom: "16px" }}>Mídias anexadas com sucesso!</div>}
            
            <form onSubmit={handleSubmitMidia} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Escolha o Morador Destinatário</label>
                  <select value={formMidia.idoso_id} onChange={(e) => setFormMidia({ ...formMidia, idoso_id: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }} required>
                    <option value="">Selecione um morador...</option>
                    {idosos.map((i) => (
                      <option key={i.id} value={i.id}>
                        👤 {i.nome_completo} (Quarto {i.quarto})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Cuidador Responsável</label>
                  <input type="text" value={formMidia.autor_nome} onChange={(e) => setFormMidia({ ...formMidia, autor_nome: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required />
                </div>
              </div>

              <div style={{ padding: "24px", border: "2px dashed #2A5D8A", borderRadius: "12px", textAlign: "center", backgroundColor: "#F8F5F0" }}>
                <label style={{ cursor: "pointer", display: "block" }}>
                  <span style={{ fontSize: "18px", fontWeight: "bold", color: "#2A5D8A" }}>📁 Clique para selecionar Arquivos (Fotos, Áudios e Vídeos)</span>
                  <input type="file" multiple accept="image/*,audio/*,video/*" onChange={handleMultipleFilesChange} style={{ display: "none" }} />
                </label>
              </div>

              {arquivosProcessados.length > 0 && (
                <div style={{ backgroundColor: "#FFF8F0", padding: "16px", borderRadius: "12px", border: "1px solid #F4A261" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#264653" }}>Arquivos Selecionados ({arquivosProcessados.length}):</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {arquivosProcessados.map((item, index) => (
                      <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "white", borderRadius: "6px", border: "1px solid #ddd" }}>
                        <span style={{ fontSize: "14px", fontWeight: "bold", color: "#2A5D8A" }}>
                          {item.tipo === "foto" ? "📷 Foto" : item.tipo === "audio" ? "🎵 Áudio" : "🎬 Vídeo"}: {item.nome}
                        </span>
                        <button type="button" onClick={() => setArquivosProcessados((prev) => prev.filter((_, i) => i !== index))} style={{ padding: "4px 8px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Descrição / Mensagem Afetiva Geral</label>
                <textarea value={formMidia.conteudo} onChange={(e) => setFormMidia({ ...formMidia, conteudo: e.target.value })} rows={3} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} placeholder="Escreva o relato das memórias..." required />
              </div>

              <button type="submit" style={{ padding: "16px", backgroundColor: "#2A5D8A", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
                Salvar Todos os Arquivos no Perfil
              </button>
            </form>
          </div>
        )}

        {abaAtiva === "gerenciarMidias" && (
          <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "22px", color: "#264653", marginBottom: "16px", fontWeight: "bold" }}>Gerenciar e Excluir Arquivos Anexados</h2>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Selecione o Morador para Ver as Mídias</label>
              <select value={idosoMidiaSelecionado} onChange={(e) => carregarMidiasDoMorador(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}>
                <option value="">Escolha um idoso...</option>
                {idosos.map((i) => (
                  <option key={i.id} value={i.id}>
                    👤 {i.nome_completo} (Quarto {i.quarto})
                  </option>
                ))}
              </select>
            </div>

            {idosoMidiaSelecionado && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                {listaMidiasMorador.map((midia) => (
                  <div key={midia.id} style={{ padding: "16px", borderRadius: "12px", border: "1px solid #ddd", backgroundColor: "#F8F5F0" }}>
                    <h4 style={{ margin: "0 0 6px 0", color: "#264653" }}>{midia.titulo}</h4>
                    <p style={{ margin: "0 0 12px 0", color: "#555", fontSize: "14px" }}>{midia.descricao}</p>
                    <button onClick={() => handleExcluirMidia(midia.id, midia.titulo)} style={{ padding: "8px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
                      🗑️ Excluir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {abaAtiva === "cadastrarIdoso" && (
          <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "22px", color: "#264653", marginBottom: "16px", fontWeight: "bold" }}>Cadastrar Novo Idoso Morador</h2>
            <form onSubmit={handleCadastrarIdoso} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Nome Completo</label>
                  <input type="text" value={novoIdoso.nome_completo} onChange={(e) => setNovoIdoso({ ...novoIdoso, nome_completo: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Idade</label>
                  <input type="number" value={novoIdoso.idade} onChange={(e) => setNovoIdoso({ ...novoIdoso, idade: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Quarto</label>
                  <input type="text" value={novoIdoso.quarto} onChange={(e) => setNovoIdoso({ ...novoIdoso, quarto: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Diagnóstico Clínico</label>
                <input type="text" value={novoIdoso.diagnostico} onChange={(e) => setNovoIdoso({ ...novoIdoso, diagnostico: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required />
              </div>
              <button type="submit" style={{ padding: "16px", backgroundColor: "#2A9D8F", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>Cadastrar Morador</button>
            </form>
          </div>
        )}

        {abaAtiva === "cadastrarFamiliar" && (
          <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "22px", color: "#264653", marginBottom: "16px", fontWeight: "bold" }}>Cadastrar Familiar e Vincular ao Morador</h2>
            <form onSubmit={handleCadastrarFamiliar} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Selecione o Morador</label>
                <select value={novoFamiliar.idoso_id} onChange={(e) => setNovoFamiliar({ ...novoFamiliar, idoso_id: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }} required>
                  <option value="">Escolha o morador...</option>
                  {idosos.map((i) => <option key={i.id} value={i.id}>👤 {i.nome_completo} (Quarto {i.quarto})</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Nome do Familiar</label>
                  <input type="text" value={novoFamiliar.nome} onChange={(e) => setNovoFamiliar({ ...novoFamiliar, nome: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>E-mail de Acesso</label>
                  <input type="email" value={novoFamiliar.email} onChange={(e) => setNovoFamiliar({ ...novoFamiliar, email: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Senha de Acesso</label>
                  <input type="password" value={novoFamiliar.senha} onChange={(e) => setNovoFamiliar({ ...novoFamiliar, senha: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required />
                </div>
              </div>
              <button type="submit" style={{ padding: "16px", backgroundColor: "#F4A261", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>Vincular e Criar Conta do Familiar</button>
            </form>
          </div>
        )}

        {abaAtiva === "gerenciar" && (
          <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "22px", color: "#264653", marginBottom: "20px", fontWeight: "bold" }}>Lista de Moradores e Perfis</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {idosos.map((idoso) => {
                const familiarVinculado = usuarios.find((u) => String(u.idoso_id) === String(idoso.id));
                return (
                  <div key={idoso.id} style={{ padding: "20px", borderRadius: "12px", backgroundColor: "#F8F5F0", borderLeft: "6px solid #2A5D8A", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 6px 0", fontSize: "20px", color: "#264653" }}>👤 {idoso.nome_completo}</h3>
                      <p style={{ margin: "0 0 8px 0", color: "#666", fontSize: "14px" }}>
                        {idoso.idade} anos • Quarto {idoso.quarto} • {idoso.diagnostico || "Sem diagnóstico"}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <Link href={`/idoso/${idoso.id}`} style={{ padding: "10px 16px", backgroundColor: "#2A5D8A", color: "white", textDecoration: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "14px" }}>
                        👁️ Perfil
                      </Link>
                      <button onClick={() => handleAbrirEdicao(idoso)} style={{ padding: "10px 16px", backgroundColor: "#F4A261", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>
                        ✏️ Editar
                      </button>
                      <button onClick={() => handleExcluirIdosoEFamiliar(idoso.id, idoso.nome_completo)} style={{ padding: "10px 16px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>
                        🗑️ Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default DashboardCuidador;