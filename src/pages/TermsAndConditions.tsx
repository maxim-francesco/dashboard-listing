import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-admin-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Înapoi
        </Button>
        
        <Card className="border-card-border shadow-sm">
          <CardHeader className="border-b border-border bg-card/50">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">Termeni și Condiții</CardTitle>
            <p className="text-sm text-muted-foreground">Ultima actualizare: {new Date().toLocaleDateString('ro-RO')}</p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none py-8 text-foreground">
            <p>Prezentul document stabilește termenii și condițiile de utilizare a platformei operate de <strong>MAXIM FRANCESCO PERSOANĂ FIZICĂ AUTORIZATĂ</strong>, cu sediul în România, CUI <strong>52564061</strong>, Nr. Reg. Com. <strong>F2025036030001</strong>.</p>

            <h3>1. Acceptarea Termenilor</h3>
            <p>Prin accesarea și utilizarea acestei platforme, sunteți de acord să respectați acești termeni și condiții în totalitate. Dacă nu sunteți de acord cu orice parte a acestora, vă rugăm să încetați utilizarea serviciilor noastre.</p>

            <h3>2. Descrierea Serviciilor</h3>
            <p>Platforma oferă un sistem de administrare a anunțurilor (ex: vehicule, imobiliare). Serviciile includ gestiunea categoriilor, a imaginilor și a mesajelor primite de la potențiali clienți.</p>

            <h3>3. Responsabilitățile Utilizatorului</h3>
            <p>Utilizatorul este responsabil pentru acuratețea datelor introduse și pentru menținerea confidențialității datelor de acces (email și parolă). Este interzisă utilizarea platformei pentru activități ilegale sau pentru încărcarea de conținut ofensator.</p>

            <h3>4. Proprietate Intelectuală</h3>
            <p>Întregul conținut al platformei (texte, grafică, logo-uri, software) este proprietatea MAXIM FRANCESCO PFA sau a partenerilor săi și este protejat de legile dreptului de autor.</p>

            <h3>5. Limitarea Răspunderii</h3>
            <p>MAXIM FRANCESCO PFA nu poate fi trasă la răspundere pentru eventuale daune indirecte rezultate din utilizarea sau imposibilitatea utilizării platformei, sau pentru erori tehnice ce nu țin de controlul direct al operatorului.</p>

            <h3>6. Modificări</h3>
            <p>Ne rezervăm dreptul de a modifica acești termeni în orice moment. Modificările vor deveni efective imediat ce vor fi publicate pe site.</p>

            <h3>7. Contact</h3>
            <p>Pentru orice întrebări referitoare la acești termeni, ne puteți contacta la adresa de email: <strong>maaximfrancesco@gmail.com</strong>.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsAndConditions;
