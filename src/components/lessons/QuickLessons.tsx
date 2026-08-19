import React, { useState, useEffect, useCallback } from 'react';
import type { LessonTopic, MicroLesson, LessonProgressMap } from '../../types';
import { LessonArchive } from './LessonArchive';
import { LessonViewer } from './LessonViewer';
import { parseRoute, getQuickLessonUrlForRoute } from '../../utils/route';
import { Loader2 } from 'lucide-react';

export const QuickLessons: React.FC = () => {
  const [topics, setTopics] = useState<LessonTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<LessonTopic | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<MicroLesson | null>(null);
  const [loading, setLoading] = useState(true);

  const [progressMap, setProgressMap] = useState<LessonProgressMap>(() => {
    const saved = localStorage.getItem('lesson-progress');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse lesson progress:', e);
      }
    }
    return {};
  });

  const syncRouteWithState = useCallback((allTopics: LessonTopic[]) => {
    const route = parseRoute();
    if (route.mode !== 'lessons') return;

    if (!route.topicId) {
      setSelectedTopic(null);
      setSelectedLesson(null);
      return;
    }

    const foundTopic = allTopics.find((t) => t.id === route.topicId);
    if (foundTopic) {
      setSelectedTopic(foundTopic);
      if (route.lessonId) {
        const foundLesson = foundTopic.lessons.find((l) => l.id === route.lessonId);
        if (foundLesson) {
          setSelectedLesson(foundLesson);
        } else if (foundTopic.lessons.length > 0) {
          setSelectedLesson(foundTopic.lessons[0]);
        }
      } else if (foundTopic.lessons.length > 0) {
        setSelectedLesson(foundTopic.lessons[0]);
      }
    }
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}lessons/lessons-catalog.json?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data: LessonTopic[]) => {
        setTopics(data);
        syncRouteWithState(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load lessons catalog:', err);
        setLoading(false);
      });
  }, [syncRouteWithState]);

  useEffect(() => {
    const handlePopState = () => {
      syncRouteWithState(topics);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [topics, syncRouteWithState]);

  const handleSelectLesson = (topic: LessonTopic, lesson: MicroLesson) => {
    setSelectedTopic(topic);
    setSelectedLesson(lesson);
    window.history.pushState(null, '', getQuickLessonUrlForRoute(topic.id, lesson.id));
  };

  const handleBackToArchive = () => {
    setSelectedTopic(null);
    setSelectedLesson(null);
    window.history.pushState(null, '', getQuickLessonUrlForRoute(null));
  };

  const handleCompleteQuiz = (score: number, total: number) => {
    if (!selectedLesson) return;

    setProgressMap((prev) => {
      const updated = {
        ...prev,
        [selectedLesson.id]: {
          completed: true,
          score,
          total,
          lastAttemptTime: Date.now(),
        },
      };
      localStorage.setItem('lesson-progress', JSON.stringify(updated));
      return updated;
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--accent)" />
      </div>
    );
  }

  if (selectedTopic && selectedLesson) {
    return (
      <LessonViewer
        topic={selectedTopic}
        lesson={selectedLesson}
        onNavigateLesson={(nextLesson) => handleSelectLesson(selectedTopic, nextLesson)}
        onBackToArchive={handleBackToArchive}
        onCompleteQuiz={handleCompleteQuiz}
      />
    );
  }

  return (
    <LessonArchive
      topics={topics}
      progressMap={progressMap}
      onSelectLesson={handleSelectLesson}
    />
  );
};
