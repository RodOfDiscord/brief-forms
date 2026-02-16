import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

// POST: Submit a response (public, no auth required)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { form_id, answers } = body;

        if (!form_id || !answers || !Array.isArray(answers)) {
            return NextResponse.json(
                { error: 'form_id та answers обов\'язкові' },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        // Verify form exists and is published
        const { data: form } = await supabase
            .from('forms')
            .select('id, is_published')
            .eq('id', form_id)
            .single();

        if (!form || !form.is_published) {
            return NextResponse.json(
                { error: 'Форму не знайдено' },
                { status: 404 }
            );
        }

        // Create response
        const responseId = uuidv4();
        const { error: responseError } = await supabase
            .from('responses')
            .insert({
                id: responseId,
                form_id,
            });

        if (responseError) {
            return NextResponse.json(
                { error: responseError.message },
                { status: 500 }
            );
        }

        // Insert answers
        if (answers.length > 0) {
            const answersToInsert = answers.map(
                (a: { question_id: string; value: string }) => ({
                    id: uuidv4(),
                    response_id: responseId,
                    question_id: a.question_id,
                    value: a.value || '',
                })
            );

            const { error: answersError } = await supabase
                .from('answers')
                .insert(answersToInsert);

            if (answersError) {
                return NextResponse.json(
                    { error: answersError.message },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({ id: responseId }, { status: 201 });
    } catch {
        return NextResponse.json(
            { error: 'Помилка сервера' },
            { status: 500 }
        );
    }
}
