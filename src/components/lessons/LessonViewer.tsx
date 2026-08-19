import React, { useState } from 'react';
import type { MicroLesson, LessonTopic } from '../../types';
import { ArrowLeft, ArrowRight, Globe, List } from 'lucide-react';
import { QuizPlayer } from './QuizPlayer';
import { getQuickLessonUrlForRoute } from '../../utils/route';

interface LessonViewerProps {
  topic: LessonTopic;
  lesson: MicroLesson;
  onNavigateLesson: (nextLesson: MicroLesson) => void;
  onBackToArchive: () => void;
  onCompleteQuiz: (score: number, total: number) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'english', label: 'English' },
  { code: 'sanskrit', label: 'संस्कृतम्' },
  { code: 'kannada', label: 'ಕನ್ನಡ' },
  { code: 'hindi', label: 'हिंदी' },
  { code: 'tamil', label: 'தமிழ்' },
  { code: 'telugu', label: 'తెలుగు' },
];

export const LessonViewer: React.FC<LessonViewerProps> = ({
  topic,
  lesson,
  onNavigateLesson,
  onBackToArchive,
  onCompleteQuiz,
}) => {
  const [currentLang, setCurrentLang] = useState<string>(() => {
    return localStorage.getItem('lesson-language') || 'english';
  });

  const handleLanguageChange = (lang: string) => {
    setCurrentLang(lang);
    localStorage.setItem('lesson-language', lang);
  };

  const currentIndex = topic.lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? topic.lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < topic.lessons.length - 1 ? topic.lessons[currentIndex + 1] : null;

  // Resolve localized content if available for current language
  let localizedData = lesson.localized?.[currentLang];
  if (!localizedData && currentLang !== 'english') {
    // Fallback to default lesson content if requested language is not present
    localizedData = {
      title: lesson.title,
      summary: lesson.summary,
      content: lesson.content,
      quiz: lesson.quiz,
    };
  }

  const activeTitle = localizedData?.title || lesson.title;
  const activeSummary = localizedData?.summary || lesson.summary;
  const activeContent = localizedData?.content || lesson.content;
  const activeQuiz = localizedData?.quiz || lesson.quiz;

  const currentUrl = window.location.origin + getQuickLessonUrlForRoute(topic.id, lesson.id);

  return (
    <div
      className="lesson-viewer"
      style={{
        maxWidth: '850px',
        margin: '0 auto',
        padding: '20px',
        minHeight: '100vh',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <button
          onClick={onBackToArchive}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: 'var(--bg-tertiary)',
            border: 'none',
            borderRadius: '20px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem',
          }}
        >
          <List size={16} /> Topics Archive
        </button>

        {/* 6-Language Pill Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            background: 'var(--bg-primary)',
            padding: '4px 8px',
            borderRadius: '20px',
            border: '1px solid var(--border)',
          }}
        >
          <Globe size={16} color="var(--accent)" style={{ marginLeft: '4px' }} />
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              style={{
                padding: '4px 10px',
                borderRadius: '14px',
                border: 'none',
                background: currentLang === lang.code ? 'var(--accent)' : 'transparent',
                color: currentLang === lang.code ? 'white' : 'var(--text-primary)',
                fontWeight: currentLang === lang.code ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.15s ease',
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lesson Topic Subtitle */}
      <div style={{ marginBottom: '15px' }}>
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 'bold',
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {topic.title} • Lesson {currentIndex + 1} of {topic.lessons.length}
        </span>
      </div>

      {/* Main Lesson Card */}
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        <h1
          style={{
            margin: '0 0 12px 0',
            fontSize: '1.6rem',
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            lineHeight: 1.3,
          }}
        >
          {activeTitle}
        </h1>

        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          {activeSummary}
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '15px 0 20px 0' }} />

        {/* Lesson Body Content */}
        <div
          style={{
            fontSize: '1.1rem',
            lineHeight: 1.7,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-line',
          }}
        >
          {activeContent}
        </div>
      </div>

      {/* Interactive 3-Question Quiz */}
      <QuizPlayer
        quiz={activeQuiz}
        lessonTitle={activeTitle}
        shareUrl={currentUrl}
        onComplete={onCompleteQuiz}
      />

      {/* Sequential Lesson Navigation Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '15px',
          marginTop: '30px',
          marginBottom: '40px',
        }}
      >
        {prevLesson ? (
          <button
            onClick={() => onNavigateLesson(prevLesson)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            <ArrowLeft size={18} /> Previous Lesson
          </button>
        ) : (
          <div />
        )}

        {nextLesson ? (
          <button
            onClick={() => onNavigateLesson(nextLesson)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            Next Lesson <ArrowRight size={18} />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};
