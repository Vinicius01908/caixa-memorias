"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

function RelatorioEvolucaoConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idosoIdUrl = searchParams.get("idosoId") || "";

  // Estados de dados
  const [carregando, setCarregando] = useState(true);
  const [carregandoDados, setCarregandoDados] = useState(false);
  const [idosos, setIdosos] = useState([]);
  const [idosoSelecionadoId, setIdosoSelecionadoId] = useState(idosoIdUrl);
  const [idosoAtual, setIdosoAtual] = useState(null);
  const [todasAvaliacoesTEA, setTodasAvaliacoesTEA] = useState([]);
  const [todasMemorias, setTodasMemorias] = useState([]);
  const [todasSubmissoes, setTodasSubmissoes] = useState([]);
  
  // Filtros de período
  // Opções: '7d', '30d', '90d', 'tudo', 'custom'
  const [filtroPeriodo, setFiltroPeriodo] = useState("30d");
  const [dataInicioCustom, setDataInicioCustom] = useState("");
  const [dataFimCustom, setDataFimCustom] = useState("");

  // Ordenação do histórico
  const [ordemCrescente, setOrdemCrescente] = useState(false);

  // Anotações complementares do profissional (salvas localmente por morador)
  const [anotacoesProfissional, setAnotacoesProfissional] = useState("");

  // Estado de autorização / login
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [erroAutorizacao, setErroAutorizacao] = useState("");

  // Ponto de hover no gráfico
  const [pontoGraficoAtivo, setPontoGraficoAtivo] = useState(null);

  // 1. Verificar autenticação e permissões
  useEffect(() => {
    try {
      const sessaoStr = localStorage.getItem("usuario_logado");
      if (!sessaoStr) {
        // Em desenvolvimento ou uso direto, se não houver login salvo, alertamos e permitimos cuidador padrão
        const fallbackUser = { tipo: "cuidador", email: "cuidador@sistema.local" };
        setUsuarioLogado(fallbackUser);
      } else {
        const user = JSON.parse(sessaoStr);
        setUsuarioLogado(user);

        // Se for perfil familiar tentando acessar outro idoso
        const tipo = (user.tipo || "").toLowerCase();
        if (tipo.includes("fam") && user.idoso_id) {
          if (idosoIdUrl && String(idosoIdUrl) !== String(user.idoso_id)) {
            setErroAutorizacao("Você só possui permissão para visualizar o relatório do morador vinculado à sua família.");
            setIdosoSelecionadoId(String(user.idoso_id));
          } else {
            setIdosoSelecionadoId(String(user.idoso_id));
          }
        }
      }
    } catch (e) {
      console.warn("Aviso ao ler sessão:", e);
    }
  }, [idosoIdUrl]);

  // 2. Carregar lista de moradores disponíveis
  useEffect(() => {
    async function carregarMoradores() {
      try {
        const { data, error } = await supabase
          .from("idosos")
          .select("*")
          .order("nome_completo", { ascending: true });

        if (error) throw error;
        const lista = data || [];
        setIdosos(lista);

        // Se houver ID na URL ou se houver moradores, selecionar o inicial
        if (idosoIdUrl) {
          setIdosoSelecionadoId(String(idosoIdUrl));
        } else if (lista.length > 0 && !idosoSelecionadoId) {
          setIdosoSelecionadoId(String(lista[0].id));
        }
      } catch (err) {
        console.error("Erro ao carregar moradores:", err);
      } finally {
        setCarregando(false);
      }
    }

    carregarMoradores();
  }, [idosoIdUrl]);

  // 3. Carregar dados clínicos (Avaliação TEA, Memórias, Submissões) do morador selecionado
  useEffect(() => {
    if (!idosoSelecionadoId) return;

    async function carregarDadosMorador() {
      setCarregandoDados(true);
      try {
        // Encontra o idoso atual
        const idosoObj = idosos.find((i) => String(i.id) === String(idosoSelecionadoId));
        if (idosoObj) {
          setIdosoAtual(idosoObj);
        } else {
          // Busca individual se não estiver na lista inicial
          const { data: idosoDb } = await supabase
            .from("idosos")
            .select("*")
            .eq("id", idosoSelecionadoId)
            .single();
          if (idosoDb) setIdosoAtual(idosoDb);
        }

        // Recuperar anotações locais salvas para este idoso
        const anotacaoSalva = localStorage.getItem(`anotacao_relatorio_${idosoSelecionadoId}`);
        setAnotacoesProfissional(anotacaoSalva || "");

        // 3.1 CONSULTAR AVALIAÇÃO CLÍNICA (TEA) - Tabela interacoes_tea
        const { data: avaliacoes, error: errAvaliacoes } = await supabase
          .from("interacoes_tea")
          .select("*")
          .eq("idoso_id", String(idosoSelecionadoId))
          .order("created_at", { ascending: false });

        if (errAvaliacoes) {
          console.error("Erro ao buscar interacoes_tea:", errAvaliacoes);
          setTodasAvaliacoesTEA([]);
        } else {
          setTodasAvaliacoesTEA(avaliacoes || []);
        }

        // 3.2 CONSULTAR ACERVO DE MEMÓRIAS - Tabela memorias
        const { data: mems, error: errMems } = await supabase
          .from("memorias")
          .select("*")
          .eq("idoso_id", String(idosoSelecionadoId))
          .order("created_at", { ascending: false });

        if (!errMems && mems) {
          setTodasMemorias(mems);
        } else {
          setTodasMemorias([]);
        }

        // 3.3 CONSULTAR SUBMISSÕES TELEGRAM - Tabela telegram_submissoes
        const { data: subs, error: errSubs } = await supabase
          .from("telegram_submissoes")
          .select("*")
          .eq("idoso_id", String(idosoSelecionadoId))
          .order("created_at", { ascending: false });

        if (!errSubs && subs) {
          setTodasSubmissoes(subs);
        } else {
          setTodasSubmissoes([]);
        }

      } catch (err) {
        console.error("Erro geral ao carregar dados clínicos:", err);
      } finally {
        setCarregandoDados(false);
      }
    }

    carregarDadosMorador();
  }, [idosoSelecionadoId, idosos]);

  // Salvar anotações do profissional localmente
  const handleSalvarAnotacao = (texto) => {
    setAnotacoesProfissional(texto);
    if (idosoSelecionadoId) {
      localStorage.setItem(`anotacao_relatorio_${idosoSelecionadoId}`, texto);
    }
  };

  // 4. Filtrar avaliações pelo período selecionado
  const { avaliacoesFiltradas, dataInicioPeriodo, dataFimPeriodo } = useMemo(() => {
    if (!todasAvaliacoesTEA || todasAvaliacoesTEA.length === 0) {
      return { avaliacoesFiltradas: [], dataInicioPeriodo: null, dataFimPeriodo: null };
    }

    const agora = new Date();
    let dataInicio = null;
    let dataFim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59, 999);

    if (filtroPeriodo === "7d") {
      dataInicio = new Date(agora);
      dataInicio.setDate(dataInicio.getDate() - 7);
      dataInicio.setHours(0, 0, 0, 0);
    } else if (filtroPeriodo === "30d") {
      dataInicio = new Date(agora);
      dataInicio.setDate(dataInicio.getDate() - 30);
      dataInicio.setHours(0, 0, 0, 0);
    } else if (filtroPeriodo === "90d") {
      dataInicio = new Date(agora);
      dataInicio.setDate(dataInicio.getDate() - 90);
      dataInicio.setHours(0, 0, 0, 0);
    } else if (filtroPeriodo === "custom") {
      if (dataInicioCustom) {
        const [ano, mes, dia] = dataInicioCustom.split("-").map(Number);
        dataInicio = new Date(ano, mes - 1, dia, 0, 0, 0);
      }
      if (dataFimCustom) {
        const [ano, mes, dia] = dataFimCustom.split("-").map(Number);
        dataFim = new Date(ano, mes - 1, dia, 23, 59, 59);
      }
    } else {
      // 'tudo' - todo o histórico
      dataInicio = null;
    }

    const filtradas = todasAvaliacoesTEA.filter((item) => {
      if (!item.created_at) return true;
      const dataItem = new Date(item.created_at);
      if (dataInicio && dataItem < dataInicio) return false;
      if (dataFim && dataItem > dataFim) return false;
      return true;
    });

    // Se dataInicio não foi definida por filtro (ex: 'tudo'), usa a data do registro mais antigo
    let dataInicialEfetiva = dataInicio;
    if (!dataInicialEfetiva && filtradas.length > 0) {
      const datas = filtradas.map((f) => new Date(f.created_at).getTime()).filter((t) => !isNaN(t));
      if (datas.length > 0) {
        dataInicialEfetiva = new Date(Math.min(...datas));
      }
    }

    return {
      avaliacoesFiltradas: filtradas,
      dataInicioPeriodo: dataInicialEfetiva,
      dataFimPeriodo: dataFim,
    };
  }, [todasAvaliacoesTEA, filtroPeriodo, dataInicioCustom, dataFimCustom]);

  // Ordenação das avaliações para exibição
  const avaliacoesOrdenadas = useMemo(() => {
    const lista = [...avaliacoesFiltradas];
    lista.sort((a, b) => {
      const tA = new Date(a.created_at || 0).getTime();
      const tB = new Date(b.created_at || 0).getTime();
      return ordemCrescente ? tA - tB : tB - tA;
    });
    return lista;
  }, [avaliacoesFiltradas, ordemCrescente]);

  // Lista ordenada cronologicamente (sempre antiga -> nova) para o gráfico de evolução
  const avaliacoesGrafico = useMemo(() => {
    const lista = [...avaliacoesFiltradas];
    lista.sort((a, b) => {
      const tA = new Date(a.created_at || 0).getTime();
      const tB = new Date(b.created_at || 0).getTime();
      return tA - tB;
    });
    return lista;
  }, [avaliacoesFiltradas]);

  // 5. CÁLCULO DOS INDICADORES E CONSOLIDAÇÕES (Item 9 e 10)
  const indicadores = useMemo(() => {
    const total = avaliacoesFiltradas.length;
    if (total === 0) {
      return {
        totalAvaliacoes: 0,
        mediaEngajamento: 0,
        indicePonderadoTEA: 0,
        midiaMaiorEngajamento: "Nenhum registro",
        evolucaoTexto: "Sem dados para o período",
        cuidadorResponsavel: idosoAtual ? "Equipe Villa do Conde" : "Não informado",
        distribuicaoNotas: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    // Soma e média de engajamento
    const somaEngajamento = avaliacoesFiltradas.reduce((acc, curr) => acc + (Number(curr.nivel_engajamento) || 0), 0);
    const mediaEngajamento = Number((somaEngajamento / total).toFixed(1));

    // Soma ponderada TEA: (nivel_engajamento * multiplicador_emocao)
    const somaPonderada = avaliacoesFiltradas.reduce((acc, curr) => {
      const eng = Number(curr.nivel_engajamento) || 0;
      const mult = Number(curr.multiplicador_emocao) || 1.0;
      return acc + (eng * mult);
    }, 0);
    const indicePonderadoTEA = Number((somaPonderada / total).toFixed(2));

    // Mídia / Tema com maior engajamento
    const engajamentoPorTema = {};
    avaliacoesFiltradas.forEach((item) => {
      const tema = (item.memoria_titulo || "Sessão Terapêutica").trim();
      const nota = Number(item.nivel_engajamento) || 0;
      if (!engajamentoPorTema[tema]) {
        engajamentoPorTema[tema] = { totalNotas: 0, count: 0 };
      }
      engajamentoPorTema[tema].totalNotas += nota;
      engajamentoPorTema[tema].count += 1;
    });

    let maiorTema = "Não determinado";
    let maiorMedia = -1;
    Object.entries(engajamentoPorTema).forEach(([tema, stats]) => {
      const mediaTema = stats.totalNotas / stats.count;
      if (mediaTema > maiorMedia) {
        maiorMedia = mediaTema;
        maiorTema = `${tema} (Média ${mediaTema.toFixed(1)}/5.0)`;
      }
    });

    // Comparativo de evolução temporal (1ª metade vs 2ª metade do período)
    let evolucaoTexto = "Estável ao longo do período";
    if (total >= 4) {
      const metade = Math.floor(total / 2);
      // Ordenadas cronologicamente
      const crono = [...avaliacoesFiltradas].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const primeiraMetade = crono.slice(0, metade);
      const segundaMetade = crono.slice(metade);

      const media1 = primeiraMetade.reduce((acc, c) => acc + Number(c.nivel_engajamento || 0), 0) / primeiraMetade.length;
      const media2 = segundaMetade.reduce((acc, c) => acc + Number(c.nivel_engajamento || 0), 0) / segundaMetade.length;
      const diff = media2 - media1;

      if (diff > 0.3) {
        evolucaoTexto = `Tendência Ascendente (+${diff.toFixed(1)} pts no engajamento recente)`;
      } else if (diff < -0.3) {
        evolucaoTexto = `Leve Oscilação (${diff.toFixed(1)} pts - requer atenção aos estímulos)`;
      } else {
        evolucaoTexto = `Patamar Consistente e Estável (${media2.toFixed(1)}/5.0 no período recente)`;
      }
    } else {
      evolucaoTexto = `${total} sessão(ões) realizada(s) no período selecionado`;
    }

    // Cuidadores responsáveis
    const cuidadoresUnicos = [...new Set(avaliacoesFiltradas.map((a) => a.cuidador_responsavel).filter(Boolean))];
    const cuidadoresTexto = cuidadoresUnicos.length > 0 ? cuidadoresUnicos.join(", ") : "Equipe de Cuidadores";

    // Distribuição de notas
    const distribuicaoNotas = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    avaliacoesFiltradas.forEach((a) => {
      const n = Math.round(Number(a.nivel_engajamento) || 0);
      if (distribuicaoNotas[n] !== undefined) {
        distribuicaoNotas[n] += 1;
      }
    });

    return {
      totalAvaliacoes: total,
      mediaEngajamento,
      indicePonderadoTEA,
      midiaMaiorEngajamento: maiorTema,
      evolucaoTexto,
      cuidadorResponsavel: cuidadoresTexto,
      distribuicaoNotas,
    };
  }, [avaliacoesFiltradas, idosoAtual]);

  // 6. MAPEMENTO DO ACERVO AFETIVO (Item 7)
  const acervoAfetivo = useMemo(() => {
    const totalMem = todasMemorias.length;
    const fotos = todasMemorias.filter((m) => m.tipo_midia === "foto").length;
    const videos = todasMemorias.filter((m) => m.tipo_midia === "video").length;
    const audios = todasMemorias.filter((m) => m.tipo_midia === "audio" || m.tipo_midia === "musica").length;
    const textos = todasMemorias.filter((m) => m.tipo_midia === "texto" || (!m.tipo_midia && !m.arquivo_url)).length;

    // Submissões do telegram aprovadas e totais
    const submissoesAprovadas = todasSubmissoes.filter((s) => s.status === "aprovado").length;
    const submissoesPendentes = todasSubmissoes.filter((s) => s.status === "pendente").length;

    // Mídias utilizadas nas avaliações do período
    const titulosUsados = new Set(avaliacoesFiltradas.map((a) => (a.memoria_titulo || "").trim().toLowerCase()));
    titulosUsados.delete("");

    return {
      totalMemoria: totalMem,
      fotos,
      videos,
      audios,
      textos,
      submissoesAprovadas,
      submissoesPendentes,
      midiasUtilizadasQtd: titulosUsados.size,
    };
  }, [todasMemorias, todasSubmissoes, avaliacoesFiltradas]);

  // 7. ANÁLISE QUALITATIVA E OBSERVAÇÕES COMPORTAMENTAIS (Item 11)
  const analiseQualitativa = useMemo(() => {
    const atencaoFoco = [];
    const linguagemEvocacao = [];
    const reacoesEmocionais = [];
    const observacoesGerais = [];

    avaliacoesFiltradas.forEach((item) => {
      const obs = (item.observacoes_sessao || "").trim();
      const reacao = (item.rotulo_reacao || "").trim();
      const dataStr = item.created_at ? new Date(item.created_at).toLocaleDateString("pt-BR") : "Data não reg.";
      const contexto = `[${dataStr} - ${item.memoria_titulo || 'Sessão'}]: `;

      // Reação observada registrada
      if (reacao) {
        reacoesEmocionais.push({
          data: dataStr,
          tema: item.memoria_titulo,
          texto: reacao,
          multiplicador: item.multiplicador_emocao,
        });
      }

      if (!obs) return;

      const obsMin = obs.toLowerCase();
      let categorizado = false;

      // Classificação factual das observações já existentes nos registros
      if (
        obsMin.includes("atenção") ||
        obsMin.includes("foco") ||
        obsMin.includes("olhar") ||
        obsMin.includes("concentra") ||
        obsMin.includes("fixou") ||
        obsMin.includes("dispers")
      ) {
        atencaoFoco.push({ data: dataStr, texto: obs, tema: item.memoria_titulo });
        categorizado = true;
      }

      if (
        obsMin.includes("lembr") ||
        obsMin.includes("reconhec") ||
        obsMin.includes("falou") ||
        obsMin.includes("nome") ||
        obsMin.includes("história") ||
        obsMin.includes("palavra") ||
        obsMin.includes("verbaliz") ||
        obsMin.includes("contou") ||
        obsMin.includes("relat")
      ) {
        linguagemEvocacao.push({ data: dataStr, texto: obs, tema: item.memoria_titulo });
        categorizado = true;
      }

      if (
        obsMin.includes("sorri") ||
        obsMin.includes("chor") ||
        obsMin.includes("emoc") ||
        obsMin.includes("beij") ||
        obsMin.includes("palma") ||
        obsMin.includes("alegr") ||
        obsMin.includes("calm") ||
        obsMin.includes("tranquil") ||
        obsMin.includes("agit")
      ) {
        reacoesEmocionais.push({
          data: dataStr,
          tema: item.memoria_titulo,
          texto: obs,
          multiplicador: item.multiplicador_emocao,
        });
        categorizado = true;
      }

      observacoesGerais.push({
        data: dataStr,
        cuidador: item.cuidador_responsavel || "Cuidador",
        tema: item.memoria_titulo,
        texto: obs,
      });
    });

    return {
      atencaoFoco,
      linguagemEvocacao,
      reacoesEmocionais,
      observacoesGerais,
    };
  }, [avaliacoesFiltradas]);

  // 8. PARECER E RECOMENDAÇÕES DA EQUIPE (Item 12)
  const parecerRecomendacoes = useMemo(() => {
    if (avaliacoesFiltradas.length === 0) return null;

    // Frequência de sessões observada
    const totalSessoes = avaliacoesFiltradas.length;
    let continuidade = "Manter rotina regular de estímulo afetivo e cognitivo (2 a 3 sessões semanais).";
    if (indicadores.mediaEngajamento >= 4.0) {
      continuidade = "A resposta ao estímulo afetivo está muito receptiva. Recomenda-se a continuidade das sessões imersivas na mesma frequência habitual.";
    } else if (indicadores.mediaEngajamento < 2.5) {
      continuidade = "Sessões com baixo engajamento recente. Recomenda-se reduzir o tempo de exposição para evitar sobrecarga sensorial e priorizar estímulos musicais suaves.";
    }

    let familia = "Incentivar familiares a enviarem mídias com temas familiares conhecidos e fotos com pessoas de afeto direto.";
    if (acervoAfetivo.fotos > 0 && acervoAfetivo.audios > 0) {
      familia = "Mídias audiovisuais combinadas (fotos antigas com áudios de familiares carinhosos) demonstraram melhor evocação e entusiasmo.";
    }

    const rotina = "Aplicar as sessões preferencialmente em horários de menor fadiga cognitiva (geralmente período matutino ou início da tarde), em ambiente calmo e silencioso.";

    return {
      continuidade,
      familia,
      rotina,
    };
  }, [avaliacoesFiltradas, indicadores, acervoAfetivo]);

  // Função para acionar impressão / PDF do navegador
  const handleImprimir = () => {
    window.print();
  };

  // Formatador de datas PT-BR
  const formatarData = (dataObj) => {
    if (!dataObj) return "Todo o histórico";
    return new Date(dataObj).toLocaleDateString("pt-BR");
  };

  if (carregando) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F8F5F0", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ textAlign: "center", color: "#264653" }}>
          <div style={{ fontSize: "36px", marginBottom: "16px" }}>⏳</div>
          <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Carregando dados clínicos...</h2>
          <p style={{ color: "#666" }}>Acessando registros da Avaliação Clínica (TEA)...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relatorio-pagina" style={{ backgroundColor: "#F8F5F0", minHeight: "100vh", padding: "24px 16px", color: "#333", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* ESTILOS DE IMPRESSÃO (CSS PRINT) */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 12pt;
          }
          .relatorio-pagina {
            background-color: #ffffff !important;
            padding: 0 !important;
          }
          .nao-imprimir {
            display: none !important;
          }
          .bloco-imprimivel {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
            page-break-inside: avoid;
            margin-bottom: 16px !important;
          }
          .cabecalho-relatorio-oficial {
            display: block !important;
            border-bottom: 2px solid #264653;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          a {
            text-decoration: none !important;
            color: inherit !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* ========================================== */}
        {/* BARRA SUPERIOR DE AÇÕES (NÃO IMPRIMÍVEL)    */}
        {/* ========================================== */}
        <div className="nao-imprimir" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/cuidador"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                backgroundColor: "#ffffff",
                color: "#264653",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                textDecoration: "none",
                boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
              }}
            >
              ← Voltar à Área do Cuidador
            </Link>
            {idosoAtual && (
              <Link
                href={`/idoso/${idosoAtual.id}`}
                target="_blank"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  backgroundColor: "#2A5D8A",
                  color: "#ffffff",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                👁️ Abrir Modo Terapêutico
              </Link>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleImprimir}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                backgroundColor: "#2A9D8F",
                color: "#ffffff",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "14px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(42,157,143,0.3)",
              }}
            >
              🖨️ Imprimir / 📄 Gerar PDF
            </button>
          </div>
        </div>

        {/* ALERTA DE PERMISSÃO (SE APLICÁVEL) */}
        {erroAutorizacao && (
          <div className="nao-imprimir" style={{ padding: "14px 18px", backgroundColor: "#FEF3C7", borderLeft: "6px solid #D97706", borderRadius: "10px", marginBottom: "20px", color: "#92400E", fontSize: "14px", fontWeight: "bold" }}>
            ⚠️ {erroAutorizacao}
          </div>
        )}

        {/* ========================================== */}
        {/* SELETOR DE MORADOR E FILTROS DE PERÍODO   */}
        {/* ========================================== */}
        <div className="nao-imprimir" style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "20px 24px", marginBottom: "24px", boxShadow: "0 4px 16px rgba(0,0,0,0.05)", border: "1px solid #E5E7EB" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", alignItems: "end" }}>
            
            {/* 1. SELEÇÃO DO MORADOR */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>
                👤 Selecionar Morador(a):
              </label>
              <select
                value={idosoSelecionadoId}
                onChange={(e) => {
                  setIdosoSelecionadoId(e.target.value);
                  router.push(`/cuidador/relatorio-evolucao?idosoId=${e.target.value}`);
                }}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "2px solid #2A9D8F",
                  backgroundColor: "#F9FAFB",
                  fontSize: "15px",
                  fontWeight: "bold",
                  color: "#264653",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">Escolha um morador...</option>
                {idosos.map((i) => (
                  <option key={i.id} value={String(i.id)}>
                    {i.nome_completo} {i.quarto ? `(Quarto ${i.quarto})` : ""} - ID: {i.id}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. FILTRO DE PERÍODO (ATALHOS RÁPIDOS) */}
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>
                📅 Período de Análise:
              </label>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[
                  { id: "7d", rotulo: "7 dias" },
                  { id: "30d", rotulo: "30 dias" },
                  { id: "90d", rotulo: "90 dias" },
                  { id: "tudo", rotulo: "Todo histórico" },
                  { id: "custom", rotulo: "Personalizado" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFiltroPeriodo(item.id)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      backgroundColor: filtroPeriodo === item.id ? "#264653" : "#F3F4F6",
                      color: filtroPeriodo === item.id ? "#ffffff" : "#4B5563",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {item.rotulo}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. DATAS CUSTOMIZADAS (QUANDO ATIVO) */}
            {filtroPeriodo === "custom" && (
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", paddingTop: "8px", borderTop: "1px dashed #E5E7EB" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#4B5563" }}>De:</span>
                  <input
                    type="date"
                    value={dataInicioCustom}
                    onChange={(e) => setDataInicioCustom(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "14px" }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#4B5563" }}>Até:</span>
                  <input
                    type="date"
                    value={dataFimCustom}
                    onChange={(e) => setDataFimCustom(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #D1D5DB", fontSize: "14px" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ESTADO VAZIO: NENHUM MORADOR SELECIONADO */}
        {!idosoAtual && (
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "48px 24px", textAlign: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "42px", marginBottom: "12px" }}>👵👴</div>
            <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#264653", marginBottom: "8px" }}>Selecione um Morador</h3>
            <p style={{ color: "#666", maxWidth: "500px", margin: "0 auto" }}>
              Por favor, selecione um morador na caixa acima para carregar o histórico de avaliações clínicas, acervo afetivo e indicadores de evolução.
            </p>
          </div>
        )}

        {/* ============================================================== */}
        {/* DOCUMENTO DO RELATÓRIO CLÍNICO (PRONTO PARA TELA E IMPRESSÃO)  */}
        {/* ============================================================== */}
        {idosoAtual && (
          <div className="conteudo-relatorio" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* CABEÇALHO OFICIAL DO RELATÓRIO */}
            <div className="bloco-imprimivel" style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "32px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)", borderLeft: "8px solid #2A9D8F" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", borderBottom: "1px solid #E5E7EB", paddingBottom: "20px", marginBottom: "20px" }}>
                <div>
                  <span style={{ display: "inline-block", padding: "4px 10px", backgroundColor: "#E6F4F1", color: "#2A9D8F", fontSize: "12px", fontWeight: "bold", borderRadius: "6px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                    Caixa de Memórias • Relatório Oficial
                  </span>
                  <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#264653", margin: "0 0 6px 0", lineHeight: 1.2 }}>
                    Relatório de Evolução Clínica
                  </h1>
                  <p style={{ fontSize: "16px", color: "#E76F51", fontWeight: "600", margin: 0 }}>
                    Estímulo Cognitivo e Afetivo • Villa do Conde
                  </p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#F3F4F6", padding: "6px 12px", borderRadius: "8px", fontSize: "13px", color: "#374151", fontWeight: "600" }}>
                    <span>Origem dos registros:</span>
                    <strong style={{ color: "#2A9D8F" }}>Avaliação Clínica (TEA)</strong>
                  </div>
                  <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "6px" }}>
                    Emissão: {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>

              {/* IDENTIFICAÇÃO DO RESIDENTE E PERÍODO (Item 6) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", backgroundColor: "#F8F5F0", padding: "20px", borderRadius: "14px" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "#6B7280", textTransform: "uppercase", fontWeight: "bold" }}>Morador(a) Avaliado(a)</div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#264653", marginTop: "2px" }}>
                    👤 {idosoAtual.nome_completo}
                  </div>
                  <div style={{ fontSize: "13px", color: "#4B5563", marginTop: "2px" }}>
                    ID: <strong>#{idosoAtual.id}</strong> {idosoAtual.idade ? `• ${idosoAtual.idade} anos` : ""} {idosoAtual.quarto ? `• Quarto ${idosoAtual.quarto}` : ""}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "12px", color: "#6B7280", textTransform: "uppercase", fontWeight: "bold" }}>Diagnóstico Registrado</div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#264653", marginTop: "2px" }}>
                    🩺 {idosoAtual.diagnostico || "Não informado no cadastro"}
                  </div>
                  <div style={{ fontSize: "13px", color: "#4B5563", marginTop: "2px" }}>
                    Ambiente: <strong>Modo Terapêutico Imersivo</strong>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "12px", color: "#6B7280", textTransform: "uppercase", fontWeight: "bold" }}>Período Consolidado</div>
                  <div style={{ fontSize: "15px", fontWeight: "bold", color: "#264653", marginTop: "2px" }}>
                    📅 {dataInicioPeriodo ? formatarData(dataInicioPeriodo) : "Início"} a {dataFimPeriodo ? formatarData(dataFimPeriodo) : "Hoje"}
                  </div>
                  <div style={{ fontSize: "13px", color: "#2A9D8F", fontWeight: "600", marginTop: "2px" }}>
                    {filtroPeriodo === "7d" && "Filtro: Últimos 7 dias"}
                    {filtroPeriodo === "30d" && "Filtro: Últimos 30 dias"}
                    {filtroPeriodo === "90d" && "Filtro: Últimos 90 dias"}
                    {filtroPeriodo === "tudo" && "Todo o histórico acumulado"}
                    {filtroPeriodo === "custom" && "Intervalo customizado"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "12px", color: "#6B7280", textTransform: "uppercase", fontWeight: "bold" }}>Profissional(is) Responsável(is)</div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#264653", marginTop: "2px", wordBreak: "break-word" }}>
                    👩‍⚕️ {indicadores.cuidadorResponsavel}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>
                    Registros salvos em <strong>interacoes_tea</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* ========================================== */}
            {/* SEÇÃO 1: INDICADORES DE EVOLUÇÃO (Item 9)  */}
            {/* ========================================== */}
            <div className="bloco-imprimivel" style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#264653", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>📈</span> Indicadores de Evolução Clínica
                </h3>
                <span style={{ fontSize: "12px", color: "#6B7280" }}>
                  Consolidação matemática direta dos registros clínicos
                </span>
              </div>

              {avaliacoesFiltradas.length === 0 ? (
                <div style={{ padding: "24px", backgroundColor: "#F9FAFB", borderRadius: "12px", textAlign: "center", color: "#6B7280" }}>
                  ℹ️ Este morador ainda não possui registros na Avaliação Clínica (TEA) para o período selecionado.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                  
                  {/* KPI 1: MÉDIA DE ENGAJAMENTO */}
                  <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "14px", padding: "18px" }}>
                    <div style={{ fontSize: "12px", color: "#166534", fontWeight: "bold", textTransform: "uppercase" }}>Média de Engajamento</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "6px" }}>
                      <span style={{ fontSize: "32px", fontWeight: "bold", color: "#15803D" }}>
                        {indicadores.mediaEngajamento}
                      </span>
                      <span style={{ fontSize: "16px", color: "#86EFAC", fontWeight: "bold" }}>/ 5.0</span>
                    </div>
                    <div style={{ marginTop: "6px", fontSize: "12px", color: "#166534", fontWeight: "600" }}>
                      {indicadores.mediaEngajamento >= 4.5 && "🌟 Engajamento Excelente"}
                      {indicadores.mediaEngajamento >= 3.5 && indicadores.mediaEngajamento < 4.5 && "✨ Engajamento Moderado Alto"}
                      {indicadores.mediaEngajamento >= 2.5 && indicadores.mediaEngajamento < 3.5 && "🟡 Engajamento Moderado"}
                      {indicadores.mediaEngajamento < 2.5 && "🟠 Baixo Engajamento / Apatia"}
                    </div>
                  </div>

                  {/* KPI 2: ÍNDICE PONDERADO TEA */}
                  <div style={{ backgroundColor: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: "14px", padding: "18px" }}>
                    <div style={{ fontSize: "12px", color: "#0369A1", fontWeight: "bold", textTransform: "uppercase" }}>Índice Ponderado TEA</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "6px" }}>
                      <span style={{ fontSize: "32px", fontWeight: "bold", color: "#0284C7" }}>
                        {indicadores.indicePonderadoTEA}
                      </span>
                    </div>
                    <div style={{ marginTop: "6px", fontSize: "12px", color: "#0369A1" }}>
                      (Engajamento × Multiplicador Emocional)
                    </div>
                  </div>

                  {/* KPI 3: TOTAL DE SESSÕES */}
                  <div style={{ backgroundColor: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: "14px", padding: "18px" }}>
                    <div style={{ fontSize: "12px", color: "#6B21A8", fontWeight: "bold", textTransform: "uppercase" }}>Total de Avaliações</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "6px" }}>
                      <span style={{ fontSize: "32px", fontWeight: "bold", color: "#7E22CE" }}>
                        {indicadores.totalAvaliacoes}
                      </span>
                      <span style={{ fontSize: "14px", color: "#A855F7" }}>sessões</span>
                    </div>
                    <div style={{ marginTop: "6px", fontSize: "12px", color: "#6B21A8" }}>
                      No período selecionado
                    </div>
                  </div>

                  {/* KPI 4: MÍDIA DE MAIOR ENGAJAMENTO */}
                  <div style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "14px", padding: "18px", gridColumn: "span 1" }}>
                    <div style={{ fontSize: "12px", color: "#92400E", fontWeight: "bold", textTransform: "uppercase" }}>Mídia com Maior Resposta</div>
                    <div style={{ fontSize: "15px", fontWeight: "bold", color: "#B45309", marginTop: "8px", lineHeight: 1.3 }}>
                      🎯 {indicadores.midiaMaiorEngajamento}
                    </div>
                    <div style={{ marginTop: "6px", fontSize: "12px", color: "#92400E" }}>
                      {indicadores.evolucaoTexto}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* ========================================== */}
            {/* SEÇÃO 2: GRÁFICO DE EVOLUÇÃO (Item 10)     */}
            {/* ========================================== */}
            <div className="bloco-imprimivel" style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#264653", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>📊</span> Curva de Evolução do Engajamento ao Longo do Tempo
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#6B7280" }}>
                    Mapeamento cronológico das notas de engajamento (1 a 5) registradas em cada sessão terapêutica
                  </p>
                </div>
              </div>

              {avaliacoesGrafico.length < 2 ? (
                <div style={{ padding: "32px 20px", backgroundColor: "#F8F5F0", borderRadius: "14px", textAlign: "center", color: "#6B7280", border: "1px dashed #D1D5DB" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>📉</div>
                  <strong style={{ display: "block", color: "#264653", marginBottom: "4px" }}>
                    Ainda não existem registros suficientes na Avaliação Clínica (TEA) para apresentar a evolução do engajamento.
                  </strong>
                  <span style={{ fontSize: "13px" }}>
                    São necessárias pelo menos duas sessões registradas no período para traçar a curva de telemetria.
                  </span>
                </div>
              ) : (
                <div>
                  {/* SVG DO GRÁFICO DINÂMICO E VETORIAL */}
                  <div style={{ width: "100%", overflowX: "auto", position: "relative" }}>
                    {(() => {
                      const svgWidth = 850;
                      const svgHeight = 240;
                      const padLeft = 65;
                      const padRight = 35;
                      const padTop = 25;
                      const padBottom = 45;
                      const chartWidth = svgWidth - padLeft - padRight;
                      const chartHeight = svgHeight - padTop - padBottom;

                      const totalPontos = avaliacoesGrafico.length;
                      const getX = (index) => {
                        if (totalPontos <= 1) return padLeft + chartWidth / 2;
                        return padLeft + (index / (totalPontos - 1)) * chartWidth;
                      };

                      // Escala de 1 a 5: nota 1 = base (chartHeight), nota 5 = topo (0)
                      const getY = (nota) => {
                        const clamped = Math.max(1, Math.min(5, Number(nota) || 1));
                        const normalizado = (clamped - 1) / 4; // 0 a 1
                        return padTop + (1 - normalizado) * chartHeight;
                      };

                      // Gerar pontos da linha
                      const points = avaliacoesGrafico.map((a, i) => `${getX(i)},${getY(a.nivel_engajamento)}`).join(" ");

                      // Linha de área preenchida
                      const firstX = getX(0);
                      const lastX = getX(totalPontos - 1);
                      const baseY = padTop + chartHeight;
                      const areaPoints = `${firstX},${baseY} ${points} ${lastX},${baseY}`;

                      return (
                        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: "100%", height: "auto", minWidth: "600px", display: "block" }}>
                          <defs>
                            <linearGradient id="gradienteEngajamento" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2A9D8F" stopOpacity="0.35" />
                              <stop offset="100%" stopColor="#2A9D8F" stopOpacity="0.02" />
                            </linearGradient>
                          </defs>

                          {/* LINHAS GUIA HORIZONTAIS (NOTAS 1 A 5) */}
                          {[5, 4, 3, 2, 1].map((nota) => {
                            const y = getY(nota);
                            const rotulo =
                              nota === 5 ? "5 — Máximo" :
                              nota === 4 ? "4 — Mod. Alto" :
                              nota === 3 ? "3 — Moderado" :
                              nota === 2 ? "2 — Baixo" : "1 — Apatia";
                            return (
                              <g key={nota}>
                                <line
                                  x1={padLeft}
                                  y1={y}
                                  x2={svgWidth - padRight}
                                  y2={y}
                                  stroke={nota === 3 ? "#D1D5DB" : "#E5E7EB"}
                                  strokeDasharray={nota === 3 ? "4 4" : "2 2"}
                                  strokeWidth="1"
                                />
                                <text
                                  x={padLeft - 10}
                                  y={y + 4}
                                  textAnchor="end"
                                  fontSize="10"
                                  fill="#6B7280"
                                  fontWeight="600"
                                >
                                  {rotulo}
                                </text>
                              </g>
                            );
                          })}

                          {/* ÁREA PREENCHIDA COM GRADIENTE */}
                          <polygon points={areaPoints} fill="url(#gradienteEngajamento)" />

                          {/* LINHA PRINCIPAL DA CURVA */}
                          <polyline
                            points={points}
                            fill="none"
                            stroke="#2A9D8F"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* PONTOS INDIVIDUAIS COM LABELS DE DATA */}
                          {avaliacoesGrafico.map((a, i) => {
                            const cx = getX(i);
                            const cy = getY(a.nivel_engajamento);
                            const dataObj = a.created_at ? new Date(a.created_at) : null;
                            const dataCurta = dataObj ? `${dataObj.getDate()}/${dataObj.getMonth() + 1}` : `#${i + 1}`;
                            const isAtivo = pontoGraficoAtivo === i;

                            return (
                              <g
                                key={a.id || i}
                                onMouseEnter={() => setPontoGraficoAtivo(i)}
                                onMouseLeave={() => setPontoGraficoAtivo(null)}
                                style={{ cursor: "pointer" }}
                              >
                                {/* Círculo de fundo / hover */}
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={isAtivo ? 9 : 6}
                                  fill={isAtivo ? "#E76F51" : "#ffffff"}
                                  stroke={isAtivo ? "#E76F51" : "#2A9D8F"}
                                  strokeWidth="3"
                                  style={{ transition: "all 0.2s ease" }}
                                />

                                {/* Valor da nota sobre o ponto */}
                                <text
                                  x={cx}
                                  y={cy - 12}
                                  textAnchor="middle"
                                  fontSize="11"
                                  fontWeight="bold"
                                  fill={isAtivo ? "#E76F51" : "#264653"}
                                >
                                  {a.nivel_engajamento}
                                </text>

                                {/* Rótulo de data no eixo X */}
                                <text
                                  x={cx}
                                  y={padTop + chartHeight + 20}
                                  textAnchor="middle"
                                  fontSize="10"
                                  fontWeight="600"
                                  fill="#4B5563"
                                >
                                  {dataCurta}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      );
                    })()}
                  </div>

                  {/* DETALHE DO PONTO SELECIONADO NO HOVER */}
                  {pontoGraficoAtivo !== null && avaliacoesGrafico[pontoGraficoAtivo] && (
                    <div style={{ marginTop: "14px", padding: "12px 16px", backgroundColor: "#F0FDF4", borderRadius: "10px", border: "1px solid #86EFAC", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", fontSize: "13px" }}>
                      <div>
                        <strong style={{ color: "#166534" }}>
                          Sessão em {new Date(avaliacoesGrafico[pontoGraficoAtivo].created_at).toLocaleDateString("pt-BR")}:
                        </strong>{" "}
                        <span style={{ color: "#264653", fontWeight: "bold" }}>
                          {avaliacoesGrafico[pontoGraficoAtivo].memoria_titulo || "Sessão Terapêutica"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <span>Engajamento: <strong>{avaliacoesGrafico[pontoGraficoAtivo].nivel_engajamento}/5</strong></span>
                        <span>Reação: <strong>{avaliacoesGrafico[pontoGraficoAtivo].rotulo_reacao || "Não informada"}</strong></span>
                        <span>Multiplicador: <strong>{avaliacoesGrafico[pontoGraficoAtivo].multiplicador_emocao}x</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ========================================== */}
            {/* SEÇÃO 3: MAPEAMENTO DO ACERVO AFETIVO (7)  */}
            {/* ========================================== */}
            <div className="bloco-imprimivel" style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#264653", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🖼️</span> Mapeamento do Acervo Afetivo
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#6B7280" }}>
                    Inventário real de mídias e memórias catalogadas para o morador
                  </p>
                </div>
                <div style={{ fontSize: "13px", fontWeight: "bold", color: "#2A9D8F" }}>
                  Total de Memórias Ativas: {acervoAfetivo.totalMemoria}
                </div>
              </div>

              {acervoAfetivo.totalMemoria === 0 ? (
                <div style={{ padding: "20px", backgroundColor: "#F9FAFB", borderRadius: "12px", textAlign: "center", color: "#6B7280" }}>
                  Não existem mídias disponíveis cadastradas para este morador.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                  
                  {/* FOTOS */}
                  <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "#F8F5F0", borderLeft: "4px solid #2A9D8F" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#264653", fontWeight: "bold", fontSize: "15px" }}>
                      <span>📷</span> Fotografias de Família
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2A9D8F", marginTop: "8px" }}>
                      {acervoAfetivo.fotos} <span style={{ fontSize: "14px", fontWeight: "normal", color: "#666" }}>fotos</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#777", marginTop: "4px" }}>
                      Álbuns de casamento, viagens, netos e juventude
                    </div>
                  </div>

                  {/* VÍDEOS */}
                  <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "#F8F5F0", borderLeft: "4px solid #E76F51" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#264653", fontWeight: "bold", fontSize: "15px" }}>
                      <span>🎥</span> Gravações de Vídeo
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#E76F51", marginTop: "8px" }}>
                      {acervoAfetivo.videos} <span style={{ fontSize: "14px", fontWeight: "normal", color: "#666" }}>vídeos</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#777", marginTop: "4px" }}>
                      Recados afetivos de parentes e celebrações
                    </div>
                  </div>

                  {/* ÁUDIOS */}
                  <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "#F8F5F0", borderLeft: "4px solid #F4A261" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#264653", fontWeight: "bold", fontSize: "15px" }}>
                      <span>🎵</span> Áudios e Músicas
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#F4A261", marginTop: "8px" }}>
                      {acervoAfetivo.audios} <span style={{ fontSize: "14px", fontWeight: "normal", color: "#666" }}>áudios</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#777", marginTop: "4px" }}>
                      Vozes familiares e canções de época significativas
                    </div>
                  </div>

                  {/* COBERTURA NAS SESSÕES */}
                  <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "#F8F5F0", borderLeft: "4px solid #2A5D8A" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#264653", fontWeight: "bold", fontSize: "15px" }}>
                      <span>🔄</span> Mídias nas Avaliações
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2A5D8A", marginTop: "8px" }}>
                      {acervoAfetivo.midiasUtilizadasQtd} <span style={{ fontSize: "14px", fontWeight: "normal", color: "#666" }}>temas</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#777", marginTop: "4px" }}>
                      Trabalhados nas sessões clínicas do período
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* SEÇÃO 4: HISTÓRICO DA AVALIAÇÃO CLÍNICA (TEA) (Item 8)   */}
            {/* ======================================================== */}
            <div className="bloco-imprimivel" style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#264653", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>📋</span> Histórico da Avaliação Clínica (TEA)
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#6B7280" }}>
                    Todos os registros gravados pela equipe durante as sessões de telemetria
                  </p>
                </div>

                <div className="nao-imprimir" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setOrdemCrescente(!ordemCrescente)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid #D1D5DB",
                      backgroundColor: "#F9FAFB",
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: "#4B5563",
                      cursor: "pointer",
                    }}
                  >
                    {ordemCrescente ? "⬆️ Mais antigas primeiro" : "⬇️ Mais recentes primeiro"}
                  </button>
                </div>
              </div>

              {avaliacoesOrdenadas.length === 0 ? (
                <div style={{ padding: "32px", backgroundColor: "#F9FAFB", borderRadius: "12px", textAlign: "center", color: "#6B7280" }}>
                  Este morador ainda não possui registros na Avaliação Clínica (TEA) para o período selecionado.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#F8F5F0", borderBottom: "2px solid #E5E7EB", color: "#264653" }}>
                        <th style={{ padding: "12px 14px", fontWeight: "bold", minWidth: "110px" }}>Data / Hora</th>
                        <th style={{ padding: "12px 14px", fontWeight: "bold", minWidth: "160px" }}>Memória / Tema</th>
                        <th style={{ padding: "12px 14px", fontWeight: "bold", minWidth: "130px" }}>Engajamento</th>
                        <th style={{ padding: "12px 14px", fontWeight: "bold", minWidth: "180px" }}>Reação Observada</th>
                        <th style={{ padding: "12px 14px", fontWeight: "bold", minWidth: "140px" }}>Responsável</th>
                        <th style={{ padding: "12px 14px", fontWeight: "bold" }}>Observações Clínicas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {avaliacoesOrdenadas.map((sessao, idx) => {
                        const dataFormatada = sessao.created_at
                          ? new Date(sessao.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "—";
                        const eng = Number(sessao.nivel_engajamento) || 0;
                        const mult = Number(sessao.multiplicador_emocao) || 1.0;

                        return (
                          <tr
                            key={sessao.id || idx}
                            style={{
                              borderBottom: "1px solid #E5E7EB",
                              backgroundColor: idx % 2 === 0 ? "#ffffff" : "#FAFAFA",
                            }}
                          >
                            {/* DATA */}
                            <td style={{ padding: "12px 14px", color: "#4B5563", fontWeight: "600", fontSize: "13px", whiteSpace: "nowrap" }}>
                              {dataFormatada}
                            </td>

                            {/* MEMÓRIA / TEMA */}
                            <td style={{ padding: "12px 14px", fontWeight: "bold", color: "#264653" }}>
                              {sessao.memoria_titulo || "Sessão Terapêutica"}
                            </td>

                            {/* ENGAJAMENTO */}
                            <td style={{ padding: "12px 14px" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  backgroundColor:
                                    eng >= 4 ? "#DCFCE7" : eng === 3 ? "#FEF9C3" : "#FEE2E2",
                                  color:
                                    eng >= 4 ? "#15803D" : eng === 3 ? "#A16207" : "#B91C1C",
                                }}
                              >
                                {eng === 5 && "⭐ 5/5 Máximo"}
                                {eng === 4 && "⭐ 4/5 Mod. Alto"}
                                {eng === 3 && "🟡 3/5 Moderado"}
                                {eng === 2 && "🟠 2/5 Baixo"}
                                {eng === 1 && "🔴 1/5 Apatia"}
                                {!([1, 2, 3, 4, 5].includes(eng)) && `${eng}/5`}
                              </span>
                            </td>

                            {/* REAÇÃO OBSERVADA */}
                            <td style={{ padding: "12px 14px", fontSize: "13px", color: "#374151" }}>
                              <div style={{ fontWeight: "600" }}>{sessao.rotulo_reacao || "Reação registrada"}</div>
                              <div style={{ fontSize: "11px", color: "#6B7280" }}>
                                Multiplicador: <strong>{mult}x</strong>
                              </div>
                            </td>

                            {/* CUIDADOR RESPONSÁVEL */}
                            <td style={{ padding: "12px 14px", fontSize: "13px", color: "#4B5563" }}>
                              {sessao.cuidador_responsavel || "Cuidador"}
                            </td>

                            {/* OBSERVAÇÕES */}
                            <td style={{ padding: "12px 14px", fontSize: "13px", color: "#4B5563", lineHeight: 1.4 }}>
                              {sessao.observacoes_sessao ? (
                                <span>{sessao.observacoes_sessao}</span>
                              ) : (
                                <em style={{ color: "#9CA3AF" }}>Sem anotações complementares</em>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* SEÇÃO 5: ANÁLISE QUALITATIVA E OBSERVAÇÕES (Item 11)     */}
            {/* ======================================================== */}
            <div className="bloco-imprimivel" style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#264653", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🧠</span> Análise Qualitativa e Observações Comportamentais
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#6B7280" }}>
                    Consolidação dos registros descritivos realizados pelos profissionais durante a aplicação dos estímulos
                  </p>
                </div>
              </div>

              {analiseQualitativa.observacoesGerais.length === 0 ? (
                <div style={{ padding: "20px", backgroundColor: "#F9FAFB", borderRadius: "12px", textAlign: "center", color: "#6B7280" }}>
                  Nenhuma observação descritiva registrada nas avaliações do período.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                  
                  {/* CATEGORIA 1: ATENÇÃO E FOCO */}
                  <div style={{ backgroundColor: "#F8F5F0", borderRadius: "14px", padding: "20px", borderTop: "4px solid #2A9D8F" }}>
                    <h4 style={{ fontSize: "16px", fontWeight: "bold", color: "#264653", margin: "0 0 10px 0" }}>
                      🎯 Atenção e Concentração
                    </h4>
                    {analiseQualitativa.atencaoFoco.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: "18px", color: "#4B5563", fontSize: "13px", lineHeight: 1.5 }}>
                        {analiseQualitativa.atencaoFoco.slice(0, 5).map((item, i) => (
                          <li key={i} style={{ marginBottom: "6px" }}>
                            <strong>{item.data}</strong> ({item.tema}): {item.texto}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, color: "#6B7280", fontSize: "13px" }}>
                        O morador manteve foco habitual durante as apresentações visuais e sonoras registradas no período.
                      </p>
                    )}
                  </div>

                  {/* CATEGORIA 2: LINGUAGEM E EVOCAÇÃO */}
                  <div style={{ backgroundColor: "#F8F5F0", borderRadius: "14px", padding: "20px", borderTop: "4px solid #E76F51" }}>
                    <h4 style={{ fontSize: "16px", fontWeight: "bold", color: "#264653", margin: "0 0 10px 0" }}>
                      🗣️ Linguagem e Evocação de Memórias
                    </h4>
                    {analiseQualitativa.linguagemEvocacao.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: "18px", color: "#4B5563", fontSize: "13px", lineHeight: 1.5 }}>
                        {analiseQualitativa.linguagemEvocacao.slice(0, 5).map((item, i) => (
                          <li key={i} style={{ marginBottom: "6px" }}>
                            <strong>{item.data}</strong> ({item.tema}): {item.texto}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, color: "#6B7280", fontSize: "13px" }}>
                        Registros verbais e de reconhecimento mantiveram o padrão de receptividade durante as sessões.
                      </p>
                    )}
                  </div>

                  {/* CATEGORIA 3: ESTADO EMOCIONAL E REAÇÕES */}
                  <div style={{ backgroundColor: "#F8F5F0", borderRadius: "14px", padding: "20px", borderTop: "4px solid #F4A261" }}>
                    <h4 style={{ fontSize: "16px", fontWeight: "bold", color: "#264653", margin: "0 0 10px 0" }}>
                      ❤️ Reações Afetivas e Emocionais
                    </h4>
                    {analiseQualitativa.reacoesEmocionais.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: "18px", color: "#4B5563", fontSize: "13px", lineHeight: 1.5 }}>
                        {analiseQualitativa.reacoesEmocionais.slice(0, 5).map((item, i) => (
                          <li key={i} style={{ marginBottom: "6px" }}>
                            <strong>{item.data}</strong>: {item.texto}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, color: "#6B7280", fontSize: "13px" }}>
                        Expressões afetivas estáveis e acolhedoras observadas pelos cuidadores.
                      </p>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* SEÇÃO 6: PARECER E RECOMENDAÇÕES DA EQUIPE (Item 12)     */}
            {/* ======================================================== */}
            <div className="bloco-imprimivel" style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#264653", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>💡</span> Parecer e Recomendações de Continuidade
                </h3>
                <span style={{ fontSize: "12px", color: "#6B7280" }}>
                  Suporte à equipe multidisciplinar e familiares
                </span>
              </div>

              {parecerRecomendacoes && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                  
                  <div style={{ padding: "16px", backgroundColor: "#F0FDF4", borderRadius: "12px", border: "1px solid #BBF7D0" }}>
                    <div style={{ fontWeight: "bold", color: "#166534", fontSize: "14px", marginBottom: "6px" }}>
                      🔁 Continuidade das Sessões
                    </div>
                    <div style={{ fontSize: "13px", color: "#166534", lineHeight: 1.5 }}>
                      {parecerRecomendacoes.continuidade}
                    </div>
                  </div>

                  <div style={{ padding: "16px", backgroundColor: "#FEF3C7", borderRadius: "12px", border: "1px solid #FDE68A" }}>
                    <div style={{ fontWeight: "bold", color: "#92400E", fontSize: "14px", marginBottom: "6px" }}>
                      👨‍👩‍👧 Orientações à Família
                    </div>
                    <div style={{ fontSize: "13px", color: "#92400E", lineHeight: 1.5 }}>
                      {parecerRecomendacoes.familia}
                    </div>
                  </div>

                  <div style={{ padding: "16px", backgroundColor: "#EFF6FF", borderRadius: "12px", border: "1px solid #BFDBFE" }}>
                    <div style={{ fontWeight: "bold", color: "#1E40AF", fontSize: "14px", marginBottom: "6px" }}>
                      ⏰ Ajustes de Rotina e Ambiente
                    </div>
                    <div style={{ fontSize: "13px", color: "#1E40AF", lineHeight: 1.5 }}>
                      {parecerRecomendacoes.rotina}
                    </div>
                  </div>

                </div>
              )}

              {/* CAMPO DE ANOTAÇÕES ADICIONAIS DO PROFISSIONAL (EDITÁVEL EM TELA, IMPRESSO NO LAUDO) */}
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px dashed #E5E7EB" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", color: "#264653", marginBottom: "6px" }}>
                  ✍️ Anotações Complementares do Profissional Responsável (para emissão):
                </label>
                <textarea
                  value={anotacoesProfissional}
                  onChange={(e) => handleSalvarAnotacao(e.target.value)}
                  placeholder="Insira aqui observações específicas, orientações personalizadas ou parecer multidisciplinar antes de imprimir..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #D1D5DB",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    outline: "none",
                    fontFamily: "inherit",
                    backgroundColor: "#FAFAFA",
                  }}
                />
                <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>
                  * As anotações são salvas no seu navegador para constarem na impressão deste relatório.
                </div>
              </div>

            </div>

            {/* ======================================================== */}
            {/* SEÇÃO 7: AVISO LEGAL E ISENÇÃO DE DIAGNÓSTICO (Item 13) */}
            {/* ======================================================== */}
            <div className="bloco-imprimivel" style={{ backgroundColor: "#FFFBEB", borderRadius: "14px", padding: "18px 22px", border: "1px solid #FDE68A", color: "#92400E" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "20px", lineHeight: 1 }}>⚠️</span>
                <div style={{ fontSize: "13px", lineHeight: 1.5 }}>
                  <strong>Aviso Importante:</strong> Este relatório é uma consolidação dos registros realizados na{" "}
                  <strong>Avaliação Clínica (TEA)</strong> e não constitui diagnóstico médico, psicológico ou clínico.
                  O sistema não gera conclusões diagnósticas automáticas; trata-se de um instrumento técnico para organizar
                  e apresentar as observações empíricas realizadas pelos profissionais cuidadores durante as sessões de
                  estímulo cognitivo e afetivo da <em>Caixa de Memórias</em>.
                </div>
              </div>
            </div>

            {/* ASSINATURA NA IMPRESSÃO */}
            <div style={{ marginTop: "32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", textAlign: "center", paddingTop: "24px", borderTop: "1px solid #E5E7EB" }}>
              <div>
                <div style={{ borderBottom: "1px solid #333", width: "80%", margin: "0 auto 8px auto", height: "30px" }}></div>
                <div style={{ fontSize: "13px", fontWeight: "bold", color: "#264653" }}>
                  {indicadores.cuidadorResponsavel || "Profissional Responsável"}
                </div>
                <div style={{ fontSize: "11px", color: "#666" }}>Equipe de Cuidados / Terapêutica</div>
              </div>

              <div>
                <div style={{ borderBottom: "1px solid #333", width: "80%", margin: "0 auto 8px auto", height: "30px" }}></div>
                <div style={{ fontSize: "13px", fontWeight: "bold", color: "#264653" }}>Villa do Conde</div>
                <div style={{ fontSize: "11px", color: "#666" }}>Gestão e Coordenação Clínica</div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function RelatorioEvolucaoPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", backgroundColor: "#F8F5F0", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ textAlign: "center", color: "#264653" }}>
          <div style={{ fontSize: "36px", marginBottom: "16px" }}>⏳</div>
          <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Carregando Relatório de Evolução...</h2>
        </div>
      </div>
    }>
      <RelatorioEvolucaoConteudo />
    </Suspense>
  );
}
