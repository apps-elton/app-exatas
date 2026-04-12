import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const qualities = [
    { key: 'hd' as const, label: 'ULTRA-HD-8K (8x)', description: 'Máxima qualidade (8x)' },
    { key: 'medium' as const, label: 'HD-4K (4x)', description: 'Alta resolução (4x)' },
    { key: 'low' as const, label: 'HD-2K (2x)', description: 'Boa resolução (2x)' }
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
{t('button.download')}
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