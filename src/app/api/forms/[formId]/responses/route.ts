import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { verifyAdminToken } from '@/lib/auth/jwt';

interface RouteParams {
    params: Promise<{ formId: string }>;
}

// GET: Fetch all responses for a form (admin only)
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { formId } = await params;
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await verifyAdminToken(token))) {
        return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();

    // Fetch responses
    const { data: responses, error: respError } = await supabase
        .from('responses')
        .select('*')
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });

    if (respError) {
        return NextResponse.json({ error: respError.message }, { status: 500 });
    }

    // Fetch answers for all responses
    const responseIds = (responses || []).map((r) => r.id);
    let answers: Array<{ id: string; response_id: string; question_id: string; value: string }> = [];
    if (responseIds.length > 0) {
        const { data: ans } = await supabase
            .from('answers')
            .select('*')
            .in('response_id', responseIds);
        answers = ans || [];
    }

    // Attach answers to responses
    const responsesWithAnswers = (responses || []).map((r) => ({
        ...r,
        answers: answers.filter((a) => a.response_id === r.id),
    }));

    return NextResponse.json(responsesWithAnswers);
}
