import React, { useState } from 'react';
import type { QuizQuestion } from '../../types';
import { CheckCircle2, XCircle, Award, Share2, Check, RefreshCw } from 'lucide-react';

interface QuizPlayerProps {
  quiz: QuizQuestion[];
  lessonTitle: string;
  shareUrl: string;
  onComplete: (score: number, total: number) => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quiz,
  lessonTitle,
  shareUrl,
  onComplete,
}) => {
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: number }>({});
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!quiz || quiz.length === 0) return null;

  const handleSelectOption = (qId: string, optionIndex: number) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [qId]: optionIndex }));
  };

  const calculateScore = () => {
    let score = 0;
    quiz.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) {
        score += 1;
      }
    });
    return score;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const score = calculateScore();
    onComplete(score, quiz.length);
  };

  const handleReset = () => {
    setUserAnswers({});
    setSubmitted(false);
  };

  const handleShareToWhatsApp = () => {
    const score = calculateScore();
    const percent = Math.round((score / quiz.length) * 100);
    const stars = percent === 100 ? '⭐⭐⭐' : percent >= 60 ? '⭐⭐' : '⭐';

    const message = `⚡ I scored ${score}/${quiz.length} ${stars} on today's Quick Lesson "${lessonTitle}"!\n\nTake the 2-minute lesson & quiz here:\n${shareUrl}`;
    
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyShareLink = () => {
    const score = calculateScore();
    const percent = Math.round((score / quiz.length) * 100);
    const stars = percent === 100 ? '⭐⭐⭐' : percent >= 60 ? '⭐⭐' : '⭐';

    const text = `⚡ I scored ${score}/${quiz.length} ${stars} on today's Quick Lesson "${lessonTitle}"!\n${shareUrl}`;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const allAnswered = quiz.every((q) => userAnswers[q.id] !== undefined);
  const score = calculateScore();
  const percentage = Math.round((score / quiz.length) * 100);

  return (
    <div
      className="quiz-player"
      style={{
        marginTop: '30px',
        padding: '24px',
        borderRadius: '16px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award color="var(--accent)" size={24} />
          Quick 3-Question Quiz
        </h3>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
          {Object.keys(userAnswers).length} / {quiz.length} Answered
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {quiz.map((q, idx) => {
          const selected = userAnswers[q.id];
          const isCorrect = selected === q.correctIndex;

          return (
            <div
              key={q.id}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                {idx + 1}. {q.question}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {q.options.map((opt, optIdx) => {
                  let bg = 'var(--bg-primary)';
                  let borderColor = 'var(--border)';
                  let textColor = 'var(--text-primary)';

                  if (selected === optIdx) {
                    bg = 'var(--bg-tertiary)';
                    borderColor = 'var(--accent)';
                  }

                  if (submitted) {
                    if (optIdx === q.correctIndex) {
                      bg = '#e8f5e9';
                      borderColor = '#2e7d32';
                      textColor = '#1b5e20';
                    } else if (selected === optIdx && !isCorrect) {
                      bg = '#ffebee';
                      borderColor = '#c62828';
                      textColor = '#b71c1c';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      disabled={submitted}
                      style={{
                        textAlign: 'left',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`,
                        background: bg,
                        color: textColor,
                        fontWeight: selected === optIdx ? 'bold' : 'normal',
                        cursor: submitted ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{opt}</span>
                      {submitted && optIdx === q.correctIndex && (
                        <CheckCircle2 size={18} color="#2e7d32" style={{ marginLeft: '10px' }} />
                      )}
                      {submitted && selected === optIdx && !isCorrect && (
                        <XCircle size={18} color="#c62828" style={{ marginLeft: '10px' }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: isCorrect ? '#f1f8e9' : '#fff8e1',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    borderLeft: `4px solid ${isCorrect ? '#2e7d32' : '#f57c00'}`,
                  }}
                >
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          style={{
            marginTop: '20px',
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            border: 'none',
            background: allAnswered ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: allAnswered ? 'white' : 'var(--text-secondary)',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: allAnswered ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
          }}
        >
          {allAnswered ? 'Submit Quiz' : 'Answer all 3 questions to see score'}
        </button>
      ) : (
        <div
          style={{
            marginTop: '24px',
            padding: '20px',
            borderRadius: '12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            {percentage === 100 ? '⭐⭐⭐' : percentage >= 60 ? '⭐⭐' : '⭐'}
          </div>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', fontWeight: 'bold' }}>
            Score: {score} / {quiz.length} ({percentage}%)
          </h4>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 15px 0', fontSize: '0.95rem' }}>
            {percentage === 100
              ? '🎉 Outstanding! Perfect Score!'
              : percentage >= 60
              ? '👏 Great Effort! Keep Learning!'
              : '💪 Good Try! Review the lesson and try again!'}
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleShareToWhatsApp}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '20px',
                border: 'none',
                background: '#25D366',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              <Share2 size={18} /> Share Score to WhatsApp
            </button>
            <button
              onClick={handleCopyShareLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                background: copied ? '#2e7d32' : 'var(--bg-tertiary)',
                color: copied ? 'white' : 'var(--text-primary)',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={18} /> : <Share2 size={18} />}
              {copied ? 'Link Copied!' : 'Copy Result'}
            </button>
            <button
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={16} /> Retake Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
