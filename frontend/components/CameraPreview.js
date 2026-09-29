"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraPreview() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("loading"); // 'loading', 'active', 'denied', 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let activeStream = null;
    let isMounted = true;

    async function startCamera() {
      // Verifica suporte no navegador
      if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage("Câmera não suportada neste dispositivo.");
        }
        return;
      }

      try {
        if (isMounted) setStatus("loading");

        // Solicita acesso à câmera frontal/padrão do dispositivo (somente vídeo, sem áudio)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        // Caso o componente tenha sido desmontado durante a solicitação de permissão
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        activeStream = stream;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn("Aviso na reprodução do stream da câmera:", playErr);
          }
        }

        if (isMounted) {
          setStatus("active");
          setErrorMessage("");
        }
      } catch (err) {
        console.warn("Câmera indisponível ou permissão negada:", err);
        if (isMounted) {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            setStatus("denied");
            setErrorMessage("Permissão da câmera negada.");
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            setStatus("error");
            setErrorMessage("Nenhuma câmera encontrada.");
          } else {
            setStatus("error");
            setErrorMessage("Câmera indisponível.");
          }
        }
      }
    }

    startCamera();

    // Ciclo de vida: encerra todas as trilhas da câmera ao fechar ou desmontar
    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
        activeStream = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Se o aviso foi dispensado pelo usuário
  if (dismissed) {
    return null;
  }

  // Tratamento sutil para erro ou permissão negada: aviso discreto e não invasivo
  if (status === "denied" || status === "error") {
    return (
      <div
        style={{
          position: "absolute",
          top: "74px",
          right: "24px",
          zIndex: 2010,
          maxWidth: "200px",
          backgroundColor: "rgba(20, 20, 20, 0.75)",
          backdropFilter: "blur(8px)",
          color: "#CBD5E1",
          fontSize: "12px",
          padding: "8px 12px",
          borderRadius: "10px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "14px" }}>📷</span>
          <span>{errorMessage}</span>
        </span>
        <button
          onClick={() => setDismissed(true)}
          title="Fechar aviso"
          style={{
            background: "none",
            border: "none",
            color: "#94A3B8",
            cursor: "pointer",
            fontSize: "14px",
            padding: "0 2px",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "74px",
        right: "24px",
        zIndex: 2010,
        width: isMinimized ? "auto" : "clamp(160px, 16vw, 200px)",
        backgroundColor: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(10px)",
        borderRadius: "14px",
        border: "2px solid rgba(255, 255, 255, 0.22)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
        overflow: "hidden",
        transition: "all 0.25s ease-in-out",
      }}
    >
      {/* Barra de controle discreta */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "5px 10px",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          fontSize: "11px",
          color: "#E2E8F0",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: status === "active" ? "#10B981" : "#F59E0B",
              boxShadow: status === "active" ? "0 0 6px #10B981" : "none",
              display: "inline-block",
            }}
          />
          <span style={{ fontWeight: 600, letterSpacing: "0.3px" }}>
            {status === "active" ? "Câmera" : "Conectando..."}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsMinimized(!isMinimized)}
          title={isMinimized ? "Expandir câmera" : "Minimizar câmera"}
          style={{
            background: "transparent",
            border: "none",
            color: "#CBD5E1",
            cursor: "pointer",
            fontSize: "12px",
            padding: "2px 4px",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isMinimized ? "➕" : "➖"}
        </button>
      </div>

      {/* Caixa do Vídeo */}
      {!isMinimized && (
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4 / 3",
            backgroundColor: "#0B1120",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)", // Efeito espelhado natural
              display: status === "active" ? "block" : "none",
            }}
          />

          {status === "loading" && (
            <div
              style={{
                color: "#94A3B8",
                fontSize: "12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ fontSize: "18px" }}>⏳</span>
              <span>Iniciando...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
