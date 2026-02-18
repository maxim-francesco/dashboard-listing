import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

const CookiePolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-admin-bg flex flex-col">
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Înapoi
          </Button>

          <Card className="border-card-border shadow-sm">
            <CardHeader className="border-b border-border bg-card/50">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">Politică de Cookie-uri</CardTitle>
              <div className="flex flex-col space-y-1">
                <p className="text-sm text-muted-foreground">MAXIM FRANCESCO PERSOANĂ FIZICĂ AUTORIZATĂ</p>
                <p className="text-sm text-muted-foreground italic">Ultima actualizare: 18 februarie 2026</p>
              </div>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none py-8 text-foreground">
              <section>
                <h3 className="text-xl font-semibold">1. Ce sunt modulele cookie?</h3>
                <p>
                  Modulele cookie sunt fișiere text de mici dimensiuni, stocate pe dispozitivul dumneavoastră (calculator, telefon sau tabletă) atunci când accesați platforma noastră. Acestea sunt utilizate pentru a asigura funcționarea corectă a site-ului și pentru a îmbunătăți experiența de utilizare.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold">2. Tipuri de cookie-uri utilizate</h3>
                <p>Platforma noastră utilizează următoarele categorii de module cookie:</p>
                
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-bold text-primary mb-1">Cookie-uri Esențiale (Strict Necesare)</h4>
                    <p className="text-sm">
                      <strong>authToken:</strong> Acest cookie este vital pentru securitate. El memorează sesiunea de autentificare a administratorului, permițându-vă să rămâneți logat în panoul de control în timp ce navigați între pagini. Fără acesta, platforma nu poate funcționa.
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-bold text-primary mb-1">Cookie-uri de Preferințe</h4>
                    <p className="text-sm">
                      <strong>cookie_consent:</strong> Memorează alegerea dumneavoastră privind acceptarea politicilor noastre, astfel încât bannerul de informare să nu apară la fiecare vizită.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold">3. Cookie-uri de la Terți</h3>
                <p>
                  Prestatorul MAXIM FRANCESCO PFA nu utilizează module cookie de tracking, publicitate sau analiză furnizate de terți (precum Google Analytics sau Facebook Pixel) în cadrul acestui panou de administrare fără consimțământul dumneavoastră prealabil și explicit.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold">4. Controlul modulelor cookie</h3>
                <p>
                  Puteți controla și/sau șterge cookie-urile după cum doriți direct din setările browserului dumneavoastră. Puteți șterge toate cookie-urile care sunt deja pe calculator și puteți seta majoritatea browserelor să împiedice plasarea acestora. Totuși, dacă faceți acest lucru, este posibil să fiți nevoit să ajustați manual unele preferințe de fiecare dată când vizitați site-ul, iar unele servicii și funcționalități (precum logarea în cont) ar putea să nu funcționeze.
                </p>
              </section>

              <div className="mt-10 p-4 border-l-4 border-primary bg-primary/5 text-sm">
                <p>Pentru orice întrebări suplimentare privind politica noastră de utilizare a modulelor cookie, ne puteți contacta la: <strong>maaximfrancesco@gmail.com</strong>.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;