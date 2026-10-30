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
  SENTENCE_FILL_SETS, 
  type SentenceFillSet 
} from '../../data/sentenceFillData';

interface SentenceFillExerciseProps {
  onScoreEarned?: (score: number) => void;
  onScoreUpdate?: (score: number) => void;
}

export const SentenceFillExercise: React.FC<SentenceFillExerciseProps> = ({ 
  onScoreEarned,
  onScoreUpdate 
}) => {
  const [activeSetId, setActiveSetId] = useState<string>('set1');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [revealedItems, setRevealedItems] = useState<Record<string, boolean>>({});
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [showAllAnswers, setShowAllAnswers] = useState<boolean>(false);

  const activeSet: SentenceFillSet = SENTENCE_FILL_SETS.find(s => s.id === activeSetId) || SENTENCE_FILL_SETS[0];

  const handleSetChange = (setId: string) => {
    setActiveSetId(setId);
    setSelectedAnswers({});
    setRevealedItems({});
    setIsChecked(false);
    setShowAllAnswers(false);
    if (onScoreUpdate) {
      onScoreUpdate(0);
    }
  };

  const handleSelect = (itemId: string, value: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const toggleItemReveal = (itemId: string) => {
    setRevealedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const toggleAllAnswers = () => {
    const next = !showAllAnswers;
    setShowAllAnswers(next);
    const updated: Record<string, boolean> = {};
    activeSet.items.forEach(item => {
      updated[item.id] = next;
    });
    setRevealedItems(updated);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setRevealedItems({});
    setIsChecked(false);
    setShowAllAnswers(false);
    if (onScoreUpdate) {
      onScoreUpdate(0);
    }
  };

  const handleCheck = () => {
    setIsChecked(true);
    const correctCount = activeSet.items.filter(item => selectedAnswers[item.id] === item.correctAnswer).length;
    // Scale score across 8 items to 25 marks:
    const score = Math.round((correctCount / activeSet.items.length) * 25);
    if (onScoreUpdate) {
      onScoreUpdate(score);
    }
    if (onScoreEarned && score > 0) {
      onScoreEarned(score);
    }
  };

  const correctCount = activeSet.items.filter(item => selectedAnswers[item.id] === item.correctAnswer).length;

  return (
    <div 
      className="sentence-fill-container"
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
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.8rem'
              }}
            >
              मुख्यविभागः ३ (Main 3)
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              विभक्ति-वाक्यपूरणम् (Sentence Completion with Nouns)
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            उचित-नामपदेन वाक्यानि पूरयन्तु <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>— ८ वाक्यानि (सम्पूर्णाङ्काः: २५)</span>
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            अष्टासु विभक्तिषु नामपद-प्रयोगं चिनोतु (सम्पूर्णाङ्काः: २५)। केवलं नामपदानां चयनं कर्तव्यम्।
          </p>
        </div>

        {/* Set Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            गणः (Set):
          </label>
          <select
            value={activeSetId}
            onChange={(e) => handleSetChange(e.target.value)}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: '2px solid #059669',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer'
            }}
          >
            {SENTENCE_FILL_SETS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.shortTitle}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Toolbar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '18px'
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
              background: '#059669',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <CheckCircle2 size={16} />
            <span>परीक्ष्यताम् (Check Answers)</span>
          </button>

          <button
            onClick={toggleAllAnswers}
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
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid #059669',
              padding: '4px 14px',
              borderRadius: '20px',
              color: '#059669',
              fontWeight: 800,
              fontSize: '0.92rem'
            }}
          >
            <Award size={18} />
            <span>विभागाङ्काः: {Math.round((correctCount / activeSet.items.length) * 25)} / 25 ({correctCount} / {activeSet.items.length} शुद्धम्)</span>
          </div>
        )}
      </div>

      {/* 3. Sentences Grid List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
        {activeSet.items.map((item, idx) => {
          const chosen = selectedAnswers[item.id] || '';
          const isRevealed = revealedItems[item.id] || showAllAnswers;
          const hasAnswered = chosen !== '';
          const isCorrect = hasAnswered && chosen === item.correctAnswer;
          const isWrong = hasAnswered && isChecked && chosen !== item.correctAnswer;

          let dropdownBorder = '1px solid var(--border)';
          let dropdownBg = 'var(--bg-primary)';

          if (isChecked && hasAnswered) {
            if (isCorrect) {
              dropdownBorder = '2px solid #16a34a';
              dropdownBg = 'rgba(34, 197, 94, 0.08)';
            } else if (isWrong) {
              dropdownBorder = '2px solid #ef4444';
              dropdownBg = 'rgba(239, 68, 68, 0.08)';
            }
          }

          return (
            <div 
              key={item.id}
              style={{
                background: idx % 2 === 0 ? 'var(--bg-secondary)' : 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '14px 18px',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Sentence line with inline dropdown */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '1.14rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1.8
                }}
              >
                <span 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginRight: '4px'
                  }}
                >
                  {idx + 1}
                </span>

                {item.sentenceBefore && <span>{item.sentenceBefore}</span>}

                {/* Dropdown for the noun blank */}
                <div style={{ position: 'relative', display: 'inline-block', minWidth: '160px' }}>
                  <select
                    value={chosen}
                    onChange={(e) => handleSelect(item.id, e.target.value)}
                    style={{
                      padding: '5px 28px 5px 10px',
                      borderRadius: '8px',
                      border: dropdownBorder,
                      background: dropdownBg,
                      color: 'var(--text-primary)',
                      fontWeight: 700,
                      fontSize: '1.02rem',
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      outline: 'none',
                      minWidth: '150px'
                    }}
                  >
                    <option value="">[ पदं चिनोतु... ]</option>
                    {item.options.map((opt, optIdx) => (
                      <option key={optIdx} value={opt}>
                        {opt}
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
                </div>

                <span>{item.sentenceAfter}</span>

                {/* Reveal toggle button */}
                <button
                  onClick={() => toggleItemReveal(item.id)}
                  title={isRevealed ? 'उत्तरं गोपयतु' : 'उत्तरं पश्यतु'}
                  style={{
                    marginLeft: 'auto',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: isRevealed ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-primary)',
                    color: isRevealed ? '#16a34a' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Translation & Rule info */}
              <div style={{ marginTop: '8px', fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span>📖 {item.englishTranslation}</span>
                {item.kannadaTranslation && <span>• {item.kannadaTranslation}</span>}
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>• {item.vibhakti}</span>
              </div>

              {/* Reveal/Answer feedback banner */}
              {(isRevealed || (isChecked && isWrong)) && (
                <div 
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    fontSize: '0.86rem',
                    color: '#16a34a',
                    fontWeight: 700
                  }}
                >
                  ✓ शुद्धम् उत्तरम्: <span style={{ textDecoration: 'underline' }}>{item.correctAnswer}</span> — {item.ruleHint}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Tips footer */}
      <div 
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '14px 18px',
          fontSize: '0.85rem',
          lineHeight: 1.5,
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} color="#059669" /> कारक-विभक्ति-सम्बन्धः (Case Ending Rules in Sentences):
        </div>
        <div>
          • <strong>प्रथमा (कर्ता):</strong> क्रियायाः सम्पादकः (रामः गच्छति) | <strong>द्वितीया (कर्म):</strong> फलभाजनम् (रामं पश्यति)
        </div>
        <div>
          • <strong>तृतीया (करणम्/सह):</strong> साधकतमं करणम् / 'सह' योगे तृतीया (रामेण सह) | <strong>चतुर्थी (सम्प्रदानम्):</strong> दानार्थे / नमः योगे (रामाय नमति)
        </div>
        <div>
          • <strong>पञ्चमी (अपादानम्):</strong> पृथग्भावे / उत्पत्तौ (रामात् भवति) | <strong>षष्ठी (सम्बन्धः):</strong> सम्बन्धमात्रे (रामस्य पिता) | <strong>सप्तमी (अधिकरणम्):</strong> आधारः (रामे अस्ति)
        </div>
      </div>
    </div>
  );
};

