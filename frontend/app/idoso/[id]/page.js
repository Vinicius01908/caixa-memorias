'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Heart, Image, Music, Play, Pause, SkipForward, 
  SkipBack, Volume2, X, Clock, Users, Star 
} from 'lucide-react';
import Link from 'next/link';

export default function PerfilIdoso() {
  const { id } = useParams();
  const [idoso, setIdoso] = useState(null);
  const [memorias, setMemorias] = useState([]);
  const [modoTerapeutico, setModoTerapeutico] = useState(false);
  const [memoriaAtual, setMemoriaAtual] = useState(0);
  const [reproduzindo, setReproduzindo] = useState(false);

  useEffect(() => {
    fetch(`/api/idosos/${id}`)
      .then(r => r.json())
      .then(data => {
        setIdoso(data.idoso);
        setMemorias(data.memorias || []);
      })
      .catch(console.error);
  }, [id]);

  const iniciarModoTerapeutico = (index = 0) => {
    setMemoriaAtual(index);
    setModoTerapeutico(true);
    setReproduzindo(true);
  };

  const proximaMemoria = () => {
    setMemoriaAtual(prev => (prev + 1) % memorias.length);
  };

  const memoriaAnterior = () => {
    setMemoriaAtual(prev => (prev - 1 + memorias.length) % memorias.length);
  };

  const memoria = memorias[memoriaAtual];

  if (!idoso) return <div className="p-12 text-idoso-2xl">Carregando...</div>;

  // MODO TERAPÊUTICO EM TELA CHEIA
  if (modoTerapeutico && memoria) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Barra superior */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/70 to-transparent">
          <h2 className="text-white text-idoso-xl font-bold">{memoria.titulo}</h2>
          <button 
            onClick={() => setModoTerapeutico(false)}
            className="p-4 bg-white/20 rounded-full hover:bg-white/40 transition"
          >
            <X className="w-10 h-10 text-white" />
          </button>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 flex items-center justify-center p-8">
          {memoria.tipo_midia === 'foto' && (
            <img 
              src={memoria.arquivo_url} 
              alt={memoria.titulo}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />
          )}
          {memoria.tipo_midia === 'musica' && (
            <div className="text-center text-white">
              <Music className="w-48 h-48 mx-auto mb-8 text-villa-secondary animate-pulse" />
              <h3 className="text-idoso-3xl font-bold mb-4">{memoria.titulo}</h3>
              <p className="text-idoso-xl text-gray-300">{memoria.descricao}</p>
              <audio 
                src={memoria.arquivo_url} 
                autoPlay 
                onEnded={proximaMemoria}
                className="mt-8 mx-auto w-full max-w-2xl"
              />
            </div>
          )}
          {memoria.tipo_midia === 'video' && (
            <video 
              src={memoria.arquivo_url} 
              autoPlay 
              controls 
              className="max-w-full max-h-full rounded-2xl"
              onEnded={proximaMemoria}
            />
          )}
          {memoria.tipo_midia === 'audio' && (
            <div className="text-center text-white">
              <Volume2 className="w-48 h-48 mx-auto mb-8 text-villa-accent animate-pulse" />
              <h3 className="text-idoso-3xl font-bold mb-4">{memoria.titulo}</h3>
              <p className="text-idoso-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                {memoria.descricao}
              </p>
              <audio 
                src={memoria.arquivo_url} 
                autoPlay 
                onEnded={proximaMemoria}
                className="mt-8 mx-auto w-full max-w-2xl"
              />
            </div>
          )}
        </div>

        {/* Controles inferiores */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex justify-center items-center gap-12">
            <button 
              onClick={memoriaAnterior}
              className="p-6 bg-white/20 rounded-full hover:bg-white/40 transition"
            >
              <SkipBack className="w-12 h-12 text-white" />
            </button>
            <button 
              onClick={() => setReproduzindo(!reproduzindo)}
              className="p-8 bg-villa-secondary rounded-full hover:bg-red-600 transition"
            >
              {reproduzindo ? <Pause className="w-16 h-16 text-white" /> : <Play className="w-16 h-16 text-white" />}
            </button>
            <button 
              onClick={proximaMemoria}
              className="p-6 bg-white/20 rounded-full hover:bg-white/40 transition"
            >
              <SkipForward className="w-12 h-12 text-white" />
            </button>
          </div>
          <p className="text-center text-white/70 mt-4 text-idoso-sm">
            {memoriaAtual + 1} de {memorias.length} • {memoria.categoria_nome}
          </p>
        </div>
      </div>
    );
  }

  // PERFIL NORMAL
  return (
    <div className="min-h-screen bg-villa-light p-6">
      {/* Cabeçalho */}
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-3 text-villa-primary text-idoso-lg font-semibold mb-8 hover:underline">
          <SkipBack className="w-8 h-8" /> Voltar
        </Link>

        <div className="card-idoso mb-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-40 h-40 rounded-full bg-villa-primary/20 flex items-center justify-center overflow-hidden border-4 border-villa-primary">
            {idoso.foto_principal ? (
              <img src={idoso.foto_principal} alt={idoso.nome_completo} className="w-full h-full object-cover" />
            ) : (
              <Users className="w-20 h-20 text-villa-primary" />
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-idoso-3xl font-bold text-villa-dark mb-2">{idoso.nome_completo}</h1>
            <p className="text-idoso-lg text-gray-600 mb-2">{idoso.idade} anos • Quarto {idoso.quarto}</p>
            <p className="text-idoso-sm text-villa-secondary font-semibold mb-4">{idoso.diagnostico}</p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <span className="px-4 py-2 bg-villa-primary/10 text-villa-primary rounded-full text-idoso-sm font-semibold">
                {idoso.grau_dependencia}
              </span>
            </div>
          </div>
          <button 
            onClick={() => iniciarModoTerapeutico(0)}
            className="btn-idoso-secondary"
          >
            <Play className="w-10 h-10" />
            <span>Modo Terapêutico</span>
          </button>
        </div>

        {/* Preferências */}
        {idoso.preferencias_pessoais && (
          <div className="card-idoso mb-8 bg-villa-warm/20 border-villa-warm">
            <h2 className="text-idoso-xl font-bold text-villa-dark mb-4 flex items-center gap-3">
              <Star className="w-8 h-8 text-villa-accent" /> Preferências
            </h2>
            <p className="text-idoso-base leading-relaxed">{idoso.preferencias_pessoais}</p>
          </div>
        )}

        {/* Memórias */}
        <h2 className="text-idoso-2xl font-bold text-villa-dark mb-6 flex items-center gap-4">
          <Image className="w-10 h-10" /> Memórias
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {memorias.map((mem, idx) => (
            <button
              key={mem.id}
              onClick={() => iniciarModoTerapeutico(idx)}
              className="card-idoso text-left hover:shadow-2xl transition-all"
            >
              <div className="h-48 bg-villa-primary/10 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                {mem.tipo_midia === 'foto' && mem.thumbnail_url ? (
                  <img src={mem.thumbnail_url} alt={mem.titulo} className="w-full h-full object-cover" />
                ) : mem.tipo_midia === 'musica' ? (
                  <Music className="w-20 h-20 text-villa-secondary" />
                ) : (
                  <Play className="w-20 h-20 text-villa-primary" />
                )}
              </div>
              <h3 className="text-idoso-lg font-bold text-villa-dark mb-2">{mem.titulo}</h3>
              <p className="text-idoso-sm text-gray-600 mb-3 line-clamp-2">{mem.descricao}</p>
              <div className="flex items-center gap-3">
                <span 
                  className="px-3 py-1 rounded-full text-white text-idoso-xs font-semibold"
                  style={{ backgroundColor: mem.categoria_cor || '#4A90D9' }}
                >
                  {mem.categoria_nome}
                </span>
                <span className="text-idoso-xs text-gray-500">{mem.emocao}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Linha do Tempo */}
        <h2 className="text-idoso-2xl font-bold text-villa-dark mb-6 flex items-center gap-4">
          <Clock className="w-10 h-10" /> Linha do Tempo
        </h2>
        <div className="card-idoso">
          <div className="space-y-6">
            {memorias
              .filter(m => m.data_aproximada)
              .sort((a, b) => new Date(b.data_aproximada) - new Date(a.data_aproximada))
              .map(mem => (
                <div key={mem.id} className="flex items-start gap-6 pb-6 border-b-2 border-gray-100 last:border-0">
                  <div className="w-24 text-center">
                    <span className="text-idoso-sm font-bold text-villa-primary">
                      {new Date(mem.data_aproximada).getFullYear()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-idoso-lg font-bold text-villa-dark">{mem.titulo}</h4>
                    <p className="text-idoso-sm text-gray-600">{mem.descricao}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}