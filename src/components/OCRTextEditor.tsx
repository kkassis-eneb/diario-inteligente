import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Copy, 
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface OCRTextEditorProps {
  isOpen: boolean;
  onClose: () => void;
  rawText: string;
  cleanedText: string;
  entradaId: string;
  onSave?: (text: string) => void;
}

export const OCRTextEditor = ({ 
  isOpen, 
  onClose, 
  rawText, 
  cleanedText, 
  entradaId,
  onSave 
}: OCRTextEditorProps) => {
  const [editedText, setEditedText] = useState(cleanedText);
  const [showRawText, setShowRawText] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [improvedText, setImprovedText] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('entradas')
        .update({ 
          texto_ocr: editedText,
          improvement_status: 'manual_edited'
        })
        .eq('id', entradaId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Texto guardado",
        description: "El texto editado ha sido guardado correctamente.",
      });

      onSave?.(editedText);
      onClose();
    } catch (error) {
      console.error('Error saving text:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar el texto editado.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImproveWithAI = async () => {
    setIsImproving(true);
    try {
      const { data, error } = await supabase.functions.invoke('improve-text', {
        body: { text: editedText }
      });

      if (error) throw error;

      const { improvedText: aiText } = data;
      setImprovedText(aiText);
      
      toast({
        title: "Texto mejorado con IA",
        description: "El texto ha sido procesado y mejorado automáticamente.",
      });
    } catch (error) {
      console.error('Error improving text:', error);
      toast({
        title: "Error al mejorar",
        description: "No se pudo mejorar el texto con IA.",
        variant: "destructive",
      });
    } finally {
      setIsImproving(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado",
        description: "Texto copiado al portapapeles",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el texto",
        variant: "destructive",
      });
    }
  };

  const useImprovedText = () => {
    if (improvedText) {
      setEditedText(improvedText);
      setImprovedText(null);
      toast({
        title: "Texto actualizado",
        description: "Se ha aplicado la mejora de IA al texto editor.",
      });
    }
  };

  const textStats = {
    characters: editedText.length,
    words: editedText.trim().split(/\s+/).filter(word => word.length > 0).length,
    lines: editedText.split('\n').length
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Editor de Texto OCR</span>
            <Badge variant="outline" className="text-xs">
              {textStats.words} palabras • {textStats.characters} caracteres
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto">
          {/* Control buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRawText(!showRawText)}
              className="flex items-center gap-2"
            >
              {showRawText ? <EyeOff size={16} /> : <Eye size={16} />}
              {showRawText ? 'Ocultar original' : 'Ver texto original'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleImproveWithAI}
              disabled={isImproving}
              className="flex items-center gap-2"
            >
              {isImproving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {isImproving ? 'Mejorando...' : 'Mejorar con IA'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(editedText)}
              className="flex items-center gap-2"
            >
              <Copy size={16} />
              Copiar texto
            </Button>
          </div>

          {/* Raw text comparison */}
          {showRawText && (
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Texto original extraído (sin procesar)
                </span>
              </div>
              <div className="text-sm text-muted-foreground bg-background p-3 rounded border max-h-32 overflow-y-auto">
                {rawText || 'No hay texto original disponible'}
              </div>
            </Card>
          )}

          {/* AI improved text preview */}
          {improvedText && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Texto mejorado con IA
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(improvedText)}
                  >
                    <Copy size={14} />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={useImprovedText}
                  >
                    Usar este texto
                  </Button>
                </div>
              </div>
              <div className="text-sm bg-background p-3 rounded border max-h-32 overflow-y-auto">
                {improvedText}
              </div>
            </Card>
          )}

          {/* Main text editor */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                Texto a guardar
              </span>
              <Badge variant="secondary" className="text-xs">
                {textStats.lines} líneas
              </Badge>
            </div>
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              placeholder="Edita el texto extraído aquí..."
              className="min-h-[300px] max-h-[400px] resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              <X size={16} className="mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !editedText.trim()}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isSaving ? 'Guardando...' : 'Guardar texto'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};