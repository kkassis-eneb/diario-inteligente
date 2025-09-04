import { Card } from "@/components/ui/card";

interface EmotionCardProps {
  emotion: {
    name: string;
    emoji: string;
    color: string;
    valencia: 'bienestar' | 'neutro' | 'malestar';
  };
  count?: number;
  percentage?: number;
}

export const EmotionCard = ({ emotion, count, percentage }: EmotionCardProps) => {
  const getGradientClass = () => {
    switch (emotion.valencia) {
      case 'bienestar':
        return 'bg-gradient-wellbeing';
      case 'malestar':
        return 'bg-gradient-distress';
      default:
        return 'bg-gradient-neutral';
    }
  };

  return (
    <Card className={`p-4 ${getGradientClass()} border-none shadow-card hover:shadow-emotion transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-soft"
            style={{ backgroundColor: emotion.color + '40' }}
          >
            {emotion.emoji}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{emotion.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{emotion.valencia}</p>
          </div>
        </div>
        <div className="text-right">
          {count !== undefined && (
            <p className="text-2xl font-bold text-foreground">{count}</p>
          )}
          {percentage !== undefined && (
            <p className="text-sm text-muted-foreground">{percentage}%</p>
          )}
        </div>
      </div>
    </Card>
  );
};