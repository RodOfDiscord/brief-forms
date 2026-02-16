'use client';

import type { Question } from '@/types/form';
import { TextQuestion } from './TextQuestion';
import { SingleChoiceQuestion } from './SingleChoiceQuestion';
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion';

interface QuestionRouterProps {
    question: Question;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function QuestionRouter({ question, value, onChange, disabled }: QuestionRouterProps) {
    switch (question.type) {
        case 'text':
            return <TextQuestion question={question} value={value} onChange={onChange} disabled={disabled} />;
        case 'single_choice':
            return (
                <SingleChoiceQuestion
                    question={question}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                />
            );
        case 'multiple_choice':
            return (
                <MultipleChoiceQuestion
                    question={question}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                />
            );
        default:
            return null;
    }
}
