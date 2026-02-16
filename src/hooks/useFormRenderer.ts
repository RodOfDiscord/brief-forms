'use client';

import { useState, useCallback } from 'react';
import type { Question } from '@/types/form';
import type { AnswerInput } from '@/types/response';
import { useConditionalLogic } from './useConditionalLogic';

interface UseFormRendererProps {
    formId: string;
    questions: Question[];
    formSlug: string;
}

export function useFormRenderer({ formId, questions, formSlug }: UseFormRendererProps) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { visibleQuestions } = useConditionalLogic(questions, answers);

    const setAnswer = useCallback((questionId: string, value: string) => {
        setAnswers((prev) => {
            const next = { ...prev, [questionId]: value };

            // Clear answers for questions that become invisible
            // when a parent answer changes
            const allQuestionIds = questions.map((q) => q.id);
            for (const qId of allQuestionIds) {
                const question = questions.find((q) => q.id === qId);
                if (question?.parent_question_id === questionId && question?.trigger_option_id) {
                    // If the trigger option is not in the new value, clear child answer
                    const selectedOptions = value.split(',').map((s) => s.trim());
                    if (!selectedOptions.includes(question.trigger_option_id)) {
                        delete next[qId];
                    }
                }
            }

            return next;
        });
    }, [questions]);

    const validate = useCallback((): string | null => {
        for (const question of visibleQuestions) {
            if (question.is_required) {
                const answer = answers[question.id];
                if (!answer || answer.trim() === '') {
                    return `Питання "${question.label}" є обов'язковим`;
                }
            }
        }
        return null;
    }, [visibleQuestions, answers]);

    const submit = useCallback(async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return false;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Only submit answers for visible questions
            const visibleIds = new Set(visibleQuestions.map((q) => q.id));
            const answersToSubmit: AnswerInput[] = Object.entries(answers)
                .filter(([qId]) => visibleIds.has(qId))
                .map(([question_id, value]) => ({ question_id, value }));

            const response = await fetch('/api/responses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    form_id: formId,
                    answers: answersToSubmit,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Помилка відправки');
            }

            // Redirect to success page
            window.location.href = `/forms/${formSlug}/success`;
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Помилка відправки');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [answers, formId, formSlug, validate, visibleQuestions]);

    return {
        answers,
        setAnswer,
        visibleQuestions,
        isSubmitting,
        error,
        submit,
    };
}
