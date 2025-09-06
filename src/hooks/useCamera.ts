import { useState } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';

export const useCamera = (userId?: string) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { uploadFile } = useFileUpload();

  const captureAndUpload = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para tomar fotos.",
        variant: "destructive",
      });
      return;
    }

    setIsCapturing(true);

    try {
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

      // Convert to blob and create file
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      });

      const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });

      setIsCapturing(false);
      setIsUploading(true);

      // Use the file upload hook for consistency
      await uploadFile(file, new Date(), userId);

      toast({
        title: "Foto capturada exitosamente",
        description: "Tu imagen ha sido guardada y está siendo procesada.",
      });

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