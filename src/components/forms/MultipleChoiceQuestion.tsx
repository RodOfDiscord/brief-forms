'use client';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { Question } from '@/types/form';

interface MultipleChoiceQuestionProps {
    question: Question;
    value: string; // comma-separated option IDs
    onChange: (value: string) => void;
}

export function MultipleChoiceQuestion({
    question,
    value,
    onChange,
}: MultipleChoiceQuestionProps) {
    const selectedIds = value ? value.split(',').filter(Boolean) : [];

    const handleToggle = (optionId: string, checked: boolean) => {
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
                        className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent"
                    >
                        <Checkbox
                            checked={selectedIds.includes(option.id)}
                            onCheckedChange={(checked) =>
                                handleToggle(option.id, checked as boolean)
                            }
                        />
                        <span className="text-sm">{option.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
