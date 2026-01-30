import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Variable, VariableType } from '@/types';

interface AddVariableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (variable: Variable) => void;
  objectName?: string; // If provided, shows "for this object" option
}

const VARIABLE_TYPES: { value: VariableType; label: string; description: string }[] = [
  { value: 'string', label: 'Text', description: 'Letters and words' },
  { value: 'integer', label: 'Integer', description: 'Whole numbers (1, 2, 3...)' },
  { value: 'float', label: 'Decimal', description: 'Numbers with decimals (1.5, 3.14...)' },
  { value: 'boolean', label: 'Boolean', description: 'True or False' },
];

function getDefaultValue(type: VariableType): number | string | boolean {
  switch (type) {
    case 'string': return '';
    case 'integer': return 0;
    case 'float': return 0.0;
    case 'boolean': return false;
  }
}

export function AddVariableDialog({ open, onOpenChange, onAdd, objectName }: AddVariableDialogProps) {
  const [name, setName] = useState('');
  const [scope, setScope] = useState<'global' | 'local'>('global');
  const [type, setType] = useState<VariableType>('integer');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a variable name');
      return;
    }

    // Check for invalid characters (only allow letters, numbers, underscore)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedName)) {
      setError('Variable name must start with a letter or underscore, and contain only letters, numbers, and underscores');
      return;
    }

    const variable: Variable = {
      id: crypto.randomUUID(),
      name: trimmedName,
      type,
      defaultValue: getDefaultValue(type),
      scope,
    };

    onAdd(variable);

    // Reset form
    setName('');
    setScope('global');
    setType('integer');
    setError(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    setName('');
    setScope('global');
    setType('integer');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Variable</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Variable Name */}
          <div className="space-y-2">
            <Label htmlFor="var-name">Variable Name</Label>
            <Input
              id="var-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="myVariable"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          {/* Scope Toggle */}
          <div className="space-y-2">
            <Label>Scope</Label>
            <div className="flex gap-2">
              <Button
                variant={scope === 'global' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setScope('global')}
              >
                Global
              </Button>
              <Button
                variant={scope === 'local' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setScope('local')}
                disabled={!objectName}
              >
                Local {objectName ? `(${objectName})` : ''}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {scope === 'global'
                ? 'Available to all objects in the project'
                : 'Only available to this object (each instance has its own value)'}
            </p>
          </div>

          {/* Type Selection */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {VARIABLE_TYPES.map((t) => (
                <Button
                  key={t.value}
                  variant={type === t.value ? 'default' : 'outline'}
                  className="h-auto py-2 flex flex-col items-start"
                  onClick={() => setType(t.value)}
                >
                  <span className="font-medium">{t.label}</span>
                  <span className="text-xs opacity-70">{t.description}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>
            Add Variable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
