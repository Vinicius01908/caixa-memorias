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

  return (
    <div className={altoContraste ? "alto-contraste" : ""}>
      {/* Barra Superior */}
      <div className="barra-superior">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <svg width="40" height="40" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <h1>Caixa de Memorias</h1>
        </div>
        <button onClick={() => setAltoContraste(!altoContraste)}>
          {altoContraste ? "Normal" : "Contraste"}
        </button>
      </div>

      {/* Conteudo */}
      <div className="container">
        <h2 className="titulo-centro">Escolha um morador:</h2>

        <div className="grid-idosos">
          {idosos.map((idoso) => (
            <Link href={`/idoso/${idoso.id}`} key={idoso.id} className="card-idoso">
              <div className="avatar-idoso">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="nome-idoso">{idoso.nome_completo}</div>
              <div className="idade-idoso">{idoso.idade} anos</div>
              <div className="quarto-idoso">{idoso.quarto}</div>
            </Link>
          ))}
        </div>

        {/* Botoes principais */}
        <div className="grid-botoes">
          <button className="botao-grande botao-azul">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Fotos</span>
          </button>
          <button className="botao-grande botao-coral">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span>Musicas</span>
          </button>
          <button className="botao-grande botao-laranja">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Familia</span>
          </button>
          <button className="botao-grande botao-verde">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Linha do Tempo</span>
          </button>
        </div>

        {/* Acesso Cuidador / Familia */}
        <div className="botoes-acesso">
          <Link href="/cuidador" className="link-acesso link-cuidador">
            Area do Cuidador
          </Link>
          <Link href="/familia" className="link-acesso link-familia">
            Portal da Familia
          </Link>
        </div>
      </div>
    </div>
  );
}