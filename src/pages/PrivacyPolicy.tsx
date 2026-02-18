import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-admin-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Înapoi
        </Button>

        <Card className="border-card-border shadow-sm">
          <CardHeader className="border-b border-border bg-card/50">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">Politică de Confidențialitate</CardTitle>
            <p className="text-sm text-muted-foreground">Conform Regulamentului (UE) 2016/679 (GDPR)</p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none py-8 text-foreground">
            <p><strong>MAXIM FRANCESCO PERSOANĂ FIZICĂ AUTORIZATĂ</strong> (CUI 52564061) acționează în calitate de operator de date. Protejarea datelor dumneavoastră cu caracter personal este o prioritate pentru noi.</p>

            <h3>1. Datele colectate</h3>
            <p>Colectăm următoarele categorii de date:</p>
            <ul>
              <li><strong>Date de cont:</strong> Email, parolă (criptată), numele afacerii.</li>
              <li><strong>Date de contact (prin formulare):</strong> Nume, telefon, email furnizate de vizitatori.</li>
              <li><strong>Date tehnice:</strong> Adresa IP, tipul browserului, cookies esențiale.</li>
            </ul>

            <h3>2. Scopul prelucrării</h3>
            <p>Prelucrăm aceste date pentru:</p>
            <ul>
              <li>Furnizarea accesului la panoul de administrare.</li>
              <li>Facilitarea comunicării între administrator și potențialii clienți.</li>
              <li>Îmbunătățirea securității platformei.</li>
            </ul>

            <h3>3. Temeiul juridic</h3>
            <p>Prelucrarea se bazează pe necesitatea executării unui contract (furnizarea serviciului), pe consimțământul dumneavoastră (în cazul formularelor de contact) sau pe interesul nostru legitim (securitate).</p>

            <h3>4. Destinatarii datelor</h3>
            <p>Datele nu sunt vândute către terți. Putem transmite date către furnizori de servicii tehnice (hosting, baze de date) doar în măsura necesară funcționării platformei, sub contracte de confidențialitate stricte.</p>

            <h3>5. Drepturile dumneavoastră</h3>
            <p>Conform GDPR, beneficiați de dreptul de acces, rectificare, ștergere ("dreptul de a fi uitat"), restricționarea prelucrării, portabilitatea datelor și dreptul de a vă opune prelucrării. Pentru exercitarea acestor drepturi, ne puteți contacta la <strong>maaximfrancesco@gmail.com</strong>.</p>

            <h3>6. Securitate</h3>
            <p>Implementăm măsuri tehnice și organizatorice moderne (criptare SSL, hashing parole) pentru a preveni accesul neautorizat la datele dumneavoastră.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
