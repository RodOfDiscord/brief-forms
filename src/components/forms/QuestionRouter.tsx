'use client';

import type { Question } from '@/types/form';
import { TextQuestion } from './TextQuestion';
import { SingleChoiceQuestion } from './SingleChoiceQuestion';
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion';

interface QuestionRouterProps {
    question: Question;
    value: string;
    onChange: (value: string) => void;
}

export function QuestionRouter({ question, value, onChange }: QuestionRouterProps) {
    switch (question.type) {
        case 'text':
            return <TextQuestion question={question} value={value} onChange={onChange} />;
        case 'single_choice':
            return (
                <SingleChoiceQuestion question={question} value={value} onChange={onChange} />
            );
        case 'multiple_choice':
            return (
                <MultipleChoiceQuestion question={question} value={value} onChange={onChange} />
            );
        default:
            return null;
    }
}
