'use client';

import { useEffect, useState } from 'react';
import { FormsList } from '@/components/dashboard/FormsList';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { FormListItem } from '@/types/form';

export default function DashboardPage() {
    const [forms, setForms] = useState<FormListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchForms = async () => {
        try {
            const res = await fetch('/api/forms');
            if (res.ok) {
                const data = await res.json();
                setForms(data);
            }
        } catch (err) {
            console.error('Failed to fetch forms:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchForms();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Ви впевнені, що хочете видалити цю форму?')) return;

        try {
            const res = await fetch(`/api/forms/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setForms((prev) => prev.filter((f) => f.id !== id));
            }
        } catch (err) {
            console.error('Failed to delete form:', err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Мої форми</h2>
                    <p className="text-muted-foreground">
                        Керуйте своїми формами та переглядайте відповіді
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/forms/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Нова форма
                    </Link>
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <FormsList forms={forms} onDelete={handleDelete} />
            )}
        </div>
    );
}
