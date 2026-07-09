import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

interface WordPracticeProps {
  onBack: () => void;
  onComplete: (score: number) => void;
  activeLanguage: string;
}

export const WordPractice: React.FC<WordPracticeProps> = ({ onBack, onComplete, activeLanguage }) => {
  const [words, setWords] = useState<any[]>([]);
  const [selectedSanskrit, setSelectedSanskrit] = useState<string | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}books/sanskrit-learner/practice/words.json`)
      .then(res => res.json())
      .then(data => {
        // Take just 5 random words for this session
        const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 5);
        setWords(shuffled);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedSanskrit && selectedMeaning) {
      const match = words.find(w => w.id === selectedSanskrit && w.id === selectedMeaning);
      if (match) {
        setFeedback('correct');
        setTimeout(() => {
          setMatchedPairs(prev => [...prev, selectedSanskrit]);
          setSelectedSanskrit(null);
          setSelectedMeaning(null);
          setFeedback(null);
          onComplete(10);
        }, 1000);
      } else {
        setFeedback('incorrect');
        setTimeout(() => {
          setSelectedSanskrit(null);
          setSelectedMeaning(null);
          setFeedback(null);
        }, 1000);
      }
    }
  }, [selectedSanskrit, selectedMeaning, words, onComplete]);

  if (words.length === 0) return <div>Loading...</div>;

  const isAllMatched = matchedPairs.length === words.length;

  const t = {
    te: { back: 'తిరిగి వెళ్ళు', title: 'పదజాలం (शब्दः)', desc: 'సంస్కృత పదాన్ని మరియు దాని సరైన అర్థాన్ని జత చేయడానికి వాటిని క్లిక్ చేయండి.', great: 'అద్భుతం!', complete: 'మీరు ఈ సెట్‌లోని అన్ని పదాలను జత చేసారు.', return: 'తిరిగి వెళ్ళు' },
    ta: { back: 'திரும்ப செல்', title: 'சொற்களஞ்சியம் (शब्दः)', desc: 'சமஸ்கிருத சொல்லையும் அதன் சரியான பொருளையும் இணைக்க அவற்றைக் கிளிக் செய்யவும்.', great: 'மிக நன்று!', complete: 'இந்த தொகுப்பில் உள்ள அனைத்து சொற்களையும் நீங்கள் பொருத்திவிட்டீர்கள்.', return: 'திரும்ப செல்' },
    kn: { back: 'ಹಿಂದಕ್ಕೆ ಹೋಗಿ', title: 'ಶಬ್ದಕೋಶ (शब्दः)', desc: 'ಸಂಸ್ಕೃತ ಪದ ಮತ್ತು ಅದರ ಸರಿಯಾದ ಅರ್ಥವನ್ನು ಹೊಂದಿಸಲು ಅವುಗಳನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ.', great: 'ಅದ್ಭುತ!', complete: 'ನೀವು ಈ ಸೆಟ್‌ನಲ್ಲಿರುವ ಎಲ್ಲಾ ಪದಗಳನ್ನು ಹೊಂದಿಸಿದ್ದೀರಿ.', return: 'ಹಿಂದಕ್ಕೆ ಹೋಗಿ' },
    sa: { back: 'प्रतिगच्छ', title: 'शब्दः', desc: 'संस्कृतशब्दं तस्य अर्थं च मेलयितुं नुदन्तु।', great: 'उत्तमम्!', complete: 'सर्वे शब्दाः मेलिताः।', return: 'प्रतिगच्छ' }
  };
  const l = (t as any)[activeLanguage] || t['sa'];

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        <ArrowLeft size={18} /> {l.back}
      </button>

      <h2>{l.title}</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>{l.desc}</p>

      {isAllMatched ? (
        <div style={{ padding: '40px', background: 'var(--bg-secondary)', borderRadius: '16px' }}>
          <CheckCircle2 size={64} color="#4ade80" style={{ margin: '0 auto 20px' }} />
          <h3>{l.great}</h3>
          <p>{l.complete}</p>
          <button onClick={onBack} style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--accent)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>{l.return}</button>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px' }}>
          {/* Sanskrit Column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {words.map(w => {
              const isMatched = matchedPairs.includes(w.id);
              const isSelected = selectedSanskrit === w.id;
              return (
                <button
                  key={`san_${w.id}`}
                  disabled={isMatched}
                  onClick={() => setSelectedSanskrit(w.id)}
                  style={{
                    padding: '20px', fontSize: '1.5rem', borderRadius: '12px', cursor: isMatched ? 'default' : 'pointer',
                    background: isMatched ? '#4ade80' : isSelected ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: (isMatched || isSelected) ? 'white' : 'var(--text-primary)',
                    border: '2px solid var(--border)',
                    opacity: isMatched ? 0.6 : 1,
                    transition: 'all 0.2s',
                    animation: feedback === 'incorrect' && isSelected ? 'shake 0.5s' : 'none'
                  }}
                >
                  {w.sanskrit}
                </button>
              );
            })}
          </div>

          {/* Meaning Column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Shuffle meanings array so they aren't side-by-side */}
            {[...words].sort(() => 0.5 - Math.random()).map(w => {
              const displayMeaning = activeLanguage === 'te' ? w.telugu : 
                              activeLanguage === 'ta' ? w.tamil : 
                              activeLanguage === 'kn' ? w.kannada : 
                              activeLanguage === 'sa' ? w.sanskrit : w.english;
              const isSelected = selectedMeaning === w.id;
              const isMatched = matchedPairs.includes(w.id);
              return (
                <button
                  key={`mean_${w.id}`}
                  disabled={isMatched}
                  onClick={() => setSelectedMeaning(w.id)}
                  style={{
                    padding: '20px', fontSize: '1.5rem', borderRadius: '12px', cursor: isMatched ? 'default' : 'pointer',
                    background: isMatched ? '#4ade80' : isSelected ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: (isMatched || isSelected) ? 'white' : 'var(--text-primary)',
                    border: '2px solid var(--border)',
                    opacity: isMatched ? 0.6 : 1,
                    transition: 'all 0.2s',
                    animation: feedback === 'incorrect' && isSelected ? 'shake 0.5s' : 'none'
                  }}
                >
                  {displayMeaning || w.english}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }
      `}} />
    </div>
  );
};
