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
            <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">Termeni și Condiții de Utilizare</CardTitle>
            <p className="text-sm text-muted-foreground italic">Ultima actualizare: 24 Mai 2024</p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none py-8 text-foreground">
            <section>
              <h3 className="text-xl font-semibold">Articolul 1. Identificarea Prestatorului</h3>
              <p>
                Platforma software este operată de <strong>MAXIM FRANCESCO PERSOANĂ FIZICĂ AUTORIZATĂ</strong>, cu sediul social în România, identificată prin Codul Unic de Înregistrare <strong>52564061</strong> și înregistrată la Registrul Comerțului sub nr. <strong>F2025036030001</strong> (denumită în continuare „Prestatorul”).
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold">Articolul 2. Obiectul și Acceptarea Contractului</h3>
              <p>
                2.1. Prezentul document reprezintă contractul cadru dintre Prestator și Utilizatorul de tip „ADMIN” (persoană fizică autorizată sau reprezentant al unei persoane juridice) care utilizează serviciile de tip SaaS (Software as a Service) pentru managementul inventarului de anunțuri auto.
              </p>
              <p>
                2.2. Accesarea panoului de administrare și utilizarea oricărei funcționalități a platformei implică acceptarea deplină și necondiționată a acestor Termeni și Condiții.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold">Articolul 3. Serviciile Oferite</h3>
              <p>Platforma oferă următoarele facilități tehnice:</p>
              <ul className="list-disc pl-6">
                <li>Gestiunea centralizată a anunțurilor auto;</li>
                <li>Sistem de încărcare și procesare a materialelor media (imagini și video) prin intermediul serviciului terț Cloudinary;</li>
                <li>Sincronizarea automată sau manuală a datelor către platforme terțe de publicitate (ex: BestAuto.ro);</li>
                <li>Instrumente de analiză și raportare a vizualizărilor și interacțiunilor clienților.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold">Articolul 4. Proprietatea Intelectuală</h3>
              <p>
                4.1. Întregul conținut al platformei, incluzând dar fără a se limita la: codul sursă, arhitectura bazei de date, design-ul interfeței (UI/UX), logourile și textele descriptive, sunt proprietatea exclusivă a Prestatorului și sunt protejate de legislația privind drepturile de autor și proprietatea intelectuală.
              </p>
              <p>
                4.2. Utilizatorului i se acordă o licență de utilizare limitată, neexclusivă și netransferabilă asupra platformei, strict pe durata valabilității contului și în scopul desfășurării activității comerciale proprii.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold">Articolul 5. Utilizarea Acceptabilă și Conținutul</h3>
              <p>
                5.1. Utilizatorul este singurul responsabil pentru acuratețea datelor introduse în anunțuri. Este interzisă publicarea de conținut care:
              </p>
              <ul className="list-disc pl-6">
                <li>Încalcă drepturile de proprietate intelectuală ale unor terți;</li>
                <li>Este fals, înșelător sau induce în eroare consumatorul final;</li>
                <li>Conține materiale cu caracter obscen, ofensator sau ilegal.</li>
              </ul>
              <p>
                5.2. Prestatorul își rezervă dreptul de a suspenda accesul la cont sau de a șterge anunțurile care încalcă aceste prevederi, fără notificare prealabilă.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold">Articolul 6. Limitarea Răspunderii</h3>
              <p>
                6.1. Prestatorul depune toate eforturile pentru a asigura disponibilitatea platformei, însă nu garantează funcționarea neîntreruptă sau fără erori a acesteia. Serviciul este oferit „ca atare” (as is).
              </p>
              <p>
                6.2. Prestatorul nu poate fi tras la răspundere pentru:
              </p>
              <ul className="list-disc pl-6">
                <li>Pierderi de profit sau date rezultate din utilizarea defectuoasă a platformei;</li>
                <li>Erori de sincronizare cu platforme terțe (ex: BestAuto) cauzate de modificări ale API-urilor acestora;</li>
                <li>Probleme tehnice apărute la furnizorii de infrastructură (hosting, Cloudinary).</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold">Articolul 7. Încetarea Serviciilor</h3>
              <p>
                Utilizatorul poate solicita închiderea contului în orice moment. La încetarea contractului, accesul la panoul de administrare va fi revocat, iar datele asociate vor fi arhivate sau șterse conform politicii de confidențialitate și obligațiilor legale de retenție a datelor financiare.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold">Articolul 8. Dispoziții Finale</h3>
              <p>
                Prezentul contract este guvernat de legea română. Orice litigiu care nu poate fi rezolvat pe cale amiabilă va fi înaintat spre soluționare instanțelor judecătorești competente de la sediul Prestatorului.
              </p>
            </section>

            <div className="mt-10 p-4 bg-muted rounded-lg text-sm">
              <p className="font-bold mb-2">Contact:</p>
              <p>MAXIM FRANCESCO PFA</p>
              <p>Email: maaximfrancesco@gmail.com</p>
              <p>Tel: +40 758 990 675</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsAndConditions;
