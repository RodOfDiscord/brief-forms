'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import type { OptionInput } from '@/types/form';

interface OptionsListProps {
    options: OptionInput[];
    questionId: string;
    onAdd: () => void;
    onRemove: (optionId: string) => void;
    onUpdate: (optionId: string, label: string) => void;
}

export function OptionsList({
    options,
    onAdd,
    onRemove,
    onUpdate,
}: OptionsListProps) {
    return (
        <div className="space-y-2">
            {options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">
                        {index + 1}.
                    </span>
                    <Input
                        value={option.label}
                        onChange={(e) => onUpdate(option.id, e.target.value)}
                        placeholder={`Варіант ${index + 1}`}
                        className="flex-1"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(option.id)}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAdd}
                className="w-full"
            >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Додати варіант
            </Button>
        </div>
    );
}
