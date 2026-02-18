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
            <section>
              <h3 className="text-xl font-semibold">1. Identitatea Operatorului</h3>
              <p>
                Platforma este operată de <strong>MAXIM FRANCESCO PERSOANĂ FIZICĂ AUTORIZATĂ</strong>, cu sediul în România, CUI 52564061, Reg. Com. F2025036030001 (denumit în continuare „Operatorul”). Protejarea datelor dumneavoastră cu caracter personal este un angajament fundamental pentru noi.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold">2. Categorii de Date Prelucrate</h3>
              <p>Colectăm și prelucrăm următoarele tipuri de date cu caracter personal:</p>
              <ul>
                <li><strong>Date de Identificare Cont:</strong> Adresa de email, parola (stocată sub formă de hash criptografic), numele afacerii/entității juridice.</li>
                <li><strong>Date Media:</strong> Fișiere de tip imagine și video încărcate de utilizator pentru popularea anunțurilor auto.</li>
                <li><strong>Date Tehnice și de Trafic:</strong> Adresa IP, tipul browserului, identificatori de dispozitiv, date colectate prin modulele cookie esențiale pentru menținerea sesiunii.</li>
                <li><strong>Date de Contact Clienți:</strong> Nume, telefon și email furnizate voluntar de vizitatori prin formularele de contact ale anunțurilor.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold">3. Scopul și Temeiul Juridic al Prelucrării</h3>
              <p>Prelucrăm datele dumneavoastră în următoarele scopuri:</p>
              <ul>
                <li><strong>Furnizarea Serviciului (Art. 6 alin. 1 lit. b GDPR):</strong> Pentru crearea contului, autentificarea securizată și gestionarea inventarului de anunțuri auto.</li>
                <li><strong>Securitate (Art. 6 alin. 1 lit. f GDPR):</strong> Protejarea platformei împotriva fraudelor și atacurilor cibernetice prin utilizarea token-urilor de tip JWT (JSON Web Token).</li>
                <li><strong>Comunicare:</strong> Facilitarea legăturii între administratorul platformei și potențialii săi cumpărători prin intermediul mesajelor primite.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold">4. Destinatari și Transferul Datelor</h3>
              <p>Datele dumneavoastră nu sunt vândute către terți. Acestea pot fi accesate de furnizori de servicii strict necesari funcționării platformei:</p>
              <ul>
                <li><strong>Cloudinary:</strong> Pentru stocarea și procesarea securizată a fișierelor media (imagini și video).</li>
                <li><strong>Furnizori de Hosting:</strong> Pentru găzduirea bazei de date și a codului sursă al platformei.</li>
                <li><strong>Autorități Publice:</strong> Doar în cazul unei obligații legale exprese.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold">5. Securitatea Datelor</h3>
              <p>
                Implementăm măsuri tehnice și organizatorice avansate pentru a asigura integritatea datelor:
              </p>
              <ul>
                <li>Criptarea comunicațiilor prin protocol SSL/TLS (HTTPS).</li>
                <li>Utilizarea token-urilor JWT pentru protecția și autorizarea fiecărei sesiuni de lucru a administratorului.</li>
                <li>Hashing ireversibil al parolelor, astfel încât nicio persoană din cadrul echipei tehnice să nu poată vizualiza parolele în format text.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold">6. Drepturile Dumneavoastră</h3>
              <p>Conform GDPR, beneficiați de următoarele drepturi:</p>
              <ul>
                <li><strong>Dreptul de Acces:</strong> Puteți solicita o confirmare a datelor prelucrate de noi.</li>
                <li><strong>Dreptul la Rectificare:</strong> Puteți solicita corectarea datelor inexacte sau incomplete.</li>
                <li><strong>Dreptul la Ștergere („Dreptul de a fi uitat”):</strong> Puteți solicita ștergerea datelor dacă acestea nu mai sunt necesare scopurilor inițiale.</li>
                <li><strong>Dreptul la Restricționarea Prelucrării:</strong> În anumite condiții, puteți solicita suspendarea prelucrării datelor.</li>
                <li><strong>Dreptul la Portabilitate:</strong> Puteți solicita transmiterea datelor într-un format structurat.</li>
              </ul>
              <p>Pentru exercitarea acestor drepturi, ne puteți contacta la adresa de email: <strong>maaximfrancesco@gmail.com</strong>.</p>
            </section>

            <section>
              <h3 className="text-xl font-semibold">7. Perioada de Retenție</h3>
              <p>
                Păstrăm datele cu caracter personal pe durata activității contului dumneavoastră de administrator. La solicitarea de închidere a contului, datele vor fi șterse sau anonimizate în termen de maxim 30 de zile, cu excepția datelor necesare pentru conformarea cu obligațiile legale fiscale sau juridice.
              </p>
            </section>

            <div className="mt-10 p-4 bg-muted rounded-lg text-sm italic">
              <p>Prezenta politică poate fi actualizată periodic. Vă recomandăm consultarea acestei pagini la fiecare utilizare majoră a serviciului.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
