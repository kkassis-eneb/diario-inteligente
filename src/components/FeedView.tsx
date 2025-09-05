import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Image, FileText, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EntradaWithArchivo {
  id: string;
  fecha: string;
  fuente: string;
  estado_validacion: string;
  texto_ocr: string | null;
  archivo_id: string | null;
  tipo: string | null;
  url_privada: string | null;
}

interface FeedViewProps {
  onViewChange: (view: string) => void;
  onEntrySelect: (entryId: string) => void;
}

export const FeedView = ({ onViewChange, onEntrySelect }: FeedViewProps) => {
  const [entradas, setEntradas] = useState<EntradaWithArchivo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntradas();
  }, []);

  const fetchEntradas = async () => {
    try {
      const { data, error } = await supabase
        .from('entradas')
        .select(`
          id,
          fecha,
          fuente,
          estado_validacion,
          texto_ocr,
          archivos (
            id,
            tipo,
            url_privada
          )
        `)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include latest archivo for each entrada
      const transformedData = data.map(entrada => ({
        id: entrada.id,
        fecha: entrada.fecha,
        fuente: entrada.fuente,
        estado_validacion: entrada.estado_validacion,
        texto_ocr: entrada.texto_ocr,
        archivo_id: entrada.archivos?.[0]?.id || null,
        tipo: entrada.archivos?.[0]?.tipo || null,
        url_privada: entrada.archivos?.[0]?.url_privada || null,
      }));

      setEntradas(transformedData);
    } catch (error) {
      console.error('Error fetching entradas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url_privada: string) => {
    const { data } = supabase.storage
      .from('diario-fotos')
      .getPublicUrl(url_privada);
    return data.publicUrl;
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 bg-gradient-card shadow-card animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-20 bg-muted rounded mb-3"></div>
            <div className="h-3 bg-muted rounded w-full mb-2"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewChange('home')}
          className="p-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feed Cronológico</h1>
          <p className="text-muted-foreground">Tus entradas más recientes</p>
        </div>
      </div>

      <div className="space-y-4">
        {entradas.length === 0 ? (
          <Card className="p-8 bg-gradient-card shadow-card text-center">
            <Calendar className="mx-auto mb-4 text-muted-foreground" size={48} />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No hay entradas aún
            </h3>
            <p className="text-muted-foreground mb-4">
              Comienza capturando tu primera página de diario
            </p>
            <Button onClick={() => onViewChange('scan')}>
              Escanear Diario
            </Button>
          </Card>
        ) : (
          entradas.map((entrada) => (
            <Card 
              key={entrada.id} 
              className="p-6 bg-gradient-card shadow-card hover:shadow-emotion transition-all duration-300 cursor-pointer"
              onClick={() => onEntrySelect(entrada.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-muted-foreground" />
                  <span className="font-semibold text-foreground">
                    {format(new Date(entrada.fecha), 'dd \'de\' MMMM, yyyy', { locale: es })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Badge variant={entrada.estado_validacion === 'validated' ? 'default' : 'secondary'}>
                    {entrada.estado_validacion === 'validated' ? 'Validado' : 'Pendiente'}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {entrada.tipo === 'imagen' ? <Image size={12} /> : <FileText size={12} />}
                    {entrada.fuente}
                  </Badge>
                </div>
              </div>

              {entrada.url_privada && entrada.tipo === 'imagen' && (
                <div className="mb-3">
                  <img
                    src={getImageUrl(entrada.url_privada)}
                    alt="Entrada"
                    className="w-full h-32 object-cover rounded-md border"
                  />
                </div>
              )}

              {entrada.texto_ocr && (
                <div className="bg-background/50 p-3 rounded-md">
                  <p className="text-sm text-foreground leading-relaxed">
                    {truncateText(entrada.texto_ocr)}
                  </p>
                </div>
              )}

              {!entrada.texto_ocr && (
                <p className="text-sm text-muted-foreground italic">
                  Sin texto extraído
                </p>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};