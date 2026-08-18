import React from 'react';
import { CourseSummary, RoutePath } from '../../types';
import { BookOpen, ArrowRight, CheckCircle2, GraduationCap } from 'lucide-react';
import { Progress } from '../ui/Progress';

interface LearningWidgetProps {
  courses: CourseSummary[];
  onNavigate: (path: RoutePath) => void;
}

export function LearningWidget({ courses, onNavigate }: LearningWidgetProps) {
  return (
    <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Active Mastery</h2>
            <p className="text-[11px] text-neutral-400">Technical & Systems Curricula</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('/learn')}
          className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
        >
          <span>Courses</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {courses.length === 0 ? (
          <div className="text-center py-6 text-neutral-400 text-xs">
            No enrolled courses yet. Explore the learning matrix!
          </div>
        ) : (
          courses.slice(0, 3).map((course) => (
            <div
              key={course.id}
              onClick={() => onNavigate('/learn')}
              className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 hover:border-indigo-500/30 transition-all cursor-pointer space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">{course.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400">
                    <span>{course.category}</span>
                    <span>•</span>
                    <span className="truncate max-w-[140px]">{course.currentModule}</span>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono text-indigo-500">{course.progress}%</span>
              </div>

              <div className="space-y-1">
                <Progress value={course.progress} />
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-indigo-500" />
                    <span>{course.completedLessons}/{course.totalLessons} Lessons</span>
                  </span>
                  <span>{course.progress >= 100 ? 'Certified' : 'In Study'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
