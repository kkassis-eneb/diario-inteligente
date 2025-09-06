import { useState } from 'react';
import { createWorker } from 'tesseract.js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOCR = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processImage = async (imageUrl: string, entradaId: string) => {
    setIsProcessing(true);
    try {
      const worker = await createWorker('spa'); // Spanish language
      const { data: { text } } = await worker.recognize(imageUrl);
      await worker.terminate();

      // Extract dates from text
      const dateRegex = /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})|(\d{1,2}) de (\w+) de (\d{4})/g;
      const dates = [...text.matchAll(dateRegex)];

      if (dates.length > 0) {
        toast({
          title: "Fechas detectadas en el texto",
          description: `Se encontraron ${dates.length} fechas. Puedes editarlas en el detalle de la entrada.`,
          duration: 5000,
        });
      }

      // Update entrada with OCR text
      const { data: existingEntrada, error: fetchError } = await supabase
        .from('entradas')
        .select('texto_ocr')
        .eq('id', entradaId)
        .single();

      if (fetchError) throw fetchError;

      // Concatenate with existing text if any
      const existingText = existingEntrada?.texto_ocr || '';
      const newText = existingText ? `${existingText}\n\n---\n\n${text}` : text;

      const { error } = await supabase
        .from('entradas')
        .update({ texto_ocr: newText })
        .eq('id', entradaId);

      if (error) throw error;

      toast({
        title: "OCR completado",
        description: "El texto ha sido extraído y guardado correctamente.",
      });

      return text;
    } catch (error) {
      console.error('Error processing OCR:', error);
      toast({
        title: "Error en OCR",
        description: "No se pudo extraer el texto de la imagen.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return { processImage, isProcessing };
};