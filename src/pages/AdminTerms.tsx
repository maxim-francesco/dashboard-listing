import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminTerms = () => (
  <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-2xl sm:text-3xl">Termeni și Condiții (Panou Admin)</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm sm:prose-base max-w-none text-foreground">
        <p>Utilizarea acestui panou de administrare este condiționată de acceptarea acestor termeni. Sunteți responsabil pentru securitatea credențialelor dvs. de acces și pentru conținutul pe care îl încărcați în platformă.</p>
        <p>Operatorul platformei este MAXIM FRANCESCO PERSOANĂ FIZICĂ AUTORIZATĂ, CUI 52564061.</p>
      </CardContent>
    </Card>
  </div>
);

export default AdminTerms;
