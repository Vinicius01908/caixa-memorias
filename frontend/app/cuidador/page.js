"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function DashboardCuidador() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [idosos, setIdosos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState("gerenciar");
  const [logStatus, setLogStatus] = useState("Aguardando carregamento...");

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
    reacao_observada: "1.2",
    rotulo_reacao: "Entusiasmo (Risos, palmas, beijar a tela)",
    observacoes_sessao: "",
  });

  // Gerenciamento de Mídias
  const [idosoMidiaSelecionado, setIdosoMidiaSelecionado] = useState("");
  const [listaMidiasMorador, setListaMidiasMorador] = useState([]);

  // Modais de Edição
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [idosoEmEdicao, setIdosoEmEdicao] = useState(null);
  const [modalEdicaoFamiliarAberto, setModalEdicaoFamiliarAberto] = useState(false);
  const [familiarEmEdicao, setFamiliarEmEdicao] = useState(null);

  // Anexo Múltiplo
  const [enviandoMidia, setEnviandoMidia] = useState(false);
  const [arquivosSelecionados, setArquivosSelecionados] = useState([]);
  const [formMidia, setFormMidia] = useState({ idoso_id: "", autor_nome: "Cuidador / Equipe", conteudo: "" });

  // Moderação Telegram
  const [submissoesTelegram, setSubmissoesTelegram] = useState([]);
  const [carregandoTelegram, setCarregandoTelegram] = useState(false);
  const [processandoAprovacaoId, setProcessandoAprovacaoId] = useState(null);
  const [botInfo, setBotInfo] = useState({ ativo: false, username: null });

  useEffect(() => {
    carregarDados();
    carregarSubmissoesTelegram();
    carregarBotInfo();
    setCarregando(false);
  }, []);

  // 1. CARREGAR DADOS COM RESILIÊNCIA E TIMEOUT
  async function carregarDados() {
    setLogStatus("⏳ Conectando ao Supabase...");
    console.log("🔄 Disparando busca de dados...");

    try {
      if (!supabase || !supabase.from) {
        setLogStatus("❌ Cliente Supabase não foi inicializado.");
        return;
      }

      // Timeout de segurança em 5 segundos
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Tempo de conexão esgotado (Timeout)")), 5000)
      );

      // Busca moradores sem limitação e ordenado por ID
      const idososPromise = supabase.from("idosos").select("*").order("id", { ascending: true });
      const resIdosos = await Promise.race([idososPromise, timeoutPromise]);

      if (resIdosos.error) {
        setLogStatus(`❌ Erro em 'idosos': ${resIdosos.error.message}`);
        console.error(resIdosos.error);
        return;
      }

      console.log("✅ Idosos carregados:", resIdosos.data);
      setIdosos(resIdosos.data || []);

      // Busca usuários / familiares
      const usuariosPromise = supabase.from("usuarios_sistema").select("*");
      const resUsuarios = await Promise.race([usuariosPromise, timeoutPromise]);

      if (!resUsuarios.error) {
        console.log("✅ Usuários carregados:", resUsuarios.data);
        setUsuarios(resUsuarios.data || []);
      }

      setLogStatus(`✅ Sucesso! Moradores: ${resIdosos.data?.length || 0} | Usuarios: ${resUsuarios.data?.length || 0}`);
      carregarSubmissoesTelegram();

    } catch (err) {
      console.error("💥 Falha na conexão:", err);
      setLogStatus(`❌ Falha de Conexão: ${err.message}`);
    }
  }

  // EDIÇÃO DE MORADOR
  const handleAbrirEdicao = (idoso) => {
    setIdosoEmEdicao({ ...idoso });
    setModalEdicaoAberto(true);
  };

  const handleSalvarEdicaoIdoso = async (e) => {
    e.preventDefault();
    if (!idosoEmEdicao) return;

    try {
      const { error } = await supabase
        .from("idosos")
        .update({
          nome_completo: idosoEmEdicao.nome_completo,
          idade: Number(idosoEmEdicao.idade),
          quarto: idosoEmEdicao.quarto,
          diagnostico: idosoEmEdicao.diagnostico,
        })
        .eq("id", idosoEmEdicao.id);

      if (error) throw error;

      setMensagemSucesso(`Cadastro do morador "${idosoEmEdicao.nome_completo}" atualizado!`);
      setModalEdicaoAberto(false);
      setIdosoEmEdicao(null);
      carregarDados();
      setTimeout(() => setMensagemSucesso(""), 4000);
    } catch (err) {
      alert("Erro ao atualizar morador: " + err.message);
    }
  };

  // EDIÇÃO DE FAMILIAR
  const handleAbrirEdicaoFamiliar = (familiar) => {
    setFamiliarEmEdicao({ ...familiar });
    setModalEdicaoFamiliarAberto(true);
  };

  const handleSalvarEdicaoFamiliar = async (e) => {
    e.preventDefault();
    if (!familiarEmEdicao) return;

    try {
      const dadosAtualizacao = {
        nome: familiarEmEdicao.nome,
        email: familiarEmEdicao.email,
        idoso_id: String(familiarEmEdicao.idoso_id),
      };

      if (familiarEmEdicao.nova_senha && familiarEmEdicao.nova_senha.trim() !== "") {
        dadosAtualizacao.senha = familiarEmEdicao.nova_senha;
      }

      const { error } = await supabase
        .from("usuarios_sistema")
        .update(dadosAtualizacao)
        .eq("id", familiarEmEdicao.id);

      if (error) throw error;

      setMensagemSucesso(`Cadastro do familiar "${familiarEmEdicao.nome}" atualizado!`);
      setModalEdicaoFamiliarAberto(false);
      setFamiliarEmEdicao(null);
      carregarDados();
      setTimeout(() => setMensagemSucesso(""), 4000);
    } catch (err) {
      alert("Erro ao atualizar familiar: " + err.message);
    }
  };

  const handleExcluirFamiliar = async (familiarId, nomeFamiliar) => {
    if (confirm(`Remover o cadastro do familiar "${nomeFamiliar}"?`)) {
      await supabase.from("usuarios_sistema").delete().eq("id", familiarId);
      carregarDados();
      setMensagemSucesso(`Familiar "${nomeFamiliar}" removido!`);
      setTimeout(() => setMensagemSucesso(""), 4000);
    }
  };

  // CADASTRO DE MORADOR
  const handleCadastrarIdoso = async (e) => {
    e.preventDefault();
    const novoObjeto = {
      nome_completo: novoIdoso.nome_completo,
      idade: Number(novoIdoso.idade),
      quarto: novoIdoso.quarto,
      diagnostico: novoIdoso.diagnostico,
    };

    const { error } = await supabase.from("idosos").insert([novoObjeto]);

    if (error) {
      alert("Erro ao cadastrar morador: " + error.message);
      return;
    }

    carregarDados();
    setNovoIdoso({ nome_completo: "", idade: "", quarto: "", diagnostico: "" });
    setMensagemSucesso(`Morador ${novoObjeto.nome_completo} cadastrado!`);
    setTimeout(() => setMensagemSucesso(""), 4000);
  };

  // CADASTRO DE FAMILIAR
  const handleCadastrarFamiliar = async (e) => {
    e.preventDefault();

    if (!novoFamiliar.idoso_id) {
      alert("Selecione um morador para vincular o familiar.");
      return;
    }

    const objetoFamiliar = {
      email: novoFamiliar.email,
      senha: novoFamiliar.senha,
      tipo: "familiar",
      idoso_id: String(novoFamiliar.idoso_id),
      nome: novoFamiliar.nome,
    };

    const { error } = await supabase
      .from("usuarios_sistema")
      .insert([objetoFamiliar]);

    if (error) {
      alert("Erro ao cadastrar familiar: " + error.message);
    } else {
      setMensagemSucesso("Familiar vinculado no Supabase com sucesso!");
      setNovoFamiliar({ nome: "", email: "", senha: "", idoso_id: "" });
      carregarDados();
      setTimeout(() => setMensagemSucesso(""), 4000);
    }
  };

  const handleExcluirIdosoEFamiliar = async (idosoId, nomeIdoso) => {
    if (confirm(`Excluir o morador "${nomeIdoso}" (ID: ${idosoId}) e todos os seus registros?`)) {
      await supabase.from("idosos").delete().eq("id", idosoId);
      await supabase.from("usuarios_sistema").delete().eq("idoso_id", idosoId);
      await supabase.from("memorias").delete().eq("idoso_id", idosoId);
      await supabase.from("interacoes_tea").delete().eq("idoso_id", idosoId);

      carregarDados();
      setMensagemSucesso(`Morador "${nomeIdoso}" excluído!`);
      setTimeout(() => setMensagemSucesso(""), 4000);
    }
  };

  // ENVIO DE MÍDIAS
  const handleMultipleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setArquivosSelecionados((prev) => [...prev, ...files]);
    }
  };

  const handleSubmitMidia = async (e) => {
    e.preventDefault();
    const idosoId = String(formMidia.idoso_id);

    if (!idosoId || arquivosSelecionados.length === 0) {
      alert("Selecione um morador e ao menos um arquivo.");
      return;
    }

    setEnviandoMidia(true);

    try {
      for (const file of arquivosSelecionados) {
        let tipoDetectado = "foto";
        if (file.type.startsWith("audio/")) tipoDetectado = "audio";
        if (file.type.startsWith("video/")) tipoDetectado = "video";

        const nomeArquivoUnico = `${idosoId}/${Date.now()}_${file.name}`;

        const { error: storageErr } = await supabase.storage
          .from("memorias-idosos")
          .upload(nomeArquivoUnico, file);

        let urlFinal = "";
        if (!storageErr) {
          const { data: publicUrlData } = supabase.storage.from("memorias-idosos").getPublicUrl(nomeArquivoUnico);
          urlFinal = publicUrlData.publicUrl;
        } else {
          urlFinal = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
        }

        await supabase.from("memorias").insert([
          {
            idoso_id: idosoId,
            titulo: `${tipoDetectado.toUpperCase()} enviado por ${formMidia.autor_nome}`,
            descricao: formMidia.conteudo,
            tipo_midia: tipoDetectado,
            arquivo_url: urlFinal,
            autor_registro: formMidia.autor_nome,
          },
        ]);
      }

      setMensagemSucesso("Mídias salvas no Supabase com sucesso!");
      setArquivosSelecionados([]);
      setFormMidia({ idoso_id: formMidia.idoso_id, autor_nome: "Cuidador / Equipe", conteudo: "" });
      setTimeout(() => setMensagemSucesso(""), 4000);
    } catch (err) {
      alert("Erro ao enviar mídias para o servidor Supabase.");
      console.error(err);
    } finally {
      setEnviandoMidia(false);
    }
  };

  // CONSULTAR MÍDIAS
  const carregarMidiasDoMorador = async (idosoId) => {
    setIdosoMidiaSelecionado(idosoId);
    if (!idosoId) {
      setListaMidiasMorador([]);
      return;
    }

    const { data: memoriasDb, error } = await supabase
      .from("memorias")
      .select("*")
      .eq("idoso_id", idosoId)
      .order("created_at", { ascending: false });

    if (!error && memoriasDb && memoriasDb.length > 0) {
      setListaMidiasMorador(memoriasDb);
    } else {
      const chaveStorage = `memorias_idoso_${idosoId}`;
      setListaMidiasMorador(JSON.parse(localStorage.getItem(chaveStorage) || "[]"));
    }
  };

  const handleExcluirMidia = async (midiaId, tituloMidia) => {
    if (confirm(`Excluir a memória "${tituloMidia}"?`)) {
      await supabase.from("memorias").delete().eq("id", midiaId);
      carregarMidiasDoMorador(idosoMidiaSelecionado);
      setMensagemSucesso("Arquivo excluído com sucesso!");
      setTimeout(() => setMensagemSucesso(""), 4000);
    }
  };

  // TELEMETRIA TEA
  const carregarHistoricoTEA = async (idosoId) => {
    setIdosoTEASelecionado(idosoId);
    if (!idosoId) {
      setHistoricoTEA([]);
      setResultadoTEA(null);
      return;
    }

    const { data: interacoesDb } = await supabase
      .from("interacoes_tea")
      .select("*")
      .eq("idoso_id", idosoId)
      .order("created_at", { ascending: false });

    let historico = interacoesDb || [];
    setHistoricoTEA(historico);

    if (historico.length > 0) {
      const somaPonderada = historico.reduce((acc, sessao) => acc + (Number(sessao.nivel_engajamento) * Number(sessao.multiplicador_emocao)), 0);
      setResultadoTEA((somaPonderada / historico.length).toFixed(2));
    } else {
      setResultadoTEA(null);
    }
  };

  const handleSalvarSessaoTEA = async (e) => {
    e.preventDefault();
    const idosoId = String(formTEA.idoso_id);

    if (!idosoId) {
      alert("Selecione um morador.");
      return;
    }

    const novaSessao = {
      idoso_id: idosoId,
      memoria_titulo: formTEA.memoria_titulo || "Sessão Terapêutica",
      cuidador_responsavel: formTEA.cuidador_responsavel,
      nivel_engajamento: Number(formTEA.nivel_engajamento),
      multiplicador_emocao: Number(formTEA.reacao_observada),
      rotulo_reacao: formTEA.rotulo_reacao,
      observacoes_sessao: formTEA.observacoes_sessao,
    };

    await supabase.from("interacoes_tea").insert([novaSessao]);

    carregarHistoricoTEA(idosoId);
    setMensagemSucesso("Sessão TEA salva com sucesso!");
    setFormTEA({ ...formTEA, memoria_titulo: "", observacoes_sessao: "" });
    setTimeout(() => setMensagemSucesso(""), 4000);
  };

  // FUNÇÕES DO TELEGRAM
  const carregarSubmissoesTelegram = async () => {
    setCarregandoTelegram(true);
    try {
      // 1. Tenta buscar direto no Supabase
      const { data, error } = await supabase
        .from("telegram_submissoes")
        .select("*")
        .eq("status", "pendente")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        setSubmissoesTelegram(data);
      } else {
        // Fallback: busca via rota de API backend
        const res = await fetch("/api/telegram/pendentes");
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) setSubmissoesTelegram(json);
        }
      }
    } catch (err) {
      console.log("Aviso ao carregar Telegram:", err.message);
    } finally {
      setCarregandoTelegram(false);
    }
  };

  const carregarBotInfo = async () => {
    try {
      const res = await fetch("/api/telegram/bot-info");
      if (res.ok) {
        const json = await res.json();
        setBotInfo(json);
      }
    } catch (e) {
      // Opcional
    }
  };

  const handleAprovarTelegram = async (item) => {
    setProcessandoAprovacaoId(item.id);
    try {
      // 1. Grava na tabela 'memorias' do morador (visível no Modo Terapêutico)
      const { error: errMem } = await supabase.from("memorias").insert([
        {
          idoso_id: String(item.idoso_id),
          titulo: `${(item.tipo_midia || "mídia").toUpperCase()} enviado por ${item.nome_familiar || "Família via Telegram"}`,
          descricao: item.legenda || "Enviado com carinho via Telegram",
          tipo_midia: item.tipo_midia,
          arquivo_url: item.arquivo_url,
          autor_registro: `Família (${item.nome_familiar || "Telegram"})`,
        },
      ]);

      if (errMem) {
        console.error("Erro ao salvar memória no Supabase:", errMem);
      }

      // 2. Atualiza status na tabela de submissões
      await supabase
        .from("telegram_submissoes")
        .update({ status: "aprovado" })
        .eq("id", item.id);

      // 3. Notifica o familiar pelo Bot do Telegram
      try {
        await fetch("/api/telegram/aprovar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, cuidador_nome: "Cuidador Responsável" }),
        });
      } catch (e) {
        // Notificação em segundo plano
      }

      setMensagemSucesso("✅ Memória aprovada! Já está incluída no perfil e visível em 'Iniciar Modo Terapêutico'!");
      setSubmissoesTelegram((prev) => prev.filter((s) => s.id !== item.id));
      setTimeout(() => setMensagemSucesso(""), 5000);
    } catch (err) {
      alert("Erro ao aprovar memória: " + err.message);
    } finally {
      setProcessandoAprovacaoId(null);
    }
  };

  const handleRecusarTelegram = async (item) => {
    const motivo = prompt("Motivo da recusa (opcional, será enviado ao familiar):", "Critérios do plano terapêutico") || "";
    setProcessandoAprovacaoId(item.id);
    try {
      await supabase
        .from("telegram_submissoes")
        .update({ status: "recusado", motivo_recusa: motivo })
        .eq("id", item.id);

      try {
        await fetch("/api/telegram/recusar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, motivo }),
        });
      } catch (e) {}

      setMensagemSucesso("Memória recusada com sucesso.");
      setSubmissoesTelegram((prev) => prev.filter((s) => s.id !== item.id));
      setTimeout(() => setMensagemSucesso(""), 4000);
    } catch (err) {
      alert("Erro ao recusar memória: " + err.message);
    } finally {
      setProcessandoAprovacaoId(null);
    }
  };

  const handleCopiarLinkTelegram = (idoso) => {
    const username = botInfo.username || "SEU_BOT_TELEGRAM";
    const link = `https://t.me/${username}?start=${idoso.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      alert(`Link do Telegram copiado para a área de transferência!\n\n${link}\n\nEnvie este link para a família no WhatsApp para vincularem diretamente ao morador "${idoso.nome_completo}".`);
    } else {
      prompt("Copie o link abaixo para enviar à família:", link);
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
        
        {/* CABEÇALHO */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#264653", margin: 0 }}>Área do Cuidador</h1>
            <p style={{ color: "#666", margin: "4px 0 0 0" }}>Gerenciamento do Sistema de Memórias</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              type="button" 
              onClick={carregarDados} 
              style={{ padding: "12px 20px", backgroundColor: "#2A9D8F", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
            >
              🔄 Recarregar Dados
            </button>
            <Link href="/" style={{ padding: "12px 20px", backgroundColor: "#2A5D8A", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
              Início
            </Link>
            <button type="button" onClick={handleLogoff} style={{ padding: "12px 20px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              Sair
            </button>
          </div>
        </div>

        {/* BARRA DE STATUS DE DIAGNÓSTICO */}
        <div style={{ padding: "12px 18px", backgroundColor: "#EAEAEA", border: "1px solid #CCC", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", fontFamily: "monospace", color: "#333" }}>
          Status da Conexão: <strong>{logStatus}</strong>
        </div>

        {mensagemSucesso && (
          <div style={{ padding: "16px", backgroundColor: "rgba(42, 157, 143, 0.15)", border: "2px solid #2A9D8F", borderRadius: "12px", marginBottom: "24px", color: "#2A9D8F", fontWeight: "bold" }}>
            ✅ {mensagemSucesso}
          </div>
        )}

        {/* NAVEGAÇÃO POR ABAS */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <button type="button" onClick={() => setAbaAtiva("gerenciar")} style={{ padding: "14px 20px", borderRadius: "12px", border: "none", backgroundColor: abaAtiva === "gerenciar" ? "#E85D75" : "#fff", color: abaAtiva === "gerenciar" ? "#fff" : "#E85D75", fontWeight: "bold", cursor: "pointer" }}>
            📋 Gerenciar Perfis
          </button>
          <button type="button" onClick={() => { setAbaAtiva("aprovacoesTelegram"); carregarSubmissoesTelegram(); }} style={{ padding: "14px 20px", borderRadius: "12px", border: "none", backgroundColor: abaAtiva === "aprovacoesTelegram" ? "#0088cc" : "#fff", color: abaAtiva === "aprovacoesTelegram" ? "#fff" : "#0088cc", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📲 Aprovações Telegram</span>
            {submissoesTelegram.length > 0 && (
              <span style={{ backgroundColor: abaAtiva === "aprovacoesTelegram" ? "#fff" : "#E85D75", color: abaAtiva === "aprovacoesTelegram" ? "#0088cc" : "#fff", borderRadius: "10px", padding: "2px 8px", fontSize: "12px", fontWeight: "bold" }}>
                {submissoesTelegram.length}
              </span>
            )}
          </button>
          <button type="button" onClick={() => setAbaAtiva("midia")} style={{ padding: "14px 20px", borderRadius: "12px", border: "none", backgroundColor: abaAtiva === "midia" ? "#2A5D8A" : "#fff", color: abaAtiva === "midia" ? "#fff" : "#264653", fontWeight: "bold", cursor: "pointer" }}>
            ☁️ Upload de Mídias (Nuvem)
          </button>
          <button type="button" onClick={() => setAbaAtiva("telemetriaTEA")} style={{ padding: "14px 20px", borderRadius: "12px", border: "none", backgroundColor: abaAtiva === "telemetriaTEA" ? "#2A9D8F" : "#fff", color: abaAtiva === "telemetriaTEA" ? "#fff" : "#2A9D8F", fontWeight: "bold", cursor: "pointer" }}>
            📊 Avaliação Clínica (TEA)
          </button>
          <button type="button" onClick={() => setAbaAtiva("gerenciarMidias")} style={{ padding: "14px 20px", borderRadius: "12px", border: "none", backgroundColor: abaAtiva === "gerenciarMidias" ? "#2A5D8A" : "#fff", color: abaAtiva === "gerenciarMidias" ? "#fff" : "#264653", fontWeight: "bold", cursor: "pointer" }}>
            🖼️ Gerenciar Memórias
          </button>
          <button type="button" onClick={() => setAbaAtiva("cadastrarIdoso")} style={{ padding: "14px 20px", borderRadius: "12px", border: "none", backgroundColor: abaAtiva === "cadastrarIdoso" ? "#2A5D8A" : "#fff", color: abaAtiva === "cadastrarIdoso" ? "#fff" : "#264653", fontWeight: "bold", cursor: "pointer" }}>
            👤 Cadastrar Idoso
          </button>
          <button type="button" onClick={() => setAbaAtiva("cadastrarFamiliar")} style={{ padding: "14px 20px", borderRadius: "12px", border: "none", backgroundColor: abaAtiva === "cadastrarFamiliar" ? "#2A5D8A" : "#fff", color: abaAtiva === "cadastrarFamiliar" ? "#fff" : "#264653", fontWeight: "bold", cursor: "pointer" }}>
            👨‍👩‍👧 Cadastrar Familiar
          </button>
        </div>

        {/* ABA: GERENCIAR PERFIS */}
        {abaAtiva === "gerenciar" && (
          <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "22px", color: "#264653", marginBottom: "20px", fontWeight: "bold" }}>
              Lista de Moradores e Familiares Cadastrados ({idosos ? idosos.length : 0} no total)
            </h2>

            {(!idosos || idosos.length === 0) ? (
              <div style={{ padding: "24px", color: "#666", textAlign: "center" }}>
                Nenhum morador encontrado. Verifique a barra de status acima.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {idosos.map((idoso) => {
                  const listaUsuarios = Array.isArray(usuarios) ? usuarios : [];
                  const familiaresDoIdoso = listaUsuarios.filter((u) => String(u.idoso_id) === String(idoso.id));

                  return (
                    <div key={idoso.id} style={{ padding: "20px", borderRadius: "12px", backgroundColor: "#F8F5F0", borderLeft: "6px solid #2A5D8A" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <div>
                          <h3 style={{ margin: "0 0 6px 0", color: "#264653" }}>
                            👤 {idoso.nome_completo} <span style={{ fontSize: "12px", color: "#888", fontWeight: "normal" }}>(ID: {idoso.id})</span>
                          </h3>
                          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                            {idoso.idade} anos • Quarto {idoso.quarto} • Diagnóstico: {idoso.diagnostico || 'Não informado'}
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          <Link href={`/idoso/${idoso.id}`} style={{ padding: "8px 14px", backgroundColor: "#2A5D8A", color: "white", textDecoration: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "14px" }}>
                            Perfil
                          </Link>
                          <button type="button" onClick={() => handleCopiarLinkTelegram(idoso)} style={{ padding: "8px 14px", backgroundColor: "#0088cc", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>
                            📲 Link Telegram
                          </button>
                          <button type="button" onClick={() => handleAbrirEdicao(idoso)} style={{ padding: "8px 14px", backgroundColor: "#F4A261", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>
                            ✏️ Editar Morador
                          </button>
                          <button type="button" onClick={() => handleExcluirIdosoEFamiliar(idoso.id, idoso.nome_completo)} style={{ padding: "8px 14px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>
                            Excluir Morador
                          </button>
                        </div>
                      </div>

                      {/* FAMILIARES VINCULADOS */}
                      <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #ccc" }}>
                        <h4 style={{ margin: "0 0 8px 0", color: "#2A5D8A", fontSize: "14px" }}>👨‍👩‍👧 Familiares Responsáveis:</h4>
                        {familiaresDoIdoso.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {familiaresDoIdoso.map((fam) => (
                              <div key={fam.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFF", padding: "10px 14px", borderRadius: "8px", border: "1px solid #E0E0E0" }}>
                                <div>
                                  <span style={{ fontWeight: "bold", color: "#264653" }}>{fam.nome || fam.email}</span>
                                  <span style={{ color: "#888", fontSize: "13px", marginLeft: "10px" }}>({fam.email})</span>
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button type="button" onClick={() => handleAbrirEdicaoFamiliar(fam)} style={{ padding: "6px 12px", backgroundColor: "#2A9D8F", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
                                    ✏️ Editar Familiar
                                  </button>
                                  <button type="button" onClick={() => handleExcluirFamiliar(fam.id, fam.nome || fam.email)} style={{ padding: "6px 12px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
                                    🗑️ Remover
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ margin: 0, color: "#999", fontSize: "13px", fontStyle: "italic" }}>
                            Nenhum familiar vinculado no momento.
                          </p>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA: APROVAÇÕES TELEGRAM */}
        {abaAtiva === "aprovacoesTelegram" && (
          <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2 style={{ fontSize: "22px", color: "#264653", margin: "0 0 6px 0", fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span>📲 Aprovações de Mídias do Telegram</span>
                  {submissoesTelegram.length > 0 && (
                    <span style={{ backgroundColor: "#E85D75", color: "white", fontSize: "14px", padding: "3px 10px", borderRadius: "20px", fontWeight: "normal" }}>
                      {submissoesTelegram.length} pendente{submissoesTelegram.length > 1 ? "s" : ""}
                    </span>
                  )}
                </h2>
                <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                  Mídias enviadas pelos familiares via Telegram aguardando sua validação para entrar na Caixa de Memórias.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={carregarSubmissoesTelegram}
                  style={{ padding: "10px 18px", backgroundColor: "#0088cc", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  🔄 {carregandoTelegram ? "Atualizando..." : "Atualizar Lista"}
                </button>
              </div>
            </div>

            {/* CARD INFORMATIVO DO BOT TELEGRAM */}
            <div style={{ padding: "16px 20px", backgroundColor: "#F0F8FF", border: "1px solid #BCE0FD", borderRadius: "12px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "28px" }}>🤖</span>
                <div>
                  <div style={{ fontWeight: "bold", color: "#0088cc", fontSize: "15px" }}>
                    {botInfo.username ? `@${botInfo.username}` : "Bot do Telegram"} {botInfo.ativo ? "🟢 (Ativo no Backend)" : "⚪ (Pronto para conexão)"}
                  </div>
                  <div style={{ color: "#555", fontSize: "13px" }}>
                    Familiares enviam fotos, áudios ou vídeos diretamente pelo chat do Telegram. Use o botão <strong>📲 Link Telegram</strong> na aba &quot;Gerenciar Perfis&quot; para enviar o link direto à família de cada morador.
                  </div>
                </div>
              </div>
            </div>

            {carregandoTelegram && submissoesTelegram.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                <div style={{ fontSize: "24px", marginBottom: "10px" }}>⏳</div>
                Verificando novas submissões do Telegram...
              </div>
            ) : submissoesTelegram.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", backgroundColor: "#FBFBFA", borderRadius: "16px", border: "2px dashed #D0D0D0" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎉</div>
                <h3 style={{ margin: "0 0 8px 0", color: "#264653" }}>Nenhuma mídia pendente no momento!</h3>
                <p style={{ margin: 0, color: "#777", fontSize: "14px", maxWidth: "500px", margin: "0 auto" }}>
                  Quando familiares enviarem fotos, áudios ou vídeos pelo Telegram, eles aparecerão aqui para você moderar antes de disponibilizar no Modo Terapêutico.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
                {submissoesTelegram.map((item) => {
                  const moradorEncontrado = idosos.find((i) => String(i.id) === String(item.idoso_id));
                  const nomeMorador = moradorEncontrado?.nome_completo || `Morador #${item.idoso_id}`;
                  const quartoMorador = moradorEncontrado?.quarto ? `(Quarto ${moradorEncontrado.quarto})` : "";
                  const estaProcessando = processandoAprovacaoId === item.id;

                  const dataFormatada = item.created_at
                    ? new Date(item.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
                    : "Data recente";

                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "16px",
                        overflow: "hidden",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                        display: "flex",
                        flexDirection: "column",
                        transition: "transform 0.2s, box-shadow 0.2s",
                      }}
                    >
                      {/* TOPO DO CARD: MORADOR E REMETENTE */}
                      <div style={{ padding: "16px 18px", backgroundColor: "#F8F9FA", borderBottom: "1px solid #EAEAEA" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", padding: "3px 8px", borderRadius: "6px", backgroundColor: item.tipo_midia === "foto" ? "#E0F2FE" : item.tipo_midia === "audio" ? "#FEF3C7" : "#FCE7F3", color: item.tipo_midia === "foto" ? "#0284C7" : item.tipo_midia === "audio" ? "#D97706" : "#DB2777" }}>
                            {item.tipo_midia === "foto" ? "📷 Foto" : item.tipo_midia === "audio" ? "🎙️ Áudio / Voz" : "🎥 Vídeo"}
                          </span>
                          <span style={{ fontSize: "12px", color: "#888" }}>{dataFormatada}</span>
                        </div>
                        <h4 style={{ margin: "4px 0 2px 0", color: "#264653", fontSize: "16px", fontWeight: "bold" }}>
                          👤 {nomeMorador} <span style={{ fontSize: "12px", color: "#666", fontWeight: "normal" }}>{quartoMorador}</span>
                        </h4>
                        <p style={{ margin: 0, color: "#666", fontSize: "13px" }}>
                          Enviado por: <strong>{item.nome_familiar || "Familiar"}</strong>
                        </p>
                      </div>

                      {/* CONTEÚDO DA MÍDIA COM PREVIEW */}
                      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", backgroundColor: "#FCFCFC" }}>
                        {item.tipo_midia === "foto" && (
                          <div style={{ width: "100%", maxHeight: "280px", overflow: "hidden", borderRadius: "10px", textAlign: "center", backgroundColor: "#f0f0f0" }}>
                            <img
                              src={item.arquivo_url}
                              alt={item.legenda || "Foto do familiar"}
                              style={{ width: "100%", maxHeight: "280px", objectFit: "contain", display: "block" }}
                            />
                          </div>
                        )}

                        {item.tipo_midia === "audio" && (
                          <div style={{ width: "100%", padding: "16px 8px", textAlign: "center" }}>
                            <div style={{ fontSize: "36px", marginBottom: "8px" }}>🎙️</div>
                            <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#555", fontWeight: "bold" }}>Mensagem de Voz / Áudio</p>
                            <audio controls src={item.arquivo_url} style={{ width: "100%" }} preload="metadata" />
                          </div>
                        )}

                        {item.tipo_midia === "video" && (
                          <div style={{ width: "100%", borderRadius: "10px", overflow: "hidden", backgroundColor: "#000" }}>
                            <video controls src={item.arquivo_url} style={{ width: "100%", maxHeight: "260px", display: "block" }} preload="metadata" />
                          </div>
                        )}

                        {/* LEGENDA SE HOUVER */}
                        {item.legenda && (
                          <div style={{ width: "100%", marginTop: "12px", padding: "10px 14px", backgroundColor: "#FFF8ED", borderLeft: "3px solid #F4A261", borderRadius: "6px", fontSize: "13px", color: "#444", boxSizing: "border-box" }}>
                            <strong>Recado:</strong> &ldquo;{item.legenda}&rdquo;
                          </div>
                        )}
                      </div>

                      {/* AÇÕES DE MODERAÇÃO */}
                      <div style={{ padding: "14px 18px", backgroundColor: "#FFFFFF", borderTop: "1px solid #EAEAEA", display: "flex", gap: "10px" }}>
                        <button
                          type="button"
                          disabled={estaProcessando}
                          onClick={() => handleAprovarTelegram(item)}
                          style={{
                            flex: 2,
                            padding: "12px 14px",
                            backgroundColor: estaProcessando ? "#999" : "#2A9D8F",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            cursor: estaProcessando ? "not-allowed" : "pointer",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          ✅ {estaProcessando ? "Salvando..." : "Aprovar"}
                        </button>

                        <button
                          type="button"
                          disabled={estaProcessando}
                          onClick={() => handleRecusarTelegram(item)}
                          style={{
                            flex: 1,
                            padding: "12px 10px",
                            backgroundColor: estaProcessando ? "#ccc" : "#E85D75",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            cursor: estaProcessando ? "not-allowed" : "pointer",
                            fontSize: "13px",
                          }}
                        >
                          ❌ Recusar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA: UPLOAD DE MÍDIAS */}
        {abaAtiva === "midia" && (
          <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "22px", color: "#264653", marginBottom: "16px", fontWeight: "bold" }}>Anexar Mídias no Supabase Cloud</h2>
            <form onSubmit={handleSubmitMidia} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Escolha o Morador</label>
                  <select value={formMidia.idoso_id} onChange={(e) => setFormMidia({ ...formMidia, idoso_id: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }} required>
                    <option value="">Escolha um morador...</option>
                    {idosos && idosos.map((i) => (
                      <option key={i.id} value={String(i.id)}>👤 {i.nome_completo} {i.quarto ? `(Quarto ${i.quarto})` : ''}</option>
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
                  <span style={{ fontSize: "18px", fontWeight: "bold", color: "#2A5D8A" }}>📁 Clique para selecionar Arquivos (Fotos, MP3, Vídeos)</span>
                  <input type="file" multiple accept="image/*,audio/*,video/*" onChange={handleMultipleFilesChange} style={{ display: "none" }} />
                </label>
              </div>
              {arquivosSelecionados.length > 0 && (
                <div style={{ backgroundColor: "#FFF8F0", padding: "16px", borderRadius: "12px", border: "1px solid #F4A261" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#264653" }}>Arquivos para Envio ({arquivosSelecionados.length}):</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {arquivosSelecionados.map((file, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "white", borderRadius: "6px", border: "1px solid #ddd" }}>
                        <span style={{ fontSize: "14px", fontWeight: "bold", color: "#2A5D8A" }}>{file.name}</span>
                        <button type="button" onClick={() => setArquivosSelecionados((prev) => prev.filter((_, i) => i !== idx))} style={{ padding: "4px 8px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "4px", fontSize: "12px" }}>Remover</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Descrição / Mensagem Afetiva</label>
                <textarea value={formMidia.conteudo} onChange={(e) => setFormMidia({ ...formMidia, conteudo: e.target.value })} rows={3} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required />
              </div>
              <button type="submit" disabled={enviandoMidia} style={{ padding: "16px", backgroundColor: enviandoMidia ? "#aaa" : "#2A5D8A", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
                {enviandoMidia ? "Enviando Arquivos..." : "☁️ Salvar Mídias no Supabase"}
              </button>
            </form>
          </div>
        )}

        {/* ABA: TELEMETRIA TEA */}
        {abaAtiva === "telemetriaTEA" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)", borderLeft: "8px solid #2A9D8F" }}>
              <h2 style={{ fontSize: "22px", color: "#264653", marginBottom: "8px", fontWeight: "bold" }}>🩺 Registro de Telemetria TEA</h2>
              <form onSubmit={handleSalvarSessaoTEA} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Morador Avaliado</label>
                    <select value={formTEA.idoso_id} onChange={(e) => { setFormTEA({ ...formTEA, idoso_id: e.target.value }); carregarHistoricoTEA(e.target.value); }} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }} required>
                      <option value="">Escolha um morador...</option>
                      {idosos && idosos.map((i) => <option key={i.id} value={String(i.id)}>👤 {i.nome_completo} {i.quarto ? `(Quarto ${i.quarto})` : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Profissional Responsável</label>
                    <input type="text" value={formTEA.cuidador_responsavel} onChange={(e) => setFormTEA({ ...formTEA, cuidador_responsavel: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Memória / Tema Trabalhado</label>
                  <input type="text" value={formTEA.memoria_titulo} onChange={(e) => setFormTEA({ ...formTEA, memoria_titulo: e.target.value })} placeholder="Ex: Fotografias do Casamento" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Nível de Engajamento (Ni)</label>
                    <select value={formTEA.nivel_engajamento} onChange={(e) => setFormTEA({ ...formTEA, nivel_engajamento: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }} required>
                      <option value="5">5 — Engajamento Máximo (Interação ativa)</option>
                      <option value="4">4 — Engajamento Moderado Alto</option>
                      <option value="3">3 — Engajamento Moderado</option>
                      <option value="2">2 — Baixo Engajamento</option>
                      <option value="1">1 — Apatia Total</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Multiplicador Emocional (Ei)</label>
                    <select value={formTEA.reacao_observada} onChange={(e) => setFormTEA({ ...formTEA, reacao_observada: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }} required>
                      <option value="1.2">1.2 — Entusiasmo (Risos, palmas, beijar a tela)</option>
                      <option value="1.0">1.0 — Contemplação Neutra-Agradável</option>
                      <option value="0.5">0.5 — Apatia ou Estresse</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Observações do Cuidador</label>
                  <textarea value={formTEA.observacoes_sessao} onChange={(e) => setFormTEA({ ...formTEA, observacoes_sessao: e.target.value })} rows={3} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} />
                </div>
                <button type="submit" style={{ padding: "16px", backgroundColor: "#2A9D8F", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
                  💾 Gravar Telemetria
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ABA: GERENCIAR MÍDIAS */}
        {abaAtiva === "gerenciarMidias" && (
          <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "22px", color: "#264653", marginBottom: "16px", fontWeight: "bold" }}>Gerenciar Arquivos do Morador</h2>
            <select value={idosoMidiaSelecionado} onChange={(e) => carregarMidiasDoMorador(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", marginBottom: "20px" }}>
              <option value="">Escolha um morador...</option>
              {idosos && idosos.map((i) => <option key={i.id} value={String(i.id)}>👤 {i.nome_completo} {i.quarto ? `(Quarto ${i.quarto})` : ''}</option>)}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              {listaMidiasMorador.map((midia) => (
                <div key={midia.id} style={{ padding: "16px", borderRadius: "12px", border: "1px solid #ddd", backgroundColor: "#F8F5F0" }}>
                  <h4 style={{ margin: "0 0 6px 0", color: "#264653" }}>{midia.titulo}</h4>
                  <p style={{ margin: "0 0 12px 0", color: "#555", fontSize: "14px" }}>{midia.descricao}</p>
                  {midia.tipo_midia === "foto" && midia.arquivo_url && <img src={midia.arquivo_url} alt={midia.titulo} style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px" }} />}
                  {midia.tipo_midia === "audio" && midia.arquivo_url && <audio src={midia.arquivo_url} controls style={{ width: "100%", marginTop: "8px" }} />}
                  {midia.tipo_midia === "video" && midia.arquivo_url && <video src={midia.arquivo_url} controls style={{ width: "100%", height: "140px", borderRadius: "8px" }} />}
                  <button onClick={() => handleExcluirMidia(midia.id, midia.titulo)} style={{ marginTop: "12px", width: "100%", padding: "8px", backgroundColor: "#E85D75", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
                    🗑️ Excluir
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: CADASTRO IDOSO */}
        {abaAtiva === "cadastrarIdoso" && (
          <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "22px", color: "#264653", marginBottom: "16px", fontWeight: "bold" }}>Cadastrar Morador</h2>
            <form onSubmit={handleCadastrarIdoso} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input type="text" value={novoIdoso.nome_completo} onChange={(e) => setNovoIdoso({ ...novoIdoso, nome_completo: e.target.value })} placeholder="Nome Completo" style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }} required />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <input type="number" value={novoIdoso.idade} onChange={(e) => setNovoIdoso({ ...novoIdoso, idade: e.target.value })} placeholder="Idade" style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }} required />
                <input type="text" value={novoIdoso.quarto} onChange={(e) => setNovoIdoso({ ...novoIdoso, quarto: e.target.value })} placeholder="Quarto" style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }} required />
              </div>
              <input type="text" value={novoIdoso.diagnostico} onChange={(e) => setNovoIdoso({ ...novoIdoso, diagnostico: e.target.value })} placeholder="Diagnóstico Clínico" style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }} required />
              <button type="submit" style={{ padding: "16px", backgroundColor: "#2A9D8F", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Cadastrar Morador no Supabase</button>
            </form>
          </div>
        )}

        {/* ABA: CADASTRO FAMILIAR */}
        {abaAtiva === "cadastrarFamiliar" && (
          <div style={{ backgroundColor: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: "22px", color: "#264653", marginBottom: "16px", fontWeight: "bold" }}>Cadastrar Familiar</h2>
            <form onSubmit={handleCadastrarFamiliar} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <select value={novoFamiliar.idoso_id} onChange={(e) => setNovoFamiliar({ ...novoFamiliar, idoso_id: e.target.value })} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }} required>
                <option value="">Escolha o morador...</option>
                {idosos && idosos.map((i) => <option key={i.id} value={String(i.id)}>👤 {i.nome_completo} (ID: {i.id})</option>)}
              </select>
              <input type="text" value={novoFamiliar.nome} onChange={(e) => setNovoFamiliar({ ...novoFamiliar, nome: e.target.value })} placeholder="Nome do Familiar" style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }} required />
              <input type="email" value={novoFamiliar.email} onChange={(e) => setNovoFamiliar({ ...novoFamiliar, email: e.target.value })} placeholder="E-mail" style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }} required />
              <input type="password" value={novoFamiliar.senha} onChange={(e) => setNovoFamiliar({ ...novoFamiliar, senha: e.target.value })} placeholder="Senha" style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }} required />
              <button type="submit" style={{ padding: "16px", backgroundColor: "#F4A261", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Vincular Familiar</button>
            </form>
          </div>
        )}

        {/* MODAIS DE EDIÇÃO */}
        {modalEdicaoAberto && idosoEmEdicao && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div style={{ backgroundColor: "white", padding: "32px", borderRadius: "20px", width: "100%", maxWidth: "500px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
              <h3 style={{ marginTop: 0, color: "#264653", fontSize: "22px" }}>✏️ Editar Morador</h3>
              <form onSubmit={handleSalvarEdicaoIdoso} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "6px" }}>Nome Completo</label>
                  <input type="text" value={idosoEmEdicao.nome_completo || ""} onChange={(e) => setIdosoEmEdicao({ ...idosoEmEdicao, nome_completo: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "6px" }}>Idade</label>
                    <input type="number" value={idosoEmEdicao.idade || ""} onChange={(e) => setIdosoEmEdicao({ ...idosoEmEdicao, idade: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required />
                  </div>
                  <div>
                    <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "6px" }}>Quarto</label>
                    <input type="text" value={idosoEmEdicao.quarto || ""} onChange={(e) => setIdosoEmEdicao({ ...idosoEmEdicao, quarto: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "6px" }}>Diagnóstico Clínico</label>
                  <input type="text" value={idosoEmEdicao.diagnostico || ""} onChange={(e) => setIdosoEmEdicao({ ...idosoEmEdicao, diagnostico: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required />
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                  <button type="submit" style={{ flex: 1, padding: "14px", backgroundColor: "#2A9D8F", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Salvar Alterações</button>
                  <button type="button" onClick={() => { setModalEdicaoAberto(false); setIdosoEmEdicao(null); }} style={{ flex: 1, padding: "14px", backgroundColor: "#ccc", color: "#333", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {modalEdicaoFamiliarAberto && familiarEmEdicao && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div style={{ backgroundColor: "white", padding: "32px", borderRadius: "20px", width: "100%", maxWidth: "500px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
              <h3 style={{ marginTop: 0, color: "#264653", fontSize: "22px" }}>✏️ Editar Familiar</h3>
              <form onSubmit={handleSalvarEdicaoFamiliar} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "6px" }}>Nome do Familiar</label>
                  <input type="text" value={familiarEmEdicao.nome || ""} onChange={(e) => setFamiliarEmEdicao({ ...familiarEmEdicao, nome: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "6px" }}>E-mail de Acesso</label>
                  <input type="email" value={familiarEmEdicao.email || ""} onChange={(e) => setFamiliarEmEdicao({ ...familiarEmEdicao, email: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "6px" }}>Vincular ao Morador</label>
                  <select value={familiarEmEdicao.idoso_id || ""} onChange={(e) => setFamiliarEmEdicao({ ...familiarEmEdicao, idoso_id: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} required>
                    <option value="">Selecione o morador...</option>
                    {idosos && idosos.map((i) => (
                      <option key={i.id} value={String(i.id)}>👤 {i.nome_completo} (ID: {i.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: "bold", color: "#264653", marginBottom: "6px" }}>Nova Senha (opcional)</label>
                  <input type="password" value={familiarEmEdicao.nova_senha || ""} onChange={(e) => setFamiliarEmEdicao({ ...familiarEmEdicao, nova_senha: e.target.value })} placeholder="••••••••" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                  <button type="submit" style={{ flex: 1, padding: "14px", backgroundColor: "#2A9D8F", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Salvar Alterações</button>
                  <button type="button" onClick={() => { setModalEdicaoFamiliarAberto(false); setFamiliarEmEdicao(null); }} style={{ flex: 1, padding: "14px", backgroundColor: "#ccc", color: "#333", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}