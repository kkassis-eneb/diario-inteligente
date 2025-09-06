import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Copy, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface NotaEntrada {
  id: string;
  fecha: string;
  texto_ocr: string;
  fuente: string;
  created_at: string;
}

interface NotesViewProps {
  onViewChange: (view: string) => void;
}

export const NotesView = ({ onViewChange }: NotesViewProps) => {
  const [notas, setNotas] = useState<NotaEntrada[]>([]);
  const [selectedNota, setSelectedNota] = useState<NotaEntrada | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotas();
  }, []);

  const fetchNotas = async () => {
    try {
      const { data, error } = await supabase
        .from('entradas')
        .select('id, fecha, texto_ocr, fuente, created_at')
        .not('texto_ocr', 'is', null)
        .neq('texto_ocr', '')
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotas(data || []);
    } catch (error) {
      console.error('Error fetching notas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las notas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Texto copiado",
        description: "El contenido se ha copiado al portapapeles.",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "No se pudo copiar el texto.",
        variant: "destructive",
      });
    }
  };

  const truncateText = (text: string, maxLength: number = 120) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const groupNotasByDate = (notas: NotaEntrada[]) => {
    const groups: { [key: string]: NotaEntrada[] } = {};
    
    notas.forEach(nota => {
      const dateKey = nota.fecha;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(nota);
    });

    return Object.entries(groups).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
  };

  if (selectedNota) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedNota(null)}
            className="p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Detalle de Nota</h1>
            <p className="text-muted-foreground">
              {format(new Date(selectedNota.fecha), 'dd \'de\' MMMM, yyyy', { locale: es })}
            </p>
          </div>
        </div>

        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-muted-foreground" />
              <span className="font-semibold text-foreground">
                {format(new Date(selectedNota.fecha), 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: es })}
              </span>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <FileText size={12} />
                {selectedNota.fuente}
              </Badge>
              <Button
                size="sm"
                onClick={() => copyToClipboard(selectedNota.texto_ocr)}
                className="flex items-center gap-2"
              >
                <Copy size={16} />
                Copiar
              </Button>
            </div>
          </div>

          <div className="bg-background/50 p-4 rounded-lg">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {selectedNota.texto_ocr}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 bg-gradient-card shadow-card animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-muted rounded w-full mb-2"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </Card>
        ))}
      </div>
    );
  }

  const groupedNotas = groupNotasByDate(notas);

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
          <h1 className="text-2xl font-bold text-foreground">Notas Digitalizadas</h1>
          <p className="text-muted-foreground">Textos extraídos por OCR</p>
        </div>
      </div>

      <div className="space-y-6">
        {groupedNotas.length === 0 ? (
          <Card className="p-8 bg-gradient-card shadow-card text-center">
            <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No hay notas aún
            </h3>
            <p className="text-muted-foreground mb-4">
              Escanea documentos para extraer el texto automáticamente
            </p>
            <Button onClick={() => onViewChange('scan')}>
              Escanear Documento
            </Button>
          </Card>
        ) : (
          groupedNotas.map(([fecha, notasDelDia]) => (
            <div key={fecha} className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <Calendar size={16} className="text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  {format(new Date(fecha), 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: es })}
                </h2>
                <Badge variant="secondary">{notasDelDia.length}</Badge>
              </div>
              
              <div className="space-y-2">
                {notasDelDia.map((nota) => (
                  <Card 
                    key={nota.id}
                    className="p-4 bg-gradient-card shadow-card hover:shadow-emotion transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedNota(nota)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {format(new Date(nota.created_at), 'HH:mm')}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {nota.fuente}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-foreground leading-relaxed">
                      {truncateText(nota.texto_ocr)}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};