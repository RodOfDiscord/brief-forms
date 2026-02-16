'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send } from 'lucide-react';
import type { Form } from '@/types/form';
import { useFormRenderer } from '@/hooks/useFormRenderer';
import { QuestionRouter } from './QuestionRouter';
import { ConditionalBlock } from './ConditionalBlock';

interface FormRendererProps {
    form: Form;
}

export function FormRenderer({ form }: FormRendererProps) {
    const {
        answers,
        setAnswer,
        visibleQuestions,
        isSubmitting,
        error,
        submit,
    } = useFormRenderer({
        formId: form.id,
        questions: form.questions,
        formSlug: form.slug,
    });

    // Get root questions (no parent)
    const rootQuestions = visibleQuestions
        .filter((q) => !q.parent_question_id)
        .sort((a, b) => a.order_index - b.order_index);

    return (
        <div className="min-h-screen bg-muted/30 py-8 px-4">
            <div className="mx-auto max-w-2xl">
                {/* Form header */}
                <Card className="mb-6 border-t-4 border-t-primary">
                    <CardHeader>
                        <CardTitle className="text-2xl">{form.title}</CardTitle>
                        {form.description && (
                            <CardDescription className="text-base">
                                {form.description}
                            </CardDescription>
                        )}
                    </CardHeader>
                </Card>

                {/* Questions */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        submit();
                    }}
                    className="space-y-4"
                >
                    {rootQuestions.map((question) => (
                        <Card key={question.id}>
                            <CardContent className="pt-6 space-y-4">
                                <QuestionRouter
                                    question={question}
                                    value={answers[question.id] || ''}
                                    onChange={(value) => setAnswer(question.id, value)}
                                />
                                <ConditionalBlock
                                    question={question}
                                    allQuestions={form.questions}
                                    answers={answers}
                                    onAnswer={setAnswer}
                                />
                            </CardContent>
                        </Card>
                    ))}

                    {/* Error */}
                    {error && (
                        <Card className="border-destructive">
                            <CardContent className="pt-6">
                                <p className="text-destructive text-sm">{error}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Submit button */}
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            size="lg"
                            disabled={isSubmitting}
                            className="gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Надсилання...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Надіслати
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
