import { Calendar, Home, Brain, Map, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Navigation = ({ currentView, onViewChange }: NavigationProps) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Inicio' },
    { id: 'calendar', icon: Calendar, label: 'Calendario' },
    { id: 'insights', icon: Brain, label: 'Insights' },
    { id: 'map', icon: Map, label: 'Mapa' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50">
      <div className="max-w-lg mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentView === item.id ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                currentView === item.id 
                  ? "bg-primary/10 text-primary shadow-soft" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon size={20} />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          ))}
          <Button
            onClick={() => onViewChange('scan')}
            className="flex flex-col items-center gap-1 h-auto py-2 px-3 bg-primary text-primary-foreground shadow-emotion rounded-full"
            size="sm"
          >
            <Plus size={20} />
            <span className="text-xs font-medium">Escanear</span>
          </Button>
        </div>
      </div>
    </div>
  );
};