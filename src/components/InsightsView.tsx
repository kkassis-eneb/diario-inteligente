import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { EmotionCard } from "./EmotionCard";
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const InsightsView = () => {
  const [stats, setStats] = useState({
    totalEntradas: 0,
    entradasPorMes: [],
    palabrasFreuentes: [],
    entradasPorFuente: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total entries
      const { data: entradas, error: entradasError } = await supabase
        .from('entradas')
        .select('*');

      if (entradasError) throw entradasError;

      // Process data
      const totalEntradas = entradas?.length || 0;
      
      // Group by month
      const entriesByMonth = entradas?.reduce((acc: any, entry: any) => {
        const month = new Date(entry.fecha).toLocaleDateString('es-ES', { month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {}) || {};

      const entradasPorMes = Object.entries(entriesByMonth).map(([month, count]) => ({
        month,
        count
      }));

      // Group by source
      const entriesBySource = entradas?.reduce((acc: any, entry: any) => {
        acc[entry.fuente] = (acc[entry.fuente] || 0) + 1;
        return acc;
      }, {}) || {};

      const entradasPorFuente = Object.entries(entriesBySource).map(([fuente, count]) => ({
        name: fuente,
        value: count,
        color: fuente === 'foto' ? 'hsl(var(--primary))' : 'hsl(var(--accent))'
      }));

      // Extract frequent words from OCR text
      const allText = entradas?.map(e => e.texto_ocr).filter(Boolean).join(' ') || '';
      const words = allText.toLowerCase()
        .replace(/[^\w\sáéíóúñü]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !['para', 'esta', 'esto', 'pero', 'solo', 'todo', 'muy', 'más', 'también', 'donde', 'como', 'cuando', 'porque'].includes(word));

      const wordFreq = words.reduce((acc: any, word: string) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});

      const palabrasFreuentes = Object.entries(wordFreq)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));

      setStats({
        totalEntradas,
        entradasPorMes,
        palabrasFreuentes,
        entradasPorFuente
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock emotion data for now
  const emotionData = [
    { emotion: "Alegría", value: 35, color: "hsl(var(--emotion-joy))", emoji: "😊" },
    { emotion: "Calma", value: 28, color: "hsl(var(--emotion-calm))", emoji: "😌" },
    { emotion: "Inspiración", value: 20, color: "hsl(var(--emotion-inspiration))", emoji: "✨" },
    { emotion: "Nostalgia", value: 17, color: "hsl(var(--emotion-sadness))", emoji: "🌙" },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 bg-gradient-card shadow-card animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Insights Emocionales
        </h1>
        <p className="text-muted-foreground">
          Patrones y tendencias en tu diario
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-gradient-joy text-center">
          <div className="text-2xl font-bold text-foreground">{stats.totalEntradas}</div>
          <div className="text-sm text-muted-foreground">Entradas Totales</div>
        </Card>
        <Card className="p-4 bg-gradient-calm text-center">
          <div className="text-2xl font-bold text-foreground">
            {stats.entradasPorMes.length}
          </div>
          <div className="text-sm text-muted-foreground">Meses Activos</div>
        </Card>
      </div>

      {/* Emotion Distribution */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Distribución Emocional</h2>
        <div className="grid grid-cols-2 gap-4">
          {emotionData.map((emotion, index) => (
            <EmotionCard
              key={index}
              emotion={{
                name: emotion.emotion,
                emoji: emotion.emoji,
                color: emotion.color,
                valencia: 'bienestar' as const
              }}
              count={emotion.value}
              percentage={Math.round((emotion.value / emotionData.reduce((sum, e) => sum + e.value, 0)) * 100)}
            />
          ))}
        </div>
      </div>

      {/* Entries by Month */}
      {stats.entradasPorMes.length > 0 && (
        <Card className="p-6 bg-gradient-card shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Entradas por Mes</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.entradasPorMes}>
                <XAxis dataKey="month" />
                <YAxis />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Sources Distribution */}
      {stats.entradasPorFuente.length > 0 && (
        <Card className="p-6 bg-gradient-card shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Entradas por Fuente</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.entradasPorFuente}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stats.entradasPorFuente.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Frequent Words */}
      {stats.palabrasFreuentes.length > 0 && (
        <Card className="p-6 bg-gradient-card shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Palabras Más Frecuentes</h3>
          <div className="grid grid-cols-2 gap-2">
            {stats.palabrasFreuentes.slice(0, 8).map((item: any, index: number) => (
              <div 
                key={index} 
                className="flex justify-between items-center p-2 bg-background/50 rounded text-sm"
              >
                <span className="text-foreground capitalize">{item.word}</span>
                <span className="text-muted-foreground">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};