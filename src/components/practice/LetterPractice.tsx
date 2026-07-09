import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Volume2, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Mic, Square } from 'lucide-react';

interface LetterPracticeProps {
  onBack: () => void;
  onComplete: (score: number) => void;
  activeLanguage: string;
}

export const LetterPractice: React.FC<LetterPracticeProps> = ({ onBack, onComplete, activeLanguage }) => {
  const [letters, setLetters] = useState<any[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<any | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}books/sanskrit-learner/practice/letters.json`)
      .then(res => res.json())
      .then(data => setLetters(data))
      .catch(console.error);
  }, []);

  if (letters.length === 0) return <div>Loading...</div>;

  const playSound = (letter: any) => {
    // Stop any queued speech
    window.speechSynthesis.cancel();
    
    const playTTS = () => {
      let speakChar = letter.char;
      
      const phonetics: Record<string, string> = {
        'ऋ': 'रु',
        'ॠ': 'रू',
        'लृ': 'लु',
        'ऌ': 'लु'
      };
      
      if (phonetics[speakChar]) {
        speakChar = phonetics[speakChar];
      } else {
        speakChar = speakChar.replace(/ृ/g, '्रु');
        speakChar = speakChar.replace(/ॄ/g, '्रू');
        speakChar = speakChar.replace(/ॢ/g, '्लु');
        speakChar = speakChar.replace(/ॣ/g, '्लू');
      }
      
      const utterance = new SpeechSynthesisUtterance(speakChar);
      
      const voices = window.speechSynthesis.getVoices();
      const sanskritVoice = voices.find(v => v.lang === 'sa-IN' || v.lang.startsWith('sa'));
      const hindiVoice = voices.find(v => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
      
      if (sanskritVoice) {
        utterance.voice = sanskritVoice;
        utterance.lang = 'sa-IN';
      } else if (hindiVoice) {
        utterance.voice = hindiVoice;
        utterance.lang = 'hi-IN';
      } else {
        utterance.lang = 'hi-IN';
      }
  
      window.speechSynthesis.speak(utterance);
      onComplete(1);
    };

    if (letter.type === 'vowel' || letter.type === 'consonant') {
      // Look for .webm (the default output of MediaRecorder in Chrome)
      const audio = new Audio(`${import.meta.env.BASE_URL}books/sanskrit-learner/practice/audio/${letter.id}.webm`);
      
      // Try fetching to avoid annoying 404 console errors if the file doesn't exist yet
      fetch(`${import.meta.env.BASE_URL}books/sanskrit-learner/practice/audio/${letter.id}.webm`, { method: 'HEAD' })
        .then(res => {
          if (res.ok) {
            audio.play().then(() => onComplete(1)).catch(() => playTTS());
          } else {
            playTTS();
          }
        }).catch(() => playTTS());
    } else {
      playTTS();
    }
  };

  const startRecording = async (letterId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          await fetch(`/api/upload-audio?id=${letterId}`, {
            method: 'POST',
            body: audioBlob,
            headers: { 'Content-Type': 'audio/webm' }
          });
          console.log(`Saved audio for ${letterId}`);
        } catch (e) {
          console.error('Failed to upload audio', e);
        }
        
        // Stop the microphone tracks
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error('Microphone access error:', e);
      alert('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const typeLabels: Record<string, Record<string, string>> = {
    vowel: { te: 'అచ్చు', ta: 'உயிரெழுத்து', kn: 'ಸ್ವರ', sa: 'स्वरः' },
    consonant: { te: 'హల్లు', ta: 'மெய்யெழுத்து', kn: 'ವ್ಯಂಜನ', sa: 'व्यञ्जनम्' },
    gunita: { te: 'గుణింతం', ta: 'உயிர்மெய்', kn: 'ಗುಣಿತ', sa: 'गुणिताक्षरम्' },
    conjunct: { te: 'సంయుక్తాక్షరం', ta: 'கூட்டெழுத்து', kn: 'ಸಂಯುಕ್ತಾಕ್ಷರ', sa: 'संयुक्ताक्षरम्' }
  };

  const t = {
    te: { back: 'తిరిగి వెళ్ళు', title: 'అక్షరమాల (अक्षरम्)', desc: 'అక్షరాలను వినడానికి కార్డ్‌పై క్లిక్ చేయండి.', next: 'తదుపరి అక్షరం' },
    ta: { back: 'திரும்ப செல்', title: 'எழுத்துக்கள் (अक्षरम्)', desc: 'எழுத்துக்களைக் கேட்க அட்டையை கிளிக் செய்யவும்.', next: 'அடுத்த எழுத்து' },
    kn: { back: 'ಹಿಂದಕ್ಕೆ ಹೋಗಿ', title: 'ವರ್ಣಮಾಲೆ (अक्षरम्)', desc: 'ಅಕ್ಷರಗಳನ್ನು ಕೇಳಲು ಕಾರ್ಡ್ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ.', next: 'ಮುಂದಿನ ಅಕ್ಷರ' },
    sa: { back: 'प्रतिगच्छ', title: 'अक्षरम्', desc: 'अक्षरं श्रोतुं कार्ड् नुदन्तु।', next: 'अग्रिमाक्षरम्' }
  };
  const l = (t as any)[activeLanguage] || t['sa'];

  const exampleLabels: Record<string, string> = {
    te: 'ఉదాహరణ',
    ta: 'உதாரணம்',
    kn: 'ಉದಾಹರಣೆ',
    sa: 'उदाहरणम्'
  };
  const examplePrefix = exampleLabels[activeLanguage] || exampleLabels['sa'];

  const getVarga = (char: string) => {
    const kaVarga = ['क्', 'ख्', 'ग्', 'घ्', 'ङ्'];
    const chaVarga = ['च्', 'छ्', 'ज्', 'झ्', 'ञ्'];
    const taVarga = ['ट्', 'ठ्', 'ड्', 'ढ्', 'ण्'];
    const thaVarga = ['त्', 'थ्', 'द्', 'ध्', 'न्'];
    const paVarga = ['प्', 'फ्', 'ब्', 'भ्', 'म्'];
    const avargiya = ['य्', 'र्', 'ल्', 'व्', 'श्', 'ष्', 'स्', 'ह्', 'ळ्'];

    if (kaVarga.includes(char)) return 'कवर्गः (Ka-varga)';
    if (chaVarga.includes(char)) return 'चवर्गः (Cha-varga)';
    if (taVarga.includes(char)) return 'टवर्गः (Ta-varga)';
    if (thaVarga.includes(char)) return 'तवर्गः (Ta-varga)';
    if (paVarga.includes(char)) return 'पवर्गः (Pa-varga)';
    if (avargiya.includes(char)) return 'अवर्गीय-व्यञ्जनानि (Avargīya)';
    return null;
  };

  const groupedLetters: Record<string, any[]> = {};
  letters.forEach(letter => {
    let group = typeLabels[letter.type]?.[activeLanguage] || typeLabels[letter.type]?.['sa'] || letter.type;
    if (letter.type === 'consonant') {
      group = getVarga(letter.char) || group;
    } else if (letter.type === 'gunita' && letter.baseConsonant) {
      group = `${letter.baseConsonant} - ${group}`;
    }
    if (!groupedLetters[group]) groupedLetters[group] = [];
    groupedLetters[group].push(letter);
  });

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => {
      const isCurrentlyCollapsed = prev[groupName] ?? groupName.includes('गुणिताक्षरम्') ?? groupName.includes('gunita');
      return { ...prev, [groupName]: !isCurrentlyCollapsed };
    });
  };

  const selectedIndex = selectedLetter ? letters.findIndex(l => l.id === selectedLetter.id) : -1;
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex < letters.length - 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasPrev) setSelectedLetter(letters[selectedIndex - 1]);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasNext) setSelectedLetter(letters[selectedIndex + 1]);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        <ArrowLeft size={18} /> {l.back}
      </button>

      <h2>{l.title}</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>{l.desc}</p>

      {Object.entries(groupedLetters).map(([groupName, groupLetters]) => {
        const isCollapsed = collapsedGroups[groupName] ?? (groupName.includes('गुणिताक्षरम्') || groupName.includes('gunita'));
        return (
        <div key={groupName} style={{ marginBottom: '20px', textAlign: 'left', background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
          <div 
            onClick={() => toggleGroup(groupName)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          >
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', margin: 0 }}>
              {groupName} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>({groupLetters.length})</span>
            </h3>
            {isCollapsed ? <ChevronDown size={24} color="var(--text-muted)" /> : <ChevronUp size={24} color="var(--text-muted)" />}
          </div>
          
          {!isCollapsed && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '15px', marginTop: '20px' }}>
              {groupLetters.map(letter => (
                <div 
                   key={letter.id} 
                   onClick={() => setSelectedLetter(letter)}
                   style={{ 
                     padding: '15px', 
                     fontSize: '2rem', 
                     background: 'var(--bg-secondary)', 
                     border: '2px solid var(--border)', 
                     borderRadius: '12px', 
                     cursor: 'pointer',
                     transition: 'all 0.2s',
                     display: 'flex',
                     justifyContent: 'center',
                     alignItems: 'center'
                   }}
                   onMouseOver={(e) => {
                     e.currentTarget.style.transform = 'scale(1.05)';
                     e.currentTarget.style.borderColor = 'var(--accent)';
                     e.currentTarget.style.color = 'var(--accent)';
                   }}
                   onMouseOut={(e) => {
                     e.currentTarget.style.transform = 'scale(1)';
                     e.currentTarget.style.borderColor = 'var(--border)';
                     e.currentTarget.style.color = 'inherit';
                   }}
                >
                  {letter.char}
                </div>
              ))}
            </div>
          )}
        </div>
      )})}

      {selectedLetter && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} 
          onClick={() => setSelectedLetter(null)}
        >
          <div 
            style={{ background: 'var(--bg-primary)', padding: '40px', borderRadius: '24px', position: 'relative', width: '350px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} 
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setSelectedLetter(null)} style={{ position: 'absolute', top: '15px', left: '15px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <X size={24}/>
            </button>
            <button onClick={() => playSound(selectedLetter)} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'var(--accent)', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
              <Volume2 size={20}/>
            </button>

            {(selectedLetter.type === 'vowel' || selectedLetter.type === 'consonant') && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
              <button 
                onClick={() => isRecording ? stopRecording() : startRecording(selectedLetter.id)} 
                style={{ position: 'absolute', top: '65px', right: '15px', border: 'none', background: isRecording ? 'red' : 'var(--bg-tertiary)', color: isRecording ? 'white' : 'var(--text-primary)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                title={isRecording ? "Stop Recording" : "Record Voice"}
              >
                {isRecording ? <Square size={16}/> : <Mic size={20}/>}
              </button>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '30px 0' }}>
              <button 
                onClick={handlePrev} 
                disabled={!hasPrev}
                style={{ background: 'transparent', border: 'none', cursor: hasPrev ? 'pointer' : 'default', color: hasPrev ? 'var(--text-primary)' : 'var(--border)', display: 'flex', alignItems: 'center', padding: '10px' }}
              >
                <ChevronLeft size={36} />
              </button>

              <div style={{ fontSize: '6rem', fontWeight: 'bold', color: 'var(--text-primary)', width: '120px' }}>
                {selectedLetter.char}
              </div>

              <button 
                onClick={handleNext} 
                disabled={!hasNext}
                style={{ background: 'transparent', border: 'none', cursor: hasNext ? 'pointer' : 'default', color: hasNext ? 'var(--text-primary)' : 'var(--border)', display: 'flex', alignItems: 'center', padding: '10px' }}
              >
                <ChevronRight size={36} />
              </button>
            </div>
            
            <div style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>
              {typeLabels[selectedLetter.type]?.[activeLanguage] || typeLabels[selectedLetter.type]?.['sa'] || selectedLetter.type}
            </div>
            
            {selectedLetter.type === 'consonant' && getVarga(selectedLetter.char) && (
              <div style={{ fontSize: '1.2rem', marginTop: '10px', color: 'var(--accent)', fontWeight: 500 }}>
                {getVarga(selectedLetter.char)}
              </div>
            )}
            
            {selectedLetter.example && (
              <div style={{ fontSize: '1.2rem', marginTop: '10px', color: 'var(--accent)' }}>
                {examplePrefix}: {selectedLetter.example}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
