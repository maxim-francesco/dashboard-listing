import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CookiePolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-admin-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Înapoi
        </Button>

        <Card className="border-card-border shadow-sm">
          <CardHeader className="border-b border-border bg-card/50">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">Politica de Cookies</CardTitle>
            <p className="text-sm text-muted-foreground">Informații despre utilizarea modulelor cookie</p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none py-8 text-foreground">
            <p>Această pagină explică modul în care platforma operată de <strong>MAXIM FRANCESCO PFA</strong> utilizează modulele cookie și tehnologii similare.</p>

            <h3>1. Ce sunt modulele cookie?</h3>
            <p>Cookies sunt fișiere text de mici dimensiuni stocate pe dispozitivul dumneavoastră (calculator, telefon, tabletă) atunci când vizitați un site web. Acestea permit site-ului să "țină minte" acțiunile sau preferințele dumneavoastră pe o perioadă de timp.</p>

            <h3>2. Ce tipuri de cookies folosim?</h3>
            <ul>
              <li><strong>Cookies esențiale:</strong> Necesar pentru funcționarea platformei (ex: menținerea sesiunii de logare a administratorului). Fără acestea, serviciul nu poate fi furnizat corect.</li>
              <li><strong>Cookies de preferință:</strong> Folosite pentru a memora setări precum acceptul bannerului de cookies.</li>
              <li><strong>Cookies de analiză (opțional):</strong> Putem folosi unelte precum Google Analytics pentru a înțelege cum este utilizată platforma, în scopul îmbunătățirii acesteia.</li>
            </ul>

            <h3>3. Cum puteți controla cookies?</h3>
            <p>Majoritatea browserelor vă permit să vizualizați, să ștergeți sau să blocați modulele cookie. Rețineți că blocarea tuturor modulelor cookie poate afecta negativ funcționalitatea platformei noastre.</p>

            <h3>4. Durata de stocare</h3>
            <p>Unele cookies sunt șterse când închideți browserul (cookies de sesiune), în timp ce altele rămân pe dispozitiv până la expirare sau ștergere manuală (cookies persistente).</p>

            <h3>5. Actualizări</h3>
            <p>Putem actualiza această politică periodic pentru a reflecta schimbările tehnologice sau legislative. Vă recomandăm să consultați această pagină regulat.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CookiePolicy;
