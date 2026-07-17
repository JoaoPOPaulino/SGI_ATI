import React, { useRef } from "react";

interface CaixaAssinaturaProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

const CaixaAssinatura: React.FC<CaixaAssinaturaProps> = ({
  onChange,
  onClear,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasDrawnRef = useRef(false);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * c.width,
      y: ((e.clientY - r.top) / r.height) * c.height,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    drawingRef.current = true;
    hasDrawnRef.current = true;
    const p = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    c.setPointerCapture(e.pointerId);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const p = getPoint(e);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const c = canvasRef.current;
    if (!c || !hasDrawnRef.current) return;
    onChange(c.toDataURL("image/png"));
  };

  const clearSignature = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    hasDrawnRef.current = false;
    onChange("");
    onClear?.();
  };

  return (
    <div className="space-y-2">
      <div className="bg-white border border-outline rounded-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          className="block w-full h-32 touch-none cursor-crosshair"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-outline font-semibold">
          Assine dentro da área branca usando mouse ou touch.
        </p>
        <button
          type="button"
          onClick={clearSignature}
          className="px-3 py-1.5 text-[10px] font-bold text-primary border border-outline rounded-lg hover:bg-surface-container-high"
        >
          Limpar
        </button>
      </div>
    </div>
  );
};

export default CaixaAssinatura;
