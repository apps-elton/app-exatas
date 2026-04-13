import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const CONSENT_KEY = 'geoteach-cookie-consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          Utilizamos cookies e tecnologias semelhantes para melhorar sua experiencia.
          Ao continuar navegando, voce concorda com nossa{' '}
          <a href="/privacy" className="underline text-primary hover:text-primary/80">
            Politica de Privacidade
          </a>.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={decline}>
            Recusar
          </Button>
          <Button size="sm" onClick={accept}>
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  );
}
