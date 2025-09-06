import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { HomeView } from "@/components/HomeView";
import { CalendarView } from "@/components/CalendarView";
import { InsightsView } from "@/components/InsightsView";
import { ScanView } from "@/components/ScanView";
import { FeedView } from "@/components/FeedView";
import { NotesView } from "@/components/NotesView";
import { EntryDetail } from "@/components/EntryDetail";
import { AuthView } from "@/components/AuthView";
import { MapView } from "@/components/MapView";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Index = () => {
  const [currentView, setCurrentView] = useState('home');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const { user, loading, signOut, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showAuth) {
      return (
        <div className="min-h-screen bg-gradient-main pb-20">
          <div className="max-w-lg mx-auto px-4 py-6">
            <AuthView 
              onBack={() => setShowAuth(false)} 
              onSuccess={() => {
                setShowAuth(false);
                setCurrentView('home');
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Diario Inteligente</h1>
          <p className="text-muted-foreground mb-8">
            Digitaliza y analiza tus pensamientos de forma segura y privada
          </p>
          <Button onClick={() => setShowAuth(true)} size="lg" className="w-full">
            Comenzar
          </Button>
        </div>
      </div>
    );
  }

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
      case 'notes':
        return <NotesView onViewChange={setCurrentView} />;
      case 'calendar':
        return <CalendarView />;
      case 'insights':
        return <InsightsView />;
      case 'scan':
        return <ScanView onViewChange={setCurrentView} userId={user?.id} />;
      case 'map':
        return <MapView onViewChange={setCurrentView} />;
      default:
        return <HomeView onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="flex items-center gap-2"
          >
            <LogOut size={16} />
            Salir
          </Button>
        </div>
        {renderView()}
      </div>
      {!selectedEntryId && (
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
      )}
    </div>
  );
};

export default Index;
