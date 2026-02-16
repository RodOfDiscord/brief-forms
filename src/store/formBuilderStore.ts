import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { QuestionInput, OptionInput, QuestionType } from '@/types/form';

interface FormBuilderState {
    title: string;
    description: string;
    slug: string;
    isPublished: boolean;
    questions: QuestionInput[];

    // Actions
    setTitle: (title: string) => void;
    setDescription: (description: string) => void;
    setSlug: (slug: string) => void;
    setIsPublished: (isPublished: boolean) => void;
    setQuestions: (questions: QuestionInput[]) => void;

    addQuestion: (parentQuestionId?: string | null, triggerOptionId?: string | null) => void;
    removeQuestion: (questionId: string) => void;
    updateQuestion: (questionId: string, updates: Partial<QuestionInput>) => void;
    reorderQuestions: (startIndex: number, endIndex: number) => void;

    addOption: (questionId: string) => void;
    removeOption: (questionId: string, optionId: string) => void;
    updateOption: (questionId: string, optionId: string, label: string) => void;

    reset: () => void;
    loadForm: (data: {
        title: string;
        description: string | null;
        slug: string;
        is_published: boolean;
        questions: QuestionInput[];
    }) => void;
}

const initialState = {
    title: '',
    description: '',
    slug: '',
    isPublished: false,
    questions: [] as QuestionInput[],
};

export const useFormBuilderStore = create<FormBuilderState>((set) => ({
    ...initialState,

    setTitle: (title) => set({ title }),
    setDescription: (description) => set({ description }),
    setSlug: (slug) => set({ slug }),
    setIsPublished: (isPublished) => set({ isPublished }),
    setQuestions: (questions) => set({ questions }),

    addQuestion: (parentQuestionId = null, triggerOptionId = null) =>
        set((state) => ({
            questions: [
                ...state.questions,
                {
                    id: uuidv4(),
                    label: '',
                    type: 'text' as QuestionType,
                    is_required: false,
                    order_index: state.questions.length,
                    parent_question_id: parentQuestionId || null,
                    trigger_option_id: triggerOptionId || null,
                    options: [],
                },
            ],
        })),

    removeQuestion: (questionId) =>
        set((state) => {
            // Remove the question and all its children recursively
            const idsToRemove = new Set<string>();
            const collectIds = (id: string) => {
                idsToRemove.add(id);
                state.questions
                    .filter((q) => q.parent_question_id === id)
                    .forEach((child) => collectIds(child.id));
            };
            collectIds(questionId);

            return {
                questions: state.questions
                    .filter((q) => !idsToRemove.has(q.id))
                    .map((q, idx) => ({ ...q, order_index: idx })),
            };
        }),

    updateQuestion: (questionId, updates) =>
        set((state) => ({
            questions: state.questions.map((q) =>
                q.id === questionId ? { ...q, ...updates } : q
            ),
        })),

    reorderQuestions: (startIndex, endIndex) =>
        set((state) => {
            const result = [...state.questions];
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);
            return {
                questions: result.map((q, idx) => ({ ...q, order_index: idx })),
            };
        }),

    addOption: (questionId) =>
        set((state) => ({
            questions: state.questions.map((q) =>
                q.id === questionId
                    ? {
                        ...q,
                        options: [
                            ...q.options,
                            {
                                id: uuidv4(),
                                label: '',
                                order_index: q.options.length,
                            } as OptionInput,
                        ],
                    }
                    : q
            ),
        })),

    removeOption: (questionId, optionId) =>
        set((state) => ({
            questions: state.questions
                .map((q) => {
                    if (q.id === questionId) {
                        return {
                            ...q,
                            options: q.options
                                .filter((o) => o.id !== optionId)
                                .map((o, idx) => ({ ...o, order_index: idx })),
                        };
                    }
                    // Also remove any child questions that triggered on this option
                    if (q.trigger_option_id === optionId) {
                        return null;
                    }
                    return q;
                })
                .filter(Boolean) as QuestionInput[],
        })),

    updateOption: (questionId, optionId, label) =>
        set((state) => ({
            questions: state.questions.map((q) =>
                q.id === questionId
                    ? {
                        ...q,
                        options: q.options.map((o) =>
                            o.id === optionId ? { ...o, label } : o
                        ),
                    }
                    : q
            ),
        })),

    reset: () => set(initialState),

    loadForm: (data) =>
        set({
            title: data.title,
            description: data.description || '',
            slug: data.slug,
            isPublished: data.is_published,
            questions: data.questions,
        }),
}));
