import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

interface SentencePracticeProps {
  onBack: () => void;
  onComplete: (score: number) => void;
  activeLanguage: string;
}

export const SentencePractice: React.FC<SentencePracticeProps> = ({ onBack, onComplete, activeLanguage }) => {
  const [sentences, setSentences] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [placedWords, setPlacedWords] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}books/sanskrit-learner/practice/sentences.json`)
      .then(res => res.json())
      .then(data => setSentences(data))
      .catch(console.error);
  }, []);

  if (sentences.length === 0) return <div>Loading...</div>;

  const currentSentence = sentences[currentIndex];
  // Filter out words that have already been placed
  const availableWords = currentSentence.words.filter((w: any) => !placedWords.find(p => p.id === w.id));

  const handleWordClick = (word: any) => {
    const newPlaced = [...placedWords, word];
    setPlacedWords(newPlaced);

    // Check if the sequence so far is correct
    const isCorrectSoFar = newPlaced.every((w, i) => w.id === currentSentence.correctOrder[i]);
    
    if (!isCorrectSoFar) {
      setFeedback('incorrect');
      setTimeout(() => {
        setPlacedWords([]); // Reset on mistake
        setFeedback(null);
      }, 1000);
      return;
    }

    if (newPlaced.length === currentSentence.correctOrder.length) {
      setFeedback('correct');
      onComplete(15);
      setTimeout(() => {
        setPlacedWords([]);
        setFeedback(null);
        setCurrentIndex(prev => (prev + 1) % sentences.length);
      }, 1500);
    }
  };

  const handleRemoveLast = () => {
    if (placedWords.length > 0 && feedback !== 'correct') {
      setPlacedWords(placedWords.slice(0, -1));
    }
  };

  const displayMeaning = activeLanguage === 'te' ? currentSentence.telugu : 
                         activeLanguage === 'ta' ? currentSentence.tamil : 
                         activeLanguage === 'kn' ? currentSentence.kannada : 
                         activeLanguage === 'sa' ? '' : currentSentence.english;

  const t = {
    te: { back: 'తిరిగి వెళ్ళు', title: 'వాక్య నిర్మాణం (वाक्यम्)', desc: 'సరైన క్రమంలో పదాలను క్లిక్ చేసి వాక్యాన్ని నిర్మించండి.', hint: 'పదాలను ఇక్కడ ఉంచడానికి క్రింది వాటిపై నొక్కండి...' },
    ta: { back: 'திரும்ப செல்', title: 'வாக்கிய அமைப்பு (वाक्यम्)', desc: 'சரியான வரிசையில் வார்த்தைகளை கிளிக் செய்து வாக்கியத்தை அமைக்கவும்.', hint: 'வார்த்தைகளை இங்கே வைக்க கீழே தட்டவும்...' },
    kn: { back: 'ಹಿಂದಕ್ಕೆ ಹೋಗಿ', title: 'ವಾಕ್ಯ ರಚನೆ (वाक्यम्)', desc: 'ಸರಿಯಾದ ಕ್ರಮದಲ್ಲಿ ಪದಗಳನ್ನು ಕ್ಲಿಕ್ ಮಾಡುವ ಮೂಲಕ ವಾಕ್ಯವನ್ನು ರಚಿಸಿ.', hint: 'ಪದಗಳನ್ನು ಇಲ್ಲಿ ಇರಿಸಲು ಕೆಳಗೆ ಟ್ಯಾಪ್ ಮಾಡಿ...' },
    sa: { back: 'प्रतिगच्छ', title: 'वाक्यम्', desc: 'समीचीनक्रमेण पदानि चित्वा वाक्यं रचयन्तु।', hint: 'पदानि अत्र स्थापयितुं अधः नुदन्तु...' }
  };
  const l = (t as any)[activeLanguage] || t['sa'];

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        <ArrowLeft size={18} /> {l.back}
      </button>

      <h2>{l.title}</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>{l.desc}</p>

      <div style={{ marginBottom: '30px', padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{displayMeaning}</h3>
      </div>

      {/* Target Area */}
      <div 
        onClick={handleRemoveLast}
        style={{ 
          minHeight: '80px', 
          display: 'flex', 
          gap: '15px', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '20px', 
          border: '2px dashed var(--border)', 
          borderRadius: '16px',
          marginBottom: '40px',
          background: feedback === 'correct' ? '#dcfce7' : feedback === 'incorrect' ? '#fee2e2' : 'transparent',
          transition: 'background 0.3s'
        }}
      >
        {placedWords.length === 0 && <span style={{ color: 'var(--text-muted)' }}>{l.hint}</span>}
        {placedWords.map((w, i) => (
          <div key={i} style={{ padding: '15px 25px', fontSize: '1.5rem', background: 'var(--accent)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
            {w.sanskrit}
          </div>
        ))}
        {feedback === 'correct' && <CheckCircle2 size={32} color="#16a34a" style={{ marginLeft: '10px' }} />}
      </div>

      {/* Source Area */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {availableWords.map((w: any) => (
          <button
            key={w.id}
            onClick={() => handleWordClick(w)}
            style={{ padding: '15px 25px', fontSize: '1.5rem', background: 'var(--bg-secondary)', border: '2px solid var(--border)', borderRadius: '8px', cursor: 'pointer', transition: 'transform 0.1s' }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {w.sanskrit}
          </button>
        ))}
      </div>
    </div>
  );
};
