import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, FileText, Upload, Loader2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCamera } from "@/hooks/useCamera";
import { FileUpload } from "@/components/FileUpload";
import { OCRTextEditor } from "@/components/OCRTextEditor";
import { useOCREditor } from "@/hooks/useOCREditor";

interface ScanViewProps {
  onViewChange: (view: string) => void;
  userId?: string;
}

export const ScanView = ({ onViewChange, userId }: ScanViewProps) => {
  const { toast } = useToast();
  const { captureAndUpload, isProcessing } = useCamera(userId);
  const { 
    editorState, 
    isProcessing: isOCRProcessing, 
    processAndEditImage, 
    createNewEntry,
    openEditorWithText,
    closeEditor,
    saveEditedText 
  } = useOCREditor();

  const handleCameraCapture = async () => {
    try {
      await captureAndUpload();
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleTextFromImage = async () => {
    try {
      // Create a new entry first
      const entradaId = await createNewEntry();
      
      // For now, simulate image capture and OCR process
      // In a real scenario, this would capture an image first
      toast({
        title: "Funcionalidad en desarrollo",
        description: "Captura de imagen y OCR directo estará disponible pronto.",
        duration: 4000,
      });
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleManualTextEntry = async () => {
    try {
      const entradaId = await createNewEntry();
      openEditorWithText("", entradaId);
    } catch (error) {
      // Error is already handled in the hook
    }
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
            disabled={isProcessing || isOCRProcessing}
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
            onClick={handleManualTextEntry}
            disabled={isProcessing || isOCRProcessing}
            className="w-full h-16 bg-secondary text-secondary-foreground shadow-soft hover:shadow-emotion transition-all duration-300 text-lg font-semibold disabled:opacity-50"
          >
            {isOCRProcessing ? (
              <Loader2 className="mr-3 animate-spin" size={24} />
            ) : (
              <Edit className="mr-3" size={24} />
            )}
            {isOCRProcessing ? 'Procesando...' : 'Escribir Texto Manualmente'}
          </Button>
        </Card>

        <FileUpload 
          selectedDate={new Date()} 
          userId={userId}
          onUploadComplete={() => {
            toast({
              title: "Archivo procesado",
              description: "Tu archivo ha sido procesado correctamente",
            });
          }} 
        />
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

      {/* OCR Text Editor */}
      <OCRTextEditor
        isOpen={editorState.isEditorOpen}
        onClose={closeEditor}
        rawText={editorState.rawText}
        cleanedText={editorState.cleanedText}
        entradaId={editorState.entradaId || ''}
        onSave={saveEditedText}
      />
    </div>
  );
};