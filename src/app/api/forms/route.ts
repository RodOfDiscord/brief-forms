import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { verifyAdminToken } from '@/lib/auth/jwt';
import { v4 as uuidv4 } from 'uuid';

// GET: List all forms (admin only)
export async function GET(request: NextRequest) {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await verifyAdminToken(token))) {
        return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();

    const { data: forms, error } = await supabase
        .from('forms')
        .select('id, title, slug, is_published, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get response counts for each form
    const formsWithCounts = await Promise.all(
        (forms || []).map(async (form) => {
            const { count } = await supabase
                .from('responses')
                .select('*', { count: 'exact', head: true })
                .eq('form_id', form.id);

            return { ...form, response_count: count || 0 };
        })
    );

    return NextResponse.json(formsWithCounts);
}

// POST: Create a new form (admin only)
export async function POST(request: NextRequest) {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await verifyAdminToken(token))) {
        return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, description, slug, is_published, questions } = body;

        if (!title || !slug) {
            return NextResponse.json(
                { error: 'Назва та slug обов\'язкові' },
                { status: 400 }
            );
        }

        const supabase = createAdminSupabaseClient();

        // Create form
        const formId = uuidv4();
        const { error: formError } = await supabase
            .from('forms')
            .insert({
                id: formId,
                title,
                description: description || null,
                slug,
                is_published: is_published || false,
            });

        if (formError) {
            if (formError.code === '23505') {
                return NextResponse.json(
                    { error: 'Форма з таким slug вже існує' },
                    { status: 409 }
                );
            }
            return NextResponse.json({ error: formError.message }, { status: 500 });
        }

        // Insert questions with options
        if (questions && questions.length > 0) {
            // Map client IDs to server IDs
            const idMap = new Map<string, string>();

            // First pass: create ID mapping
            for (const q of questions) {
                const newId = uuidv4();
                idMap.set(q.id, newId);
                if (q.options) {
                    for (const opt of q.options) {
                        idMap.set(opt.id, uuidv4());
                    }
                }
            }

            // Insert questions (without trigger_option_id first)
            for (const q of questions) {
                const questionId = idMap.get(q.id)!;
                const parentId = q.parent_question_id
                    ? idMap.get(q.parent_question_id) || null
                    : null;

                const { error: qError } = await supabase
                    .from('questions')
                    .insert({
                        id: questionId,
                        form_id: formId,
                        label: q.label,
                        type: q.type,
                        is_required: q.is_required || false,
                        order_index: q.order_index,
                        parent_question_id: parentId,
                        trigger_option_id: null, // set after options are created
                    });

                if (qError) {
                    return NextResponse.json({ error: qError.message }, { status: 500 });
                }

                // Insert options
                if (q.options && q.options.length > 0) {
                    const optionsToInsert = q.options.map((opt: { id: string; label: string; order_index: number }) => ({
                        id: idMap.get(opt.id)!,
                        question_id: questionId,
                        label: opt.label,
                        order_index: opt.order_index,
                    }));

                    const { error: optError } = await supabase
                        .from('options')
                        .insert(optionsToInsert);

                    if (optError) {
                        return NextResponse.json({ error: optError.message }, { status: 500 });
                    }
                }
            }

            // Second pass: update trigger_option_id for conditional questions
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

        return NextResponse.json({ id: formId, slug }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 });
    }
}
