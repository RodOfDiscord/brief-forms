'use client';

import { Button } from '@/components/ui/button';
import { GitBranch, Plus, Trash2 } from 'lucide-react';
import type { QuestionInput } from '@/types/form';

interface ConditionalLogicEditorProps {
    question: QuestionInput;
    allQuestions: QuestionInput[];
    onAddConditionalQuestion: (
        parentQuestionId: string,
        triggerOptionId: string
    ) => void;
    onRemoveQuestion: (questionId: string) => void;
}

export function ConditionalLogicEditor({
    question,
    allQuestions,
    onAddConditionalQuestion,
    onRemoveQuestion,
}: ConditionalLogicEditorProps) {
    // Only show for choice questions with options
    if (
        question.type === 'text' ||
        question.options.length === 0
    ) {
        return null;
    }

    // Find child questions for this parent
    const childQuestions = allQuestions.filter(
        (q) => q.parent_question_id === question.id
    );

    // Group children by trigger option
    const childrenByOption = new Map<string, QuestionInput[]>();
    for (const child of childQuestions) {
        if (child.trigger_option_id) {
            const existing = childrenByOption.get(child.trigger_option_id) || [];
            existing.push(child);
            childrenByOption.set(child.trigger_option_id, existing);
        }
    }

    return (
        <div className="mt-3 space-y-3 border-t pt-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <GitBranch className="h-4 w-4" />
                <span>Умовна логіка</span>
            </div>

            {question.options.map((option) => {
                const children = childrenByOption.get(option.id) || [];
                return (
                    <div key={option.id} className="ml-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                Якщо обрано: <strong>&quot;{option.label || `Варіант`}&quot;</strong>
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() =>
                                    onAddConditionalQuestion(question.id, option.id)
                                }
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Додати питання
                            </Button>
                        </div>
                        {children.length > 0 && (
                            <div className="space-y-1 ml-2 border-l-2 border-primary/20 pl-3">
                                {children.map((child) => (
                                    <div
                                        key={child.id}
                                        className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs"
                                    >
                                        <span className="truncate">
                                            {child.label || 'Без назви'}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                            onClick={() => onRemoveQuestion(child.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
