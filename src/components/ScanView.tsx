import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, FileText, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCamera } from "@/hooks/useCamera";

interface ScanViewProps {
  onViewChange: (view: string) => void;
}

export const ScanView = ({ onViewChange }: ScanViewProps) => {
  const { toast } = useToast();
  const { captureAndUpload, isProcessing } = useCamera();

  const handleCameraCapture = async () => {
    try {
      await captureAndUpload();
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleScan = (type: string) => {
    toast({
      title: "Funcionalidad en desarrollo",
      description: `${type} estará disponible pronto.`,
      duration: 4000,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Escanear Diario
        </h1>
        <p className="text-muted-foreground">
          Captura tus páginas de diario para análisis automático
        </p>
      </div>

      <div className="space-y-4">
        <Card className="p-6 bg-gradient-card shadow-card">
          <Button 
            onClick={handleCameraCapture}
            disabled={isProcessing}
            className="w-full h-20 bg-primary text-primary-foreground shadow-soft hover:shadow-emotion transition-all duration-300 text-lg font-semibold disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="mr-3 animate-spin" size={28} />
            ) : (
              <Camera className="mr-3" size={28} />
            )}
            {isProcessing ? 'Procesando...' : 'Tomar Foto'}
          </Button>
        </Card>

        <Card className="p-6 bg-gradient-card shadow-card">
          <Button 
            onClick={() => handleScan('Archivo PDF')}
            variant="outline"
            className="w-full h-20 border-2 border-dashed border-border hover:border-primary/50 bg-background/50 hover:bg-background/80 transition-all duration-300 text-lg font-semibold"
          >
            <FileText className="mr-3" size={28} />
            Subir PDF
          </Button>
        </Card>

        <Card className="p-6 bg-gradient-card shadow-card">
          <Button 
            onClick={() => handleScan('Imagen desde galería')}
            variant="outline"
            className="w-full h-20 border-2 border-dashed border-border hover:border-primary/50 bg-background/50 hover:bg-background/80 transition-all duration-300 text-lg font-semibold"
          >
            <Upload className="mr-3" size={28} />
            Subir Imagen
          </Button>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-neutral shadow-card">
        <h3 className="font-semibold mb-3 text-foreground">¿Qué analizaremos?</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full"></span>
            <span>Extracción de texto con OCR</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emotion-joy rounded-full"></span>
            <span>Análisis de emociones principales</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emotion-calm rounded-full"></span>
            <span>Detección de comportamientos y temas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emotion-hope rounded-full"></span>
            <span>Identificación de ubicaciones</span>
          </div>
        </div>
      </Card>

      <Button 
        onClick={() => onViewChange('home')}
        variant="outline"
        className="w-full"
      >
        Volver al Inicio
      </Button>
    </div>
  );
};