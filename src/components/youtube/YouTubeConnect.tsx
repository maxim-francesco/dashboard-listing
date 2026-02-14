
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Youtube, Link, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/services/api';

const YouTubeConnect = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('youtube') === 'success') {
      toast.success('Canalul YouTube a fost conectat cu succes!');
      setIsConnected(true);
      // Clean up the URL
      searchParams.delete('youtube');
      setSearchParams(searchParams, { replace: true });
    }
    // In a real app, you'd also fetch the current connection status from your backend.
  }, [searchParams, setSearchParams]);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/youtube/auth-url');
      const { authUrl } = response.data;
      if (authUrl) {
        // Redirect the user to the YouTube authorization screen
        window.location.href = authUrl;
      } else {
        toast.error('Nu s-a putut obține URL-ul de autentificare.');
        setIsLoading(false);
      }
    } catch (error) {
      toast.error('A apărut o eroare la conectarea cu YouTube.');
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="w-6 h-6 text-red-600" />
          <span>Conectare YouTube</span>
        </CardTitle>
        <CardDescription>
          Conectează-ți canalul pentru a încărca videoclipuri direct la anunțuri.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="flex items-center gap-3 p-4 bg-success-light border border-success/20 rounded-lg">
            <CheckCircle className="w-6 h-6 text-success" />
            <div>
              <p className="font-semibold text-success">Canalul YouTube este conectat.</p>
              <p className="text-sm text-success/80">Acum poți adăuga videoclipuri la anunțuri.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-secondary/50 border border-border rounded-lg">
            <p className="text-sm text-muted-foreground mb-4 sm:mb-0">
              Permite platformei să acceseze contul tău YouTube.
            </p>
            <Button onClick={handleConnect} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Se încarcă...' : 'Conectează-te cu YouTube'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default YouTubeConnect;
