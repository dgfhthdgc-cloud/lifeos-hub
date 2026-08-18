import React, { useState, useEffect } from 'react';
import { DetailedCourse, CourseModule, CourseLesson } from '../../types';
import { Storage } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Circle,
  Award,
  PlayCircle,
  Bookmark,
  ChevronRight,
  Clock,
  Sparkles,
  ArrowLeft,
  FileCheck,
  Zap,
} from 'lucide-react';
import { Progress } from '../ui/Progress';

export function LearnView() {
  const { user, addXp } = useAuth();
  const { showToast } = useNotifications();
  const [courses, setCourses] = useState<DetailedCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  useEffect(() => {
    setCourses(Storage.getDetailedCourses());
  }, []);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const handleToggleLesson = (courseId: string, lessonId: string) => {
    const res = Storage.toggleLessonCompletion(courseId, lessonId);
    if (res.course) {
      setCourses(Storage.getDetailedCourses());
      if (res.xpAwarded > 0) {
        addXp(res.xpAwarded, `Completed lesson in ${res.course.title}`);
        showToast(`Lesson completed! +${res.xpAwarded} XP`, 'success');
      }
      if (res.newCertificate) {
        showToast(`🏆 Congratulations! You earned a Certificate of Mastery in ${res.course.title}!`, 'success', 5000);
      }
    }
  };

  const handleToggleBookmark = (courseId: string, lessonId: string) => {
    const isBookmarked = Storage.toggleLessonBookmark(courseId, lessonId);
    setCourses(Storage.getDetailedCourses());
    showToast(isBookmarked ? 'Lesson bookmarked' : 'Bookmark removed', 'info');
  };

  const getCourseProgress = (course: DetailedCourse) => {
    const totalLessons = course.modules.flatMap((m) => m.lessons).length;
    const completedLessons = course.modules.flatMap((m) => m.lessons).filter((l) => l.completed).length;
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  // If a course is selected, show the course classroom/module explorer
  if (selectedCourse) {
    const allLessons = selectedCourse.modules.flatMap((m) => m.lessons);
    const currentLesson = allLessons.find((l) => l.id === selectedLessonId) || allLessons[0];
    const progress = getCourseProgress(selectedCourse);

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Course Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <button
            onClick={() => {
              setSelectedCourseId(null);
              setSelectedLessonId(null);
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course Academy
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500">Progress: {progress}%</span>
            <div className="w-32">
              <Progress value={progress} />
            </div>
            {selectedCourse.certificate && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Award className="w-3.5 h-3.5" />
                Certified
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Syllabus / Modules List */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {selectedCourse.domain}
                </span>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mt-2">{selectedCourse.title}</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{selectedCourse.tagline}</p>
              </div>

              {/* Modules Accordion */}
              <div className="space-y-3 pt-2">
                {selectedCourse.modules.map((module, mIdx) => (
                  <div key={module.id} className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      Module {mIdx + 1}: {module.title}
                    </div>
                    <div className="space-y-1">
                      {module.lessons.map((lesson) => {
                        const isCurrent = currentLesson?.id === lesson.id;
                        const isBookmarked = selectedCourse.bookmarkedLessons?.includes(lesson.id);

                        return (
                          <div
                            key={lesson.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all ${
                              isCurrent
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                                : 'bg-neutral-50 dark:bg-neutral-950/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            <button
                              onClick={() => setSelectedLessonId(lesson.id)}
                              className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                            >
                              <PlayCircle className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-emerald-500' : 'text-neutral-400'}`} />
                              <span className="truncate">{lesson.title}</span>
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <button
                                onClick={() => handleToggleBookmark(selectedCourse.id, lesson.id)}
                                className="text-neutral-400 hover:text-amber-500 p-1"
                              >
                                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                              </button>
                              <button
                                onClick={() => handleToggleLesson(selectedCourse.id, lesson.id)}
                                className="text-neutral-400 hover:text-emerald-500 p-1"
                              >
                                {lesson.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certificate Preview Card if Available */}
            {selectedCourse.certificate && (
              <div className="bg-gradient-to-br from-amber-500/10 via-neutral-900 to-neutral-950 border border-amber-500/30 rounded-2xl p-5 text-white space-y-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <Award className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Verified Credential</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedCourse.certificate.courseTitle}</h4>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    ID: {selectedCourse.certificate.credentialId}
                  </p>
                </div>
                <div className="text-[11px] text-neutral-300">
                  Issued to: <strong className="text-white">{selectedCourse.certificate.recipientName}</strong> on{' '}
                  {selectedCourse.certificate.issueDate}
                </div>
              </div>
            )}
          </div>

          {/* Active Lesson Reader & Workspace */}
          <div className="lg:col-span-2 space-y-6">
            {currentLesson ? (
              <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-start justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                      Lesson #{currentLesson.order || 1} • {currentLesson.durationMinutes} Mins
                    </span>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mt-2">{currentLesson.title}</h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{currentLesson.summary}</p>
                  </div>

                  <button
                    onClick={() => handleToggleLesson(selectedCourse.id, currentLesson.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                      currentLesson.completed
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-sm'
                    }`}
                  >
                    {currentLesson.completed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Completed (+{currentLesson.xpReward || 50} XP)
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Mark Complete (+{currentLesson.xpReward || 50} XP)
                      </>
                    )}
                  </button>
                </div>

                {/* Lesson Theory Content */}
                <div className="prose dark:prose-invert max-w-none text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed space-y-4">
                  <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Core Theory & Architectural Notes</h4>
                    <p className="whitespace-pre-line">{currentLesson.contentMarkdown || 'Lesson lecture content initialized in memory.'}</p>
                  </div>
                </div>

                {/* Code Snippet / Example if exists */}
                {currentLesson.codeSnippet && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Interactive Execution Example</div>
                    <pre className="bg-neutral-950 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-neutral-800">
                      <code>{currentLesson.codeSnippet}</code>
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center text-neutral-400 text-xs">
                Select a lesson from the syllabus to begin study.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Course Grid View
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-emerald-500" />
            Polymath Learning Academy
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Accelerated technical curricula with verifiable certificates of engineering mastery
          </p>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const progress = getCourseProgress(course);
          const totalLessons = course.modules.flatMap((m) => m.lessons).length;

          return (
            <div
              key={course.id}
              className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {course.domain}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono capitalize">
                    {course.difficulty}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">{course.title}</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                    {course.tagline}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>{totalLessons} Tactical Lessons</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{course.totalDurationHours}h</span>
                </div>
                <button
                  onClick={() => setSelectedCourseId(course.id)}
                  className="px-3.5 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span>Open Course</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
