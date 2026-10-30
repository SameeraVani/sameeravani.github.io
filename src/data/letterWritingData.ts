// Letter Writing (पत्रलेखनम्) Data for Chapter 13
// Cloze-style letter completion with Manjusha (Word Bank) and dropdowns.

export interface LetterExercise {
  id: string;
  title: string;
  subTitle: string;
  recipient: string;
  location: string;
  date: string;
  salutation: string;
  manjusha: string[];
  paragraphs: {
    segments: {
      textBefore: string;
      blankIndex?: number;
      textAfter?: string;
    }[];
  }[];
  signOffPrefix: string;
  signOffBlankIndex: number;
  senderName: string;
  correctAnswers: Record<number, string>;
  explanations: Record<number, string>;
}

export const LETTER_EXERCISES: LetterExercise[] = [
  {
    id: 'letter-1',
    title: 'पत्रम् १: पितरं प्रति पत्रम् (Letter to Father)',
    subTitle: 'छात्रावासात् परीक्षाविषये पितुः चरणे पत्रम्',
    recipient: 'पूज्य पितृमहोदयः',
    location: 'छात्रावासात्',
    date: 'दिनाङ्कः— १५-०३-२०२५',
    salutation: 'पूज्य पितृमहोदय!',
    manjusha: [
      'प्रणामः',
      'कुशलम्',
      'परीक्षा',
      'सफलताम्',
      'पुत्रः',
      'अभवत्',
      'पठामि',
      'लभते',
      'भविष्यति',
      'सन्ति'
    ],
    paragraphs: [
      {
        segments: [
          { textBefore: 'सादरं (१) ', blankIndex: 1, textAfter: '।' }
        ]
      },
      {
        segments: [
          { textBefore: 'अत्र सर्वं (२) ', blankIndex: 2, textAfter: ', तत्रापि अस्तु। मम अध्ययनं सम्यक् प्रचलति। मम अर्धवार्षिकी (३) ' },
          { textBefore: '', blankIndex: 3, textAfter: ' सम्यक् समाप्ता (४) ' },
          { textBefore: '', blankIndex: 4, textAfter: '। सम्प्रति अहं वार्षिकी-परीक्षायाः सिद्धतायै मनोयोगेन (५) ' },
          { textBefore: '', blankIndex: 5, textAfter: '।' }
        ]
      },
      {
        segments: [
          { textBefore: 'अस्माकं शिक्षकः वदति यत् यः छात्रः परिश्रमी भवति, सः एव विद्यां (६) ', blankIndex: 6, textAfter: '। मम वार्षिकी परीक्षा आगामि-मासे (७) ' },
          { textBefore: '', blankIndex: 7, textAfter: '। अहं निश्चयेन उत्तमां (८) ' },
          { textBefore: '', blankIndex: 8, textAfter: ' प्राप्स्यामि।' }
        ]
      },
      {
        segments: [
          { textBefore: 'मातृचरणयोः मम सादरप्रणामाः (९) ', blankIndex: 9, textAfter: '।' }
        ]
      }
    ],
    signOffPrefix: 'भवतः आज्ञाकारी (१०)',
    signOffBlankIndex: 10,
    senderName: 'अनुरागः',
    correctAnswers: {
      1: 'प्रणामः',
      2: 'कुशलम्',
      3: 'परीक्षा',
      4: 'अभवत्',
      5: 'पठामि',
      6: 'लभते',
      7: 'भविष्यति',
      8: 'सफलताम्',
      9: 'सन्ति',
      10: 'पुत्रः'
    },
    explanations: {
      1: 'पित्रे अभिवादने "सादरं प्रणामः" इति प्रयुज्यते।',
      2: 'क्षेमवार्तायाम् "अत्र सर्वं कुशलम्" इति शिष्टाचारः।',
      3: 'अर्धवार्षिकी "परीक्षा" सम्यक् समाप्ता।',
      4: 'भूतकालिक-समाप्तौ "अभवत्" (भू धातोः लङ्-लकारः)।',
      5: 'अहं मनोयोगेन "पठामि" (पठ् धातोः लट् उत्तमपुरुषः)।',
      6: 'परिश्रमी एव विद्यां "लभते" (लभ् धातोः आत्मनेपदम्)।',
      7: 'आगामि-मासे "भविष्यति" (भू धातोः लृट् भविष्यत्कालः)।',
      8: 'द्वितीया-विभक्तौ उत्तमां "सफलताम्" प्राप्स्यामि।',
      9: 'प्रणामाः बहुवचनान्तः, अतः क्रियापदं "सन्ति"।',
      10: 'पितरं प्रति अन्ते "भवतः आज्ञाकारी पुत्रः अनुरागः"।'
    }
  },
  {
    id: 'letter-2',
    title: 'पत्रम् २: मित्रं प्रति निमन्त्रण-पत्रम् (Invitation to Friend)',
    subTitle: 'जन्मदिनोत्सवार्थं मित्रं प्रति पत्रम्',
    recipient: 'प्रियं मित्रम्',
    location: 'बेङ्गलूरुतः',
    date: 'दिनाङ्कः— १०-०४-२०२५',
    salutation: 'प्रिय मित्र माधव!',
    manjusha: [
      'नमस्ते',
      'कुशली',
      'जन्मदिवसः',
      'आयोजितः',
      'आगन्तव्यम्',
      'आगमिष्यन्ति',
      'आनन्दः',
      'प्रतीक्षां',
      'प्रणामाः',
      'सुहृद्'
    ],
    paragraphs: [
      {
        segments: [
          { textBefore: 'सप्रेम (१) ', blankIndex: 1, textAfter: '।' }
        ]
      },
      {
        segments: [
          { textBefore: 'अत्र अहं (२) ', blankIndex: 2, textAfter: ' अस्मि, तत्रापि भवान् कुशली स्यात्। विशेषवार्ता इयं यत् आगामिसप्ताहस्य रविवासरे मम (३) ' },
          { textBefore: '', blankIndex: 3, textAfter: ' अस्ति। अस्मिन् शुभ-अवसरे गृहे एकः उत्सवः (४) ' },
          { textBefore: '', blankIndex: 4, textAfter: ' अस्ति।' }
        ]
      },
      {
        segments: [
          { textBefore: 'अस्मिन् उत्सवे त्वया सपरिवारं निश्चयेन (५) ', blankIndex: 5, textAfter: '। अस्माकं सर्वे मित्राणि अपि अत्र (६) ' },
          { textBefore: '', blankIndex: 6, textAfter: '। सर्वेषां मेलनेन महान् (७) ' },
          { textBefore: '', blankIndex: 7, textAfter: ' भविष्यति। अहं तव (८) ' },
          { textBefore: '', blankIndex: 8, textAfter: ' करिष्यामि।' }
        ]
      },
      {
        segments: [
          { textBefore: 'तव पितृपादयोः मम (९) ', blankIndex: 9, textAfter: ' समर्पणीयाः।' }
        ]
      }
    ],
    signOffPrefix: 'तव अभिन्नः (१०)',
    signOffBlankIndex: 10,
    senderName: 'श्रीकान्तः',
    correctAnswers: {
      1: 'नमस्ते',
      2: 'कुशली',
      3: 'जन्मदिवसः',
      4: 'आयोजितः',
      5: 'आगन्तव्यम्',
      6: 'आगमिष्यन्ति',
      7: 'आनन्दः',
      8: 'प्रतीक्षां',
      9: 'प्रणामाः',
      10: 'सुहृद्'
    },
    explanations: {
      1: 'मित्रेण सह सप्रेम "नमस्ते"।',
      2: 'अहं "कुशली" अस्मि।',
      3: 'मम "जन्मदिवसः" अस्ति।',
      4: 'उत्सवः "आयोजितः" अस्ति।',
      5: 'विध्यर्थे त्वया "आगन्तव्यम्"।',
      6: 'मित्राणि "आगमिष्यन्ति" (लृट्-बहुवचनम्)।',
      7: 'महान् "आनन्दः" भविष्यति।',
      8: 'अहं तव "प्रतीक्षां" करिष्यामि।',
      9: 'ज्येष्ठेषु "प्रणामाः" समर्पणीयाः।',
      10: 'तव अभिन्नः मित्रम्/ "सुहृद्" श्रीकान्तः।'
    }
  }
];
