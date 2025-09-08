import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Copy, 
  Download, 
  FileText, 
  Lock, 
  Unlock, 
  Sparkles, 
  ArrowLeft,
  Tag,
  Calendar,
  Eye,
  Filter,
  Plus
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface TextEntry {
  id: string;
  fecha: string;
  texto_ocr: string | null;
  improved_text: string | null;
  improvement_status: string | null;
  tags: string[] | null;
  is_private: boolean | null;
  fuente: string;
  created_at: string;
}

interface TextosDigitalizadosViewProps {
  onViewChange: (view: string) => void;
}

const PREDEFINED_TAGS = ['Ideas', 'Notas', 'Reflexiones', 'Personal', 'Trabajo', 'Aprendizaje'];

export const TextosDigitalizadosView = ({ onViewChange }: TextosDigitalizadosViewProps) => {
  const [textos, setTextos] = useState<TextEntry[]>([]);
  const [filteredTextos, setFilteredTextos] = useState<TextEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [showPrivate, setShowPrivate] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<TextEntry | null>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTextos();
  }, []);

  useEffect(() => {
    filterTextos();
  }, [textos, searchTerm, selectedTag, showPrivate]);

  const fetchTextos = async () => {
    try {
      setLoading(true);
      // Get current user for RLS filtering
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('entradas')
        .select('*')
        .eq('user_id', user.id)
        .not('texto_ocr', 'is', null)
        .neq('texto_ocr', '')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTextos(data || []);
    } catch (error) {
      console.error('Error fetching textos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los textos digitalizados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTextos = () => {
    let filtered = textos;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.texto_ocr?.toLowerCase().includes(searchLower) ||
        entry.improved_text?.toLowerCase().includes(searchLower) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter(entry => 
        entry.tags?.includes(selectedTag)
      );
    }

    // Filter by privacy
    if (!showPrivate) {
      filtered = filtered.filter(entry => !entry.is_private);
    }

    setFilteredTextos(filtered);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado",
        description: "Texto copiado al portapapeles",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el texto",
        variant: "destructive",
      });
    }
  };

  const improveTextWithAI = async (entryId: string, text: string) => {
    setIsImproving(true);
    try {
      const { data, error } = await supabase.functions.invoke('improve-text', {
        body: { text }
      });

      if (error) throw error;

      const { improvedText } = data;

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuario no autenticado');

      const { error: updateError } = await supabase
        .from('entradas')
        .update({
          improved_text: improvedText,
          improvement_status: 'completed'
        })
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Texto mejorado",
        description: "El texto ha sido mejorado con IA",
      });

      fetchTextos();
    } catch (error) {
      console.error('Error improving text:', error);
      toast({
        title: "Error",
        description: "No se pudo mejorar el texto",
        variant: "destructive",
      });
    } finally {
      setIsImproving(false);
    }
  };

  const exportToPDF = async (entry: TextEntry) => {
    setIsExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const text = entry.improved_text || entry.texto_ocr || '';
      const title = `Entrada del ${format(parseISO(entry.fecha), 'dd/MM/yyyy', { locale: es })}`;
      
      doc.setFontSize(16);
      doc.text(title, 20, 20);
      
      doc.setFontSize(12);
      const splitText = doc.splitTextToSize(text, 170);
      doc.text(splitText, 20, 40);
      
      doc.save(`texto-${entry.fecha}.pdf`);
      
      toast({
        title: "PDF exportado",
        description: "El archivo PDF ha sido descargado",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo exportar el PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToDocx = async (entry: TextEntry) => {
    setIsExporting(true);
    try {
      const { Document, Packer, Paragraph, TextRun } = await import('docx');
      
      const text = entry.improved_text || entry.texto_ocr || '';
      const title = `Entrada del ${format(parseISO(entry.fecha), 'dd/MM/yyyy', { locale: es })}`;
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: title,
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "",
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: text,
                  size: 22,
                }),
              ],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `texto-${entry.fecha}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "DOCX exportado",
        description: "El archivo Word ha sido descargado",
      });
    } catch (error) {
      console.error('Error exporting DOCX:', error);
      toast({
        title: "Error",
        description: "No se pudo exportar el DOCX",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const togglePrivacy = async (entryId: string, currentPrivate: boolean) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('entradas')
        .update({ is_private: !currentPrivate })
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: !currentPrivate ? "Texto marcado como privado" : "Texto marcado como público",
        description: "Se ha actualizado la privacidad del texto",
      });

      fetchTextos();
    } catch (error) {
      console.error('Error updating privacy:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la privacidad",
        variant: "destructive",
      });
    }
  };

  const updateTags = async (entryId: string, newTags: string[]) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('entradas')
        .update({ tags: newTags })
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Etiquetas actualizadas",
        description: "Las etiquetas han sido guardadas",
      });

      fetchTextos();
    } catch (error) {
      console.error('Error updating tags:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar las etiquetas",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewChange('home')}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Textos Digitalizados</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (selectedEntry) {
    return (
      <TextDetailView 
        entry={selectedEntry}
        onBack={() => setSelectedEntry(null)}
        onCopy={copyToClipboard}
        onImprove={improveTextWithAI}
        onExportPDF={exportToPDF}
        onExportDocx={exportToDocx}
        onTogglePrivacy={togglePrivacy}
        onUpdateTags={updateTags}
        isImproving={isImproving}
        isExporting={isExporting}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewChange('home')}
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Textos Digitalizados</h1>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 bg-gradient-card shadow-card">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en tus textos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Etiqueta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {PREDEFINED_TAGS.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant={showPrivate ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPrivate(!showPrivate)}
              className="flex items-center gap-2"
            >
              {showPrivate ? <Eye size={16} /> : <Filter size={16} />}
              {showPrivate ? "Mostrar privados" : "Ocultar privados"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Empty State */}
      {filteredTextos.length === 0 && (
        <Card className="p-8 text-center bg-gradient-card shadow-card">
          <FileText size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            {textos.length === 0 ? "No hay textos aún" : "No se encontraron resultados"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {textos.length === 0 
              ? "Comienza escaneando tu primera página manuscrita"
              : "Prueba con otros términos de búsqueda o filtros"
            }
          </p>
          {textos.length === 0 && (
            <Button onClick={() => onViewChange('scan')}>
              Escanear Primera Página
            </Button>
          )}
        </Card>
      )}

      {/* Text Entries */}
      <div className="space-y-4">
        {filteredTextos.map((entry) => (
          <Card key={entry.id} className="p-4 bg-gradient-card shadow-card hover:shadow-emotion transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar size={14} />
                  {format(parseISO(entry.fecha), 'dd/MM/yyyy', { locale: es })}
                </div>
                {entry.is_private && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Lock size={12} />
                    Privado
                  </Badge>
                )}
                {entry.improvement_status === 'completed' && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Sparkles size={12} />
                    Mejorado
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(entry.improved_text || entry.texto_ocr || '')}
                >
                  <Copy size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <Eye size={16} />
                </Button>
              </div>
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex gap-1 mb-3 flex-wrap">
                {entry.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Tag size={10} className="mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Text Preview */}
            <p className="text-foreground text-sm leading-relaxed">
              {(entry.improved_text || entry.texto_ocr || '').substring(0, 200)}
              {(entry.improved_text || entry.texto_ocr || '').length > 200 && '...'}
            </p>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      {filteredTextos.length > 0 && (
        <Card className="p-4 bg-gradient-card shadow-card">
          <div className="text-sm text-muted-foreground text-center">
            Mostrando {filteredTextos.length} de {textos.length} textos digitalizados
          </div>
        </Card>
      )}
    </div>
  );
};

// Text Detail View Component
interface TextDetailViewProps {
  entry: TextEntry;
  onBack: () => void;
  onCopy: (text: string) => void;
  onImprove: (entryId: string, text: string) => void;
  onExportPDF: (entry: TextEntry) => void;
  onExportDocx: (entry: TextEntry) => void;
  onTogglePrivacy: (entryId: string, currentPrivate: boolean) => void;
  onUpdateTags: (entryId: string, tags: string[]) => void;
  isImproving: boolean;
  isExporting: boolean;
}

const TextDetailView = ({
  entry,
  onBack,
  onCopy,
  onImprove,
  onExportPDF,
  onExportDocx,
  onTogglePrivacy,
  onUpdateTags,
  isImproving,
  isExporting
}: TextDetailViewProps) => {
  const [currentTags, setCurrentTags] = useState<string[]>(entry.tags || []);
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    if (newTag.trim() && !currentTags.includes(newTag.trim())) {
      const updatedTags = [...currentTags, newTag.trim()];
      setCurrentTags(updatedTags);
      onUpdateTags(entry.id, updatedTags);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = currentTags.filter(tag => tag !== tagToRemove);
    setCurrentTags(updatedTags);
    onUpdateTags(entry.id, updatedTags);
  };

  const displayText = entry.improved_text || entry.texto_ocr || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {format(parseISO(entry.fecha), 'dd/MM/yyyy', { locale: es })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(parseISO(entry.created_at), 'HH:mm', { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTogglePrivacy(entry.id, entry.is_private || false)}
          >
            {entry.is_private ? <Lock size={16} /> : <Unlock size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(displayText)}
          >
            <Copy size={16} />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Download size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Exportar Texto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Button
                  onClick={() => onExportPDF(entry)}
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting ? "Exportando..." : "Exportar como PDF"}
                </Button>
                <Button
                  onClick={() => onExportDocx(entry)}
                  disabled={isExporting}
                  variant="outline"
                  className="w-full"
                >
                  {isExporting ? "Exportando..." : "Exportar como DOCX"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tags Management */}
      <Card className="p-4 bg-gradient-card shadow-card">
        <h3 className="font-semibold mb-3 text-foreground">Etiquetas</h3>
        <div className="flex gap-2 mb-3 flex-wrap">
          {currentTags.map((tag, index) => (
            <Badge
              key={index}
              variant="default"
              className="cursor-pointer"
              onClick={() => removeTag(tag)}
            >
              <Tag size={12} className="mr-1" />
              {tag} ×
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Nueva etiqueta..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            className="flex-1"
          />
          <Button onClick={addTag} size="sm">
            <Plus size={16} />
          </Button>
        </div>
        <div className="mt-2 flex gap-1 flex-wrap">
          {PREDEFINED_TAGS.filter(tag => !currentTags.includes(tag)).map(tag => (
            <Button
              key={tag}
              variant="ghost"
              size="sm"
              onClick={() => {
                const updatedTags = [...currentTags, tag];
                setCurrentTags(updatedTags);
                onUpdateTags(entry.id, updatedTags);
              }}
              className="text-xs h-6"
            >
              + {tag}
            </Button>
          ))}
        </div>
      </Card>

      {/* Text Display */}
      <Card className="p-6 bg-gradient-card shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">
            {entry.improved_text ? 'Texto Mejorado' : 'Texto Original'}
          </h3>
          {entry.texto_ocr && !entry.improved_text && (
            <Button
              onClick={() => onImprove(entry.id, entry.texto_ocr!)}
              disabled={isImproving}
              size="sm"
              className="flex items-center gap-2"
            >
              <Sparkles size={16} />
              {isImproving ? "Mejorando..." : "Mejorar con IA"}
            </Button>
          )}
        </div>
        <Textarea
          value={displayText}
          readOnly
          className="min-h-[300px] resize-none border-none bg-transparent text-foreground leading-relaxed"
        />
      </Card>

      {/* Original Text (if improved version exists) */}
      {entry.improved_text && entry.texto_ocr && (
        <Card className="p-6 bg-gradient-card shadow-card">
          <h3 className="font-semibold mb-4 text-foreground">Texto Original (OCR)</h3>
          <Textarea
            value={entry.texto_ocr}
            readOnly
            className="min-h-[200px] resize-none border-none bg-transparent text-muted-foreground leading-relaxed"
          />
        </Card>
      )}
    </div>
  );
};