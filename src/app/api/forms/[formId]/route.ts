import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { verifyAdminToken } from '@/lib/auth/jwt';
import { v4 as uuidv4 } from 'uuid';

interface RouteParams {
    params: Promise<{ formId: string }>;
}

// GET: Fetch a single form (public for published, admin for any)
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { formId } = await params;
    const token = request.cookies.get('admin_token')?.value;
    const isAdmin = token ? await verifyAdminToken(token) : null;

    const supabase = isAdmin
        ? createAdminSupabaseClient()
        : createServerSupabaseClient();

    // Try to find by slug first, then by ID
    let formQuery = supabase
        .from('forms')
        .select('*')
        .or(`id.eq.${formId},slug.eq.${formId}`)
        .single();

    const { data: form, error: formError } = await formQuery;

    if (formError || !form) {
        return NextResponse.json({ error: 'Форму не знайдено' }, { status: 404 });
    }

    // Non-admin can only see published forms
    if (!isAdmin && !form.is_published) {
        return NextResponse.json({ error: 'Форму не знайдено' }, { status: 404 });
    }

    // Fetch questions
    const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', form.id)
        .order('order_index');

    // Fetch options for all questions
    const questionIds = (questions || []).map((q) => q.id);
    let options: Array<{ id: string; question_id: string; label: string; order_index: number }> = [];
    if (questionIds.length > 0) {
        const { data: opts } = await supabase
            .from('options')
            .select('*')
            .in('question_id', questionIds)
            .order('order_index');
        options = opts || [];
    }

    // Attach options to questions
    const questionsWithOptions = (questions || []).map((q) => ({
        ...q,
        options: options.filter((o) => o.question_id === q.id),
    }));

    return NextResponse.json({
        ...form,
        questions: questionsWithOptions,
    });
}

// PUT: Update a form (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const { formId } = await params;
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await verifyAdminToken(token))) {
        return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, description, slug, is_published, questions } = body;

        const supabase = createAdminSupabaseClient();

        // Update form metadata
        const { error: formError } = await supabase
            .from('forms')
            .update({
                title,
                description: description || null,
                slug,
                is_published: is_published || false,
            })
            .eq('id', formId);

        if (formError) {
            if (formError.code === '23505') {
                return NextResponse.json(
                    { error: 'Форма з таким slug вже існує' },
                    { status: 409 }
                );
            }
            return NextResponse.json({ error: formError.message }, { status: 500 });
        }

        // Delete existing questions (cascade deletes options too)
        await supabase.from('questions').delete().eq('form_id', formId);

        // Re-insert questions
        if (questions && questions.length > 0) {
            const idMap = new Map<string, string>();

            for (const q of questions) {
                const newId = uuidv4();
                idMap.set(q.id, newId);
                if (q.options) {
                    for (const opt of q.options) {
                        idMap.set(opt.id, uuidv4());
                    }
                }
            }

            for (const q of questions) {
                const questionId = idMap.get(q.id)!;
                const parentId = q.parent_question_id
                    ? idMap.get(q.parent_question_id) || null
                    : null;

                await supabase.from('questions').insert({
                    id: questionId,
                    form_id: formId,
                    label: q.label,
                    type: q.type,
                    is_required: q.is_required || false,
                    order_index: q.order_index,
                    parent_question_id: parentId,
                    trigger_option_id: null,
                });

                if (q.options && q.options.length > 0) {
                    const optionsToInsert = q.options.map((opt: { id: string; label: string; order_index: number }) => ({
                        id: idMap.get(opt.id)!,
                        question_id: questionId,
                        label: opt.label,
                        order_index: opt.order_index,
                    }));

                    await supabase.from('options').insert(optionsToInsert);
                }
            }

            // Update trigger_option_ids
            for (const q of questions) {
                if (q.trigger_option_id) {
                    const questionId = idMap.get(q.id)!;
                    const triggerOptionId = idMap.get(q.trigger_option_id) || null;

                    if (triggerOptionId) {
                        await supabase
                            .from('questions')
                            .update({ trigger_option_id: triggerOptionId })
                            .eq('id', questionId);
                    }
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 });
    }
}

// DELETE: Delete a form (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { formId } = await params;
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await verifyAdminToken(token))) {
        return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
