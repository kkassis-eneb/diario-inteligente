import { useState } from 'react';
import { createWorker } from 'tesseract.js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOCR = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Optimized OCR processing with better configuration
  const processImage = async (imageUrl: string, entradaId: string): Promise<string> => {
    setIsProcessing(true);
    try {
      const worker = await createWorker(['spa', 'eng'], 1, {
        logger: m => console.log('OCR Progress:', m)
      });

      const { data: { text, confidence } } = await worker.recognize(imageUrl);
      
      await worker.terminate();
      
      console.log('OCR Confidence:', confidence);
      
      // Post-process the extracted text
      const cleanedText = postProcessOCRText(text);

      // Show confidence feedback to user
      if (confidence < 60) {
        toast({
          title: "Calidad de OCR baja",
          description: "El texto puede contener errores. Considera mejorar la calidad de la imagen.",
          variant: "default",
        });
      }
      
      // Extract dates from text
      const dateRegex = /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})|(\d{1,2}) de (\w+) de (\d{4})/g;
      const dates = [...cleanedText.matchAll(dateRegex)];

      if (dates.length > 0) {
        toast({
          title: "Fechas detectadas en el texto",
          description: `Se encontraron ${dates.length} fechas. Puedes editarlas en el detalle de la entrada.`,
          duration: 5000,
        });
      }

      return cleanedText;
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

  // Post-processing function to clean OCR text
  const postProcessOCRText = (rawText: string): string => {
    let cleaned = rawText;
    
    // Remove common OCR artifacts and unwanted characters
    cleaned = cleaned.replace(/[|¦]/g, 'l'); // Replace pipes with 'l'
    cleaned = cleaned.replace(/[0O]/g, (match, offset, string) => {
      // Context-aware O/0 replacement
      const prevChar = string[offset - 1];
      const nextChar = string[offset + 1];
      if (prevChar && nextChar && /[a-zA-Z]/.test(prevChar) && /[a-zA-Z]/.test(nextChar)) {
        return 'o';
      }
      return match;
    });
    
    // Fix common Spanish character confusions
    cleaned = cleaned.replace(/[àâä]/g, 'á');
    cleaned = cleaned.replace(/[èêë]/g, 'é');
    cleaned = cleaned.replace(/[ìîï]/g, 'í');
    cleaned = cleaned.replace(/[òôö]/g, 'ó');
    cleaned = cleaned.replace(/[ùûü]/g, 'ú');
    
    // Remove excessive whitespace and fix line breaks
    cleaned = cleaned.replace(/\s{3,}/g, ' '); // Multiple spaces to single
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n'); // Multiple line breaks to double
    cleaned = cleaned.replace(/([.!?])\s*\n\s*([a-záéíóúüñ])/gi, '$1 $2'); // Fix broken sentences
    
    // Remove standalone special characters that are likely OCR errors
    cleaned = cleaned.replace(/^\s*[^\w\s\n.!?¿¡,;:()[\]{}'"«»""''—–-]\s*$/gm, '');
    
    // Clean up punctuation spacing
    cleaned = cleaned.replace(/\s+([.!?;:,])/g, '$1'); // Remove spaces before punctuation
    cleaned = cleaned.replace(/([.!?;:,])\s*([a-záéíóúüñ])/gi, '$1 $2'); // Ensure space after punctuation
    
    // Fix common word boundaries
    cleaned = cleaned.replace(/\b([a-záéíóúüñ])\s+([.!?])/gi, '$1$2');
    
    return cleaned.trim();
  };

  // Save processed text to database
  const saveProcessedText = async (entradaId: string, processedText: string) => {
    try {
      const { data: existingEntrada, error: fetchError } = await supabase
        .from('entradas')
        .select('texto_ocr')
        .eq('id', entradaId)
        .single();

      if (fetchError) throw fetchError;

      // Concatenate with existing text if any
      const existingText = existingEntrada?.texto_ocr || '';
      const newText = existingText ? `${existingText}\n\n---\n\n${processedText}` : processedText;

      const { error } = await supabase
        .from('entradas')
        .update({ 
          texto_ocr: newText,
          improvement_status: 'pending' // Mark for potential AI improvement
        })
        .eq('id', entradaId);

      if (error) throw error;

      toast({
        title: "OCR completado",
        description: "El texto ha sido extraído y guardado correctamente.",
      });

      return newText;
    } catch (error) {
      console.error('Error saving processed text:', error);
      toast({
        title: "Error al guardar",
        description: "El texto se extrajo pero no se pudo guardar.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return { processImage, isProcessing, saveProcessedText, postProcessOCRText };
};