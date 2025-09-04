import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { HomeView } from "@/components/HomeView";
import { CalendarView } from "@/components/CalendarView";
import { InsightsView } from "@/components/InsightsView";
import { ScanView } from "@/components/ScanView";

const Index = () => {
  const [currentView, setCurrentView] = useState('home');

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView onViewChange={setCurrentView} />;
      case 'calendar':
        return <CalendarView />;
      case 'insights':
        return <InsightsView />;
      case 'scan':
        return <ScanView onViewChange={setCurrentView} />;
      case 'map':
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-foreground mb-4">Vista de Mapa</h2>
            <p className="text-muted-foreground">Próximamente: Visualización de ubicaciones con emociones</p>
          </div>
        );
      default:
        return <HomeView onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        {renderView()}
      </div>
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
};

export default Index;
