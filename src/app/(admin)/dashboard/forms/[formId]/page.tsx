'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FormBuilder } from '@/components/builder/FormBuilder';
import { Loader2 } from 'lucide-react';
import type { Form } from '@/types/form';

export default function EditFormPage() {
    const params = useParams();
    const formId = params.formId as string;
    const [form, setForm] = useState<Form | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchForm = async () => {
            try {
                const res = await fetch(`/api/forms/${formId}`);
                if (res.ok) {
                    const data = await res.json();
                    setForm(data);
                }
            } catch (err) {
                console.error('Failed to fetch form:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchForm();
    }, [formId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!form) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Форму не знайдено</p>
            </div>
        );
    }

    return <FormBuilder existingForm={form} />;
}
