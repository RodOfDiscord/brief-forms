import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { ReadOnlyFormRenderer } from '@/components/forms/ReadOnlyFormRenderer';
import type { Form, Option } from '@/types/form';

interface PageProps {
    params: Promise<{
        formId: string;
        responseId: string;
    }>;
}

export default async function ResponseDetailPage({ params }: PageProps) {
    const { formId, responseId } = await params;
    const supabase = createAdminSupabaseClient();

    // 1. Fetch form with questions and options
    const { data: formRaw } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

    if (!formRaw) notFound();

    const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', formId)
        .order('order_index');

    const questionIds = (questions || []).map((q) => q.id);

    let options: Option[] = [];
    if (questionIds.length > 0) {
        const { data: opts } = await supabase
            .from('options')
            .select('*')
            .in('question_id', questionIds)
            .order('order_index');
        options = opts || [];
    }

    // Assemble full form object
    const fullForm: Form = {
        ...formRaw,
        questions: (questions || []).map((q) => ({
            ...q,
            options: options.filter((o) => o.question_id === q.id),
        })),
    };

    // 2. Fetch response with answers
    const { data: response } = await supabase
        .from('responses')
        .select('*')
        .eq('id', responseId)
        .single();

    if (!response) notFound();

    const { data: answersRaw } = await supabase
        .from('answers')
        .select('*')
        .eq('response_id', responseId);

    // Convert answers array to Record<string, string>
    const answersMap: Record<string, string> = {};
    (answersRaw || []).forEach((a) => {
        answersMap[a.question_id] = a.value;
    });

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/forms/${formId}/responses`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Перегляд відповіді</h2>
                    <p className="text-muted-foreground">
                        {fullForm.title}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Інформація про відповідь</CardTitle>
                    <CardDescription>
                        Відправлено: {new Date(response.submitted_at).toLocaleString('uk-UA')}
                    </CardDescription>
                </CardHeader>
            </Card>

            <ReadOnlyFormRenderer form={fullForm} answers={answersMap} />
        </div>
    );
}
