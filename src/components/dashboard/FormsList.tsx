'use client';

import { FormCard } from './FormCard';
import type { FormListItem } from '@/types/form';

interface FormsListProps {
    forms: FormListItem[];
    onDelete: (id: string) => void;
}

export function FormsList({ forms, onDelete }: FormsListProps) {
    if (forms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg font-medium text-muted-foreground">
                    Форм ще немає
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                    Створіть свою першу форму, натиснувши кнопку вище
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
                <FormCard key={form.id} form={form} onDelete={onDelete} />
            ))}
        </div>
    );
}
