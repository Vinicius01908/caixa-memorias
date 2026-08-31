"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function TelaInicial() {
  const [idosos, setIdosos] = useState([]);
  const [altoContraste, setAltoContraste] = useState(false);

  useEffect(() => {
    fetch("/api/idosos")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setIdosos(data);
        } else {
          // Dados de demonstração se o backend não responder
          setIdosos([
            { id: 1, nome_completo: "Jose Antonio Pereira", idade: 83, quarto: "101A" },
            { id: 2, nome_completo: "Maria Helena Souza", idade: 80, quarto: "102B" },
            { id: 3, nome_completo: "Antonio Carlos Lima", idade: 87, quarto: "103A" },
            { id: 4, nome_completo: "Dona Raimunda Oliveira", idade: 86, quarto: "104C" },
          ]);
        }
      })
      .catch(() => {
        setIdosos([
          { id: 1, nome_completo: "Jose Antonio Pereira", idade: 83, quarto: "101A" },
          { id: 2, nome_completo: "Maria Helena Souza", idade: 80, quarto: "102B" },
          { id: 3, nome_completo: "Antonio Carlos Lima", idade: 87, quarto: "103A" },
          { id: 4, nome_completo: "Dona Raimunda Oliveira", idade: 86, quarto: "104C" },
        ]);
      });
  }, []);

  const tema = altoContraste
    ? "bg-black text-yellow-300"
    : "bg-villa-light text-villa-dark";

  return (
    <div className={`min-h-screen ${tema} transition-colors duration-500`}>
      {/* Barra superior */}
      <div
        className={`p-4 flex justify-between items-center ${
          altoContraste ? "bg-gray-900" : "bg-villa-primary"
        } text-white`}
      >
        <div className="flex items-center gap-4">
          <svg
            className="w-10 h-10"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <h1 className="font-bold text-2xl">Caixa de Memorias</h1>
        </div>
        <button
          onClick={() => setAltoContraste(!altoContraste)}
          className="p-3 rounded-xl bg-white/20 hover:bg-white/30 transition"
        >
          <span className="font-bold text-sm">
            {altoContraste ? "Normal" : "Contraste"}
          </span>
        </button>
      </div>

      {/* Conteudo principal */}
      <main className="container mx-auto px-6 py-12">
        <h2 className="text-center font-bold mb-12 text-3xl">
          Escolha um morador:
        </h2>

        {/* Grid de idosos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {idosos.map((idoso) => (
            <Link
              key={idoso.id}
              href={`/idoso/${idoso.id}`}
              className={`bg-white rounded-3xl shadow-xl p-8 border-4 border-transparent hover:border-villa-primary transition-all duration-300 flex flex-col items-center text-center gap-6 ${
                altoContraste ? "bg-black border-2 border-yellow-300" : ""
              }`}
            >
              <div className="w-32 h-32 rounded-full bg-villa-primary/20 flex items-center justify-center overflow-hidden border-4 border-villa-primary">
                <svg
                  className="w-16 h-16 text-villa-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-2xl">{idoso.nome_completo}</h3>
              <p className="text-lg text-gray-600">{idoso.idade} anos</p>
              <p className="text-lg text-villa-secondary font-semibold">
                {idoso.quarto}
              </p>
            </Link>
          ))}
        </div>

        {/* Botoes principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div className="px-8 py-6 rounded-2xl font-bold text-2xl shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-4 min-h-[120px] bg-villa-primary text-white hover:bg-villa-dark">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Fotos</span>
          </div>
          <div className="px-8 py-6 rounded-2xl font-bold text-2xl shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-4 min-h-[120px] bg-villa-secondary text-white hover:bg-red-600">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
            <span>Musicas</span>
          </div>
          <div className="px-8 py-6 rounded-2xl font-bold text-2xl shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-4 min-h-[120px] bg-villa-accent text-villa-dark hover:bg-orange-500">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Familia</span>
          </div>
          <div className="px-8 py-6 rounded-2xl font-bold text-2xl shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-4 min-h-[120px] bg-villa-success text-white hover:bg-teal-700">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Linha do Tempo</span>
          </div>
        </div>

        {/* Acesso Cuidador/Familia */}
        <div className="mt-16 flex justify-center gap-8">
          <Link
            href="/cuidador"
            className="px-8 py-4 bg-villa-dark text-white rounded-2xl text-xl font-semibold hover:bg-gray-800 transition"
          >
            Area do Cuidador
          </Link>
          <Link
            href="/familia"
            className="px-8 py-4 bg-villa-warm text-villa-dark rounded-2xl text-xl font-semibold hover:bg-yellow-500 transition"
          >
            Portal da Familia
          </Link>
        </div>
      </main>
    </div>
  );
}