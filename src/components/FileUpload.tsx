import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Upload, Loader2 } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

interface FileUploadProps {
  onUploadComplete?: () => void;
}

export const FileUpload = ({ onUploadComplete }: FileUploadProps) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useFileUpload();

  const handleFileSelect = async (file: File) => {
    try {
      await uploadFile(file);
      onUploadComplete?.();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-card shadow-card">
        <Button 
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploading}
          variant="outline"
          className="w-full h-20 border-2 border-dashed border-border hover:border-primary/50 bg-background/50 hover:bg-background/80 transition-all duration-300 text-lg font-semibold"
        >
          {isUploading ? (
            <Loader2 className="mr-3 animate-spin" size={28} />
          ) : (
            <Upload className="mr-3" size={28} />
          )}
          {isUploading ? 'Subiendo...' : 'Subir Imagen'}
        </Button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </Card>

      <Card className="p-6 bg-gradient-card shadow-card">
        <Button 
          onClick={() => pdfInputRef.current?.click()}
          disabled={isUploading}
          variant="outline"
          className="w-full h-20 border-2 border-dashed border-border hover:border-primary/50 bg-background/50 hover:bg-background/80 transition-all duration-300 text-lg font-semibold"
        >
          {isUploading ? (
            <Loader2 className="mr-3 animate-spin" size={28} />
          ) : (
            <FileText className="mr-3" size={28} />
          )}
          {isUploading ? 'Subiendo...' : 'Subir PDF'}
        </Button>
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          onChange={handlePdfSelect}
          className="hidden"
        />
      </Card>
    </div>
  );
};