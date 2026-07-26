import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, Building2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/services/api";
import Footer from "@/components/Footer";
import DevQuickLogin from "@/components/dev/DevQuickLogin";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const DEMO_USER_AUTO = {
    email: 'demo.auto@email.com',
    password: 'parolaAuto123'
  };

  const DEMO_USER_IMOBILIARE = {
    email: 'demo.imobiliare@email.com',
    password: 'parolaImob123'
  };

  const handleDemoLogin = (demoUser: {email: string, password: string}) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); 
    try {
      const response = await api.post(
        "/auth/login",
        {
          email,
          password,
        }
      );
      if (response.data && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userEmail', email);
        navigate('/');
      }
    } catch (err: any) {
      setError('Email sau parolă incorectă. Te rugăm să încerci din nou.');
    }
  };

  const handleQuickLogin = async (emailStr: string, passwordStr: string) => {
    try {
      setError(""); 
      const response = await api.post(
        "/auth/login",
        {
          email: emailStr,
          password: passwordStr,
        }
      );
      if (response.data && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userEmail', emailStr);
        navigate('/');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Email sau parolă incorectă.';
      throw new Error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-admin-bg flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-card-border shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-semibold text-foreground">
              Autentificare Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              {error && (
                  <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                          {error}
                      </AlertDescription>
                  </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Adresă de email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background border-border focus:border-primary focus:ring-primary"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Parolă
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Introdu parola"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-background border-border focus:border-primary focus:ring-primary"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
              >
                Intră în cont
              </Button>
              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleDemoLogin(DEMO_USER_AUTO)}
                >
                  Intră ca Demo Auto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleDemoLogin(DEMO_USER_IMOBILIARE)}
                >
                  Intră ca Demo Imobiliare
                </Button>
              </div>
              <DevQuickLogin onQuickLogin={handleQuickLogin} />
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Login;