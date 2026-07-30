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
        const el = document.getElementById("qr-reader");
        if (!el) { setError("Elemento nao encontrado"); setLoading(false); return; }

        const reader = new Html5Qrcode("qr-reader", { verbose: false });
        readerRef.current = reader;

        await reader.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
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
        if (msg.includes("NotAllowed") || msg.includes("Permission")) setError("Permissao da camera negada.");
        else if (msg.includes("NotFound")) setError("Nenhuma camera encontrada.");
        else setError("Erro: " + msg.substring(0, 80));
      }
    }, 500);

    return () => { clearTimeout(timer); readerRef.current?.stop().catch(() => {}); };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black flex items-center gap-2"><Camera size={18} /> Escanear QR Code</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full"><X size={18} /></button>
        </div>
        {loading && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Loader2 size={32} className="animate-spin mb-3" />
            <p className="text-xs font-semibold">Iniciando camera...</p>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center gap-3 py-8 px-4">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-xs text-red-600 text-center font-semibold">{error}</p>
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold">Fechar</button>
          </div>
        )}
        <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />
        {!loading && !error && <p className="text-[10px] text-gray-400 text-center mt-3">Aponte a camera para o QR code</p>}
      </div>
    </div>
  );
};

export default QRScanner;
