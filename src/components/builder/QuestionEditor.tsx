'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import { QuestionTypeSelector } from './QuestionTypeSelector';
import { OptionsList } from './OptionsList';
import { ConditionalLogicEditor } from './ConditionalLogicEditor';
import type { QuestionInput, QuestionType } from '@/types/form';

interface QuestionEditorProps {
    question: QuestionInput;
    index: number;
    allQuestions: QuestionInput[];
    isConditional?: boolean;
    onUpdate: (questionId: string, updates: Partial<QuestionInput>) => void;
    onRemove: (questionId: string) => void;
    onAddOption: (questionId: string) => void;
    onRemoveOption: (questionId: string, optionId: string) => void;
    onUpdateOption: (questionId: string, optionId: string, label: string) => void;
    onAddConditionalQuestion: (
        parentQuestionId: string,
        triggerOptionId: string
    ) => void;
    dragHandleProps?: any;
}

export function QuestionEditor({
    question,
    index,
    allQuestions,
    isConditional = false,
    onUpdate,
    onRemove,
    onAddOption,
    onRemoveOption,
    onUpdateOption,
    onAddConditionalQuestion,
    dragHandleProps,
}: QuestionEditorProps) {
    const handleTypeChange = (type: QuestionType) => {
        onUpdate(question.id, {
            type,
            // Clear options when switching to text
            options: type === 'text' ? [] : question.options,
        });
    };

    return (
        <Card className={isConditional ? 'border-l-4 border-l-primary/30' : ''}>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
                <GripVertical
                    className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing"
                    {...dragHandleProps}
                />
                <span className="text-sm font-medium text-muted-foreground">
                    {isConditional ? '↳' : ''} Питання {index + 1}
                </span>
                <div className="flex-1" />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(question.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Question label */}
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Текст питання</Label>
                    <Textarea
                        value={question.label}
                        onChange={(e) =>
                            onUpdate(question.id, { label: e.target.value })
                        }
                        placeholder="Введіть текст питання..."
                        rows={2}
                        className="resize-y min-h-[60px]"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Question type */}
                    <QuestionTypeSelector
                        value={question.type}
                        onChange={handleTypeChange}
                    />

                    {/* Required toggle */}
                    <div className="flex items-end gap-2 pb-1">
                        <Checkbox
                            id={`required-${question.id}`}
                            checked={question.is_required}
                            onCheckedChange={(checked) =>
                                onUpdate(question.id, { is_required: checked as boolean })
                            }
                        />
                        <Label
                            htmlFor={`required-${question.id}`}
                            className="text-sm cursor-pointer"
                        >
                            Обов&apos;язкове
                        </Label>
                    </div>
                </div>

                {/* Options for choice questions */}
                {question.type !== 'text' && (
                    <OptionsList
                        options={question.options}
                        questionId={question.id}
                        onAdd={() => onAddOption(question.id)}
                        onRemove={(optionId) => onRemoveOption(question.id, optionId)}
                        onUpdate={(optionId, label) =>
                            onUpdateOption(question.id, optionId, label)
                        }
                    />
                )}

                {/* Conditional logic */}
                <ConditionalLogicEditor
                    question={question}
                    allQuestions={allQuestions}
                    onAddConditionalQuestion={onAddConditionalQuestion}
                    onRemoveQuestion={onRemove}
                />
            </CardContent>
        </Card>
    );
}
