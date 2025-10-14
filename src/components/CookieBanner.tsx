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
    <div className="fixed bottom-0 left-0 right-0 bg-foreground text-background p-4 flex flex-col sm:flex-row justify-between items-center z-50 shadow-lg">
      <p className="text-sm text-center sm:text-left mb-2 sm:mb-0">
        Acest site folosește cookies esențiale pentru a asigura funcționalitatea. {' '}
        <Link to="/politica-de-confidentialitate-admin" className="underline hover:text-primary">
          Află mai multe
        </Link>.
      </p>
      <Button onClick={handleAccept} size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground">
        Am înțeles
      </Button>
    </div>
  );
};

export default CookieBanner;
