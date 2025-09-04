import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const emotionData = [
  { name: 'Alegría', count: 8, percentage: 32, color: '#F7D154', emoji: '🙂' },
  { name: 'Calma', count: 6, percentage: 24, color: '#6BAAED', emoji: '😌' },
  { name: 'Amor', count: 4, percentage: 16, color: '#F6A6C1', emoji: '🥰' },
  { name: 'Inspiración', count: 3, percentage: 12, color: '#FFB36B', emoji: '💡' },
  { name: 'Tristeza', count: 2, percentage: 8, color: '#9A85C8', emoji: '😔' },
  { name: 'Ansiedad', count: 2, percentage: 8, color: '#2E2E2E', emoji: '😟' },
];

const behaviorData = [
  { name: 'Autocuidado', count: 12, icon: '🧘‍♀️' },
  { name: 'Social', count: 8, icon: '👥' },
  { name: 'Trabajo', count: 6, icon: '💼' },
  { name: 'Naturaleza', count: 4, icon: '🌿' },
];

const insights = [
  "Tus momentos de mayor bienestar coinciden con actividades al aire libre.",
  "Los lunes muestran una tendencia hacia emociones de menor valencia.",
  "Hay una correlación positiva entre ejercicio y estados de calma.",
  "Tu patrón emocional mejora consistentemente durante los fines de semana.",
];

export const InsightsView = () => {
  return (
    <div className="space-y-6">
      {/* Emotion Wheel */}
      <Card className="p-6 bg-gradient-card shadow-card">
        <h2 className="text-xl font-bold mb-4 text-foreground">Rueda Emocional</h2>
        <div className="space-y-4">
          {emotionData.map((emotion, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{emotion.emoji}</span>
                  <span className="font-medium text-foreground">{emotion.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{emotion.percentage}%</span>
              </div>
              <Progress 
                value={emotion.percentage} 
                className="h-2"
                style={{
                  // @ts-ignore
                  '--progress-background': emotion.color + '40',
                  '--progress-foreground': emotion.color,
                }}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Valencia Trend */}
      <Card className="p-6 bg-gradient-wellbeing shadow-card">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Tendencia de Bienestar</h3>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">75%</div>
          <p className="text-muted-foreground">Promedio de valencia positiva</p>
          <div className="mt-4 flex justify-center">
            <div className="text-6xl">📈</div>
          </div>
        </div>
      </Card>

      {/* Behavior Tags */}
      <Card className="p-6 bg-gradient-card shadow-card">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Comportamientos Frecuentes</h3>
        <div className="grid grid-cols-2 gap-3">
          {behaviorData.map((behavior, index) => (
            <div key={index} className="bg-background/50 rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">{behavior.icon}</div>
              <div className="font-medium text-foreground">{behavior.name}</div>
              <div className="text-sm text-muted-foreground">{behavior.count} veces</div>
            </div>
          ))}
        </div>
      </Card>

      {/* AI Insights */}
      <Card className="p-6 bg-gradient-neutral shadow-card">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Insights Personales</h3>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-primary font-bold">{index + 1}</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};