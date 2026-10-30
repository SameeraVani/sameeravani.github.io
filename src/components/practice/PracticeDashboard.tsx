import React, { useState } from 'react';
import { LetterPractice } from './LetterPractice';
import { WordPractice } from './WordPractice';
import { SentencePractice } from './SentencePractice';
import { GrammarGame } from './GrammarGame';
import { ArrowLeft, Type, AlignLeft, MessageSquare, Award } from 'lucide-react';

interface PracticeDashboardProps {
  onBack: () => void;
  activeLanguage: string;
}

export const PracticeDashboard: React.FC<PracticeDashboardProps> = ({ onBack, activeLanguage }) => {
  const [activeModule, setActiveModule] = useState<'menu' | 'letters' | 'words' | 'sentences' | 'grammar'>('menu');
  const [sessionScore, setSessionScore] = useState(0);

  const handleComplete = (scoreEarned: number) => {
    setSessionScore((prev) => prev + scoreEarned);
  };

  const t = {
    te: {
      title: 'సంస్కృత అభ్యాస గది',
      desc: 'మీ పఠనం మరియు పదజాలం మెరుగుపరచడానికి ఇంటరాక్టివ్ అభ్యాసాలు.',
      score: 'సెషన్ స్కోర్:',
      back: 'పఠనానికి తిరిగి వెళ్ళు',
      alphabet: 'అక్షరమాల',
      vocab: 'పదజాలం',
      sentences: 'వాక్యాలు',
      grammar: 'వ్యాకరణ క్రీడ'
    },
    ta: {
      title: 'சமஸ்கிருத பயிற்சி அறை',
      desc: 'உங்கள் வாசிப்பு மற்றும் சொற்களஞ்சியத்தை மேம்படுத்த ஊடாடும் பயிற்சிகள்.',
      score: 'அமர்வு மதிப்பெண்:',
      back: 'வாசிப்புக்குத் திரும்பு',
      alphabet: 'எழுத்துக்கள்',
      vocab: 'சொற்களஞ்சியம்',
      sentences: 'வாக்கியங்கள்',
      grammar: 'இலக்கண விளையாட்டு'
    },
    kn: {
      title: 'ಸಂಸ್ಕೃತ ಅಭ್ಯಾಸ ಕೊಠಡಿ',
      desc: 'ನಿಮ್ಮ ಓದುವಿಕೆ ಮತ್ತು ಶಬ್ದಕೋಶವನ್ನು ಸುಧಾರಿಸಲು ಸಂವಾದಾತ್ಮಕ ಅಭ್ಯಾಸಗಳು.',
      score: 'ಸೆಷನ್ ಸ್ಕೋರ್:',
      back: 'ಓದುವಿಕೆಗೆ ಹಿಂತಿರುಗಿ',
      alphabet: 'ವರ್ಣಮಾಲೆ',
      vocab: 'ಶಬ್ದಕೋಶ',
      sentences: 'ವಾಕ್ಯಗಳು',
      grammar: 'ವ್ಯಾಕರಣ ಆಟ'
    },
    sa: {
      title: 'अभ्यास कक्षः',
      desc: 'पठनार्थं शब्दज्ञानार्थं च अभ्यासाः।',
      score: 'अङ्काः:',
      back: 'प्रतिगच्छ',
      alphabet: 'अक्षरम्',
      vocab: 'शब्दः',
      sentences: 'वाक्यम्',
      grammar: 'व्याकरण-क्रीडा'
    }
  };

  const l = (t as any)[activeLanguage] || t['sa']; // Fallback to Sanskrit

  if (activeModule === 'letters') return <LetterPractice onBack={() => setActiveModule('menu')} onComplete={handleComplete} activeLanguage={activeLanguage} />;
  if (activeModule === 'words') return <WordPractice onBack={() => setActiveModule('menu')} onComplete={handleComplete} activeLanguage={activeLanguage} />;
  if (activeModule === 'sentences') return <SentencePractice onBack={() => setActiveModule('menu')} onComplete={handleComplete} activeLanguage={activeLanguage} />;
  if (activeModule === 'grammar') return <GrammarGame onBack={() => setActiveModule('menu')} onComplete={handleComplete} />;

  return (
    <div className="practice-dashboard" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <button onClick={onBack} className="practice-back-btn" style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-secondary)' }}>
        <ArrowLeft size={18} /> {l.back}
      </button>

      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: 'var(--text-primary)' }}>{l.title}</h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '40px' }}>
        {l.desc} {l.score} <strong style={{color: 'var(--accent)', fontSize: '1.3rem'}}>{sessionScore}</strong>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px' }}>
        <button 
          onClick={() => setActiveModule('letters')}
          className="practice-card-btn"
          style={{ padding: '30px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '2px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}
        >
          <Type size={48} color="var(--accent)" />
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{l.alphabet}</h2>
          <span style={{ color: 'var(--text-muted)' }}>अक्षरम्</span>
        </button>

        <button 
          onClick={() => setActiveModule('words')}
          className="practice-card-btn"
          style={{ padding: '30px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '2px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}
        >
          <AlignLeft size={48} color="#4ade80" />
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{l.vocab}</h2>
          <span style={{ color: 'var(--text-muted)' }}>शब्दः</span>
        </button>

        <button 
          onClick={() => setActiveModule('sentences')}
          className="practice-card-btn"
          style={{ padding: '30px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '2px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}
        >
          <MessageSquare size={48} color="#60a5fa" />
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{l.sentences}</h2>
          <span style={{ color: 'var(--text-muted)' }}>वाक्यम्</span>
        </button>

        <button 
          onClick={() => setActiveModule('grammar')}
          className="practice-card-btn"
          style={{ padding: '30px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '2px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}
        >
          <Award size={48} color="#f59e0b" />
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{l.grammar || 'व्याकरण-क्रीडा'}</h2>
          <span style={{ color: 'var(--text-muted)' }}>शब्द-धातु-सन्धि-वृत्तयः</span>
        </button>
      </div>
    </div>
  );
};
