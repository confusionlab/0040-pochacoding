import { useRef, useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, X, Upload, Loader2 } from 'lucide-react';
import { processImage } from '@/utils/imageProcessor';
import { calculateVisibleBounds } from '@/utils/imageBounds';
import type { Costume } from '@/types';
import { cn } from '@/lib/utils';

interface CostumeListProps {
  costumes: Costume[];
  selectedIndex: number;
  onSelectCostume: (index: number) => void;
  onAddCostume: (costume: Costume) => void;
  onDeleteCostume: (index: number) => void;
  onRenameCostume: (index: number, name: string) => void;
}

export const CostumeList = memo(({
  costumes,
  selectedIndex,
  onSelectCostume,
  onAddCostume,
  onDeleteCostume,
  onRenameCostume,
}: CostumeListProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddBlank = () => {
    // Create a blank 1024x1024 transparent canvas as initial costume
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    // Canvas is transparent by default, no need to fill

    const newCostume: Costume = {
      id: crypto.randomUUID(),
      name: `costume${costumes.length + 1}`,
      assetId: canvas.toDataURL('image/png'),
    };
    onAddCostume(newCostume);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;

        try {
          const processedDataUrl = await processImage(file);
          // Calculate bounds for the uploaded image
          const bounds = await calculateVisibleBounds(processedDataUrl);
          const newCostume: Costume = {
            id: crypto.randomUUID(),
            name: file.name.replace(/\.[^/.]+$/, ''),
            assetId: processedDataUrl,
            bounds: bounds || undefined,
          };
          onAddCostume(newCostume);
        } catch (error) {
          console.error('Failed to process image:', file.name, error);
        }
      }
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full w-48 border-r bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 border-b">
        <span className="text-xs font-medium">Costumes</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={handleAddBlank}
            title="New blank costume"
            disabled={isProcessing}
          >
            <Plus className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={handleUploadClick}
            title="Upload image"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Upload className="size-3" />
            )}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Costume List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {costumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center px-2">
            <p className="text-xs">No costumes</p>
            <p className="text-xs mt-1">Click + to add</p>
          </div>
        ) : (
          costumes.map((costume, index) => (
            <Card
              key={costume.id}
              onClick={() => onSelectCostume(index)}
              className={cn(
                'relative group cursor-pointer p-1.5 transition-colors',
                index === selectedIndex
                  ? 'ring-2 ring-primary bg-primary/5'
                  : 'hover:bg-accent'
              )}
            >
              {/* Thumbnail with checkerboard for transparency */}
              <div
                className="aspect-square rounded mb-1.5 overflow-hidden border"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #d0d0d0 25%, transparent 25%),
                    linear-gradient(-45deg, #d0d0d0 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #d0d0d0 75%),
                    linear-gradient(-45deg, transparent 75%, #d0d0d0 75%)
                  `,
                  backgroundSize: '10px 10px',
                  backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                  backgroundColor: '#f0f0f0',
                }}
              >
                <img
                  src={costume.assetId}
                  alt={costume.name}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              {/* Costume name */}
              <Input
                value={costume.name}
                onChange={(e) => onRenameCostume(index, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-5 px-1 text-[10px] text-center bg-transparent border-none focus:bg-background"
              />

              {/* Delete button */}
              {costumes.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCostume(index);
                  }}
                  className="absolute top-0 right-0 w-4 h-4 bg-destructive text-destructive-foreground rounded-bl rounded-tr opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  title="Delete costume"
                >
                  <X className="size-2.5" />
                </button>
              )}

              {/* Index badge */}
              <div className="absolute top-0 left-0 w-4 h-4 bg-foreground text-background rounded-tl rounded-br flex items-center justify-center text-[9px] font-medium">
                {index + 1}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
});

CostumeList.displayName = 'CostumeList';
