import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Heart, TrendingUp, Calendar } from "lucide-react";
import { EmotionCard } from "./EmotionCard";

const todayEmotion = {
  name: 'Calma',
  emoji: '😌',
  color: '#6BAAED',
  valencia: 'bienestar' as const
};

const weekSummary = {
  dominantEmotion: 'Alegría',
  emoji: '🙂',
  entries: 5,
  streak: 3
};

const recentEmotions = [
  { name: 'Alegría', emoji: '🙂', color: '#F7D154', valencia: 'bienestar' as const, count: 3 },
  { name: 'Calma', emoji: '😌', color: '#6BAAED', valencia: 'bienestar' as const, count: 2 },
  { name: 'Inspiración', emoji: '💡', color: '#FFB36B', valencia: 'bienestar' as const, count: 1 },
];

interface HomeViewProps {
  onViewChange: (view: string) => void;
}

export const HomeView = ({ onViewChange }: HomeViewProps) => {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Buenos días 🌅
        </h1>
        <p className="text-muted-foreground">
          ¿Cómo te sientes hoy?
        </p>
      </div>

      {/* Quick Scan Button */}
      <Card className="p-6 bg-gradient-main shadow-emotion border-none">
        <Button 
          onClick={() => onViewChange('scan')}
          className="w-full h-16 bg-primary text-primary-foreground shadow-soft hover:shadow-emotion transition-all duration-300 text-lg font-semibold"
        >
          <Camera className="mr-3" size={24} />
          Escanear Nueva Entrada
        </Button>
      </Card>

      {/* Today's Emotion */}
      <Card className="p-6 bg-gradient-calm shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Hoy</h2>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-soft"
            style={{ backgroundColor: todayEmotion.color + '40' }}
          >
            {todayEmotion.emoji}
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{todayEmotion.name}</h3>
            <p className="text-muted-foreground capitalize">{todayEmotion.valencia}</p>
          </div>
        </div>
      </Card>

      {/* Week Summary */}
      <Card className="p-6 bg-gradient-card shadow-card">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Resumen Semanal</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <Heart className="mx-auto mb-2 text-emotion-joy" size={24} />
            <div className="text-lg font-bold text-foreground">{weekSummary.dominantEmotion}</div>
            <div className="text-sm text-muted-foreground">Emoción dominante</div>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <TrendingUp className="mx-auto mb-2 text-primary" size={24} />
            <div className="text-lg font-bold text-foreground">{weekSummary.entries}</div>
            <div className="text-sm text-muted-foreground">Entradas esta semana</div>
          </div>
        </div>
      </Card>

      {/* Recent Emotions */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground">Emociones Recientes</h3>
        <div className="space-y-3">
          {recentEmotions.map((emotion, index) => (
            <EmotionCard key={index} emotion={emotion} count={emotion.count} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          onClick={() => onViewChange('calendar')}
          className="p-4 h-auto flex flex-col gap-2 bg-background/50 hover:bg-background/80 transition-all duration-200"
        >
          <Calendar size={24} />
          <span className="text-sm">Ver Calendario</span>
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onViewChange('insights')}
          className="p-4 h-auto flex flex-col gap-2 bg-background/50 hover:bg-background/80 transition-all duration-200"
        >
          <TrendingUp size={24} />
          <span className="text-sm">Ver Insights</span>
        </Button>
      </div>
    </div>
  );
};