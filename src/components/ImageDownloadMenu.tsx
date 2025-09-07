import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';

interface ImageDownloadMenuProps {
  onExport: (format: 'png' | 'jpg', quality: 'hd' | 'medium' | 'low') => void;
  disabled?: boolean;
}

const ImageDownloadMenu: React.FC<ImageDownloadMenuProps> = ({ onExport, disabled = false }) => {
  const qualities = [
    { key: 'hd' as const, label: 'HD (1.0)', description: 'Máxima qualidade' },
    { key: 'medium' as const, label: 'Média (0.8)', description: 'Qualidade média' },
    { key: 'low' as const, label: 'Baixa (0.6)', description: 'Arquivo menor' }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Baixar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Formato PNG</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {qualities.map((quality) => (
          <DropdownMenuItem
            key={`png-${quality.key}`}
            onClick={() => onExport('png', quality.key)}
            className="flex flex-col items-start"
          >
            <span className="font-medium">PNG {quality.label}</span>
            <span className="text-xs text-muted-foreground">{quality.description}</span>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Formato JPG</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {qualities.map((quality) => (
          <DropdownMenuItem
            key={`jpg-${quality.key}`}
            onClick={() => onExport('jpg', quality.key)}
            className="flex flex-col items-start"
          >
            <span className="font-medium">JPG {quality.label}</span>
            <span className="text-xs text-muted-foreground">{quality.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ImageDownloadMenu;