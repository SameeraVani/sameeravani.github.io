import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { 
  CHAPTER_OPTIONS, 
  CHAPTER_SECTIONS,
  GRAMMAR_QUESTIONS, 
  type GrammarQuestion 
} from '../../data/grammarQuizData';
import { DeclensionExerciseTable } from './DeclensionExerciseTable';
import { SentenceFillExercise } from './SentenceFillExercise';
import { LetterWritingExercise } from './LetterWritingExercise';

interface GrammarGameProps {
  onBack?: () => void;
  onComplete?: (score: number) => void;
  initialChapterId?: string;
  embedded?: boolean;
}

export const GrammarGame: React.FC<GrammarGameProps> = ({
  onBack,
  onComplete,
  initialChapterId = 'ch6',
  embedded = false,
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sanskrit-grammar-quiz-chapter');
      if (saved && (saved === 'all' || CHAPTER_OPTIONS.some(c => c.id === saved))) return saved;
    } catch {
      // ignore
    }
    return initialChapterId || 'ch6';
  });

  const availableSections = useMemo(() => {
    return selectedChapterId && selectedChapterId !== 'all' 
      ? CHAPTER_SECTIONS[selectedChapterId] || [] 
      : [];
  }, [selectedChapterId]);

  const [selectedSectionId, setSelectedSectionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sanskrit-grammar-quiz-section');
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'all';
  });

  const [activeMain, setActiveMain] = useState<'main1' | 'main2' | 'main3' | 'main4'>('main1');

  // Main-wise scores out of 25 each, totaling 100 for all 4 mains
  const [mainScores, setMainScores] = useState<{
    main1: number;
    main2: number;
    main3: number;
    main4: number;
  }>(() => {
    try {
      const saved = localStorage.getItem('sanskrit-grammar-main-scores');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return { main1: 0, main2: 0, main3: 0, main4: 0 };
  });

  useEffect(() => {
    try {
      localStorage.setItem('sanskrit-grammar-main-scores', JSON.stringify(mainScores));
    } catch {
      // ignore
    }
  }, [mainScores]);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  // Track answer state per question index so student can navigate back and forth
  const [answersState, setAnswersState] = useState<{
    [qIndex: number]: {
      chosenIndex: number;
      isCorrect: boolean;
    }
  }>({});

  // Game metrics
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [highestStreak, setHighestStreak] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Sound generator using Web Audio API
  const playSound = useCallback((type: 'correct' | 'wrong' | 'streak' | 'finish') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'correct') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'streak') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(739.99, ctx.currentTime + 0.07);
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.14);
        osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.21);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'wrong') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(196, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.28);
      } else if (type === 'finish') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.4);
          osc.start(ctx.currentTime + idx * 0.1);
          osc.stop(ctx.currentTime + idx * 0.1 + 0.4);
        });
      }
    } catch {
      // Audio context error ignore
    }
  }, [soundEnabled]);

  // Load questions for selected chapter & section
  const initGame = useCallback((chapterId: string, sectionId: string, customQuestionList?: GrammarQuestion[]) => {
    let pool: GrammarQuestion[];
    if (customQuestionList && customQuestionList.length > 0) {
      pool = [...customQuestionList];
    } else if (chapterId === 'all') {
      const ch6 = GRAMMAR_QUESTIONS.filter(q => q.chapterId === 'ch6').sort(() => 0.5 - Math.random()).slice(0, 3);
      const ch7 = GRAMMAR_QUESTIONS.filter(q => q.chapterId === 'ch7').sort(() => 0.5 - Math.random()).slice(0, 2);
      const ch8 = GRAMMAR_QUESTIONS.filter(q => q.chapterId === 'ch8').sort(() => 0.5 - Math.random()).slice(0, 3);
      const ch9 = GRAMMAR_QUESTIONS.filter(q => q.chapterId === 'ch9').sort(() => 0.5 - Math.random()).slice(0, 3);
      const ch10 = GRAMMAR_QUESTIONS.filter(q => q.chapterId === 'ch10').sort(() => 0.5 - Math.random()).slice(0, 3);
      const ch11 = GRAMMAR_QUESTIONS.filter(q => q.chapterId === 'ch11').sort(() => 0.5 - Math.random()).slice(0, 2);
      const ch12 = GRAMMAR_QUESTIONS.filter(q => q.chapterId === 'ch12').sort(() => 0.5 - Math.random()).slice(0, 2);
      pool = [...ch6, ...ch7, ...ch8, ...ch9, ...ch10, ...ch11, ...ch12].sort(() => 0.5 - Math.random());
    } else {
      let filtered = GRAMMAR_QUESTIONS.filter(q => q.chapterId === chapterId);
      if (sectionId && sectionId !== 'all') {
        const sectionQuestions = filtered.filter(q => q.sectionId === sectionId);
        if (sectionQuestions.length > 0) {
          filtered = sectionQuestions;
        }
      }
      if (chapterId === 'ch6') {
        // Main 1: 5 questions * 5 marks = 25 marks max
        pool = filtered.sort(() => 0.5 - Math.random()).slice(0, 5);
      } else {
        pool = filtered.sort(() => 0.5 - Math.random());
      }
    }

    setQuestions(pool);
    setCurrentIndex(0);
    setAnswersState({});
    setScore(0);
    setStreak(0);
    setHighestStreak(0);
    setIsGameOver(false);
  }, []);

  useEffect(() => {
    initGame(selectedChapterId, selectedSectionId);
  }, [selectedChapterId, selectedSectionId, initGame]);

  const currentQ = questions[currentIndex];
  const currentAnswer = answersState[currentIndex];
  const isCurrentAnswered = currentAnswer !== undefined;

  const handleAnswer = (optionIdx: number) => {
    if (isCurrentAnswered || !currentQ) return;
    
    const isCorrect = optionIdx === currentQ.correctIndex;

    const updatedAnswers = {
      ...answersState,
      [currentIndex]: {
        chosenIndex: optionIdx,
        isCorrect
      }
    };
    setAnswersState(updatedAnswers);

    if (selectedChapterId === 'ch6') {
      const correctAnswersCount = Object.values(updatedAnswers).filter(a => a.isCorrect).length;
      // 5 questions * 5 marks = 25 marks max
      const m1Score = correctAnswersCount * 5;
      setMainScores(prev => ({ ...prev, main1: m1Score }));
    }

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > highestStreak) setHighestStreak(newStreak);

      const streakBonus = newStreak >= 5 ? 100 : newStreak >= 3 ? 50 : newStreak >= 2 ? 25 : 0;
      const points = 100 + streakBonus;
      setScore(prev => prev + points);

      if (newStreak >= 3) {
        playSound('streak');
      } else {
        playSound('correct');
      }
    } else {
      setStreak(0);
      playSound('wrong');
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsGameOver(true);
      playSound('finish');
      if (onComplete) onComplete(score);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleJumpToQuestion = (idx: number) => {
    if (idx >= 0 && idx < questions.length) {
      setCurrentIndex(idx);
    }
  };

  const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newChapterId = e.target.value;
    setSelectedChapterId(newChapterId);
    setSelectedSectionId('all');
    try {
      localStorage.setItem('sanskrit-grammar-quiz-chapter', newChapterId);
      localStorage.setItem('sanskrit-grammar-quiz-section', 'all');
    } catch {
      // ignore
    }
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSectionId = e.target.value;
    setSelectedSectionId(newSectionId);
    try {
      localStorage.setItem('sanskrit-grammar-quiz-section', newSectionId);
    } catch {
      // ignore
    }
  };

  const restartQuiz = () => {
    initGame(selectedChapterId, selectedSectionId);
    if (selectedChapterId === 'ch6') {
      setMainScores(prev => ({ ...prev, main1: 0 }));
    }
  };

  const totalScore100 = useMemo(() => {
    const sum = (mainScores.main1 || 0) + (mainScores.main2 || 0) + (mainScores.main3 || 0) + (mainScores.main4 || 0);
    return Math.min(100, Number(sum.toFixed(1)));
  }, [mainScores]);

  const handleResetMainScores = () => {
    if (typeof window !== 'undefined' && window.confirm('किं भवान् सर्वेषां ४ विभागानाम् अङ्कान् शून्यं कर्तुम् इच्छति? (Reset all 4 main scores to 0?)')) {
      setMainScores({ main1: 0, main2: 0, main3: 0, main4: 0 });
      initGame(selectedChapterId, selectedSectionId);
      try {
        localStorage.removeItem('sanskrit-grammar-main-scores');
      } catch {
        // ignore
      }
    }
  };

  const retryMissedQuestions = () => {
    const missed = questions.filter((_, idx) => answersState[idx] && !answersState[idx].isCorrect);
    if (missed.length > 0) {
      initGame(selectedChapterId, selectedSectionId, missed);
    }
  };

  // Keyboard navigation for options (1, 2, 3, 4) & Arrows for prev/next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (['input', 'select', 'textarea'].includes(activeTag)) return;
      if (!isCurrentAnswered) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (idx >= 0 && idx < (currentQ?.options.length || 0)) {
            handleAnswer(idx);
          }
        }
      } else {
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
          e.preventDefault();
          handleNext();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrev();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCurrentAnswered, isGameOver, currentQ, currentIndex, questions.length]);

  // Overall statistics
  const totalQuestions = questions.length;
  const answeredIndices = Object.keys(answersState).map(Number);
  const correctCount = answeredIndices.filter(idx => answersState[idx].isCorrect).length;
  const accuracyPercent = totalQuestions > 0 && isGameOver 
    ? Math.round((correctCount / totalQuestions) * 100) 
    : 0;

  const getRankTitle = (acc: number) => {
    if (acc >= 90) return { title: 'व्याकरणविशारदः (Master)', icon: '🏆', color: '#16a34a' };
    if (acc >= 75) return { title: 'पण्डितप्रवरः (Scholar)', icon: '🥇', color: '#2563eb' };
    if (acc >= 50) return { title: 'सुधीः छात्रः (Learner)', icon: '🥈', color: '#d97706' };
    return { title: 'जिज्ञासुः (Try Again!)', icon: '🥉', color: '#7c3aed' };
  };

  const categoryColor = useMemo(() => {
    switch (currentQ?.category) {
      case 'shabda': return '#3b82f6';
      case 'dhatu': return '#8b5cf6';
      case 'sandhi': return '#10b981';
      case 'vrutti': return '#f59e0b';
      case 'sambhashana': return '#06b6d4';
      case 'kala': return '#ec4899';
      default: return 'var(--accent)';
    }
  }, [currentQ?.category]);

  const selectedChapterInfo = CHAPTER_OPTIONS.find(c => c.id === selectedChapterId) || CHAPTER_OPTIONS[0];

  return (
    <div 
      className="grammar-game-container"
      style={{
        maxWidth: embedded ? '100%' : '1080px',
        margin: '0 auto',
        padding: embedded ? '4px 0' : '16px 20px',
        fontFamily: 'inherit',
        color: 'var(--text-primary)',
      }}
    >
      {onBack && !embedded && (
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
            padding: 0
          }}
        >
          <ArrowLeft size={16} /> पृष्ठं प्रतिगच्छतु (Back)
        </button>
      )}

      {/* 1. TOP: COMPACT SCORE CARD (FOR CH 6) */}
      {selectedChapterId === 'ch6' && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1.5px solid var(--accent)',
            borderRadius: '12px',
            padding: '7px 14px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Left: Overall 100-Marks Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                background: 'var(--accent)',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.72rem',
                letterSpacing: '0.02em'
              }}
            >
              १०० अङ्काः
            </span>

            {/* Total Score Badge */}
            <div
              style={{
                background: 'var(--bg-primary)',
                border: '1.5px solid var(--accent)',
                borderRadius: '8px',
                padding: '2px 10px',
                display: 'flex',
                alignItems: 'baseline',
                gap: '4px'
              }}
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                कुल-प्राप्ताङ्काः:
              </span>
              <strong style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--accent)' }}>
                {totalScore100}
              </strong>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                / १००
              </span>
            </div>

            {/* Rank Badge */}
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                color: totalScore100 >= 90 ? '#16a34a' : totalScore100 >= 75 ? '#2563eb' : totalScore100 >= 50 ? '#d97706' : '#7c3aed',
                background: totalScore100 >= 90 ? 'rgba(34, 197, 94, 0.12)' : totalScore100 >= 75 ? 'rgba(37, 99, 235, 0.12)' : totalScore100 >= 50 ? 'rgba(217, 119, 6, 0.12)' : 'rgba(124, 58, 237, 0.12)',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid currentColor'
              }}
            >
              {totalScore100 >= 90 ? '🏆 विशारदः' : totalScore100 >= 75 ? '🥇 उत्तमः' : totalScore100 >= 50 ? '🥈 कुशलः' : totalScore100 >= 35 ? '🥉 उत्तीर्णः' : '🔄 प्रयासरतः'}
            </span>

            {/* Reset Button */}
            <button
              onClick={handleResetMainScores}
              title="सर्वेषामङ्कानां पुनःस्थापनम् (Reset 100 Marks)"
              style={{
                padding: '3px 7px',
                borderRadius: '6px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.68rem',
                fontWeight: 700
              }}
            >
              <RotateCcw size={11} />
              <span>पुनःस्थापनम्</span>
            </button>
          </div>

          {/* Right: 4 Main-wise Score Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {/* Main 1 */}
            <button
              onClick={() => setActiveMain('main1')}
              title="मुख्यविभागः १: बहुविकल्पः"
              style={{
                background: activeMain === 'main1' ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
                border: activeMain === 'main1' ? '1.5px solid #2563eb' : '1px solid var(--border)',
                borderRadius: '8px',
                padding: '3px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: activeMain === 'main1' ? '#2563eb' : 'var(--text-muted)' }}>
                १. बहुविकल्प
              </span>
              <strong style={{ fontSize: '0.85rem', fontWeight: 900, color: '#2563eb' }}>
                {mainScores.main1}<span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)' }}>/२५</span>
              </strong>
            </button>

            {/* Main 2 */}
            <button
              onClick={() => setActiveMain('main2')}
              title="मुख्यविभागः २: रूपाणि"
              style={{
                background: activeMain === 'main2' ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
                border: activeMain === 'main2' ? '1.5px solid #dc2626' : '1px solid var(--border)',
                borderRadius: '8px',
                padding: '3px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: activeMain === 'main2' ? '#dc2626' : 'var(--text-muted)' }}>
                २. रूपाणि
              </span>
              <strong style={{ fontSize: '0.85rem', fontWeight: 900, color: '#dc2626' }}>
                {mainScores.main2}<span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)' }}>/२५</span>
              </strong>
            </button>

            {/* Main 3 */}
            <button
              onClick={() => setActiveMain('main3')}
              title="मुख्यविभागः ३: वाक्यपूरणम्"
              style={{
                background: activeMain === 'main3' ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
                border: activeMain === 'main3' ? '1.5px solid #059669' : '1px solid var(--border)',
                borderRadius: '8px',
                padding: '3px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: activeMain === 'main3' ? '#059669' : 'var(--text-muted)' }}>
                ३. वाक्यपूरण
              </span>
              <strong style={{ fontSize: '0.85rem', fontWeight: 900, color: '#059669' }}>
                {mainScores.main3}<span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)' }}>/२५</span>
              </strong>
            </button>

            {/* Main 4 */}
            <button
              onClick={() => setActiveMain('main4')}
              title="मुख्यविभागः ४: पत्रलेखनम्"
              style={{
                background: activeMain === 'main4' ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
                border: activeMain === 'main4' ? '1.5px solid #7c3aed' : '1px solid var(--border)',
                borderRadius: '8px',
                padding: '3px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: activeMain === 'main4' ? '#7c3aed' : 'var(--text-muted)' }}>
                ४. पत्रलेखन
              </span>
              <strong style={{ fontSize: '0.85rem', fontWeight: 900, color: '#7c3aed' }}>
                {mainScores.main4}<span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)' }}>/२५</span>
              </strong>
            </button>
          </div>

          {/* Bottom Embedded Progress Bar */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '3px',
              background: 'var(--bg-tertiary)'
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(0, totalScore100))}%`,
                height: '100%',
                background: totalScore100 >= 75 ? 'linear-gradient(90deg, #10b981, #059669)' : totalScore100 >= 50 ? 'linear-gradient(90deg, #3b82f6, #2563eb)' : 'linear-gradient(90deg, #f59e0b, #ea580c)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* 2. THEN: LESSON & MAIN SELECTION DROPDOWNS CARD */}
      <div 
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '8px 14px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}
      >
        {/* Dropdowns Group */}
        <div style={{ display: 'flex', gap: '8px', flex: '1 1 320px', flexWrap: 'wrap' }}>
          {/* 1. Chapter Dropdown */}
          <div style={{ flex: '1 1 180px', minWidth: '150px', position: 'relative' }}>
            <label 
              htmlFor="chapter-dropdown-select" 
              style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}
            >
              पाठः (Lesson)
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <select
                id="chapter-dropdown-select"
                value={selectedChapterId}
                onChange={handleChapterChange}
                style={{
                  width: '100%',
                  padding: '7px 28px 7px 10px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: '1.5px solid var(--accent)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  outline: 'none',
                }}
              >
                {CHAPTER_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.shortLabel}
                  </option>
                ))}
              </select>
              <ChevronDown 
                size={15} 
                style={{ 
                  position: 'absolute', 
                  right: '8px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  pointerEvents: 'none',
                  color: 'var(--accent)'
                }} 
              />
            </div>
          </div>

          {/* 2. Main Section Dropdown (for Ch 6) */}
          {selectedChapterId === 'ch6' && (
            <div style={{ flex: '1 1 200px', minWidth: '170px', position: 'relative' }}>
              <label 
                htmlFor="main-dropdown-select" 
                style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}
              >
                मुख्यविभागः (Main)
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <select
                  id="main-dropdown-select"
                  value={activeMain}
                  onChange={(e) => setActiveMain(e.target.value as 'main1' | 'main2' | 'main3' | 'main4')}
                  style={{
                    width: '100%',
                    padding: '7px 28px 7px 10px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1.5px solid #ea580c',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    outline: 'none',
                  }}
                >
                  <option value="main1">१. बहुविकल्पः (Main 1: MCQ)</option>
                  <option value="main2">२. रूपाणि (Main 2: Table)</option>
                  <option value="main3">३. वाक्यपूरणम् (Main 3: Sentences)</option>
                  <option value="main4">४. पत्रलेखनम् (Main 4: Letter)</option>
                </select>
                <ChevronDown 
                  size={15} 
                  style={{ 
                    position: 'absolute', 
                    right: '8px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    pointerEvents: 'none',
                    color: '#ea580c'
                  }} 
                />
              </div>
            </div>
          )}

          {/* 3. Section Dropdown (Shown for Main 1) */}
          {availableSections.length > 0 && activeMain === 'main1' && (
            <div style={{ flex: '1 1 180px', minWidth: '160px', position: 'relative' }}>
              <label 
                htmlFor="section-dropdown-select" 
                style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}
              >
                उपविभागः (Sub-Section)
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <select
                  id="section-dropdown-select"
                  value={selectedSectionId}
                  onChange={handleSectionChange}
                  style={{
                    width: '100%',
                    padding: '7px 28px 7px 10px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    outline: 'none',
                  }}
                >
                  <option value="all">🌟 सर्व-विभागाः (All)</option>
                  {availableSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.label}
                    </option>
                  ))}
                </select>
                <ChevronDown 
                  size={15} 
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
            </div>
          )}
        </div>

        {/* Right Controls: Q-Counter & Sound */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          {selectedChapterId !== 'ch6' && (
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>अङ्काः</span>
              <strong style={{ fontSize: '1rem', color: 'var(--accent)' }}>{score}</strong>
            </div>
          )}

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
              {selectedChapterId === 'ch6' && activeMain !== 'main1' ? 'विभागः' : 'प्रश्नः'}
            </span>
            <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              {selectedChapterId === 'ch6' && activeMain === 'main2' ? (
                '२ / ४'
              ) : selectedChapterId === 'ch6' && activeMain === 'main3' ? (
                '३ / ४'
              ) : selectedChapterId === 'ch6' && activeMain === 'main4' ? (
                '४ / ४'
              ) : isGameOver ? (
                `${questions.length} / ${questions.length}`
              ) : (
                `${currentIndex + 1} / ${questions.length}`
              )}
            </strong>
          </div>

          {streak >= 2 && activeMain === 'main1' && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                background: 'rgba(249, 115, 22, 0.15)',
                color: '#ea580c',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.72rem',
              }}
            >
              <Flame size={11} color="#ea580c" />
              <span>{streak}x</span>
            </div>
          )}

          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            title={soundEnabled ? 'ध्वनिः चालितः (Sound ON)' : 'ध्वनिः बन्दः (Sound Muted)'}
            style={{
              padding: '5px 7px',
              borderRadius: '7px',
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
      </div>

      {/* 3. MAIN CONTENT: MAIN 2, MAIN 3, MAIN 4 PRESERVED PANELS */}
      {selectedChapterId === 'ch6' && (
        <>
          <div style={{ display: activeMain === 'main2' ? 'block' : 'none' }}>
            <DeclensionExerciseTable 
              onScoreUpdate={(s) => setMainScores(prev => ({ ...prev, main2: s }))}
              onScoreEarned={(pts) => setScore(prev => prev + pts)} 
            />
          </div>
          <div style={{ display: activeMain === 'main3' ? 'block' : 'none' }}>
            <SentenceFillExercise 
              onScoreUpdate={(s) => setMainScores(prev => ({ ...prev, main3: s }))}
              onScoreEarned={(pts) => setScore(prev => prev + pts)} 
            />
          </div>
          <div style={{ display: activeMain === 'main4' ? 'block' : 'none' }}>
            <LetterWritingExercise 
              onScoreUpdate={(s) => setMainScores(prev => ({ ...prev, main4: s }))}
              onScoreEarned={(pts) => setScore(prev => prev + pts)} 
            />
          </div>
        </>
      )}

      {/* Main 1 Question Card or Game Over */}
      {(selectedChapterId !== 'ch6' || activeMain === 'main1') && (
        !isGameOver && currentQ ? (
        <div 
          className="question-card"
          style={{
            background: 'var(--bg-primary)',
            border: '2px solid var(--border)',
            borderRadius: '18px',
            padding: '24px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
            position: 'relative',
          }}
        >
          {/* Card Top Metadata */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <span 
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '3px 10px',
                borderRadius: '14px',
                background: `${categoryColor}20`,
                color: categoryColor,
                border: `1px solid ${categoryColor}40`
              }}
            >
              {currentQ.sectionLabel || currentQ.categoryLabel} • {currentQ.tag}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {currentQ.sourceChapter}
            </span>
          </div>

          {/* Question Text */}
          <div style={{ marginBottom: '20px' }}>
            <h3 
              style={{
                fontSize: '1.38rem',
                lineHeight: 1.45,
                margin: '0 0 6px 0',
                color: 'var(--text-primary)',
                fontWeight: 700,
              }}
            >
              {currentQ.question}
            </h3>
            {currentQ.questionEnglish && (
              <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                {currentQ.questionEnglish}
              </p>
            )}
          </div>

          {/* 4 Answer Option Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {currentQ.options.map((opt, idx) => {
              const isSelected = currentAnswer?.chosenIndex === idx;
              const isCorrectOption = idx === currentQ.correctIndex;
              
              let btnBg = 'var(--bg-secondary)';
              let borderColor = 'var(--border)';
              let textColor = 'var(--text-primary)';
              let icon = null;

              if (isCurrentAnswered) {
                if (isCorrectOption) {
                  btnBg = 'rgba(34, 197, 94, 0.16)';
                  borderColor = '#16a34a';
                  textColor = '#16a34a';
                  icon = <CheckCircle2 size={18} color="#16a34a" />;
                } else if (isSelected) {
                  btnBg = 'rgba(239, 68, 68, 0.16)';
                  borderColor = '#ef4444';
                  textColor = '#ef4444';
                  icon = <XCircle size={18} color="#ef4444" />;
                } else {
                  btnBg = 'var(--bg-tertiary)';
                  textColor = 'var(--text-muted)';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={isCurrentAnswered}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: `2px solid ${borderColor}`,
                    background: btnBg,
                    color: textColor,
                    fontSize: '1.02rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: isCurrentAnswered ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {['१', '२', '३', '४'][idx]}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {icon}
                </button>
              );
            })}
          </div>

          {/* Feedback & In-depth Explanation Card */}
          {isCurrentAnswered && (
            <div 
              style={{
                marginTop: '18px',
                padding: '16px',
                borderRadius: '14px',
                background: currentAnswer.isCorrect 
                  ? 'rgba(34, 197, 94, 0.08)' 
                  : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${currentAnswer.isCorrect ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '6px', color: currentAnswer.isCorrect ? '#16a34a' : '#ef4444' }}>
                {currentAnswer.isCorrect ? '🎉 समीचीनम्! (Correct)' : '❌ अशुद्धम्! शुद्धम् उत्तरम्:'}
              </div>

              <div style={{ fontSize: '0.92rem', lineHeight: 1.55 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  📖 {currentQ.explanation}
                </div>
                {currentQ.explanationEnglish && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '3px' }}>
                    💡 {currentQ.explanationEnglish}
                  </div>
                )}
                {currentQ.sutra && (
                  <div 
                    style={{
                      marginTop: '6px',
                      display: 'inline-block',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      color: 'var(--accent)'
                    }}
                  >
                    सूत्रम्: {currentQ.sutra}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '22px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            {/* Previous Question Button */}
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: currentIndex === 0 ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                color: currentIndex === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: currentIndex === 0 ? 'default' : 'pointer',
                opacity: currentIndex === 0 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={16} />
              <span>पूर्वः (Prev)</span>
            </button>

            {/* Direct Jump Pill Dots */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {questions.map((_, idx) => {
                const state = answersState[idx];
                const isCurrent = idx === currentIndex;
                let dotBg = 'var(--bg-tertiary)';
                let dotBorder = 'var(--border)';
                let dotColor = 'var(--text-secondary)';

                if (state) {
                  if (state.isCorrect) {
                    dotBg = 'rgba(34, 197, 94, 0.2)';
                    dotBorder = '#16a34a';
                    dotColor = '#16a34a';
                  } else {
                    dotBg = 'rgba(239, 68, 68, 0.2)';
                    dotBorder = '#ef4444';
                    dotColor = '#ef4444';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleJumpToQuestion(idx)}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      border: isCurrent ? '2px solid var(--accent)' : `1px solid ${dotBorder}`,
                      background: isCurrent ? 'var(--accent-light, rgba(37,99,235,0.1))' : dotBg,
                      color: isCurrent ? 'var(--accent)' : dotColor,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Next / Finish Button */}
            <button
              onClick={handleNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 18px',
                borderRadius: '8px',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <span>{currentIndex + 1 === questions.length ? 'समापनम् (Finish)' : 'अग्रिमः (Next)'}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : isGameOver ? (
        /* Simple Finish Screen */
        <div 
          style={{
            background: 'var(--bg-primary)',
            border: '2px solid var(--border)',
            borderRadius: '18px',
            padding: '30px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '6px' }}>
            {getRankTitle(accuracyPercent).icon}
          </div>
          
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 6px 0', fontWeight: 800 }}>
            {selectedChapterInfo.shortLabel} — परीक्षा समाप्ता!
          </h2>
          
          <div 
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: '20px',
              background: `${getRankTitle(accuracyPercent).color}15`,
              color: getRankTitle(accuracyPercent).color,
              fontWeight: 800,
              fontSize: '1rem',
              marginBottom: '20px',
              border: `1px solid ${getRankTitle(accuracyPercent).color}40`
            }}
          >
            {getRankTitle(accuracyPercent).title}
          </div>

          {/* Simple Scores */}
          <div 
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              maxWidth: '460px',
              margin: '0 auto 24px auto',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                {selectedChapterId === 'ch6' ? 'विभागः १ (MCQ)' : 'अङ्काः (Score)'}
              </span>
              <strong style={{ fontSize: '1.35rem', color: 'var(--accent)' }}>
                {selectedChapterId === 'ch6' ? `${mainScores.main1} / 25` : score}
              </strong>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>शुद्धता (Accuracy)</span>
              <strong style={{ fontSize: '1.35rem', color: '#16a34a' }}>{accuracyPercent}%</strong>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>शुद्धप्रश्नाः (Correct)</span>
              <strong style={{ fontSize: '1.35rem', color: 'var(--text-primary)' }}>{correctCount} / {totalQuestions}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={restartQuiz}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 20px',
                borderRadius: '10px',
                background: 'var(--accent)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={16} />
              <span>पुनः क्रीडतु (Play Again)</span>
            </button>

            {answeredIndices.some(idx => !answersState[idx].isCorrect) && (
              <button
                onClick={retryMissedQuestions}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  border: '1px solid var(--border)',
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={16} color="#ea580c" />
                <span>अशुद्धप्रश्नानां पुनरभ्यासः (Retry Missed)</span>
              </button>
            )}
          </div>
        </div>
      ) : null)}
    </div>
  );
};
