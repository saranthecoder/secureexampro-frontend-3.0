export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'admin' | 'examiner' | 'student';
  rollNumber?: string;
  registerId?: string;
  pin?: string;
  isPinUpdated?: boolean;
  createdBy?: string;
  loginTimestamp?: number;
}

export interface TestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
  isHidden: boolean;
  weightage?: number;
}

export interface StarterTemplates {
  java?: string;
  python?: string;
  cpp?: string;
  c?: string;
  javascript?: string;
}

export interface Question {
  id: string;
  question: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: string;
  marks: number;
  questionType?: 'MCQ' | 'MSQ' | 'FIB' | 'NUM' | 'DES' | 'CODING';
  starterTemplates?: StarterTemplates;
  testCases?: TestCase[];
}

export interface Exam {
  id: string;
  title: string;
  code: string;
  duration: number; // minutes
  totalMarks: number;
  startTime: string;
  endTime: string;
  questions: Question[];
  status: 'upcoming' | 'active' | 'completed';
  assessmentType?: 'standard' | 'online_coding' | 'paper_code' | 'coding_hybrid';
  createdBy?: string;
  isResultReleased?: boolean;
}

export interface ExamResult {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  examId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  tabSwitchCount: number;
  status: 'completed' | 'disqualified' | 'in-progress';
  submittedAt: string;
}

export interface ExamAnswer {
  questionId: string;
  selectedOption: string | null;
}

export interface ActiveStudent {
  studentId: string;
  studentName: string;
  status: 'active' | 'tab-switched' | 'disqualified';
  tabSwitchCount: number;
  joinedAt: string;
}
