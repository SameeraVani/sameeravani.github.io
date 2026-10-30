import React, { useState, useEffect, useCallback } from 'react';
import { 
  RotateCcw, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Sparkles, 
  Award,
  ChevronDown
} from 'lucide-react';
import { 
  generateDeclensionExercise, 
  type DeclensionRow 
} from '../../data/shabdaFormsGenerator';

interface DeclensionExerciseTableProps {
  initialParadigm?: string;
  onScoreEarned?: (score: number) => void;
  onScoreUpdate?: (score: number) => void;
}

export const DeclensionExerciseTable: React.FC<DeclensionExerciseTableProps> = ({
  initialParadigm = 'all',
  onScoreEarned,
  onScoreUpdate
}) => {
  const [paradigmFilter, setParadigmFilter] = useState<string>(initialParadigm);
  const [rows, setRows] = useState<DeclensionRow[]>([]);
  
  // Selected option per row: { [rowId]: string }
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  
  // Revealed states per row: { [rowId]: boolean }
  const [revealedRows, setRevealedRows] = useState<Record<string, boolean>>({});
  
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [showAllAnswers, setShowAllAnswers] = useState<boolean>(false);
  const [earnedPoints, setEarnedPoints] = useState<number>(0);

  // Load new random exercises (5 rows = 25 marks)
  const loadNewExercise = useCallback(() => {
    const newRows = generateDeclensionExercise(5, paradigmFilter);
    setRows(newRows);
    setSelectedAnswers({});
    setRevealedRows({});
    setIsChecked(false);
    setShowAllAnswers(false);
    setEarnedPoints(0);
    if (onScoreUpdate) {
      onScoreUpdate(0);
    }
  }, [paradigmFilter, onScoreUpdate]);

  useEffect(() => {
    loadNewExercise();
  }, [loadNewExercise]);

  const handleSelectAnswer = (rowId: string, value: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [rowId]: value
    }));
  };

  const toggleRowReveal = (rowId: string) => {
    setRevealedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const toggleAllAnswers = () => {
    const nextState = !showAllAnswers;
    setShowAllAnswers(nextState);
    const updatedRevealed: Record<string, boolean> = {};
    rows.forEach(r => {
      updatedRevealed[r.id] = nextState;
    });
    setRevealedRows(updatedRevealed);
  };

  // Check answers
  const handleCheckAnswers = () => {
    setIsChecked(true);
    let correct = 0;

    rows.forEach(r => {
      const chosen = selectedAnswers[r.id];
      if (chosen === r.correctCombined) {
        correct++;
      }
    });

    const score = correct * 5; // 5 rows * 5 marks = 25 marks max
    setEarnedPoints(score);
    if (onScoreUpdate) {
      onScoreUpdate(score);
    }
    if (onScoreEarned && score > 0) {
      onScoreEarned(score);
    }
  };

  const correctCount = rows.filter(r => selectedAnswers[r.id] === r.correctCombined).length;

  return (
    <div 
      className="declension-exercise-container"
      style={{
        background: 'var(--bg-primary)',
        border: '2px solid var(--border)',
        borderRadius: '16px',
        padding: '16px 20px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
      }}
    >
      {/* 1. Header Banner mirroring textbook */}
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
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#dc2626',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.8rem'
              }}
            >
              मुख्यविभागः २ (Main 2)
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              निर्देशानुसारं रूपाणि (एक. – द्वि. – बहु.)
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            निर्देशानुसारं रूपाणि चिनोतु <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Choose forms — ५ प्रश्नाः (सम्पूर्णाङ्काः: २५)</span>
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            प्रत्येकस्य शब्दस्य निर्दिष्टविभक्तौ उचितं रूपत्रयं चिनोतु (प्रत्येकं ५ अङ्काः • ५ × ५ = २५ अङ्काः)।
          </p>
        </div>

        {/* Paradigm Filter Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            शब्दवर्गः:
          </label>
          <select
            value={paradigmFilter}
            onChange={(e) => setParadigmFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <option value="all">🌟 सर्वे शब्दाः (All Nouns)</option>
            <option value="akaranta-pu">रामवत् (अकारान्त पुल्लिङ्गः)</option>
            <option value="ikaranta-pu">हरिवत् (इकारान्त पुल्लिङ्गः)</option>
            <option value="ukaranta-pu">गुरुवत् (उकारान्त पुल्लिङ्गः)</option>
            <option value="akaranta-stree">रमावत् (आकारान्त स्त्रीलिङ्गः)</option>
            <option value="ikaranta-stree">रुचिवत् (इकारान्त स्त्रीलिङ्गः)</option>
            <option value="eekaranta-stree">नदीवत् (ईकारान्त स्त्रीलिङ्गः)</option>
            <option value="akaranta-napum">फलवत् (अकारान्त नपुंसकलिङ्गः)</option>
          </select>
        </div>
      </div>

      {/* 2. Controls & Actions Toolbar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={loadNewExercise}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={15} />
            <span>🔄 नूतनाभ्यासः (New Dynamic Words)</span>
          </button>

          <button
            onClick={handleCheckAnswers}
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
        </div>

        {/* Score indicator if evaluated */}
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
            <span>विभागाङ्काः: {earnedPoints} / 25 ({correctCount} / {rows.length} शुद्धम्)</span>
          </div>
        )}
      </div>

      {/* 3. The Interactive Worksheet Table with 4-Choice Dropdowns */}
      <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
        <table 
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.96rem'
          }}
        >
          <thead>
            <tr 
              style={{
                borderBottom: '2px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              <th style={{ padding: '12px 14px', fontWeight: 800, width: '150px' }}>शब्दः (Noun)</th>
              <th style={{ padding: '12px 14px', fontWeight: 800, width: '130px' }}>विभक्तिः (Case)</th>
              <th style={{ padding: '12px 14px', fontWeight: 800 }}>
                उचितं रूपत्रयम् (एकवचनम् – द्विवचनम् – बहुवचनम्)
              </th>
              <th style={{ padding: '12px 14px', fontWeight: 800, textAlign: 'center', width: '90px' }}>सहायः</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const chosen = selectedAnswers[row.id] || '';
              const isRevealed = revealedRows[row.id] || showAllAnswers;
              const hasAnswered = chosen !== '';
              const isCorrect = hasAnswered && chosen === row.correctCombined;
              const isWrong = hasAnswered && isChecked && chosen !== row.correctCombined;

              let selectBorder = '1px solid var(--border)';
              let selectBg = 'var(--bg-primary)';

              if (isChecked && hasAnswered) {
                if (isCorrect) {
                  selectBorder = '2px solid #16a34a';
                  selectBg = 'rgba(34, 197, 94, 0.08)';
                } else if (isWrong) {
                  selectBorder = '2px solid #ef4444';
                  selectBg = 'rgba(239, 68, 68, 0.08)';
                }
              }

              return (
                <tr 
                  key={row.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
                    transition: 'background 0.15s ease'
                  }}
                >
                  {/* Column 1: शब्दः */}
                  <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.14rem', color: 'var(--accent)' }}>
                      {row.stem}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {row.meaning} • {row.paradigmLabel.split(' ')[0]}
                    </div>
                  </td>

                  {/* Column 2: विभक्तिः */}
                  <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                    <span 
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: 'var(--accent)',
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        border: '1px solid rgba(59, 130, 246, 0.25)'
                      }}
                    >
                      {row.vibhakti}
                    </span>
                  </td>

                  {/* Column 3: 4-Choice Dropdown clubbing all vachanas */}
                  <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '520px' }}>
                      <select
                        value={chosen}
                        onChange={(e) => handleSelectAnswer(row.id, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 34px 9px 12px',
                          borderRadius: '10px',
                          border: selectBorder,
                          background: selectBg,
                          color: 'var(--text-primary)',
                          fontWeight: 600,
                          fontSize: '0.96rem',
                          cursor: 'pointer',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          outline: 'none',
                        }}
                      >
                        <option value="">-- रूपत्रयं चिनोतु (Choose 3 forms) --</option>
                        {row.options.map((opt, optIdx) => (
                          <option key={optIdx} value={opt}>
                            {['१', '२', '३', '४'][optIdx]}) {opt}
                          </option>
                        ))}
                      </select>
                      <ChevronDown 
                        size={16} 
                        style={{ 
                          position: 'absolute', 
                          right: '10px', 
                          top: '50%', 
                          transform: 'translateY(-50%)', 
                          pointerEvents: 'none',
                          color: 'var(--text-muted)'
                        }} 
                      />
                    </div>

                    {/* Feedback if revealed or evaluated */}
                    {isRevealed && (
                      <div style={{ marginTop: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#16a34a' }}>
                        ✓ शुद्धम्: {row.correctCombined}
                      </div>
                    )}
                    {isChecked && isWrong && !isRevealed && (
                      <div style={{ marginTop: '6px', fontSize: '0.84rem', fontWeight: 700, color: '#ef4444' }}>
                        ✗ अशुद्धम्! शुद्धम्: {row.correctCombined}
                      </div>
                    )}
                  </td>

                  {/* Column 4: Action / Reveal */}
                  <td style={{ padding: '10px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <button
                      onClick={() => toggleRowReveal(row.id)}
                      title={isRevealed ? 'उत्तराणि गोपयतु (Hide Answer)' : 'उत्तरं पश्यतु (Reveal Answer)'}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: isRevealed ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-secondary)',
                        color: isRevealed ? '#16a34a' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Tips & Notes footer */}
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
          <Sparkles size={16} color="var(--accent)" /> व्याकरण-स्मरण-बिन्दवः (Grammar Memory Notes):
        </div>
        <div>
          • <strong>णत्व-नियमः:</strong> यत्र <em>र्</em> वा <em>ष्</em> श्रूयते तत्र नकारस्य स्थाने णकारो भवति (यथा: रामेण, छात्रेण, गुरूणाम्, फलानाम् vs बालकेन)।
        </div>
        <div>
          • <strong>दीर्घीकरणम्:</strong> षष्ठी-बहुवचने ह्रस्वस्वराः दीर्घाः भवन्ति — यथा: <em>गुरूणाम्</em> (दीर्घ ऊ), <em>हरीणाम्</em> (दीर्घ ई), <em>नदीनाम्</em>।
        </div>
      </div>
    </div>
  );
};
