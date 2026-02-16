'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { QuestionType } from '@/types/form';

interface QuestionTypeSelectorProps {
    value: QuestionType;
    onChange: (type: QuestionType) => void;
}

const questionTypes: { value: QuestionType; label: string }[] = [
    { value: 'text', label: 'Текстова відповідь' },
    { value: 'single_choice', label: 'Одна відповідь' },
    { value: 'multiple_choice', label: 'Кілька відповідей' },
];

export function QuestionTypeSelector({
    value,
    onChange,
}: QuestionTypeSelectorProps) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Тип питання</Label>
            <Select value={value} onValueChange={(v) => onChange(v as QuestionType)}>
                <SelectTrigger className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {questionTypes.map((qt) => (
                        <SelectItem key={qt.value} value={qt.value}>
                            {qt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
