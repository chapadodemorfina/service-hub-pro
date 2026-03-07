import { useRef, useState, useEffect } from "react";
import { useSaveSignature } from "../hooks/useServiceOrders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eraser, Save } from "lucide-react";

interface Props {
  orderId: string;
}

export default function SignatureCapture({ orderId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signerName, setSignerName] = useState("");
  const saveMutation = useSaveSignature();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => setIsDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const save = async () => {
    if (!signerName.trim()) return;
    const data = canvasRef.current!.toDataURL("image/png");
    await saveMutation.mutateAsync({
      orderId,
      signerName: signerName.trim(),
      signerRole: "customer",
      signatureData: data,
    });
    clear();
    setSignerName("");
  };

  return (
    <Card>
      <CardHeader><CardTitle>Assinatura do Cliente</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Nome do Assinante</Label>
          <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Nome completo" />
        </div>
        <div className="border rounded-md overflow-hidden touch-none">
          <canvas
            ref={canvasRef}
            width={500}
            height={200}
            className="w-full cursor-crosshair bg-white"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={clear}>
            <Eraser className="mr-1 h-4 w-4" /> Limpar
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={!signerName.trim() || saveMutation.isPending}>
            <Save className="mr-1 h-4 w-4" /> Salvar Assinatura
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
