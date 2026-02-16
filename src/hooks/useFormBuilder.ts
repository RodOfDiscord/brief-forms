'use client';

import { useState, useCallback } from 'react';
import { useFormBuilderStore } from '@/store/formBuilderStore';
import { useRouter } from 'next/navigation';

export function useFormBuilder(formId?: string) {
    const store = useFormBuilderStore();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const save = useCallback(async () => {
        if (!store.title.trim()) {
            setError('Назва форми обов\'язкова');
            return false;
        }
        if (!store.slug.trim()) {
            setError('Slug обов\'язковий');
            return false;
        }

        setIsSaving(true);
        setError(null);

        try {
            const payload = {
                title: store.title,
                description: store.description || null,
                slug: store.slug,
                is_published: store.isPublished,
                questions: store.questions,
            };

            const url = formId ? `/api/forms/${formId}` : '/api/forms';
            const method = formId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Помилка збереження');
            }

            const result = await response.json();
            router.push('/dashboard');
            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Помилка збереження');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [formId, store, router]);

    return {
        ...store,
        isSaving,
        error,
        setError,
        save,
    };
}
