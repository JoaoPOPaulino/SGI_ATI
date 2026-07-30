import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, AlertCircle, Loader2 } from "lucide-react";

interface QRScannerProps {
  onScan: (text: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const readerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    scannedRef.current = false;
    setLoading(true);
    setError("");

    const timer = setTimeout(async () => {
      try {
        const reader = new Html5Qrcode("qr-reader", { verbose: false });
        readerRef.current = reader;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        };

        await reader.start(
          { facingMode: "environment" },
          config,
          (decodedText: string) => {
            if (scannedRef.current) return;
            scannedRef.current = true;
            reader.stop().catch(() => {});
            onScan(decodedText);
            onClose();
          },
          () => {}
        );

        setLoading(false);
      } catch (err: any) {
        setLoading(false);
        const msg = err?.message || String(err);
        if (msg.includes("NotAllowed") || msg.includes("Permission")) {
          setError("Permissão da câmera negada. Permita o acesso no navegador.");
        } else if (msg.includes("NotFound") || msg.includes("device")) {
          setError("Nenhuma câmera encontrada neste dispositivo.");
        } else if (msg.includes("NotReadable") || msg.includes("in use")) {
          setError("Câmera em uso por outro aplicativo. Feche e tente novamente.");
        } else {
          setError("Erro ao iniciar câmera: " + msg);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      reader.stop().catch(() => {});
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-6 shadow-2xl border border-outline-variant/10 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-primary flex items-center gap-2">
            <Camera size={18} /> Escanear QR Code
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container-high rounded-full text-outline"
          >
            <X size={18} />
          </button>
        </div>

        {loading && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-outline">
            <Loader2 size={32} className="animate-spin mb-3" />
            <p className="text-xs font-semibold">Iniciando câmera...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 py-8 px-4">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-xs text-red-600 text-center font-semibold">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-surface border border-outline rounded-xl text-xs font-bold text-outline hover:text-on-surface mt-2"
            >
              Fechar
            </button>
          </div>
        )}

        <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />

        {!loading && !error && (
          <p className="text-[10px] text-outline text-center mt-3">
            Aponte a câmera para o QR code do equipamento
          </p>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
