'use client';

import { useMemo } from 'react';
import type { Question } from '@/types/form';
import { getVisibleQuestions } from '@/lib/conditional-logic';

export function useConditionalLogic(
    questions: Question[],
    answers: Record<string, string>
) {
    const visibleQuestions = useMemo(
        () => getVisibleQuestions(questions, answers),
        [questions, answers]
    );

    return { visibleQuestions };
}
