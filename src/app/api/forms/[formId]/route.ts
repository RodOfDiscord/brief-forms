import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { verifyAdminToken } from '@/lib/auth/jwt';

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

    const { data: form, error: formError } = await supabase
        .from('forms')
        .select('*')
        .or(`id.eq.${formId},slug.eq.${formId}`)
        .single();

    if (formError || !form) {
        return NextResponse.json({ error: 'Форму не знайдено' }, { status: 404 });
    }

    if (!isAdmin && !form.is_published) {
        return NextResponse.json({ error: 'Форму не знайдено' }, { status: 404 });
    }

    const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', form.id)
        .order('order_index');

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

    const questionsWithOptions = (questions || []).map((q) => ({
        ...q,
        options: options.filter((o) => o.question_id === q.id),
    }));

    return NextResponse.json({ ...form, questions: questionsWithOptions });
}

// ── Types ────────────────────────────────────────────────────────────────────

interface IncomingOption {
    id: string;
    label: string;
    order_index: number;
}

interface IncomingQuestion {
    id: string;
    label: string;
    type: string;
    is_required: boolean;
    order_index: number;
    parent_question_id: string | null;
    trigger_option_id: string | null;
    options: IncomingOption[];
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
        const {
            title,
            description,
            slug,
            is_published,
            questions: incomingQuestions = [],
        }: {
            title: string;
            description?: string;
            slug: string;
            is_published?: boolean;
            questions: IncomingQuestion[];
        } = body;

        const supabase = createAdminSupabaseClient();

        // ── 1. Update form metadata ──────────────────────────────────────────
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

        // ── 2. Load existing structure via two explicit queries ───────────────
        // Deliberately avoid PostgREST embedded selects (e.g. `options(id)`)
        // because they can silently return incorrect/empty data, which would
        // make `existingOptionIds` an empty Set and prevent option deletion.

        const { data: existingQuestionsRaw } = await supabase
            .from('questions')
            .select('id')
            .eq('form_id', formId);

        const existingQuestionIds = new Set(
            (existingQuestionsRaw || []).map((q: { id: string }) => q.id)
        );

        // Load all current options for this form in one query
        let existingOptions: Array<{ id: string; question_id: string }> = [];
        if (existingQuestionIds.size > 0) {
            const { data: existingOptionsRaw } = await supabase
                .from('options')
                .select('id, question_id')
                .in('question_id', [...existingQuestionIds]);

            existingOptions = (existingOptionsRaw || []) as Array<{
                id: string;
                question_id: string;
            }>;
        }

        const existingOptionIds = new Set(existingOptions.map((o) => o.id));

        // Build lookup: optionId → questionId (needed for answer sanitization)
        const optionToQuestionMap = new Map(
            existingOptions.map((o) => [o.id, o.question_id])
        );

        const incomingQuestionIds = new Set(incomingQuestions.map((q) => q.id));
        const incomingOptionIds = new Set(
            incomingQuestions.flatMap((q) => (q.options || []).map((o) => o.id))
        );

        // ── 3. Nullify all trigger_option_ids before any deletions ───────────
        // Prevents FK violations when options referenced as triggers are about
        // to be deleted. The DB schema has ON DELETE SET NULL, but doing it
        // explicitly here keeps the transaction predictable.
        if (existingQuestionIds.size > 0) {
            await supabase
                .from('questions')
                .update({ trigger_option_id: null })
                .in('id', [...existingQuestionIds]);
        }

        // ── 4. Delete removed questions ──────────────────────────────────────
        // ON DELETE CASCADE removes their child options automatically.
        // Answers linked to deleted questions are also cascade-deleted —
        // correct behaviour: if admin removes a question, its data is gone.
        const questionsToDelete = [...existingQuestionIds].filter(
            (id) => !incomingQuestionIds.has(id)
        );
        if (questionsToDelete.length > 0) {
            await supabase.from('questions').delete().in('id', questionsToDelete);
        }

        // ── 5. Sanitize answers + delete removed options of kept questions ────
        // Options of deleted questions are already gone via cascade (step 4).
        // Here we handle options explicitly removed from questions that still exist.
        //
        // We compute `optionsToDelete` from existingOptionIds vs incomingOptionIds.
        // Because cascade may have already removed some of these IDs (for deleted
        // questions), we only act on IDs that still physically exist in the DB —
        // determined by optionToQuestionMap which was built before any deletions.
        const optionsToDelete = [...existingOptionIds].filter(
            (id) => !incomingOptionIds.has(id)
        );

        if (optionsToDelete.length > 0) {
            // Determine which questions (that are still kept) own these options,
            // so we can scope the answer sanitization query correctly.
            const keptQuestionsWithRemovedOptions = [
                ...new Set(
                    optionsToDelete
                        .map((id) => optionToQuestionMap.get(id))
                        .filter((qId): qId is string =>
                            qId !== undefined && !questionsToDelete.includes(qId)
                        )
                ),
            ];

            if (keptQuestionsWithRemovedOptions.length > 0) {
                // Load answers for those questions that may reference deleted options
                const { data: affectedAnswersRaw } = await supabase
                    .from('answers')
                    .select('id, value')
                    .in('question_id', keptQuestionsWithRemovedOptions);

                const affectedAnswers = (affectedAnswersRaw || []) as Array<{
                    id: string;
                    value: string;
                }>;

                if (affectedAnswers.length > 0) {
                    const deletedSet = new Set(optionsToDelete);
                    const answersToUpdate: Array<{ id: string; value: string }> = [];

                    for (const ans of affectedAnswers) {
                        // answers.value is comma-separated option IDs for choice questions
                        const current = ans.value
                            .split(',')
                            .map((v) => v.trim())
                            .filter(Boolean);
                        const cleaned = current.filter((v) => !deletedSet.has(v));

                        if (cleaned.length !== current.length) {
                            answersToUpdate.push({
                                id: ans.id,
                                value: cleaned.join(','),
                            });
                        }
                    }

                    if (answersToUpdate.length > 0) {
                        await supabase.from('answers').upsert(answersToUpdate);
                    }
                }
            }

            // Delete only options that still exist (cascade already removed the rest)
            const stillExistingOptionsToDelete = optionsToDelete.filter(
                (id) => !questionsToDelete.includes(optionToQuestionMap.get(id) ?? '')
            );
            if (stillExistingOptionsToDelete.length > 0) {
                const { error: delOptError } = await supabase
                    .from('options')
                    .delete()
                    .in('id', stillExistingOptionsToDelete);

                if (delOptError) {
                    return NextResponse.json({ error: delOptError.message }, { status: 500 });
                }
            }
        }

        if (incomingQuestions.length === 0) {
            return NextResponse.json({ success: true });
        }

        // ── 6. Upsert questions — Pass 1: structure only, no FK fields ───────
        // parent_question_id and trigger_option_id are set to null here to avoid
        // FK violations when a new parent and its new child arrive in the same
        // save (batch upsert does not guarantee row insertion order).
        const { error: qError } = await supabase
            .from('questions')
            .upsert(
                incomingQuestions.map((q) => ({
                    id: q.id,
                    form_id: formId,
                    label: q.label,
                    type: q.type,
                    is_required: q.is_required || false,
                    order_index: q.order_index,
                    parent_question_id: null,
                    trigger_option_id: null,
                }))
            );

        if (qError) {
            return NextResponse.json({ error: qError.message }, { status: 500 });
        }

        // ── 7. Upsert options ────────────────────────────────────────────────
        // All questions now exist in the DB, so `question_id` FK is safe.
        const optionsToUpsert = incomingQuestions.flatMap((q) =>
            (q.options || []).map((opt) => ({
                id: opt.id,
                question_id: q.id,
                label: opt.label,
                order_index: opt.order_index,
            }))
        );

        if (optionsToUpsert.length > 0) {
            const { error: oError } = await supabase
                .from('options')
                .upsert(optionsToUpsert);

            if (oError) {
                return NextResponse.json({ error: oError.message }, { status: 500 });
            }
        }

        // ── 8. Pass 2: set parent_question_id ───────────────────────────────
        // All questions are guaranteed to exist now, so the self-referential FK
        // on questions.parent_question_id is safe to set.
        const questionsWithParent = incomingQuestions.filter(
            (q) => q.parent_question_id
        );
        for (const q of questionsWithParent) {
            await supabase
                .from('questions')
                .update({ parent_question_id: q.parent_question_id })
                .eq('id', q.id);
        }

        // ── 9. Pass 3: set trigger_option_id ────────────────────────────────
        // All options are guaranteed to exist now, so the FK from
        // questions.trigger_option_id to options.id is safe to set.
        const questionsWithTrigger = incomingQuestions.filter(
            (q) => q.trigger_option_id
        );
        for (const q of questionsWithTrigger) {
            await supabase
                .from('questions')
                .update({ trigger_option_id: q.trigger_option_id })
                .eq('id', q.id);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Помилка сервера';
        console.error('Error updating form:', err);
        return NextResponse.json({ error: message }, { status: 500 });
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

    const { error } = await supabase.from('forms').delete().eq('id', formId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}