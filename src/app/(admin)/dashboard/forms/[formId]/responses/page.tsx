'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ResponsesTable } from '@/components/dashboard/ResponsesTable';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Download } from 'lucide-react';
import Link from 'next/link';
import type { Form } from '@/types/form';
import type { FormResponse } from '@/types/response';

export default function ResponsesPage() {
    const params = useParams();
    const formId = params.formId as string;
    const [form, setForm] = useState<Form | null>(null);
    const [responses, setResponses] = useState<FormResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch form
                const formRes = await fetch(`/api/forms/${formId}`);
                if (formRes.ok) {
                    const formData = await formRes.json();
                    setForm(formData);
                }

                // Fetch responses directly from the API
                const respRes = await fetch(`/api/forms/${formId}/responses`);
                if (respRes.ok) {
                    const respData = await respRes.json();
                    setResponses(respData);
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [formId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Відповіді: {form?.title}
                        </h2>
                        <p className="text-muted-foreground">
                            Всього відповідей: {responses.length}
                        </p>
                    </div>
                </div>
            </div>

            <ResponsesTable
                responses={responses}
                questions={form?.questions || []}
            />
        </div>
    );
}
