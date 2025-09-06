import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AuthView = ({ onBack, onSuccess }: AuthViewProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "¡Bienvenido de nuevo!",
        description: "Has iniciado sesión correctamente.",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Error de inicio de sesión",
        description: error.message || "No se pudo iniciar sesión. Verifica tus credenciales.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name || email.split('@')[0],
          }
        }
      });

      if (error) throw error;

      toast({
        title: "¡Cuenta creada!",
        description: "Tu cuenta se ha creado correctamente. Puedes empezar a usar el diario.",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Error de registro",
        description: error.message || "No se pudo crear la cuenta. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="p-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex items-center gap-2">
          <BookOpen className="text-primary" size={24} />
          <h1 className="text-2xl font-bold text-foreground">Diario Inteligente</h1>
        </div>
      </div>

      <Card className="p-8 bg-gradient-card shadow-card max-w-md mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Accede a tu diario personal
          </h2>
          <p className="text-muted-foreground">
            Digitaliza y analiza tus pensamientos de forma segura
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="signup">Registrarse</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Contraseña</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Nombre (opcional)</Label>
                <Input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Contraseña</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Tus datos están protegidos y solo tú puedes acceder a ellos
          </p>
        </div>
      </Card>
    </div>
  );
};