import { memo, useCallback, useRef, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import * as Select from '@radix-ui/react-select';
import { Button } from '@/components/ui/button';
import {
  ColorPicker,
  ColorPickerSelection,
  ColorPickerHue,
} from '@/components/ui/color-picker';
import {
  MousePointer2,
  Pencil,
  Eraser,
  PaintBucket,
  Circle,
  Square,
  Minus,
  Undo2,
  Redo2,
  Move,
  ChevronDown,
  Check,
} from 'lucide-react';
import Color from 'color';
import type { ColliderConfig } from '@/types';

export type DrawingTool = 'select' | 'brush' | 'eraser' | 'fill' | 'circle' | 'rectangle' | 'line' | 'collider';

interface ToolButtonProps {
  tool: DrawingTool;
  icon: React.ReactNode;
  label: string;
  activeTool: DrawingTool;
  onClick: (tool: DrawingTool) => void;
  className?: string;
}

const ToolButton = memo(({ tool, icon, label, activeTool, onClick, className }: ToolButtonProps) => (
  <Button
    variant={activeTool === tool ? 'default' : 'ghost'}
    size="icon"
    className={`size-8 ${className || ''}`}
    onClick={() => onClick(tool)}
    title={label}
  >
    {icon}
  </Button>
));

ToolButton.displayName = 'ToolButton';

interface CostumeToolbarProps {
  activeTool: DrawingTool;
  brushColor: string;
  brushSize: number;
  canUndo: boolean;
  canRedo: boolean;
  colliderType: ColliderConfig['type'];
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onColliderTypeChange: (type: ColliderConfig['type']) => void;
}

const tools: { tool: DrawingTool; icon: React.ReactNode; label: string }[] = [
  { tool: 'select', icon: <MousePointer2 className="size-4" />, label: 'Select' },
  { tool: 'brush', icon: <Pencil className="size-4" />, label: 'Brush' },
  { tool: 'eraser', icon: <Eraser className="size-4" />, label: 'Eraser' },
  { tool: 'fill', icon: <PaintBucket className="size-4" />, label: 'Fill' },
  { tool: 'circle', icon: <Circle className="size-4" />, label: 'Circle' },
  { tool: 'rectangle', icon: <Square className="size-4" />, label: 'Rectangle' },
  { tool: 'line', icon: <Minus className="size-4" />, label: 'Line' },
];

const colliderTypes: { value: ColliderConfig['type']; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'box', label: 'Box' },
  { value: 'circle', label: 'Circle' },
  { value: 'capsule', label: 'Capsule' },
];

export const CostumeToolbar = memo(({
  activeTool,
  brushColor,
  brushSize,
  canUndo,
  canRedo,
  colliderType,
  onToolChange,
  onColorChange,
  onBrushSizeChange,
  onUndo,
  onRedo,
  onColliderTypeChange,
}: CostumeToolbarProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const handleColorChange = useCallback((value: Parameters<typeof Color.rgb>[0]) => {
    try {
      const color = Color(value);
      const hex = color.hex();
      onColorChange(hex);
    } catch {
      // Invalid color value
    }
  }, [onColorChange]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b bg-background">
      {/* Tools */}
      <div className="flex items-center gap-0.5 border-r pr-2">
        {tools.map(({ tool, icon, label }) => (
          <ToolButton
            key={tool}
            tool={tool}
            icon={icon}
            label={label}
            activeTool={activeTool}
            onClick={onToolChange}
          />
        ))}
      </div>

      {/* Color Picker */}
      <div className="relative flex items-center gap-2 border-r pr-2" ref={colorPickerRef}>
        <button
          type="button"
          className="size-7 rounded border cursor-pointer"
          style={{ backgroundColor: brushColor }}
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Color"
        />
        {showColorPicker && (
          <>
            {/* Backdrop to close picker */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowColorPicker(false)}
            />
            <div className="absolute left-0 top-full mt-1 z-50 bg-popover border rounded-lg p-3 shadow-lg">
              <ColorPicker
                value={brushColor}
                onChange={handleColorChange}
                className="w-48"
              >
                <ColorPickerSelection className="h-32 rounded mb-2" />
                <ColorPickerHue />
              </ColorPicker>
            </div>
          </>
        )}
      </div>

      {/* Brush Size */}
      <div className="flex items-center gap-2 border-r pr-2 min-w-[120px]">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Size:</span>
        <Slider.Root
          className="relative flex h-4 w-full touch-none items-center"
          value={[brushSize]}
          onValueChange={([value]) => onBrushSizeChange(value)}
          min={1}
          max={50}
          step={1}
        >
          <Slider.Track className="relative h-1.5 w-full grow rounded-full bg-secondary">
            <Slider.Range className="absolute h-full rounded-full bg-primary" />
          </Slider.Track>
          <Slider.Thumb className="block size-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        </Slider.Root>
        <span className="text-xs text-muted-foreground w-6 text-right">{brushSize}</span>
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5 border-r pr-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
        >
          <Redo2 className="size-4" />
        </Button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Collider Controls - Right side */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Collider:</span>
        <Select.Root value={colliderType} onValueChange={(value) => onColliderTypeChange(value as ColliderConfig['type'])}>
          <Select.Trigger className="inline-flex items-center justify-between gap-1 h-8 px-2 text-xs bg-background border rounded hover:bg-accent min-w-[90px]">
            <Select.Value />
            <Select.Icon>
              <ChevronDown className="size-3" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="bg-popover border rounded-md shadow-md z-50">
              <Select.Viewport className="p-1">
                {colliderTypes.map(({ value, label }) => (
                  <Select.Item
                    key={value}
                    value={value}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer outline-none hover:bg-accent data-[highlighted]:bg-accent"
                  >
                    <Select.ItemIndicator>
                      <Check className="size-3" />
                    </Select.ItemIndicator>
                    <Select.ItemText>{label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        {/* Collider Edit Tool */}
        {colliderType !== 'none' && (
          <Button
            variant={activeTool === 'collider' ? 'default' : 'outline'}
            size="sm"
            className="h-8 px-2 gap-1"
            onClick={() => onToolChange('collider')}
            title="Edit Collider"
            style={activeTool === 'collider' ? { backgroundColor: '#22c55e', borderColor: '#22c55e' } : { borderColor: '#22c55e', color: '#22c55e' }}
          >
            <Move className="size-3" />
            <span className="text-xs">Edit</span>
          </Button>
        )}
      </div>
    </div>
  );
});

CostumeToolbar.displayName = 'CostumeToolbar';
