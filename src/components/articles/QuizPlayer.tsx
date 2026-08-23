import React, { useState } from 'react';
import type { QuizQuestion } from '../../types';
import { Share2, Check, RefreshCw } from 'lucide-react';

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

  const handleShare = () => {
    const score = calculateScore();
    const text = `🎯 I scored ${score}/${quiz.length} on the article quiz: "${lessonTitle}"!\nTest your knowledge here: ${shareUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Quiz: ${lessonTitle}`,
        text: text,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const score = calculateScore();
  const allAnswered = quiz.every((q) => userAnswers[q.id] !== undefined);

  return (
    <div
      className="quiz-player"
      style={{
        marginTop: '30px',
        padding: '24px',
        borderRadius: '16px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚡</span> 3-Question Micro-Quiz
        </h2>
        {submitted && (
          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 'bold',
              padding: '4px 12px',
              borderRadius: '20px',
              background: score === quiz.length ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              color: score === quiz.length ? '#16a34a' : '#ca8a04',
            }}
          >
            Score: {score} / {quiz.length}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {quiz.map((q, idx) => {
          const selectedOption = userAnswers[q.id];
          const isCorrect = selectedOption === q.correctIndex;

          return (
            <div
              key={q.id}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
              }}
            >
              <p style={{ fontWeight: '600', margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                {idx + 1}. {q.question}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {q.options.map((opt, optIdx) => {
                  let btnBg = 'var(--bg-secondary)';
                  let btnBorder = '1px solid var(--border)';
                  let btnColor = 'var(--text-primary)';

                  if (selectedOption === optIdx) {
                    btnBg = 'var(--accent)';
                    btnColor = 'white';
                    btnBorder = '1px solid var(--accent)';
                  }

                  if (submitted) {
                    if (optIdx === q.correctIndex) {
                      btnBg = 'rgba(34, 197, 94, 0.2)';
                      btnBorder = '1px solid #16a34a';
                      btnColor = 'var(--text-primary)';
                    } else if (selectedOption === optIdx) {
                      btnBg = 'rgba(239, 68, 68, 0.2)';
                      btnBorder = '1px solid #dc2626';
                      btnColor = 'var(--text-primary)';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      disabled={submitted}
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: btnBorder,
                        background: btnBg,
                        color: btnColor,
                        cursor: submitted ? 'default' : 'pointer',
                        fontSize: '0.95rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px',
                    borderRadius: '8px',
                    background: isCorrect ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.4',
                  }}
                >
                  <strong style={{ color: isCorrect ? '#16a34a' : '#dc2626' }}>
                    {isCorrect ? '✓ Correct!' : '✗ Incorrect.'}
                  </strong>{' '}
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              border: 'none',
              background: allAnswered ? 'var(--accent)' : 'var(--border)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: allAnswered ? 'pointer' : 'not-allowed',
            }}
          >
            Submit Answers
          </button>
        ) : (
          <>
            <button
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={16} /> Retake Quiz
            </button>

            <button
              onClick={handleShare}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--accent)',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              {copied ? 'Score Link Copied!' : 'Share Score'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
