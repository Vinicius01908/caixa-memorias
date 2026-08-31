'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Image, MessageCircle, Activity, 
  TrendingUp, AlertCircle, CheckCircle, Clock 
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardCuidador() {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setDashboard)
      .catch(console.error);
  }, []);

  if (!dashboard) return <div className="p-12 text-2xl">Carregando dashboard...</div>;

  const { resumo, engajamento, categorias, ultimas_interacoes } = dashboard;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-villa-dark">Dashboard do Cuidador</h1>
          <Link href="/" className="px-6 py-3 bg-villa-primary text-white rounded-xl font-semibold hover:bg-villa-dark transition">
            Voltar ao Início
          </Link>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-villa-primary">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-villa-primary" />
              <span className="text-3xl font-bold text-villa-dark">{resumo.total_idosos}</span>
            </div>
            <p className="text-gray-600 font-semibold">Idosos Ativos</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-villa-secondary">
            <div className="flex items-center justify-between mb-4">
              <Image className="w-8 h-8 text-villa-secondary" />
              <span className="text-3xl font-bold text-villa-dark">{resumo.total_memorias}</span>
            </div>
            <p className="text-gray-600 font-semibold">Memórias</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-villa-success">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-villa-success" />
              <span className="text-3xl font-bold text-villa-dark">{resumo.interacoes_30dias}</span>
            </div>
            <p className="text-gray-600 font-semibold">Interações (30d)</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-villa-accent">
            <div className="flex items-center justify-between mb-4">
              <MessageCircle className="w-8 h-8 text-villa-accent" />
              <span className="text-3xl font-bold text-villa-dark">{resumo.mensagens_pendentes}</span>
            </div>
            <p className="text-gray-600 font-semibold">Mensagens Pendentes</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-villa-warm">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-villa-warm" />
              <span className="text-3xl font-bold text-villa-dark">{resumo.memorias_pendentes}</span>
            </div>
            <p className="text-gray-600 font-semibold">Memórias Pendentes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Engajamento */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-villa-dark mb-6 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-villa-success" /> Engajamento por Idoso
            </h2>
            <div className="space-y-4">
              {engajamento.map(e => (
                <div key={e.idoso_id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="font-bold text-villa-dark">{e.idoso_nome}</p>
                    <p className="text-sm text-gray-500">{e.total_interacoes} interações</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-villa-success rounded-full"
                          style={{ width: `${(e.media_engajamento / 5) * 100}%` }}
                        />
                      </div>
                      <span className="font-bold text-villa-dark">
                        {e.media_engajamento ? e.media_engajamento.toFixed(1) : '0'}/5
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.floor(e.tempo_total_segundos / 60)} min totais
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Últimas Interações */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-villa-dark mb-6 flex items-center gap-3">
              <Activity className="w-6 h-6 text-villa-primary" /> Últimas Interações
            </h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {ultimas_interacoes.map((inter, idx) => (
                <div key={idx} className="p-4 border-l-4 border-villa-primary bg-gray-50 rounded-r-xl">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-villa-dark">{inter.idoso_nome}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(inter.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold">{inter.tipo_interacao}</span>
                    {inter.memoria_titulo && ` • ${inter.memoria_titulo}`}
                  </p>
                  {inter.reacao_observada && (
                    <p className="text-sm text-villa-secondary italic">"{inter.reacao_observada}"</p>
                  )}
                  {inter.nivel_engajamento && (
                    <div className="flex gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-4 h-4 rounded-full ${i < inter.nivel_engajamento ? 'bg-villa-success' : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}