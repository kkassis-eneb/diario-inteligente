import { useState } from 'react';
import { useOCR } from './useOCR';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OCREditorState {
  isEditorOpen: boolean;
  rawText: string;
  cleanedText: string;
  entradaId: string | null;
}

export const useOCREditor = () => {
  const [editorState, setEditorState] = useState<OCREditorState>({
    isEditorOpen: false,
    rawText: '',
    cleanedText: '',
    entradaId: null
  });
  
  const { processImage, isProcessing, saveProcessedText, postProcessOCRText } = useOCR();
  const { toast } = useToast();

  const processAndEditImage = async (imageUrl: string, entradaId: string) => {
    try {
      // Extract text using OCR
      const extractedText = await processImage(imageUrl, entradaId);
      const cleanedText = postProcessOCRText(extractedText);
      
      // Open editor with the processed text
      setEditorState({
        isEditorOpen: true,
        rawText: extractedText,
        cleanedText: cleanedText,
        entradaId: entradaId
      });
      
      return { rawText: extractedText, cleanedText };
    } catch (error) {
      console.error('Error in processAndEditImage:', error);
      throw error;
    }
  };

  const createNewEntry = async (): Promise<string> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('entradas')
        .insert({
          user_id: user.id,
          fecha: new Date().toISOString().split('T')[0],
          fuente: 'ocr_manual',
          texto_ocr: '',
          improvement_status: 'pending'
        })
        .select('id')
        .single();

      if (error) throw error;
      
      return data.id;
    } catch (error) {
      console.error('Error creating new entry:', error);
      toast({
        title: "Error",
        description: "No se pudo crear una nueva entrada.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const openEditorWithText = (text: string, entradaId?: string) => {
    const cleanedText = postProcessOCRText(text);
    setEditorState({
      isEditorOpen: true,
      rawText: text,
      cleanedText: cleanedText,
      entradaId: entradaId || null
    });
  };

  const closeEditor = () => {
    setEditorState({
      isEditorOpen: false,
      rawText: '',
      cleanedText: '',
      entradaId: null
    });
  };

  const saveEditedText = async (editedText: string) => {
    if (!editorState.entradaId) {
      throw new Error('No se puede guardar sin un ID de entrada válido');
    }
    
    try {
      await saveProcessedText(editorState.entradaId, editedText);
      closeEditor();
      
      toast({
        title: "Texto guardado",
        description: "El texto editado ha sido guardado en Textos Digitalizados.",
      });
    } catch (error) {
      console.error('Error saving edited text:', error);
      throw error;
    }
  };

  return {
    editorState,
    isProcessing,
    processAndEditImage,
    createNewEntry,
    openEditorWithText,
    closeEditor,
    saveEditedText,
    postProcessOCRText
  };
};