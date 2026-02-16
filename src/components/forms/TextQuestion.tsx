'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Question } from '@/types/form';

interface TextQuestionProps {
    question: Question;
    value: string;
    onChange: (value: string) => void;
}

export function TextQuestion({ question, value, onChange }: TextQuestionProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={question.id} className="text-base font-medium">
                {question.label}
                {question.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
                id={question.id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Введіть вашу відповідь..."
                className="w-full"
            />
        </div>
    );
}
