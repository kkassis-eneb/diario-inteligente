import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOCR } from './useOCR';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { processImage } = useOCR();

  const uploadFile = async (file: File, selectedDate?: Date) => {
    setIsUploading(true);
    try {
      const fecha = selectedDate || new Date();
      const year = fecha.getFullYear();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${year}/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('diario-fotos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get or create entrada for this date
      const fechaString = fecha.toISOString().split('T')[0];
      let entradaId: string;

      const { data: existingEntrada } = await supabase
        .from('entradas')
        .select('id')
        .eq('fecha', fechaString)
        .single();

      if (existingEntrada) {
        entradaId = existingEntrada.id;
      } else {
        const { data: newEntrada, error: entradaError } = await supabase
          .from('entradas')
          .insert({
            fecha: fechaString,
            fuente: file.type.includes('pdf') ? 'pdf' : 'foto',
          })
          .select('id')
          .single();

        if (entradaError) throw entradaError;
        entradaId = newEntrada.id;
      }

      // Create archivo record
      const { error: archivoError } = await supabase
        .from('archivos')
        .insert({
          entrada_id: entradaId,
          tipo: file.type.includes('pdf') ? 'pdf' : 'imagen',
          url_privada: uploadData.path,
        });

      if (archivoError) throw archivoError;

      // Process OCR if it's an image
      if (file.type.includes('image')) {
        const { data: { publicUrl } } = supabase.storage
          .from('diario-fotos')
          .getPublicUrl(uploadData.path);
        
        await processImage(publicUrl, entradaId);
      }

      toast({
        title: "Archivo subido correctamente",
        description: `${file.type.includes('pdf') ? 'PDF' : 'Imagen'} guardado para ${fechaString}`,
      });

      return { entradaId, filePath: uploadData.path };
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error al subir archivo",
        description: "No se pudo guardar el archivo. Inténtalo de nuevo.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading };
};