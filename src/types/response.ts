export interface Answer {
    id: string;
    response_id: string;
    question_id: string;
    value: string; // For multiple choice: comma-separated option IDs
}

export interface FormResponse {
    id: string;
    form_id: string;
    submitted_at: string;
    answers: Answer[];
}

// Input type for submitting a response
export interface ResponseInput {
    form_id: string;
    answers: AnswerInput[];
}

export interface AnswerInput {
    question_id: string;
    value: string;
}
