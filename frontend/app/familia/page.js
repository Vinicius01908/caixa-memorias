'use client';

import { useState, useEffect } from 'react';
import { 
  Upload, Send, Image, Music, Mic, FileText, 
  Heart, CheckCircle, AlertCircle 
} from 'lucide-react';

export default function PortalFamilia() {
  const [idosos, setIdosos] = useState([]);
  const [form, setForm] = useState({
    idoso_id: '',
    familiar_nome: '',
    tipo: 'texto',
    conteudo: '',
    arquivo: null
  });
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    fetch('/api/idosos')
      .then(r => r.json())
      .then(setIdosos)
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/mensagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idoso_id: parseInt(form.idoso_id),
          familiar_id: 1, // Em produção, virá do login
          tipo: form.tipo,
          conteudo: form.conteudo,
          arquivo_url: null
        })
      });
      if (res.ok) {
        setEnviado(true);
        setForm({ idoso_id: '', familiar_nome: '', tipo: 'texto', conteudo: '', arquivo: null });
        setTimeout(() => setEnviado(false), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-villa-light p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Heart className="w-16 h-16 text-villa-secondary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-villa-dark mb-2">Portal da Família</h1>
          <p className="text-xl text-gray-600">Envie memórias, mensagens e carinho</p>
        </div>

        {enviado && (
          <div className="mb-8 p-6 bg-villa-success/20 border-2 border-villa-success rounded-2xl flex items-center gap-4">
            <CheckCircle className="w-10 h-10 text-villa-success" />
            <div>
              <p className="text-xl font-bold text-villa-success">Mensagem enviada com sucesso!</p>
              <p className="text-gray-600">O cuidador irá revisar antes de entregar ao seu ente querido.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card-idoso space-y-6">
          <div>
            <label className="block text-lg font-bold text-villa-dark mb-2">Para quem é a mensagem?</label>
            <select 
              value={form.idoso_id}
              onChange={e => setForm({...form, idoso_id: e.target.value})}
              className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-villa-primary focus:outline-none"
              required
            >
              <option value="">Selecione o idoso</option>
              {idosos.map(i => (
                <option key={i.id} value={i.id}>{i.nome_completo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-lg font-bold text-villa-dark mb-2">Seu nome</label>
            <input 
              type="text"
              value={form.familiar_nome}
              onChange={e => setForm({...form, familiar_nome: e.target.value})}
              className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-villa-primary focus:outline-none"
              placeholder="Digite seu nome"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-villa-dark mb-2">Tipo de conteúdo</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { tipo: 'texto', icone: FileText, label: 'Texto' },
                { tipo: 'foto', icone: Image, label: 'Foto' },
                { tipo: 'audio', icone: Mic, label: 'Áudio' },
                { tipo: 'video', icone: Music, label: 'Vídeo' },
              ].map(({ tipo, icone: Icon, label }) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setForm({...form, tipo})}
                  className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition
                    ${form.tipo === tipo 
                      ? 'border-villa-primary bg-villa-primary/10 text-villa-primary' 
                      : 'border-gray-200 hover:border-villa-primary/50'}`}
                >
                  <Icon className="w-8 h-8" />
                  <span className="font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-lg font-bold text-villa-dark mb-2">Mensagem / Descrição</label>
            <textarea 
              value={form.conteudo}
              onChange={e => setForm({...form, conteudo: e.target.value})}
              className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-villa-primary focus:outline-none min-h-[150px]"
              placeholder="Escreva sua mensagem, memória ou relato..."
              required
            />
          </div>

          <div className="p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center">
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">Clique para enviar arquivo (foto, áudio ou vídeo)</p>
            <input type="file" className="hidden" />
          </div>

          <div className="flex items-start gap-3 p-4 bg-villa-warm/20 rounded-xl">
            <AlertCircle className="w-6 h-6 text-villa-accent flex-shrink-0 mt-1" />
            <p className="text-gray-600">
              <strong>Importante:</strong> Todas as mensagens passam por aprovação do cuidador antes de serem entregues ao idoso. Isso garante a segurança e o bem-estar emocional.
            </p>
          </div>

          <button 
            type="submit"
            className="w-full py-6 bg-villa-secondary text-white text-xl font-bold rounded-xl hover:bg-red-600 transition flex items-center justify-center gap-3"
          >
            <Send className="w-6 h-6" />
            Enviar para Aprovação
          </button>
        </form>
      </div>
    </div>
  );
}