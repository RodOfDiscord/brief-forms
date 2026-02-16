'use client';

import { Label } from '@/components/ui/label';
import type { Question } from '@/types/form';

interface SingleChoiceQuestionProps {
    question: Question;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function SingleChoiceQuestion({
    question,
    value,
    onChange,
    disabled,
}: SingleChoiceQuestionProps) {
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
                            ? (value === option.id ? 'border-primary bg-primary/10 opacity-100' : 'opacity-60 bg-muted/50')
                            : 'cursor-pointer hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5'
                            }`}
                    >
                        <input
                            type="radio"
                            name={question.id}
                            value={option.id}
                            checked={value === option.id}
                            onChange={() => !disabled && onChange(option.id)}
                            className="h-4 w-4 accent-primary disabled:opacity-100"
                            disabled={disabled}
                        />
                        <span className="text-sm font-medium text-foreground">{option.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
