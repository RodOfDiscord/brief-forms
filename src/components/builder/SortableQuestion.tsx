'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuestionEditor } from './QuestionEditor';
import type { QuestionInput } from '@/types/form';

interface SortableQuestionProps {
    question: QuestionInput;
    index: number;
    allQuestions: QuestionInput[];
    onUpdate: (questionId: string, updates: Partial<QuestionInput>) => void;
    onRemove: (questionId: string) => void;
    onAddOption: (questionId: string) => void;
    onRemoveOption: (questionId: string, optionId: string) => void;
    onUpdateOption: (questionId: string, optionId: string, label: string) => void;
    onAddConditionalQuestion: (
        parentQuestionId: string,
        triggerOptionId: string
    ) => void;
    children?: React.ReactNode;
}

export function SortableQuestion(props: SortableQuestionProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
            <QuestionEditor
                {...props}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
            {props.children}
        </div>
    );
}
