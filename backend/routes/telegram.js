const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { notificarFamiliar, getBotInfo } = require('../telegramBot');

// Listar submissões pendentes do Telegram
router.get('/pendentes', async (req, res) => {
  try {
    const { data: pendentes, error } = await supabase
      .from('telegram_submissoes')
      .select('*')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });

    if (error) {
      // Se a tabela ainda não existir ou falhar, retorna vazio amigável
      return res.json([]);
    }

    res.json(pendentes || []);
  } catch (err) {
    console.error('Erro ao buscar pendentes:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

// Informações do Bot (para links de convite no frontend)
router.get('/bot-info', (req, res) => {
  res.json(getBotInfo());
});

// Aprovar mídia do Telegram
router.post('/aprovar', async (req, res) => {
  try {
    const { id, cuidador_nome = 'Cuidador' } = req.body;

    if (!id) {
      return res.status(400).json({ erro: 'ID da submissão é obrigatório' });
    }

    // 1. Busca a submissão no Supabase
    const { data: submissao, error: errSub } = await supabase
      .from('telegram_submissoes')
      .select('*')
      .eq('id', id)
      .single();

    if (errSub || !submissao) {
      return res.status(404).json({ erro: 'Submissão não encontrada' });
    }

    // 2. Insere na tabela 'memorias' oficial do morador
    const { error: errMemoria } = await supabase
      .from('memorias')
      .insert([
        {
          idoso_id: String(submissao.idoso_id),
          titulo: `${submissao.tipo_midia.toUpperCase()} enviado por ${submissao.nome_familiar || 'Família'}`,
          descricao: submissao.legenda || 'Memória recebida via Telegram',
          tipo_midia: submissao.tipo_midia,
          arquivo_url: submissao.arquivo_url,
          autor_registro: `Família (${submissao.nome_familiar || 'Telegram'})`
        }
      ]);

    if (errMemoria) {
      console.error('Erro ao salvar em memorias:', errMemoria.message);
      return res.status(500).json({ erro: 'Falha ao salvar na tabela de memórias: ' + errMemoria.message });
    }

    // 3. Atualiza o status em 'telegram_submissoes'
    await supabase
      .from('telegram_submissoes')
      .update({ status: 'aprovado' })
      .eq('id', id);

    // 4. Notifica o familiar no Telegram
    if (submissao.chat_id) {
      await notificarFamiliar(
        submissao.chat_id,
        `🎉 *Boa notícia!* Sua memória foi *APROVADA* pelo cuidador (*${cuidador_nome}*) e já faz parte da *Caixa de Memórias* no Modo Terapêutico! Muito obrigado pelo carinho! ❤️`
      );
    }

    res.json({ sucesso: true, mensagem: 'Memória aprovada e publicada no perfil do morador!' });
  } catch (err) {
    console.error('Erro ao aprovar memória:', err);
    res.status(500).json({ erro: err.message });
  }
});

// Recusar mídia do Telegram
router.post('/recusar', async (req, res) => {
  try {
    const { id, motivo = 'Não atende aos critérios do momento' } = req.body;

    if (!id) {
      return res.status(400).json({ erro: 'ID da submissão é obrigatório' });
    }

    const { data: submissao } = await supabase
      .from('telegram_submissoes')
      .select('*')
      .eq('id', id)
      .single();

    if (!submissao) {
      return res.status(404).json({ erro: 'Submissão não encontrada' });
    }

    // Atualiza status para recusado
    await supabase
      .from('telegram_submissoes')
      .update({ status: 'recusado', motivo_recusa: motivo })
      .eq('id', id);

    // Notifica familiar
    if (submissao.chat_id) {
      await notificarFamiliar(
        submissao.chat_id,
        `ℹ️ Olá! A mídia que você enviou recentemente foi avaliada pela equipe de cuidadores e não pôde ser adicionada à Caixa de Memórias no momento.\n` +
        `_Motivo:_ ${motivo}`
      );
    }

    res.json({ sucesso: true, mensagem: 'Submissão recusada.' });
  } catch (err) {
    console.error('Erro ao recusar submissão:', err);
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
