export type UserRole = 'student' | 'recruiter' | 'admin';

export interface UserPublicProfile {
  uid: string;
  displayName: string;
  role: UserRole;
  headline?: string;
  bio?: string;
  targetCareerId?: string;
  avatarUrl?: string;
  company?: string;
  skillNames?: string[];
  skillLevels?: Record<string, number>;
  readinessScore?: number;
  learningHours?: number;
  updatedAt?: unknown;
}

export interface UserPrivateProfile {
  uid: string;
  email: string;
  phone?: string;
  location?: string;
  collegeOrOrg?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  weeklyHoursAvailable?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CareerSkillRequirement {
  name: string;
  targetLevel: number;
  priority: 'Core' | 'Important' | 'Recommended';
}

export interface CareerTrack {
  id: string;
  title: string;
  category: string;
  shortTagline: string;
  description: string;
  demandOutlook: string;
  avgEntryReadinessHours: number;
  requiredTechnicalSkills: CareerSkillRequirement[];
  requiredSoftSkills: string[];
  prerequisites: string[];
  recommendedTechnologies: string[];
  suggestedProjectIds: string[];
  interviewTopics: string[];
}

export interface RoadmapLesson {
  id: string;
  title: string;
  durationMinutes: number;
  practicalTask: string;
}

export interface RoadmapStage {
  stageNumber: number;
  title: string;
  objective: string;
  estimatedHours: number;
  topics: string[];
  lessons: RoadmapLesson[];
  recommendedResourceTitle?: string;
}

export interface RoadmapDocument {
  id: string;
  uid: string;
  careerId: string;
  careerTitle: string;
  experienceLevel?: string;
  weeklyHours?: number;
  stages: RoadmapStage[];
  completedLessonIds: string[];
  progressPercent: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  category: string;
  skillTags: string[];
  resourceType: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  url: string;
  estimatedMinutes: number;
  provider?: string;
}

export interface QuizSummary {
  id: string;
  title: string;
  careerId: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeLimitSeconds: number;
  questionCount: number;
}

export interface QuizAttemptRecord {
  id: string;
  uid: string;
  quizId: string;
  quizTitle: string;
  careerId: string;
  difficulty?: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  durationSeconds?: number;
  createdAt?: unknown;
}

export interface ResumeDataShape {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  links: string;
  summary: string;
  technicalSkills: string[];
  softSkills: string[];
  education: Array<{ school: string; degree: string; year: string; gpa?: string }>;
  experiences: Array<{ company: string; role: string; duration: string; highlights: string }>;
  projects: Array<{ name: string; stack: string; description: string }>;
  certifications: string[];
  achievements: string[];
}

export interface ResumeDocument {
  id: string;
  uid: string;
  title: string;
  template: 'executive' | 'technical' | 'academic';
  data: ResumeDataShape;
  aiSuggestions?: string;
  updatedAt?: unknown;
}

export interface InterviewQuestion {
  id: string;
  careerId: string;
  category: 'Technical' | 'HR' | 'Role-Specific';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  question: string;
  sampleAnswer: string;
  keySignals: string[];
}

export interface InterviewSessionRecord {
  id: string;
  uid: string;
  careerId: string;
  question: string;
  category?: string;
  difficulty?: string;
  userAnswer: string;
  aiFeedback?: string;
  score: number;
  durationSeconds?: number;
  createdAt?: unknown;
}

export interface ProjectBlueprint {
  id: string;
  title: string;
  careerId: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  requiredSkills: string[];
  techStack: string[];
  objectives: string[];
  implementationSteps: string[];
  expectedOutcome: string;
  estimatedHours: number;
}

export interface ProjectProgressRecord {
  id: string;
  uid: string;
  projectId: string;
  title: string;
  careerId?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  githubUrl?: string;
  notes?: string;
  updatedAt?: unknown;
}

export interface JobListing {
  id: string;
  recruiterUid: string;
  company: string;
  title: string;
  careerId: string;
  location?: string;
  employmentType?: string;
  experienceLevel?: string;
  salaryRange?: string;
  description: string;
  requiredSkills: string[];
  status: 'open' | 'closed';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface JobApplicationRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  recruiterUid: string;
  applicantUid: string;
  applicantName: string;
  applicantHeadline?: string;
  applicantSkills?: string[];
  matchScore: number;
  coverNote?: string;
  status: 'submitted' | 'shortlisted' | 'interview' | 'rejected' | 'accepted';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CommunityPostRecord {
  id: string;
  authorUid: string;
  authorName: string;
  authorRole?: string;
  category: 'achievement' | 'question' | 'resource' | 'discussion';
  title: string;
  content: string;
  tags?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface NotificationRecord {
  id: string;
  uid: string;
  type: 'roadmap' | 'quiz' | 'job' | 'application' | 'community' | 'achievement' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt?: unknown;
}

export interface AIConversationRecord {
  id: string;
  uid: string;
  title: string;
  mode: 'deep' | 'fast';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AIMessageRecord {
  id: string;
  uid: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  createdAt?: unknown;
}
