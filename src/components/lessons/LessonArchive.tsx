import React, { useState } from 'react';
import type { LessonTopic, MicroLesson, LessonProgressMap } from '../../types';
import { Search, CheckCircle2, Zap, ArrowRight } from 'lucide-react';

interface LessonArchiveProps {
  topics: LessonTopic[];
  progressMap: LessonProgressMap;
  onSelectLesson: (topic: LessonTopic, lesson: MicroLesson) => void;
}

export const LessonArchive: React.FC<LessonArchiveProps> = ({
  topics,
  progressMap,
  onSelectLesson,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTopics = topics.filter((topic) => {
    const matchTopic = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       topic.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchLesson = topic.lessons.some((l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.summary.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchTopic || matchLesson;
  });

  return (
    <div
      className="lesson-archive"
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '20px',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 10px 0' }}>
          <Zap size={32} color="var(--accent)" />
          Quick Lessons & Questionnaire Archive
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: 0 }}>
          Bite-sized 3-minute daily lessons with interactive quizzes designed for busy office-goers.
        </p>

        {/* Search Bar */}
        <div style={{ marginTop: '20px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search topics, lessons, or concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 45px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '1rem',
            }}
          />
        </div>
      </header>

      {/* Topics List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {filteredTopics.map((topic) => (
          <div
            key={topic.id}
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: 'var(--bg-tertiary)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                }}
              >
                {topic.category || 'Topic Course'}
              </span>
              <h2 style={{ margin: '10px 0 6px 0', fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {topic.title}
              </h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                {topic.description}
              </p>
            </div>

            {/* Lessons List in Topic */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topic.lessons.map((lesson, idx) => {
                const prog = progressMap[lesson.id];
                const isCompleted = prog?.completed;
                const score = prog?.score ?? 0;
                const total = prog?.total ?? 0;
                const stars = isCompleted && total > 0 ? (Math.round((score / total) * 100) === 100 ? '⭐⭐⭐' : '⭐⭐') : null;

                return (
                  <div
                    key={lesson.id}
                    onClick={() => onSelectLesson(topic, lesson)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: '10px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-in-out',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isCompleted ? '#e8f5e9' : 'var(--bg-tertiary)',
                          color: isCompleted ? '#2e7d32' : 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          flexShrink: 0,
                        }}
                      >
                        {isCompleted ? <CheckCircle2 size={20} color="#2e7d32" /> : idx + 1}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lesson.title}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lesson.summary}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '15px', flexShrink: 0 }}>
                      {isCompleted && (
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#2e7d32', background: '#e8f5e9', padding: '4px 10px', borderRadius: '12px' }}>
                          {score}/{total} {stars}
                        </span>
                      )}
                      <button
                        style={{
                          padding: '6px 14px',
                          borderRadius: '16px',
                          border: 'none',
                          background: 'var(--accent)',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isCompleted ? 'Review' : 'Start'} <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredTopics.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
            No topics or lessons match your search query.
          </div>
        )}
      </div>
    </div>
  );
};
