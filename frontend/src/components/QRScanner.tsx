import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera } from "lucide-react";

interface QRScannerProps {
  onScan: (text: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const readerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    const reader = new Html5Qrcode("qr-reader", { verbose: false });
    readerRef.current = reader;
    scannedRef.current = false;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1,
    };

    reader
      .start(
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
      )
      .catch((err: Error) => {
        if (err.message?.includes("NotAllowedError") || err.message?.includes("Permission")) {
          reader
            .start(
              { facingMode: "user" },
              config,
              (decodedText: string) => {
                if (scannedRef.current) return;
                scannedRef.current = true;
                reader.stop().catch(() => {});
                onScan(decodedText);
                onClose();
              },
              () => {}
            )
            .catch(() => {});
        }
      });

    return () => {
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
        <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />
        <p className="text-[10px] text-outline text-center mt-3">
          Aponte a câmera para o QR code do equipamento
        </p>
      </div>
    </div>
  );
};

export default QRScanner;
