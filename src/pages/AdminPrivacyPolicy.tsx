import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminPrivacyPolicy = () => (
  <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-2xl sm:text-3xl">Politică de Confidențialitate (Panou Admin)</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm sm:prose-base max-w-none text-foreground">
        <p>MAXIM FRANCESCO PERSOANĂ FIZICĂ AUTORIZATĂ se angajează să protejeze datele dvs. personale. Această politică se aplică datelor colectate pentru crearea și gestionarea contului dvs. de administrator.</p>
        <h2>Ce date colectăm?</h2>
        <p>La înregistrare și autentificare, colectăm numele afacerii, adresa de email și parola (stocată în format criptat).</p>
        <h2>În ce scop?</h2>
        <p>Folosim aceste date exclusiv pentru a securiza accesul la panoul de administrare și pentru a vă oferi serviciile platformei.</p>
        <h2>Drepturile dvs.</h2>
        <p>Conform GDPR, aveți dreptul de acces, rectificare, ștergere a datelor ("dreptul de a fi uitat"), restricționarea prelucrării și portabilitatea datelor. Pentru a exercita aceste drepturi, ne puteți contacta la maaximfrancesco@gmail.com.</p>
      </CardContent>
    </Card>
  </div>
);

export default AdminPrivacyPolicy;
