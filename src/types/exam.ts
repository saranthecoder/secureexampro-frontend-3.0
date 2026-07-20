export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  rollNumber?: string;
}

export interface Question {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  marks: number;
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
