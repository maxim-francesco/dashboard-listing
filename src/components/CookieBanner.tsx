import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
      <div 
        className="bg-card text-card-foreground border border-border rounded-xl shadow-lg w-full max-w-sm p-6 flex flex-col gap-4"
        role="dialog"
        aria-modal="true"
      >
        <p className="text-sm leading-relaxed">
          Acest site folosește cookies esențiale pentru a asigura funcționalitatea. {' '}
          <Link to="/politica-de-confidentialitate-admin" className="underline hover:text-primary">
            Află mai multe
          </Link>.
        </p>
        <Button 
          onClick={handleAccept} 
          className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          Am înțeles
        </Button>
      </div>
    </div>
  );
};

export default CookieBanner;

