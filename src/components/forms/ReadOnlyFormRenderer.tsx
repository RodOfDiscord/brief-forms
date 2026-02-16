'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { Form } from '@/types/form';
import { QuestionRouter } from './QuestionRouter';
import { ConditionalBlock } from './ConditionalBlock';
import { useConditionalLogic } from '@/hooks/useConditionalLogic';

interface ReadOnlyFormRendererProps {
    form: Form;
    answers: Record<string, string>;
}

export function ReadOnlyFormRenderer({ form, answers }: ReadOnlyFormRendererProps) {
    // Use conditional logic to determine visibility based on the saved answers
    const { visibleQuestions } = useConditionalLogic(form.questions, answers);

    // Get root questions (no parent) from visible questions
    const rootQuestions = visibleQuestions
        .filter((q) => !q.parent_question_id)
        .sort((a, b) => a.order_index - b.order_index);

    // Mock onChange that does nothing (just to satisfy types)
    const noop = () => { };

    return (
        <div className="space-y-4">
            {rootQuestions.map((question) => (
                <Card key={question.id}>
                    <CardContent className="pt-6 space-y-4">
                        <QuestionRouter
                            question={question}
                            value={answers[question.id] || ''}
                            onChange={noop}
                            disabled={true}
                        />
                        <ConditionalBlock
                            question={question}
                            allQuestions={form.questions}
                            answers={answers}
                            onAnswer={noop}
                            disabled={true}
                        />
                    </CardContent>
                </Card>
            ))}

            {rootQuestions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    Немає видимих питань для цієї відповіді
                </div>
            )}
        </div>
    );
}
