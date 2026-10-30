import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Sparkles, 
  Award,
  ChevronDown
} from 'lucide-react';
import { 
  LETTER_EXERCISES, 
  type LetterExercise 
} from '../../data/letterWritingData';

interface LetterWritingExerciseProps {
  onScoreEarned?: (score: number) => void;
  onScoreUpdate?: (score: number) => void;
}

export const LetterWritingExercise: React.FC<LetterWritingExerciseProps> = ({ 
  onScoreEarned,
  onScoreUpdate 
}) => {
  const [selectedLetterId, setSelectedLetterId] = useState<string>('letter-1');
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [showAllAnswers, setShowAllAnswers] = useState<boolean>(false);

  const activeLetter: LetterExercise = LETTER_EXERCISES.find(l => l.id === selectedLetterId) || LETTER_EXERCISES[0];

  const handleLetterChange = (id: string) => {
    setSelectedLetterId(id);
    setUserAnswers({});
    setIsChecked(false);
    setShowAllAnswers(false);
    if (onScoreUpdate) {
      onScoreUpdate(0);
    }
  };

  const handleSelectWord = (blankIdx: number, word: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [blankIdx]: word
    }));
  };

  const handleReset = () => {
    setUserAnswers({});
    setIsChecked(false);
    setShowAllAnswers(false);
    if (onScoreUpdate) {
      onScoreUpdate(0);
    }
  };

  const handleCheck = () => {
    setIsChecked(true);
    let correct = 0;
    Object.entries(activeLetter.correctAnswers).forEach(([idxStr, correctWord]) => {
      const idx = parseInt(idxStr, 10);
      if (userAnswers[idx] === correctWord) {
        correct++;
      }
    });

    // 10 blanks * 2.5 marks = 25 marks!
    const earned = Number((correct * 2.5).toFixed(1));
    if (onScoreUpdate) {
      onScoreUpdate(earned);
    }
    if (onScoreEarned && earned > 0) {
      onScoreEarned(Math.round(earned));
    }
  };

  const toggleRevealAll = () => {
    setShowAllAnswers(prev => !prev);
  };

  // Find used words to highlight in Manjusha
  const usedWords = new Set(Object.values(userAnswers).filter(Boolean));

  let correctCount = 0;
  Object.entries(activeLetter.correctAnswers).forEach(([idxStr, correctWord]) => {
    const idx = parseInt(idxStr, 10);
    if (userAnswers[idx] === correctWord) {
      correctCount++;
    }
  });

  return (
    <div 
      className="letter-writing-container"
      style={{
        background: 'var(--bg-primary)',
        border: '2px solid var(--border)',
        borderRadius: '16px',
        padding: '16px 20px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
      }}
    >
      {/* 1. Header Banner */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          borderBottom: '1px dashed var(--border)',
          paddingBottom: '10px',
          marginBottom: '14px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span 
              style={{
                background: 'rgba(124, 58, 237, 0.12)',
                color: '#7c3aed',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.8rem'
              }}
            >
              मुख्यविभागः ४ (Main 4)
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              पत्रलेखनम् (Letter Completion from Word Bank)
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            मञ्जूषातः पदानि चित्वा पत्रं पूरयत <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>— १० रिक्तस्थानानि (सम्पूर्णाङ्काः: २५)</span>
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            मञ्जूषायां दत्तानां १० पदानां साहाय्येन रिक्तस्थानानि पूरयन्तु (प्रत्येकं २.५ अङ्काः • १० × २.५ = २५ अङ्काः)।
          </p>
        </div>

        {/* Letter Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            पत्रम्:
          </label>
          <select
            value={selectedLetterId}
            onChange={(e) => handleLetterChange(e.target.value)}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: '2px solid #7c3aed',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer'
            }}
          >
            {LETTER_EXERCISES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Manjusha (Word Bank) Box */}
      <div 
        style={{
          background: 'rgba(124, 58, 237, 0.05)',
          border: '2px solid rgba(124, 58, 237, 0.25)',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: '#7c3aed', fontWeight: 800, fontSize: '0.95rem' }}>
          <Sparkles size={16} /> मञ्जूषा (Word Bank — १० पदानि):
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {activeLetter.manjusha.map((word, idx) => {
            const isWordUsed = usedWords.has(word);
            return (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  background: isWordUsed ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                  border: isWordUsed ? '1px solid var(--border)' : '1px solid rgba(124, 58, 237, 0.4)',
                  color: isWordUsed ? 'var(--text-muted)' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.94rem',
                  textDecoration: isWordUsed ? 'line-through' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>

      {/* 3. Action Toolbar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleCheck}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <CheckCircle2 size={16} />
            <span>पत्रं परीक्ष्यताम् (Check Answers)</span>
          </button>

          <button
            onClick={toggleRevealAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            {showAllAnswers ? <EyeOff size={15} /> : <Eye size={15} />}
            <span>{showAllAnswers ? 'उत्तराणि गोपयतु (Hide)' : 'सर्वाणि उत्तराणि पश्यतु (Show All)'}</span>
          </button>

          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={15} />
            <span>पुनः आरभताम् (Reset)</span>
          </button>
        </div>

        {isChecked && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid #16a34a',
              padding: '4px 14px',
              borderRadius: '20px',
              color: '#16a34a',
              fontWeight: 800,
              fontSize: '0.92rem'
            }}
          >
            <Award size={18} />
            <span>विभागाङ्काः: {(correctCount * 2.5).toFixed(1)} / 25 ({correctCount} / 10 शुद्धम्)</span>
          </div>
        )}
      </div>

      {/* 4. The Authentic Sanskrit Letter Paper */}
      <div 
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '28px',
          lineHeight: 2.2,
          fontSize: '1.14rem',
          color: 'var(--text-primary)',
          position: 'relative'
        }}
      >
        {/* Top Right: Location & Date */}
        <div style={{ textAlign: 'right', marginBottom: '20px', lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent)' }}>
            {activeLetter.location}
          </div>
          <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
            {activeLetter.date}
          </div>
        </div>

        {/* Salutation */}
        <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '14px', color: 'var(--text-primary)' }}>
          {activeLetter.salutation}
        </div>

        {/* Paragraphs with Inline Dropdowns */}
        {activeLetter.paragraphs.map((p, pIdx) => (
          <p key={pIdx} style={{ margin: '0 0 16px 0', textIndent: pIdx > 0 ? '24px' : '0' }}>
            {p.segments.map((seg, sIdx) => {
              if (!seg.blankIndex) {
                return <span key={sIdx}>{seg.textBefore}{seg.textAfter}</span>;
              }

              const bIdx = seg.blankIndex;
              const userVal = userAnswers[bIdx] || '';
              const expectedVal = activeLetter.correctAnswers[bIdx];
              const isCorrect = userVal === expectedVal;
              const isWrong = userVal !== '' && userVal !== expectedVal;
              const isRevealed = showAllAnswers;

              let selBorder = '1px solid var(--border)';
              let selBg = 'var(--bg-primary)';

              if (isChecked && userVal) {
                if (isCorrect) {
                  selBorder = '2px solid #16a34a';
                  selBg = 'rgba(34, 197, 94, 0.1)';
                } else if (isWrong) {
                  selBorder = '2px solid #ef4444';
                  selBg = 'rgba(239, 68, 68, 0.1)';
                }
              }

              return (
                <span key={sIdx} style={{ display: 'inline' }}>
                  {seg.textBefore}
                  <span style={{ position: 'relative', display: 'inline-block', margin: '0 4px', verticalAlign: 'middle' }}>
                    <select
                      value={userVal}
                      onChange={(e) => handleSelectWord(bIdx, e.target.value)}
                      style={{
                        padding: '4px 24px 4px 10px',
                        borderRadius: '8px',
                        border: selBorder,
                        background: selBg,
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        outline: 'none',
                        minWidth: '135px'
                      }}
                    >
                      <option value="">({bIdx}) [ चिनोतु... ]</option>
                      {activeLetter.manjusha.map((word, wIdx) => (
                        <option key={wIdx} value={word}>
                          {word}
                        </option>
                      ))}
                    </select>
                    <ChevronDown 
                      size={14} 
                      style={{ 
                        position: 'absolute', 
                        right: '8px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        pointerEvents: 'none',
                        color: 'var(--text-muted)'
                      }} 
                    />
                    {(isRevealed || (isChecked && isWrong)) && (
                      <span 
                        style={{ 
                          display: 'block', 
                          fontSize: '0.78rem', 
                          fontWeight: 800, 
                          color: '#16a34a',
                          lineHeight: 1.2,
                          marginTop: '2px',
                          textAlign: 'center'
                        }}
                      >
                        ✓ {expectedVal}
                      </span>
                    )}
                  </span>
                  {seg.textAfter}
                </span>
              );
            })}
          </p>
        ))}

        {/* Bottom Signoff (Blank 10) */}
        <div style={{ textAlign: 'right', marginTop: '30px', lineHeight: 1.6 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span>{activeLetter.signOffPrefix}</span>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <select
                value={userAnswers[activeLetter.signOffBlankIndex] || ''}
                onChange={(e) => handleSelectWord(activeLetter.signOffBlankIndex, e.target.value)}
                style={{
                  padding: '4px 24px 4px 10px',
                  borderRadius: '8px',
                  border: isChecked && userAnswers[activeLetter.signOffBlankIndex] === activeLetter.correctAnswers[activeLetter.signOffBlankIndex]
                    ? '2px solid #16a34a'
                    : isChecked && userAnswers[activeLetter.signOffBlankIndex]
                    ? '2px solid #ef4444'
                    : '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  outline: 'none',
                  minWidth: '120px'
                }}
              >
                <option value="">(१०) [ चिनोतु... ]</option>
                {activeLetter.manjusha.map((word, wIdx) => (
                  <option key={wIdx} value={word}>
                    {word}
                  </option>
                ))}
              </select>
              <ChevronDown 
                size={14} 
                style={{ 
                  position: 'absolute', 
                  right: '8px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  pointerEvents: 'none',
                  color: 'var(--text-muted)'
                }} 
              />
              {(showAllAnswers || (isChecked && userAnswers[10] !== activeLetter.correctAnswers[10])) && (
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#16a34a', textAlign: 'center', marginTop: '2px' }}>
                  ✓ {activeLetter.correctAnswers[10]}
                </div>
              )}
            </div>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', marginTop: '6px', color: 'var(--text-primary)' }}>
            {activeLetter.senderName}
          </div>
        </div>
      </div>
    </div>
  );
};
