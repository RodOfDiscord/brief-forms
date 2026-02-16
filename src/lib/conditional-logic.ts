import type { Question } from '@/types/form';

/**
 * Given all questions for a form and the current answers,
 * returns only the questions that should be visible.
 *
 * A question is visible if:
 * 1. It has no parent (root-level question), OR
 * 2. Its parent's trigger_option_id is included in the current answer for that parent question.
 *
 * For single_choice: answer is the selected option ID.
 * For multiple_choice: answer is comma-separated option IDs.
 */
export function getVisibleQuestions(
    allQuestions: Question[],
    currentAnswers: Record<string, string>
): Question[] {
    const visible: Question[] = [];

    for (const question of allQuestions) {
        if (isQuestionVisible(question, allQuestions, currentAnswers)) {
            visible.push(question);
        }
    }

    return visible;
}

function isQuestionVisible(
    question: Question,
    allQuestions: Question[],
    currentAnswers: Record<string, string>
): boolean {
    // Root-level questions are always visible
    if (!question.parent_question_id || !question.trigger_option_id) {
        return true;
    }

    // Find the parent question
    const parentQuestion = allQuestions.find(
        (q) => q.id === question.parent_question_id
    );
    if (!parentQuestion) return false;

    // Check if the parent question itself is visible (recursive)
    if (!isQuestionVisible(parentQuestion, allQuestions, currentAnswers)) {
        return false;
    }

    // Check if the parent's answer includes the trigger option
    const parentAnswer = currentAnswers[parentQuestion.id];
    if (!parentAnswer) return false;

    // For multiple_choice, the answer is comma-separated option IDs
    const selectedOptionIds = parentAnswer.split(',').map((s) => s.trim());
    return selectedOptionIds.includes(question.trigger_option_id);
}

/**
 * Build a tree structure from flat questions array.
 * Returns root questions with `children` populated recursively.
 */
export function buildQuestionTree(questions: Question[]): Question[] {
    const rootQuestions = questions.filter((q) => !q.parent_question_id);

    function attachChildren(parent: Question): Question {
        const children = questions
            .filter((q) => q.parent_question_id === parent.id)
            .sort((a, b) => a.order_index - b.order_index)
            .map((child) => attachChildren(child));

        return { ...parent, children };
    }

    return rootQuestions
        .sort((a, b) => a.order_index - b.order_index)
        .map((q) => attachChildren(q));
}
