import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface DiaryEntry {
  date: string;
  emotion: string;
  emoji: string;
  color: string;
  intensity: number;
}

const mockEntries: DiaryEntry[] = [
  { date: '2024-01-15', emotion: 'Alegría', emoji: '🙂', color: '#F7D154', intensity: 3 },
  { date: '2024-01-16', emotion: 'Calma', emoji: '😌', color: '#6BAAED', intensity: 2 },
  { date: '2024-01-18', emotion: 'Tristeza', emoji: '😔', color: '#9A85C8', intensity: 2 },
  { date: '2024-01-20', emotion: 'Inspiración', emoji: '💡', color: '#FFB36B', intensity: 3 },
  { date: '2024-01-22', emotion: 'Amor', emoji: '🥰', color: '#F6A6C1', intensity: 3 },
];

export const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getEntryForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return mockEntries.find(entry => entry.date === dateStr);
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-card shadow-card">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigateMonth(-1)}
            className="p-2"
          >
            <ChevronLeft size={20} />
          </Button>
          <h2 className="text-xl font-bold text-foreground">
            {monthNames[month]} {year}
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigateMonth(1)}
            className="p-2"
          >
            <ChevronRight size={20} />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} className="h-12" />
          ))}
          
          {/* Days of the month */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const entry = getEntryForDate(day);
            
            return (
              <div
                key={day}
                className={`h-12 flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-105 ${
                  entry 
                    ? 'text-white shadow-soft'
                    : 'text-foreground hover:bg-muted'
                }`}
                style={entry ? {
                  backgroundColor: entry.color,
                  opacity: 0.6 + (entry.intensity * 0.2)
                } : {}}
              >
                <div className="text-center">
                  <div>{day}</div>
                  {entry && (
                    <div className="text-xs mt-0.5">{entry.emoji}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 bg-gradient-card shadow-card">
        <h3 className="font-semibold mb-3 text-foreground">Entradas recientes</h3>
        <div className="space-y-2">
          {mockEntries.slice(0, 3).map((entry, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: entry.color + '40' }}
              >
                {entry.emoji}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{entry.emotion}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};