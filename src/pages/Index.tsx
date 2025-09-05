import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { HomeView } from "@/components/HomeView";
import { CalendarView } from "@/components/CalendarView";
import { InsightsView } from "@/components/InsightsView";
import { ScanView } from "@/components/ScanView";
import { FeedView } from "@/components/FeedView";
import { EntryDetail } from "@/components/EntryDetail";
import { MapView } from "@/components/MapView";

const Index = () => {
  const [currentView, setCurrentView] = useState('home');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const renderView = () => {
    if (selectedEntryId) {
      return (
        <EntryDetail 
          entryId={selectedEntryId} 
          onBack={() => setSelectedEntryId(null)} 
        />
      );
    }

    switch (currentView) {
      case 'home':
        return <HomeView onViewChange={setCurrentView} />;
      case 'feed':
        return (
          <FeedView 
            onViewChange={setCurrentView} 
            onEntrySelect={setSelectedEntryId}
          />
        );
      case 'calendar':
        return <CalendarView />;
      case 'insights':
        return <InsightsView />;
      case 'scan':
        return <ScanView onViewChange={setCurrentView} />;
      case 'map':
        return <MapView onViewChange={setCurrentView} />;
      default:
        return <HomeView onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        {renderView()}
      </div>
      {!selectedEntryId && (
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
      )}
    </div>
  );
};

export default Index;
