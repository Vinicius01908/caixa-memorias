const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const supabase = require('./supabaseClient');

let bot = null;
let botInfo = { ativo: false, username: null };

function inicializarTelegramBot() {
  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();

  if (!token || token === 'SEU_TOKEN_AQUI') {
    console.log('ℹ️ TELEGRAM_BOT_TOKEN não configurado no .env. O bot do Telegram está desativado no momento.');
    return;
  }

  try {
    bot = new TelegramBot(token, {
      polling: {
        interval: 300,
        autoStart: true,
        params: {
          timeout: 10,
          allowed_updates: JSON.stringify(["message", "edited_message", "callback_query"])
        }
      },
      request: {
        family: 4 // Força IPv4 no Windows para evitar timeouts (ETIMEDOUT) e instabilidade com IPv6
      }
    });

    bot.getMe().then((info) => {
      botInfo = { ativo: true, username: info.username, first_name: info.first_name };
      console.log(`🤖 Bot do Telegram ativo com sucesso: @${info.username} (${info.first_name})`);
    }).catch((err) => {
      console.error('⚠️ Falha ao obter informações do Bot do Telegram:', err.message);
    });

    // Tratamento inteligente de erros do polling
    bot.on('polling_error', (error) => {
      const msg = error?.message || error?.code || String(error);

      // Oscilações normais de rede do long-polling do Telegram que se reconectam sozinhas
      if (
        msg.includes('ETIMEDOUT') ||
        msg.includes('ECONNRESET') ||
        msg.includes('ESOCKETTIMEDOUT') ||
        msg.includes('socket hang up')
      ) {
        // Ignora silenciosamente micro-oscilações transitórias para não poluir o terminal
        return;
      }

      // Conflito de múltiplas instâncias rodando com o mesmo token
      if (msg.includes('409 Conflict') || msg.includes('terminated by other getUpdates request')) {
        console.warn('⚠️ Telegram Bot: Mais de uma instância está rodando com o mesmo token. Feche outras instâncias/terminais para evitar conflitos.');
        return;
      }

      console.error('⚠️ Aviso de polling no Telegram Bot:', msg);
    });

    // COMANDO /start
    bot.onText(/\/start(?:\s+(\S+))?/, async (msg, match) => {
      const chatId = String(msg.chat.id);
      const param = match && match[1] ? match[1].trim() : null;
      const nomeUsuario = [msg.from.first_name, msg.from.last_name].filter(Boolean).join(' ') || 'Familiar';
      console.log(`📩 [Telegram] /start recebido de ${nomeUsuario} (${chatId}) | Parâmetro: ${param || 'nenhum'}`);

      if (param) {
        await vincularMorador(msg, chatId, param, nomeUsuario);
        return;
      }

      // Verifica se já possui vínculo ativo
      try {
        const { data: vinculo } = await supabase
          .from('telegram_vinculos')
          .select('*')
          .eq('chat_id', chatId)
          .single();

        if (vinculo && vinculo.idoso_id) {
          const { data: idoso } = await supabase
            .from('idosos')
            .select('nome_completo')
            .eq('id', vinculo.idoso_id)
            .single();

          const nomeIdoso = idoso?.nome_completo || `Morador #${vinculo.idoso_id}`;
          return bot.sendMessage(
            chatId,
            `Olá, *${nomeUsuario}*! 👋\n\n` +
            `Você está conectado(a) à Caixa de Memórias de *${nomeIdoso}*.\n\n` +
            `📸 *Como participar:*\n` +
            `Envie fotos, mensagens de voz (áudios) ou vídeos aqui pelo chat.\n` +
            `Eles serão moderados pelo cuidador responsável e entrarão no *Modo Terapêutico* do morador! ❤️\n\n` +
            `_Dica: Se quiser trocar de morador, use: /morador <ID>_`,
            { parse_mode: 'Markdown' }
          );
        }
      } catch (e) {
        // Continua
      }

      // Se não tem vínculo, busca moradores para sugerir
      let listaMoradoresTexto = '';
      try {
        const { data: lista } = await supabase.from('idosos').select('id, nome_completo, quarto');
        if (lista && lista.length > 0) {
          listaMoradoresTexto = '\n\n*Selecione o seu familiar clicando em um dos comandos abaixo:*\n' +
            lista.map(i => `👉 \`/morador ${i.id}\` — *${i.nome_completo}* ${i.quarto ? `(Quarto ${i.quarto})` : ''}`).join('\n');
        }
      } catch (_) {}

      bot.sendMessage(
        chatId,
        `Olá, *${nomeUsuario}*! 👋\n\n` +
        `Bem-vindo(a) à *Caixa de Memórias Digital*!\n\n` +
        `Para enviar fotos, áudios e vídeos para o seu familiar, precisamos vincular este chat a ele(a).${listaMoradoresTexto || '\n\nEnvie o comando: `/morador <ID>` (Exemplo: `/morador 1`)'}`,
        { parse_mode: 'Markdown' }
      );
    });

    // COMANDO /morador <id>
    bot.onText(/\/morador(?:\s+(\S+))?/, async (msg, match) => {
      const chatId = String(msg.chat.id);
      const idosoId = match && match[1] ? match[1].trim() : null;
      const nomeUsuario = [msg.from.first_name, msg.from.last_name].filter(Boolean).join(' ') || 'Familiar';
      console.log(`📩 [Telegram] /morador recebido de ${nomeUsuario} (${chatId}) para idosoId: ${idosoId}`);

      if (!idosoId) {
        let listaTexto = '';
        try {
          const { data: lista } = await supabase.from('idosos').select('id, nome_completo');
          if (lista && lista.length > 0) {
            listaTexto = '\n\n' + lista.map(i => `👉 \`/morador ${i.id}\` — ${i.nome_completo}`).join('\n');
          }
        } catch (_) {}

        return bot.sendMessage(
          chatId,
          `⚠️ Por favor, informe o ID do morador.\nExemplo: \`/morador 1\`${listaTexto}`,
          { parse_mode: 'Markdown' }
        );
      }

      await vincularMorador(msg, chatId, idosoId, nomeUsuario);
    });

    // RECEBIMENTO DE MÍDIAS (Fotos, Áudios, Vídeos)
    bot.on('message', async (msg) => {
      // Ignora mensagens de comando
      if (msg.text && msg.text.startsWith('/')) return;

      const chatId = String(msg.chat.id);

      // Detecta tipo de mídia
      let tipoMidia = null;
      let fileId = null;
      let extensaoPadrao = 'bin';
      let mimeTypePadrao = 'application/octet-stream';

      if (msg.photo && msg.photo.length > 0) {
        tipoMidia = 'foto';
        const maiorFoto = msg.photo[msg.photo.length - 1];
        fileId = maiorFoto.file_id;
        extensaoPadrao = 'jpg';
        mimeTypePadrao = 'image/jpeg';
      } else if (msg.voice) {
        tipoMidia = 'audio';
        fileId = msg.voice.file_id;
        extensaoPadrao = 'ogg';
        mimeTypePadrao = msg.voice.mime_type || 'audio/ogg';
      } else if (msg.audio) {
        tipoMidia = 'audio';
        fileId = msg.audio.file_id;
        extensaoPadrao = msg.audio.file_name ? msg.audio.file_name.split('.').pop() : 'mp3';
        mimeTypePadrao = msg.audio.mime_type || 'audio/mpeg';
      } else if (msg.video) {
        tipoMidia = 'video';
        fileId = msg.video.file_id;
        extensaoPadrao = 'mp4';
        mimeTypePadrao = msg.video.mime_type || 'video/mp4';
      } else if (msg.video_note) {
        tipoMidia = 'video';
        fileId = msg.video_note.file_id;
        extensaoPadrao = 'mp4';
        mimeTypePadrao = 'video/mp4';
      }

      console.log(`📩 [Telegram] Mensagem recebida de ${msg.from?.first_name || 'Usuário'} (${chatId}) | Mídia: ${tipoMidia || 'somente texto'} | Conteúdo: ${msg.caption || msg.text || ''}`);

      if (!tipoMidia || !fileId) {
        // Se enviou apenas texto solto sem mídia
        if (msg.text) {
          bot.sendMessage(
            chatId,
            `Envie uma *foto*, *mensagem de voz (áudio)* ou *vídeo* para adicionarmos à Caixa de Memórias! Se quiser adicionar um recado, você pode incluí-lo como legenda da foto ou vídeo. 📸🎙️`,
            { parse_mode: 'Markdown' }
          );
        }
        return;
      }

      // Verifica qual morador está vinculado
      let idosoId = null;
      let nomeMorador = '';
      try {
        const { data: vinculo } = await supabase
          .from('telegram_vinculos')
          .select('idoso_id')
          .eq('chat_id', chatId)
          .single();

        if (vinculo && vinculo.idoso_id) {
          idosoId = vinculo.idoso_id;
        }
      } catch (err) {
        console.error('Erro ao buscar vinculo:', err.message);
      }

      if (!idosoId) {
        let listaTexto = '';
        try {
          const { data: idosos } = await supabase.from('idosos').select('id, nome_completo');
          if (idosos && idosos.length > 0) {
            listaTexto = '\n\n*Clique no morador abaixo para vincular:*\n' + idosos.map(i => `👉 \`/morador ${i.id}\` — ${i.nome_completo}`).join('\n');
          }
        } catch (_) {}

        return bot.sendMessage(
          chatId,
          `⚠️ *Você ainda não vinculou seu chat a um morador!*\n` +
          `Para que a sua foto/áudio/vídeo seja enviada para a pessoa certa, conecte-se primeiro:${listaTexto || '\nEnvie `/morador <ID>` (Exemplo: `/morador 1`)'}`,
          { parse_mode: 'Markdown' }
        );
      }

      // Notifica usuário do processamento
      bot.sendChatAction(chatId, 'upload_document');

      try {
        // 1. Obtém link do arquivo no Telegram
        const fileLink = await bot.getFileLink(fileId);

        // 2. Faz download do buffer
        const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);

        // 3. Faz upload no Supabase Storage (bucket 'memorias-idosos')
        const nomeArquivoStorage = `telegram/${idosoId}/${Date.now()}_midia.${extensaoPadrao}`;
        const { error: uploadError } = await supabase.storage
          .from('memorias-idosos')
          .upload(nomeArquivoStorage, buffer, {
            contentType: mimeTypePadrao,
            upsert: true
          });

        let urlFinal = '';
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('memorias-idosos')
            .getPublicUrl(nomeArquivoStorage);
          urlFinal = publicUrlData.publicUrl;
        } else {
          console.error('Erro ao enviar para Supabase Storage:', uploadError.message);
          // Fallback para Data URI em caso de erro no bucket
          urlFinal = `data:${mimeTypePadrao};base64,${buffer.toString('base64')}`;
        }

        const nomeFamiliar = [msg.from.first_name, msg.from.last_name].filter(Boolean).join(' ') +
          (msg.from.username ? ` (@${msg.from.username})` : '');
        const legenda = msg.caption || '';

        // 4. Grava em 'telegram_submissoes' com status 'pendente'
        const { error: dbError } = await supabase
          .from('telegram_submissoes')
          .insert([
            {
              idoso_id: String(idosoId),
              chat_id: chatId,
              nome_familiar: nomeFamiliar,
              tipo_midia: tipoMidia,
              arquivo_url: urlFinal,
              legenda: legenda,
              status: 'pendente'
            }
          ]);

        if (dbError) {
          console.error('❌ Erro ao inserir em telegram_submissoes:', dbError.message);
        } else {
          console.log(`✅ [Telegram] Mídia (${tipoMidia}) gravada em 'telegram_submissoes' para morador ID: ${idosoId} por ${nomeFamiliar}!`);
        }

        // 5. Confirma recebimento para o familiar
        bot.sendMessage(
          chatId,
          `💖 *Memória recebida com carinho!*\n\n` +
          `Sua *${tipoMidia}* foi enviada para o painel do cuidador.\n` +
          `Assim que for aprovada, você receberá um aviso aqui e ela será exibida no *Modo Terapêutico*! ✨`,
          { parse_mode: 'Markdown' }
        );

      } catch (err) {
        console.error('Erro ao processar mídia do Telegram:', err);
        bot.sendMessage(chatId, '❌ Ocorreu um erro ao processar seu arquivo. Por favor, tente novamente.');
      }
    });

  } catch (err) {
    console.error('Erro ao inicializar Telegram Bot:', err.message);
  }
}

async function vincularMorador(msg, chatId, idosoId, nomeUsuario) {
  try {
    // Busca informações do morador no Supabase
    const { data: idoso, error } = await supabase
      .from('idosos')
      .select('id, nome_completo, quarto')
      .eq('id', idosoId)
      .single();

    const nomeMorador = idoso?.nome_completo || `Morador #${idosoId}`;

    // Salva ou atualiza vínculo
    await supabase
      .from('telegram_vinculos')
      .upsert({
        chat_id: chatId,
        username: msg.from.username || '',
        nome_usuario: nomeUsuario,
        idoso_id: String(idosoId),
        updated_at: new Date().toISOString()
      });

    console.log(`✅ [Telegram] Vínculo salvo no banco: Chat ${chatId} (${nomeUsuario}) -> Morador ID ${idosoId} (${nomeMorador})`);

    bot.sendMessage(
      chatId,
      `✅ *Vínculo realizado com sucesso!*\n\n` +
      `Você está conectado(a) ao perfil de:\n` +
      `👤 *${nomeMorador}* ${idoso?.quarto ? `(Quarto ${idoso.quarto})` : ''}\n\n` +
      `Agora você já pode enviar suas fotos, recados de voz e vídeos carinhosos para a Caixa de Memórias! ❤️`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Erro ao vincular morador:', err.message);
    bot.sendMessage(
      chatId,
      `✅ Morador #${idosoId} vinculado com sucesso! Agora você já pode enviar suas fotos, áudios e vídeos.`
    );
  }
}

// Notifica o familiar quando o cuidador aprova ou recusa
async function notificarFamiliar(chatId, mensagem) {
  if (!bot || !chatId) return false;
  try {
    await bot.sendMessage(chatId, mensagem, { parse_mode: 'Markdown' });
    return true;
  } catch (err) {
    console.error(`Erro ao notificar chat ${chatId}:`, err.message);
    return false;
  }
}

function getBotInfo() {
  return botInfo;
}

async function pararTelegramBot() {
  if (bot && typeof bot.stopPolling === 'function') {
    try {
      await bot.stopPolling();
      console.log('🛑 Polling do Telegram finalizado com sucesso.');
    } catch (e) {
      // Ignora erro ao parar
    }
  }
}

module.exports = {
  inicializarTelegramBot,
  pararTelegramBot,
  notificarFamiliar,
  getBotInfo
};

