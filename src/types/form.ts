export type QuestionType = 'text' | 'single_choice' | 'multiple_choice';

export interface Option {
  id: string;
  question_id: string;
  label: string;
  order_index: number;
}

export interface Question {
  id: string;
  form_id: string;
  label: string;
  type: QuestionType;
  is_required: boolean;
  order_index: number;
  /** If set, this question only appears when the parent question's trigger option is selected */
  parent_question_id: string | null;
  /** The option from the parent question that triggers this question */
  trigger_option_id: string | null;
  options: Option[];
  /** Child questions that depend on this question (loaded recursively) */
  children?: Question[];
}

export interface Form {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  is_published: boolean;
  created_at: string;
  questions: Question[];
}

export interface FormListItem {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  created_at: string;
  response_count: number;
}

// Builder-specific types (for creating/editing forms)
export interface QuestionInput {
  id: string; // temp client-side ID (uuid)
  label: string;
  type: QuestionType;
  is_required: boolean;
  order_index: number;
  parent_question_id: string | null;
  trigger_option_id: string | null;
  options: OptionInput[];
}

export interface OptionInput {
  id: string; // temp client-side ID (uuid)
  label: string;
  order_index: number;
}

export interface FormInput {
  title: string;
  description: string | null;
  slug: string;
  is_published: boolean;
  questions: QuestionInput[];
}
