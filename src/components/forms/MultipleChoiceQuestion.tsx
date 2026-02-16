'use client';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { Question } from '@/types/form';

interface MultipleChoiceQuestionProps {
    question: Question;
    value: string; // comma-separated option IDs
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function MultipleChoiceQuestion({
    question,
    value,
    onChange,
    disabled,
}: MultipleChoiceQuestionProps) {
    const selectedIds = value ? value.split(',').filter(Boolean) : [];

    const handleToggle = (optionId: string, checked: boolean) => {
        if (disabled) return;
        let newSelected: string[];
        if (checked) {
            newSelected = [...selectedIds, optionId];
        } else {
            newSelected = selectedIds.filter((id) => id !== optionId);
        }
        onChange(newSelected.join(','));
    };

    return (
        <div className="space-y-3">
            <Label className="text-base font-medium">
                {question.label}
                {question.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="space-y-2">
                {question.options.map((option) => (
                    <label
                        key={option.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${disabled
                            ? (selectedIds.includes(option.id) ? 'border-primary bg-primary/10 opacity-100' : 'opacity-60 bg-muted/50')
                            : 'cursor-pointer hover:bg-accent'
                            }`}
                    >
                        <Checkbox
                            checked={selectedIds.includes(option.id)}
                            onCheckedChange={(checked) =>
                                handleToggle(option.id, checked as boolean)
                            }
                            disabled={disabled}
                            className="disabled:opacity-100 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <span className="text-sm font-medium text-foreground">{option.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
