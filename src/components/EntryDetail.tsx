import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Plus, Save, Image as ImageIcon, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRef } from 'react';

interface Archivo {
  id: string;
  tipo: string;
  url_privada: string;
  created_at: string;
}

interface EntryDetailProps {
  entryId: string;
  onBack: () => void;
}

export const EntryDetail = ({ entryId, onBack }: EntryDetailProps) => {
  const [entry, setEntry] = useState<any>(null);
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [textoOcr, setTextoOcr] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { uploadFile, isUploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEntryDetails();
  }, [entryId]);

  const fetchEntryDetails = async () => {
    try {
      // Fetch entry details
      const { data: entryData, error: entryError } = await supabase
        .from('entradas')
        .select('*')
        .eq('id', entryId)
        .single();

      if (entryError) throw entryError;

      // Fetch associated files
      const { data: archivosData, error: archivosError } = await supabase
        .from('archivos')
        .select('*')
        .eq('entrada_id', entryId)
        .order('created_at', { ascending: true });

      if (archivosError) throw archivosError;

      setEntry(entryData);
      setArchivos(archivosData || []);
      setTextoOcr(entryData.texto_ocr || '');
    } catch (error) {
      console.error('Error fetching entry details:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la entrada",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveText = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('entradas')
        .update({ texto_ocr: textoOcr })
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Texto guardado",
        description: "Los cambios han sido guardados correctamente",
      });
    } catch (error) {
      console.error('Error saving text:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el texto",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddPage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && entry) {
      try {
        await uploadFile(file, new Date(entry.fecha));
        await fetchEntryDetails(); // Refresh the data
        toast({
          title: "Página añadida",
          description: "La nueva página ha sido agregada a esta entrada",
        });
      } catch (error) {
        // Error is handled in the hook
      }
    }
  };

  const getImageUrl = (url_privada: string) => {
    const { data } = supabase.storage
      .from('diario-fotos')
      .getPublicUrl(url_privada);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-40 bg-muted rounded mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-foreground mb-4">Entrada no encontrada</h2>
        <Button onClick={onBack}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {format(new Date(entry.fecha), 'dd \'de\' MMMM, yyyy', { locale: es })}
          </h1>
          <div className="flex gap-2 mt-1">
            <Badge variant={entry.estado_validacion === 'validated' ? 'default' : 'secondary'}>
              {entry.estado_validacion === 'validated' ? 'Validado' : 'Pendiente'}
            </Badge>
            <Badge variant="outline">{entry.fuente}</Badge>
          </div>
        </div>
      </div>

      {/* Images/Files Grid */}
      <Card className="p-6 bg-gradient-card shadow-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Páginas ({archivos.length})
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Añadir Página
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleAddPage}
            className="hidden"
          />
        </div>

        {archivos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto mb-2" size={32} />
            <p>No hay archivos asociados a esta entrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {archivos.map((archivo) => (
              <div key={archivo.id} className="relative group">
                {archivo.tipo === 'imagen' ? (
                  <img
                    src={getImageUrl(archivo.url_privada)}
                    alt="Página de diario"
                    className="w-full h-40 object-cover rounded-md border shadow-sm"
                  />
                ) : (
                  <div className="w-full h-40 bg-muted rounded-md border shadow-sm flex items-center justify-center">
                    <FileText size={48} className="text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs">
                    {archivo.tipo === 'imagen' ? <ImageIcon size={12} /> : <FileText size={12} />}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* OCR Text */}
      <Card className="p-6 bg-gradient-card shadow-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">Texto Extraído</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={saveText}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
        
        <Textarea
          value={textoOcr}
          onChange={(e) => setTextoOcr(e.target.value)}
          placeholder="El texto extraído aparecerá aquí. Puedes editarlo manualmente."
          className="min-h-[200px] resize-none"
        />
      </Card>
    </div>
  );
};