'use client';

import type { Question } from '@/types/form';
import { QuestionRouter } from './QuestionRouter';

interface ConditionalBlockProps {
    question: Question;
    allQuestions: Question[];
    answers: Record<string, string>;
    onAnswer: (questionId: string, value: string) => void;
}

/**
 * Renders child questions that depend on a parent question's answer.
 * Recursively renders nested conditionals.
 */
export function ConditionalBlock({
    question,
    allQuestions,
    answers,
    onAnswer,
}: ConditionalBlockProps) {
    // Find child questions triggered by the current answer for this question
    const currentAnswer = answers[question.id] || '';
    const selectedOptionIds = currentAnswer.split(',').map((s) => s.trim()).filter(Boolean);

    const childQuestions = allQuestions.filter(
        (q) =>
            q.parent_question_id === question.id &&
            q.trigger_option_id &&
            selectedOptionIds.includes(q.trigger_option_id)
    );

    if (childQuestions.length === 0) return null;

    return (
        <div className="ml-4 border-l-2 border-primary/20 pl-4 space-y-4">
            {childQuestions
                .sort((a, b) => a.order_index - b.order_index)
                .map((childQ) => (
                    <div key={childQ.id} className="space-y-4">
                        <QuestionRouter
                            question={childQ}
                            value={answers[childQ.id] || ''}
                            onChange={(value) => onAnswer(childQ.id, value)}
                        />
                        {/* Recursively render conditionals for this child */}
                        <ConditionalBlock
                            question={childQ}
                            allQuestions={allQuestions}
                            answers={answers}
                            onAnswer={onAnswer}
                        />
                    </div>
                ))}
        </div>
    );
}
