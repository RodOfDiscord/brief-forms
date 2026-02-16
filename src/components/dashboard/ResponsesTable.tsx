import { useRouter } from 'next/navigation';
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
    const router = useRouter();

    // Sort logic and helper functions remain...
    const rootQuestions = questions
        .filter((q) => !q.parent_question_id)
        .sort((a, b) => a.order_index - b.order_index);

    const allQuestionsById = new Map(questions.map((q) => [q.id, q]));

    const getDisplayValue = (questionId: string, rawValue: string): string => {
        const question = allQuestionsById.get(questionId);
        if (!question) return rawValue;

        if (question.type === 'text') return rawValue;

        const optionIds = rawValue.split(',').map((s) => s.trim()).filter(Boolean);
        const labels = optionIds
            .map((optId) => question.options.find((o) => o.id === optId)?.label)
            .filter((label): label is string => label !== undefined);

        return labels.join(', ');
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
                        <TableRow
                            key={response.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => router.push(`/dashboard/forms/${response.form_id}/responses/${response.id}`)}
                        >
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                                {new Date(response.submitted_at).toLocaleString('uk-UA')}
                            </TableCell>
                            {rootQuestions.map((q) => {
                                const answer = response.answers.find(
                                    (a) => a.question_id === q.id
                                );
                                const display = answer
                                    ? getDisplayValue(q.id, answer.value)
                                    : '';
                                return (
                                    <TableCell key={q.id}>
                                        {display || '—'}
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