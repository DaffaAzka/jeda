import type { ContentStatus, ContentSource, LessonProgressStatus } from "@/app/generated/prisma/enums";
import type { SerializedEditorStateJson } from "@/lib/editor/validate-lexical";

export interface StudentLessonItem {
  id: string;
  title: string;
  summary: string | null;
  estMinutes: number;
  sortOrder: number;
  status: ContentStatus;
  progressStatus?: LessonProgressStatus;
  completedAt?: Date | null;
}

export interface StudentTopicItem {
  id: string;
  name: string;
  subtestId: string;
  subtestName: string;
  lessons: StudentLessonItem[];
  completedCount: number;
  totalCount: number;
}

export interface StudentSubtestItem {
  id: string;
  code: string;
  name: string;
  topics: StudentTopicItem[];
  completedLessons: number;
  totalLessons: number;
}

export interface ResumeLessonData {
  lessonId: string;
  lessonTitle: string;
  topicId: string;
  topicName: string;
  subtestName: string;
  estMinutes: number;
  lastViewedAt: Date;
}

export interface StudyHubData {
  resumeLesson: ResumeLessonData | null;
  recommendedLessons: Array<{
    lessonId: string;
    lessonTitle: string;
    topicId: string;
    topicName: string;
    subtestName: string;
    estMinutes: number;
    reason?: string | null;
  }>;
  subtests: StudentSubtestItem[];
  totalLessons: number;
  completedLessons: number;
}

export interface CheckQuestionOption {
  id: string;
  label: string;
  body: string;
  isCorrect: boolean;
}

export interface CheckQuestionData {
  id: string;
  stem: string;
  explanation: string | null;
  options: CheckQuestionOption[];
  sortOrder: number;
}

export interface LessonDetailData {
  id: string;
  topicId: string;
  topicName: string;
  subtestId: string;
  subtestName: string;
  title: string;
  summary: string | null;
  content: SerializedEditorStateJson | string;
  estMinutes: number;
  source: ContentSource;
  reviewedAt: Date | null;
  sortOrder: number;
  nextLessonId: string | null;
  prevLessonId: string | null;
  progress: {
    status: LessonProgressStatus;
    checkCorrect: number | null;
    checkTotal: number | null;
    completedAt: Date | null;
  } | null;
  checkQuestions: CheckQuestionData[];
}

export interface AdminLessonListItem {
  id: string;
  topicId: string;
  title: string;
  summary: string | null;
  estMinutes: number;
  sortOrder: number;
  status: ContentStatus;
  source: ContentSource;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  checkQuestionsCount: number;
}

export interface AdminTopicLessonsData {
  topic: {
    id: string;
    name: string;
    subtestId: string;
    subtestName: string;
  };
  lessons: AdminLessonListItem[];
  topicQuestions: Array<{
    id: string;
    stem: string;
    difficulty: number;
    isPublished: boolean;
  }>;
}
