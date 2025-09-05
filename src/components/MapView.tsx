import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Plus, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MapViewProps {
  onViewChange?: (view: string) => void;
}

export const MapView = ({ onViewChange }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [entradas, setEntradas] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [newLocation, setNewLocation] = useState({ ciudad: '', pais: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadMap();
    fetchEntradas();
  }, []);

  const loadMap = async () => {
    try {
      // Dynamically import Leaflet to avoid SSR issues
      const L = (await import('leaflet')).default;
      
      // Import Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (mapRef.current && !mapLoaded) {
        // Create map centered on Spain
        const map = L.map(mapRef.current, {
          center: [40.4168, -3.7038],
          zoom: 5,
          zoomControl: true,
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        setMapLoaded(true);
      }
    } catch (error) {
      console.error('Error loading map:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el mapa",
        variant: "destructive",
      });
    }
  };

  const fetchEntradas = async () => {
    try {
      const { data, error } = await supabase
        .from('entradas')
        .select('*')
        .not('ciudad', 'is', null)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setEntradas(data || []);
    } catch (error) {
      console.error('Error fetching entradas:', error);
    }
  };

  const saveLocation = async () => {
    if (!selectedEntry || !newLocation.ciudad || !newLocation.pais) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('entradas')
        .update({
          ciudad: newLocation.ciudad,
          pais: newLocation.pais,
          origen_ubicacion: 'manual'
        })
        .eq('id', selectedEntry.id);

      if (error) throw error;

      toast({
        title: "Ubicación guardada",
        description: "La ubicación ha sido añadida correctamente",
      });

      setSelectedEntry(null);
      setNewLocation({ ciudad: '', pais: '' });
      fetchEntradas();
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la ubicación",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Mapa de Emociones
        </h1>
        <p className="text-muted-foreground">
          Visualiza tus entradas por ubicación
        </p>
      </div>

      {/* Map Container */}
      <Card className="p-6 bg-gradient-card shadow-card">
        <div 
          ref={mapRef} 
          className="w-full h-64 rounded-md border bg-muted flex items-center justify-center"
        >
          {!mapLoaded && (
            <div className="text-center text-muted-foreground">
              <MapPin className="mx-auto mb-2" size={32} />
              <p>Cargando mapa...</p>
            </div>
          )}
        </div>
      </Card>

      {/* Add Location Form */}
      <Card className="p-6 bg-gradient-card shadow-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Añadir Ubicación Manual
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Seleccionar Entrada
            </label>
            <select 
              className="w-full p-2 border border-input rounded-md bg-background"
              value={selectedEntry?.id || ''}
              onChange={(e) => {
                const entry = entradas.find(e => e.id === e.target.value);
                setSelectedEntry(entry);
              }}
            >
              <option value="">Selecciona una entrada...</option>
              {entradas.map((entrada) => (
                <option key={entrada.id} value={entrada.id}>
                  {new Date(entrada.fecha).toLocaleDateString('es-ES')} - {entrada.fuente}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Ciudad
              </label>
              <Input
                value={newLocation.ciudad}
                onChange={(e) => setNewLocation({ ...newLocation, ciudad: e.target.value })}
                placeholder="ej. Madrid"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                País
              </label>
              <Input
                value={newLocation.pais}
                onChange={(e) => setNewLocation({ ...newLocation, pais: e.target.value })}
                placeholder="ej. España"
              />
            </div>
          </div>

          <Button 
            onClick={saveLocation}
            disabled={!selectedEntry || !newLocation.ciudad || !newLocation.pais}
            className="w-full flex items-center gap-2"
          >
            <Save size={16} />
            Guardar Ubicación
          </Button>
        </div>
      </Card>

      {/* Entries with Locations */}
      <Card className="p-6 bg-gradient-card shadow-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Entradas con Ubicación ({entradas.filter(e => e.ciudad).length})
        </h3>
        
        {entradas.filter(e => e.ciudad).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="mx-auto mb-2" size={32} />
            <p>No hay entradas con ubicación aún</p>
            <p className="text-sm">Añade ubicaciones manualmente usando el formulario arriba</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entradas.filter(e => e.ciudad).map((entrada) => (
              <div key={entrada.id} className="flex justify-between items-center p-3 bg-background/50 rounded-md">
                <div>
                  <span className="font-medium text-foreground">
                    {new Date(entrada.fecha).toLocaleDateString('es-ES')}
                  </span>
                  <span className="text-muted-foreground text-sm ml-2">
                    {entrada.fuente}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin size={14} />
                  {entrada.ciudad}, {entrada.pais}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};