'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { FormResponse } from '@/types/response';
import type { Question } from '@/types/form';

interface ResponsesTableProps {
    responses: FormResponse[];
    questions: Question[];
}

export function ResponsesTable({ responses, questions }: ResponsesTableProps) {
    // Get root questions (without parent) sorted by order
    const rootQuestions = questions
        .filter((q) => !q.parent_question_id)
        .sort((a, b) => a.order_index - b.order_index);

    const allQuestionsById = new Map(questions.map((q) => [q.id, q]));

    const getDisplayValue = (questionId: string, rawValue: string): string => {
        const question = allQuestionsById.get(questionId);
        if (!question) return rawValue;

        if (question.type === 'text') return rawValue;

        // For choice questions, resolve option labels
        const optionIds = rawValue.split(',').map((s) => s.trim()).filter(Boolean);
        const labels = optionIds
            .map((optId) => {
                const option = question.options.find((o) => o.id === optId);
                return option?.label || optId;
            })
            .join(', ');

        return labels;
    };

    if (responses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg font-medium text-muted-foreground">
                    Відповідей ще немає
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead className="w-[180px]">Дата</TableHead>
                        {rootQuestions.map((q) => (
                            <TableHead key={q.id} className="min-w-[150px]">
                                {q.label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {responses.map((response, index) => (
                        <TableRow key={response.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                                {new Date(response.submitted_at).toLocaleString('uk-UA')}
                            </TableCell>
                            {rootQuestions.map((q) => {
                                const answer = response.answers.find(
                                    (a) => a.question_id === q.id
                                );
                                return (
                                    <TableCell key={q.id}>
                                        {answer
                                            ? getDisplayValue(q.id, answer.value)
                                            : '—'}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
