'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Plus, Save, Loader2 } from 'lucide-react';
import { QuestionEditor } from './QuestionEditor';
import { SortableQuestion } from './SortableQuestion';
import { useFormBuilder } from '@/hooks/useFormBuilder';
import { useEffect, useState } from 'react';
import type { Form } from '@/types/form';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface FormBuilderProps {
    existingForm?: Form;
}

export function FormBuilder({ existingForm }: FormBuilderProps) {
    const {
        title,
        description,
        slug,
        isPublished,
        questions,
        setTitle,
        setDescription,
        setSlug,
        setIsPublished,
        addQuestion,
        removeQuestion,
        updateQuestion,
        reorderQuestions,
        addOption,
        removeOption,
        updateOption,
        isSaving,
        error,
        save,
        loadForm,
        reset,
    } = useFormBuilder(existingForm?.id);

    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = rootQuestions.findIndex((q) => q.id === active.id);
            const newIndex = rootQuestions.findIndex((q) => q.id === over.id);

            // We need to map these root indices back to indices in the full questions array
            const fullOldIndex = questions.findIndex((q) => q.id === active.id);
            const fullNewIndex = questions.findIndex((q) => q.id === over.id);

            reorderQuestions(fullOldIndex, fullNewIndex);
        }
    };

    useEffect(() => {
        if (existingForm) {
            loadForm({
                title: existingForm.title,
                description: existingForm.description,
                slug: existingForm.slug,
                is_published: existingForm.is_published,
                questions: existingForm.questions.map((q) => ({
                    id: q.id,
                    label: q.label,
                    type: q.type,
                    is_required: q.is_required,
                    order_index: q.order_index,
                    parent_question_id: q.parent_question_id,
                    trigger_option_id: q.trigger_option_id,
                    options: q.options.map((o) => ({
                        id: o.id,
                        label: o.label,
                        order_index: o.order_index,
                    })),
                })),
            });
        } else {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingForm?.id]);

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^a-zа-яіїєґ0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleTitleChange = (value: string) => {
        setTitle(value);
        if (!existingForm) {
            setSlug(generateSlug(value));
        }
    };

    // Root questions (no parent)
    const rootQuestions = questions
        .filter((q) => !q.parent_question_id)
        .sort((a, b) => a.order_index - b.order_index);

    // Conditional questions
    const conditionalQuestions = questions.filter(
        (q) => q.parent_question_id
    );

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Form metadata */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {existingForm ? 'Редагувати форму' : 'Нова форма'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Назва форми</Label>
                        <Input
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="Введіть назву форми..."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Опис</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Опис форми (необов'язково)"
                            rows={3}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Slug (URL)</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">/forms/</span>
                            <Input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="my-form"
                                className="flex-1"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="is-published"
                            checked={isPublished}
                            onCheckedChange={(checked) =>
                                setIsPublished(checked as boolean)
                            }
                        />
                        <Label htmlFor="is-published" className="cursor-pointer">
                            Опублікувати форму
                        </Label>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            {/* Questions */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Питання</h3>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => addQuestion()}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Додати питання
                    </Button>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={rootQuestions.map((q) => q.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {rootQuestions.map((question, index) => (
                            <div key={question.id} className="space-y-2">
                                <SortableQuestion
                                    question={question}
                                    index={index}
                                    allQuestions={questions}
                                    onUpdate={updateQuestion}
                                    onRemove={removeQuestion}
                                    onAddOption={addOption}
                                    onRemoveOption={removeOption}
                                    onUpdateOption={updateOption}
                                    onAddConditionalQuestion={addQuestion}
                                >
                                    {/* Render conditional child editors inside the sortable item */}
                                    {conditionalQuestions
                                        .filter((cq) => cq.parent_question_id === question.id)
                                        .map((childQ, cIndex) => (
                                            <div key={childQ.id} className="ml-6 mt-2">
                                                <QuestionEditor
                                                    question={childQ}
                                                    index={cIndex}
                                                    allQuestions={questions}
                                                    isConditional
                                                    onUpdate={updateQuestion}
                                                    onRemove={removeQuestion}
                                                    onAddOption={addOption}
                                                    onRemoveOption={removeOption}
                                                    onUpdateOption={updateOption}
                                                    onAddConditionalQuestion={addQuestion}
                                                />
                                            </div>
                                        ))}
                                </SortableQuestion>
                            </div>
                        ))}
                    </SortableContext>
                </DndContext>

                {questions.length === 0 && (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground">
                                Додайте перше питання до форми
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {/* Save */}
            <div className="flex justify-end gap-3">
                <Button
                    onClick={save}
                    disabled={isSaving}
                    size="lg"
                    className="gap-2"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Збереження...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Зберегти
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
