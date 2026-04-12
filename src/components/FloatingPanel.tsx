import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingPanelProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function FloatingPanel({ title, isOpen, onClose, children }: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const sidebar = document.getElementById('icon-sidebar');
        if (sidebar && sidebar.contains(e.target as Node)) return;
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div
      ref={panelRef}
      className={`fixed top-0 bottom-0 left-16 w-72 bg-background/95 backdrop-blur-xl border-r border-border/50 shadow-2xl z-30 transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none invisible'
      }`}
    >
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-48px)] p-3 space-y-4">
        {children}
      </div>
    </div>
  );
}
