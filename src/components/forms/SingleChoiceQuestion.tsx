'use client';

import { Label } from '@/components/ui/label';
import type { Question } from '@/types/form';

interface SingleChoiceQuestionProps {
    question: Question;
    value: string;
    onChange: (value: string) => void;
}

export function SingleChoiceQuestion({
    question,
    value,
    onChange,
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
                        className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                        <input
                            type="radio"
                            name={question.id}
                            value={option.id}
                            checked={value === option.id}
                            onChange={() => onChange(option.id)}
                            className="h-4 w-4 accent-primary"
                        />
                        <span className="text-sm">{option.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
