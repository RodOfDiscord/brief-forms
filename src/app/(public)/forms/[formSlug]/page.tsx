import { createServerSupabaseClient } from '@/lib/supabase/server';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { notFound } from 'next/navigation';
import type { Form } from '@/types/form';

interface PageProps {
    params: Promise<{ formSlug: string }>;
}

export default async function PublicFormPage({ params }: PageProps) {
    const { formSlug } = await params;

    // Fetch form directly from Supabase for server component
    const supabase = createServerSupabaseClient();

    const { data: form } = await supabase
        .from('forms')
        .select('*')
        .eq('slug', formSlug)
        .eq('is_published', true)
        .single();

    if (!form) {
        notFound();
    }

    // Fetch questions
    const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', form.id)
        .order('order_index');

    // Fetch options
    const questionIds = (questions || []).map((q: { id: string }) => q.id);
    let options: Array<{ id: string; question_id: string; label: string; order_index: number }> = [];
    if (questionIds.length > 0) {
        const { data: opts } = await supabase
            .from('options')
            .select('*')
            .in('question_id', questionIds)
            .order('order_index');
        options = opts || [];
    }

    const fullForm: Form = {
        ...form,
        questions: (questions || []).map((q: { id: string; form_id: string; label: string; type: 'text' | 'single_choice' | 'multiple_choice'; is_required: boolean; order_index: number; parent_question_id: string | null; trigger_option_id: string | null }) => ({
            ...q,
            options: options.filter((o) => o.question_id === q.id),
        })),
    };

    return <FormRenderer form={fullForm} />;
}
