import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCamera = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const captureAndUpload = async () => {
    try {
      setIsCapturing(true);

      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use rear camera if available
      });

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      // Stop the stream
      stream.getTracks().forEach(track => track.stop());

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      });

      setIsCapturing(false);
      setIsUploading(true);

      // Upload to Supabase Storage
      const fileName = `foto_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('diario-fotos')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('diario-fotos')
        .getPublicUrl(fileName);

      // Create entrada record
      const { data: entradaData, error: entradaError } = await supabase
        .from('entradas')
        .insert({
          fuente: 'foto',
          estado_validacion: 'pending'
        })
        .select()
        .single();

      if (entradaError) throw entradaError;

      // Create archivo record
      const { error: archivoError } = await supabase
        .from('archivos')
        .insert({
          entrada_id: entradaData.id,
          tipo: 'imagen',
          url_privada: publicUrl
        });

      if (archivoError) throw archivoError;

      // Trigger automation
      const { error: automationError } = await supabase.functions.invoke('on-file-upload', {
        body: {
          entrada_id: entradaData.id,
          file_url: publicUrl
        }
      });

      if (automationError) {
        console.warn('Automation trigger failed:', automationError);
      }

      toast({
        title: "Foto capturada exitosamente",
        description: "Tu imagen ha sido guardada y está siendo procesada.",
      });

      return { entradaId: entradaData.id, fileUrl: publicUrl };

    } catch (error) {
      console.error('Camera capture error:', error);
      toast({
        title: "Error al capturar foto",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsCapturing(false);
      setIsUploading(false);
    }
  };

  return {
    captureAndUpload,
    isCapturing,
    isUploading,
    isProcessing: isCapturing || isUploading
  };
};