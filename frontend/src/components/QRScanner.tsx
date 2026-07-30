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

    const startScanner = async (facingMode: string) => {
      const reader = new Html5Qrcode("qr-reader", { verbose: false });
      readerRef.current = reader;
      await reader.start(
        { facingMode },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        (decodedText: string) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          reader.stop().catch(() => {});
          setLoading(true);
          setError("");
          try {
            onScan(decodedText);
          } catch (e: any) {
            setError("Erro ao processar: " + (e?.message || "desconhecido"));
            setLoading(false);
            scannedRef.current = false;
            return;
          }
          onClose();
        },
        () => {}
      );
      setLoading(false);
    };

    const timer = setTimeout(async () => {
      try {
        await startScanner("environment");
      } catch {
        try {
          await startScanner("user");
        } catch (err: any) {
          setLoading(false);
          const msg = err?.message || String(err);
          if (msg.includes("NotAllowed") || msg.includes("Permission")) {
            setError("Permissao da camera negada. Permita o acesso nas configuracoes do navegador.");
          } else if (msg.includes("NotFound") || msg.includes("device")) {
            setError("Nenhuma camera encontrada neste dispositivo.");
          } else {
            setError("Erro: " + msg.substring(0, 100));
          }
        }
      }
    }, 600);

    return () => {
      clearTimeout(timer);
      try { readerRef.current?.stop().catch(() => {}); } catch {}
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-black/90">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-black flex items-center gap-2"><Camera size={18} /> Escanear QR Code</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full"><X size={18} /></button>
        </div>

        {loading && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Loader2 size={40} className="animate-spin mb-4" />
            <p className="text-sm font-semibold">Iniciando camera...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 py-12 px-6">
            <AlertCircle size={40} className="text-red-400" />
            <p className="text-sm text-red-600 text-center font-semibold">{error}</p>
            <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold">Fechar</button>
          </div>
        )}

        <div id="qr-reader" style={{ width: "100%", minHeight: "300px" }} />

        {!loading && !error && (
          <p className="text-[11px] text-gray-400 text-center py-3 bg-gray-50 border-t border-gray-100">
            Aponte a camera para o QR code do equipamento
          </p>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
