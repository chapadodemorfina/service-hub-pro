import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, Search, QrCode, Keyboard } from "lucide-react";

export default function ScanServiceOrderPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<"manual" | "camera">("manual");
  const [manualInput, setManualInput] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  const handleResult = useCallback((url: string) => {
    // Extract token from tracking URL pattern /track/:token
    const trackMatch = url.match(/\/track\/([a-f0-9]+)/i);
    if (trackMatch) {
      // Internal staff: redirect to SO lookup via token
      // We need to find the SO by token first
      navigate(`/track/${trackMatch[1]}`);
      return;
    }

    // Direct SO number input (e.g. OS-0001)
    const soMatch = url.match(/^(OS-?\d+)$/i);
    if (soMatch) {
      toast({ title: "Use a busca de OS", description: `Pesquise "${soMatch[1]}" na lista de ordens de serviço.` });
      navigate(`/service-orders?search=${encodeURIComponent(soMatch[1])}`);
      return;
    }

    // Full internal URL with UUID
    const uuidMatch = url.match(/\/service-orders\/([0-9a-f-]{36})/i);
    if (uuidMatch) {
      navigate(`/service-orders/${uuidMatch[1]}`);
      return;
    }

    toast({ title: "Código não reconhecido", description: "Não foi possível identificar uma OS neste código.", variant: "destructive" });
  }, [navigate, toast]);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      scanningRef.current = true;
      scanFrame();
    } catch (err) {
      toast({ title: "Câmera indisponível", description: "Permita o acesso à câmera para escanear.", variant: "destructive" });
      setMode("manual");
    }
  }, [toast]);

  const scanFrame = useCallback(() => {
    if (!scanningRef.current || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Use BarcodeDetector API if available
    if ("BarcodeDetector" in window) {
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      detector.detect(canvas).then((barcodes: any[]) => {
        if (barcodes.length > 0) {
          stopCamera();
          handleResult(barcodes[0].rawValue);
          return;
        }
        if (scanningRef.current) requestAnimationFrame(scanFrame);
      }).catch(() => {
        if (scanningRef.current) requestAnimationFrame(scanFrame);
      });
    } else {
      // Fallback: no BarcodeDetector, show message
      toast({ title: "Scanner indisponível", description: "Seu navegador não suporta detecção de QR code. Use a entrada manual.", variant: "destructive" });
      stopCamera();
      setMode("manual");
    }
  }, [handleResult, stopCamera, toast]);

  useEffect(() => {
    if (mode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [mode, startCamera, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = manualInput.trim();
    if (!val) return;
    handleResult(val);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Escanear OS</h1>
        <p className="text-muted-foreground">Escaneie o QR code ou digite o número da OS</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === "camera" ? "default" : "outline"}
          onClick={() => setMode("camera")}
        >
          <Camera className="mr-2 h-4 w-4" /> Câmera
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          onClick={() => setMode("manual")}
        >
          <Keyboard className="mr-2 h-4 w-4" /> Manual
        </Button>
      </div>

      {mode === "camera" ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-4 w-4" /> Aponte a câmera para o QR Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-primary/60 rounded-lg" />
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <p className="text-xs text-muted-foreground text-center mt-3">
              Posicione o QR Code da etiqueta dentro da área marcada
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" /> Busca Manual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <Label htmlFor="scan-input">Número da OS ou URL de rastreamento</Label>
                <Input
                  id="scan-input"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Ex: OS-0001 ou cole a URL do QR code"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">
                <Search className="mr-2 h-4 w-4" /> Buscar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
