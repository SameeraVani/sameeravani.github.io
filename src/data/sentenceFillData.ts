// Sentence Fill-in-the-Blank Data for Lesson 6 (Main 3)
// 4 Sets testing Noun Vibhakti usage in sentences without verb conjugation requirements.

export interface SentenceFillItem {
  id: string;
  sentenceBefore: string; // e.g. "शिवः "
  sentenceAfter: string;  // e.g. " सह गच्छति।"
  kannadaTranslation?: string;
  englishTranslation: string;
  vibhakti: string; // e.g. "तृतीया विभक्तिः"
  ruleHint: string; // e.g. "'सह' योगे तृतीया विभक्तिः"
  options: string[]; // 4 choices for the noun
  correctAnswer: string;
}

export interface SentenceFillSet {
  id: string;
  title: string;
  shortTitle: string;
  paradigm: string;
  description: string;
  items: SentenceFillItem[];
}

export const SENTENCE_FILL_SETS: SentenceFillSet[] = [
  // ==========================================
  // SET 1: अकारान्त-पुल्लिङ्गः (राम / बालक शब्दः)
  // ==========================================
  {
    id: 'set1',
    title: 'सेट् १: अकारान्त-पुल्लिङ्गः (राम / बालक शब्दः)',
    shortTitle: 'सेट् १: राम शब्दः (अकारान्त)',
    paradigm: 'अकारान्तः पुल्लिङ्गः',
    description: 'अष्टासु विभक्तिषु राम/बालक शब्दस्य वाक्येषु कारक-प्रयोगः',
    items: [
      {
        id: 's1-1',
        sentenceBefore: '',
        sentenceAfter: ' वनं गच्छति।',
        kannadaTranslation: 'रामनु वनक्के होगुत्ताने।',
        englishTranslation: 'Rama goes to the forest.',
        vibhakti: 'प्रथमा विभक्तिः (कर्ता)',
        ruleHint: 'स्वतन्त्रः कर्ता — क्रियायाः कर्तरि प्रथमा विभक्तिः प्रयुज्यते।',
        options: ['रामः', 'रामम्', 'रामेण', 'रामात्'],
        correctAnswer: 'रामः'
      },
      {
        id: 's1-2',
        sentenceBefore: 'शिवः ',
        sentenceAfter: ' पश्यति।',
        kannadaTranslation: 'शिवनु रामनन्नु नोडुत्ताने।',
        englishTranslation: 'Shiva sees Rama.',
        vibhakti: 'द्वितीया विभक्तिः (कर्म)',
        ruleHint: 'कर्तुरीप्सिततमं कर्म — क्रियायाः फलभाजनं कर्म, कर्मणि द्वितीया।',
        options: ['रामम्', 'रामः', 'रामेण', 'रामाय'],
        correctAnswer: 'रामम्'
      },
      {
        id: 's1-3',
        sentenceBefore: 'लक्ष्मणः ',
        sentenceAfter: ' सह गच्छति।',
        kannadaTranslation: 'लक्ष्मणनु रामनिन्द कूडिकोण्डु होगुत्ताने।',
        englishTranslation: 'Lakshmana goes along with Rama.',
        vibhakti: 'तृतीया विभक्तिः (करणम् / सह-योगः)',
        ruleHint: "सहयुक्तेऽप्रधाने — 'सह / साकम्' योगे तृतीया विभक्तिः भवति।",
        options: ['रामेण', 'रामस्य', 'रामाय', 'रामात्'],
        correctAnswer: 'रामेण'
      },
      {
        id: 's1-4',
        sentenceBefore: 'सूर्यः ',
        sentenceAfter: ' नमति।',
        kannadaTranslation: 'सूर्यनु रामनिगे नमिसुत्ताने।',
        englishTranslation: 'The Sun salutes Rama.',
        vibhakti: 'चतुर्थी विभक्तिः (सम्प्रदानम्)',
        ruleHint: 'नमःस्वस्तिस्वाहा... — नमन-क्रियायां सम्प्रदाने चतुर्थी विभक्तिः भवति।',
        options: ['रामाय', 'रामस्य', 'रामात्', 'रामेण'],
        correctAnswer: 'रामाय'
      },
      {
        id: 's1-5',
        sentenceBefore: 'लवः ',
        sentenceAfter: ' जायते (भवति)।',
        kannadaTranslation: 'लवनु रामन देसेयिन्द हुट्टुत्ताने।',
        englishTranslation: 'Lava is born from Rama.',
        vibhakti: 'पञ्चमी विभक्तिः (अपादानम्)',
        ruleHint: 'जनिकर्तुः प्रकृतिः — यस्मात् उत्पत्तिर्भवति तत्र अपादाने पञ्चमी भवति।',
        options: ['रामात्', 'रामेण', 'रामस्य', 'रामे'],
        correctAnswer: 'रामात्'
      },
      {
        id: 's1-6',
        sentenceBefore: '',
        sentenceAfter: ' पिता दशरथः अस्ति।',
        kannadaTranslation: 'रामन तन्दे दशरथनु आगिद्दाने।',
        englishTranslation: "Rama's father is Dasharatha.",
        vibhakti: 'षष्ठी विभक्तिः (सम्बन्धः)',
        ruleHint: 'षष्ठी शेषे — जन्य-जनक-भावे सम्बन्धे षष्ठी विभक्तिः प्रयुज्यते।',
        options: ['रामस्य', 'रामाय', 'रामात्', 'रामेण'],
        correctAnswer: 'रामस्य'
      },
      {
        id: 's1-7',
        sentenceBefore: '',
        sentenceAfter: ' उत्तमाः गुणाः सन्ति।',
        kannadaTranslation: 'रामनल्लि उत्तम गुणगळिवे।',
        englishTranslation: 'In Rama, there are noble virtues.',
        vibhakti: 'सप्तमी विभक्तिः (अधिकरणम्)',
        ruleHint: 'आधारोऽधिकरणम् — गुणानां आधारभूते अधिकरणे सप्तमी विभक्तिः भवति।',
        options: ['रामे', 'रामात्', 'रामस्य', 'रामाय'],
        correctAnswer: 'रामे'
      },
      {
        id: 's1-8',
        sentenceBefore: 'हे ',
        sentenceAfter: '! अत्र आगच्छतु।',
        kannadaTranslation: 'हे रामने, इल्लि बा।',
        englishTranslation: 'O Rama! Please come here.',
        vibhakti: 'सम्बोधनम् (आह्वानम्)',
        ruleHint: 'सम्बोधने च — आह्वानार्थे सम्बोधन-प्रथमा भवति (हे राम!)।',
        options: ['राम', 'रामः', 'रामम्', 'रामेण'],
        correctAnswer: 'राम'
      }
    ]
  },

  // ==========================================
  // SET 2: इकारान्त-पुल्लिङ्गः (हरि / मुनि / कवि शब्दः)
  // ==========================================
  {
    id: 'set2',
    title: 'सेट् २: इकारान्त-पुल्लिङ्गः (हरि / मुनि / कवि शब्दः)',
    shortTitle: 'सेट् २: हरि/मुनि शब्दः (इकारान्त)',
    paradigm: 'इकारान्तः पुल्लिङ्गः',
    description: 'इकारान्त-पुल्लिङ्ग-शब्दानां (हरि, मुनि, कवि) वाक्येषु प्रयोगः',
    items: [
      {
        id: 's2-1',
        sentenceBefore: '',
        sentenceAfter: ' आश्रमे तपः करोति।',
        kannadaTranslation: 'मुनिसु आश्रमादल्लि तपस्सु माडुत्ताने।',
        englishTranslation: 'The Sage performs penance in the hermitage.',
        vibhakti: 'प्रथमा विभक्तिः (कर्ता)',
        ruleHint: 'तपः-क्रियायाः कर्ता मुनिः (प्रथमा विभक्तिः एकवचनम्)।',
        options: ['मुनिः', 'मुनिम्', 'मुनिना', 'मुनेः'],
        correctAnswer: 'मुनिः'
      },
      {
        id: 's2-2',
        sentenceBefore: 'भक्तः देवालयं गत्वा ',
        sentenceAfter: ' पश्यति।',
        kannadaTranslation: 'भक्तनु देवालयक्के होगि हरियन्नु नोडुत्ताने।',
        englishTranslation: 'The devotee visits temple and sees Hari.',
        vibhakti: 'द्वितीया विभक्तिः (कर्म)',
        ruleHint: "दर्शन-क्रियायाः कर्म 'हरि' शब्दस्य द्वितीयायाम् 'हरिम्' भवति।",
        options: ['हरिम्', 'हरिः', 'हरये', 'हरौ'],
        correctAnswer: 'हरिम्'
      },
      {
        id: 's2-3',
        sentenceBefore: 'नृपः पण्डितेन ',
        sentenceAfter: ' सह सम्भाषते।',
        kannadaTranslation: 'अरसनु कवियिन्द कूडिकोण्डु मातुनाडुत्ताने।',
        englishTranslation: 'The King converses along with the poet.',
        vibhakti: 'तृतीया विभक्तिः (सह-योगः)',
        ruleHint: "'सह' योगे इकारान्त 'कवि' शब्दस्य तृतीयायाम् 'कविना' भवति।",
        options: ['कविना', 'कवेः', 'कवये', 'कवौ'],
        correctAnswer: 'कविना'
      },
      {
        id: 's2-4',
        sentenceBefore: 'भक्ताः मङ्गलार्थं ',
        sentenceAfter: ' नमन्ति।',
        kannadaTranslation: 'भक्तरु मङ्गळक्कागि हरिसिगे नमिसुत्तारे।',
        englishTranslation: 'Devotees bow to Lord Hari for auspiciousness.',
        vibhakti: 'चतुर्थी विभक्तिः (सम्प्रदानम्)',
        ruleHint: "नमः-योगे सम्प्रदाने 'हरि' शब्दस्य चतुर्थी-एकवचने 'हरये' भवति।",
        options: ['हरये', 'हरेः', 'हरिणा', 'हरौ'],
        correctAnswer: 'हरये'
      },
      {
        id: 's2-5',
        sentenceBefore: 'शिष्यः तत्त्वज्ञानं ',
        sentenceAfter: ' प्राप्नोति।',
        kannadaTranslation: 'शिष्यनु तत्त्वज्ञानवन्नु मुनियिन्द पडेयुत्ताने।',
        englishTranslation: 'The disciple acquires wisdom from the sage.',
        vibhakti: 'पञ्चमी विभक्तिः (अपादानम्)',
        ruleHint: "आख्यातोपयोगे / अपादाने इकारान्त 'मुनि' शब्दस्य पञ्चम्याम् 'मुनेः' भवति।",
        options: ['मुनेः', 'मुनौ', 'मुनिना', 'मुनये'],
        correctAnswer: 'मुनेः'
      },
      {
        id: 's2-6',
        sentenceBefore: 'एषा रमणीया रचना ',
        sentenceAfter: ' अस्ति।',
        kannadaTranslation: 'ई सुन्दर रचनयु कवियद्दु आगिदे।',
        englishTranslation: 'This beautiful composition belongs to the poet.',
        vibhakti: 'षष्ठी विभक्तिः (सम्बन्धः)',
        ruleHint: "'कवि' शब्दस्य स्व-स्वामि-भावे षष्ठी-एकवचने 'कवेः' भवति।",
        options: ['कवेः', 'कविना', 'कवये', 'कवौ'],
        correctAnswer: 'कवेः'
      },
      {
        id: 's2-7',
        sentenceBefore: 'संसारतारकत्वं ',
        sentenceAfter: ' एव प्रतिष्ठितम्।',
        kannadaTranslation: 'संसारतारकत्ववु हरियल्लि प्रतिष्ठितवागिदे।',
        englishTranslation: 'The power to liberate is established in Lord Hari.',
        vibhakti: 'सप्तमी विभक्तिः (अधिकरणम्)',
        ruleHint: "'हरि' शब्दस्य आधारे सप्तमी-एकवचने 'हरौ' इति रूपं भवति।",
        options: ['हरौ', 'हरये', 'हरेः', 'हरिम्'],
        correctAnswer: 'हरौ'
      },
      {
        id: 's2-8',
        sentenceBefore: 'हे ',
        sentenceAfter: '! अस्मभ्यं ज्ञानं प्रयच्छ।',
        kannadaTranslation: 'हे हरिये, नमगे ज्ञानवन्नु कोडु।',
        englishTranslation: 'O Hari! Grant us knowledge.',
        vibhakti: 'सम्बोधनम् (आह्वानम्)',
        ruleHint: "इकारान्त-पुल्लिङ्गे सम्बोधन-एकवचने 'हे हरे!' इति भवति।",
        options: ['हरे', 'हरिः', 'हरिम्', 'हरौ'],
        correctAnswer: 'हरे'
      }
    ]
  },

  // ==========================================
  // SET 3: उकारान्त-पुल्लिङ्गः (गुरु / भानु / साधु शब्दः)
  // ==========================================
  {
    id: 'set3',
    title: 'सेट् ३: उकारान्त-पुल्लिङ्गः (गुरु / भानु / साधु शब्दः)',
    shortTitle: 'सेट् ३: गुरु/साधु शब्दः (उकारान्त)',
    paradigm: 'उकारान्तः पुल्लिङ्गः',
    description: 'उकारान्त-पुल्लिङ्ग-शब्दानां (गुरु, साधु, भानु) वाक्येषु प्रयोगः',
    items: [
      {
        id: 's3-1',
        sentenceBefore: '',
        sentenceAfter: ' शिष्याय विद्यां ददाति।',
        kannadaTranslation: 'गुरुवु शिष्यनिगे विद्येयन्नु कोडुत्ताने।',
        englishTranslation: 'The Guru imparts knowledge to the student.',
        vibhakti: 'प्रथमा विभक्तिः (कर्ता)',
        ruleHint: "दानादि-क्रियायाः कर्ता 'गुरुः' (प्रथमा विभक्तिः)।",
        options: ['गुरुः', 'गुरुम्', 'गुरुणा', 'गुरवे'],
        correctAnswer: 'गुरुः'
      },
      {
        id: 's3-2',
        sentenceBefore: 'विद्यार्थी प्रातःकाले ',
        sentenceAfter: ' प्रणमति।',
        kannadaTranslation: 'विद्यार्थियु बेळिग्गे गुरुवन्नु नमिसुत्ताने।',
        englishTranslation: 'The student bows to the Guru in the morning.',
        vibhakti: 'द्वितीया विभक्तिः (कर्म)',
        ruleHint: "'गुरु' शब्दस्य कर्मणि द्वितीया-एकवचने 'गुरुम्' भवति।",
        options: ['गुरुम्', 'गुरुः', 'गुरवे', 'गुरोः'],
        correctAnswer: 'गुरुम्'
      },
      {
        id: 's3-3',
        sentenceBefore: 'राजा धर्मात्मना ',
        sentenceAfter: ' सह मन्त्रयते।',
        kannadaTranslation: 'अरसनु सज्जननाद साधुविनिन्द कूडिकोण्डु आलोचिसुत्ताने।',
        englishTranslation: 'The king deliberates along with the saint.',
        vibhakti: 'तृतीया विभक्तिः (सह-योगः)',
        ruleHint: "'सह' योगे उकारान्त 'साधु' शब्दस्य तृतीयायाम् 'साधुना' भवति।",
        options: ['साधुना', 'साधवे', 'साधोः', 'साधौ'],
        correctAnswer: 'साधुना'
      },
      {
        id: 's3-4',
        sentenceBefore: 'शिष्यः श्रद्धया ',
        sentenceAfter: ' गुरुदक्षिणां यच्छति।',
        kannadaTranslation: 'शिष्यनु श्रद्धेयिन्द गुरुविगे दक्षिणेयन्नु कोडुत्ताने।',
        englishTranslation: 'The disciple faithfully offers Dakshina to the Guru.',
        vibhakti: 'चतुर्थी विभक्तिः (सम्प्रदानम्)',
        ruleHint: "'गुरु' शब्दस्य सम्प्रदाने चतुर्थी-एकवचने 'गुरवे' भवति।",
        options: ['गुरवे', 'गुरोः', 'गुरुणा', 'गुरौ'],
        correctAnswer: 'गुरवे'
      },
      {
        id: 's3-5',
        sentenceBefore: 'सकलः प्रकाशः गगने ',
        sentenceAfter: ' उद्गच्छति।',
        kannadaTranslation: 'सर्व प्रकाशवु आकाशदल्लि सूर्यन देसेयिन्द बरुत्तदे।',
        englishTranslation: 'All radiance emanates from the Sun (Bhanu).',
        vibhakti: 'पञ्चमी विभक्तिः (अपादानम्)',
        ruleHint: "'भानु' शब्दस्य अपादाने पञ्चमी-एकवचने 'भानोः' इति भवति।",
        options: ['भानोः', 'भानुना', 'भानवे', 'भानौ'],
        correctAnswer: 'भानोः'
      },
      {
        id: 's3-6',
        sentenceBefore: 'अस्माकं कल्याणे ',
        sentenceAfter: ' उपदेशः प्रधानः।',
        kannadaTranslation: 'नम्म कल्याणदल्लि गुरुविन उपदेशवु मुख्यवागिदे।',
        englishTranslation: "In our well-being, Guru's teaching is paramount.",
        vibhakti: 'षष्ठी विभक्तिः (सम्बन्धः)',
        ruleHint: "'गुरु' शब्दस्य सम्बन्धे षष्ठी-एकवचने 'गुरोः' इति रूपं भवति।",
        options: ['गुरोः', 'गुरवे', 'गुरुणा', 'गुरौ'],
        correctAnswer: 'गुरोः'
      },
      {
        id: 's3-7',
        sentenceBefore: 'सद्गुणाः सदा ',
        sentenceAfter: ' विराजन्ते।',
        kannadaTranslation: 'सद्गुणगळु यावागलू साधुविनल्लि शोभिसुत्तवे।',
        englishTranslation: 'Virtues always shine in a virtuous saint (Sadhu).',
        vibhakti: 'सप्तमी विभक्तिः (अधिकरणम्)',
        ruleHint: "'साधु' शब्दस्य आधारे सप्तमी-एकवचने 'साधौ' भवति।",
        options: ['साधौ', 'साधोः', 'साधवे', 'साधुम्'],
        correctAnswer: 'साधौ'
      },
      {
        id: 's3-8',
        sentenceBefore: 'हे ',
        sentenceAfter: '! मां धर्ममार्गे प्रेरय।',
        kannadaTranslation: 'हे गुरुवे, नन्नन्नु धर्ममार्गदल्लि प्रेरिसु।',
        englishTranslation: 'O Guru! Guide me on the path of Dharma.',
        vibhakti: 'सम्बोधनम् (आह्वानम्)',
        ruleHint: "उकारान्त-पुल्लिङ्गे सम्बोधने 'हे गुरो!' इति रूपं भवति।",
        options: ['गुरो', 'गुरुः', 'गुरुम्', 'गुरवे'],
        correctAnswer: 'गुरो'
      }
    ]
  },

  // ==========================================
  // SET 4: स्त्रीलिङ्ग-नपुंसकलिङ्गौ (लता / नदी / फल शब्दः)
  // ==========================================
  {
    id: 'set4',
    title: 'सेट् ४: स्त्रीलिङ्ग-नपुंसकलिङ्गौ (लता, नदी, फल शब्दाः)',
    shortTitle: 'सेट् ४: लता, नदी, फल शब्दाः',
    paradigm: 'स्त्रीलिङ्गः तथा नपुंसकलिङ्गः',
    description: 'आकारान्त/ईकारान्त स्त्रीलिङ्ग तथा अकारान्त-नपुंसकलिङ्ग प्रयोगः',
    items: [
      {
        id: 's4-1',
        sentenceBefore: 'उद्याने पुष्पैः युक्ता ',
        sentenceAfter: ' शोभते।',
        kannadaTranslation: 'तोटदल्लि हूवुगळिन्द कूडिद लतेयु शोभिसुत्तदे।',
        englishTranslation: 'In the garden, the flowering creeper (Lata) looks charming.',
        vibhakti: 'प्रथमा विभक्तिः (स्त्रीलिङ्ग-कर्ता)',
        ruleHint: "'लता' आकारान्त-स्त्रीलिङ्गस्य प्रथमा-एकवचने 'लता' भवति।",
        options: ['लता', 'लताम्', 'लतया', 'लतायाः'],
        correctAnswer: 'लता'
      },
      {
        id: 's4-2',
        sentenceBefore: 'यात्रिकः पर्वतस्य समीपे वहन्तीं ',
        sentenceAfter: ' पश्यति।',
        kannadaTranslation: 'प्रयाणिकनु बेट्टद हत्तिर हरियुव नदियन्नु नोडुत्ताने।',
        englishTranslation: 'The traveler gazes at the flowing river.',
        vibhakti: 'द्वितीया विभक्तिः (कर्म)',
        ruleHint: "ईकारान्त-स्त्रीलिङ्गे 'नदी' शब्दस्य कर्मणि द्वितीयायाम् 'नदीम्' भवति।",
        options: ['नदीम्', 'नदी', 'नद्या', 'नद्याम्'],
        correctAnswer: 'नदीम्'
      },
      {
        id: 's4-3',
        sentenceBefore: 'विशालः वृक्षः हरितया ',
        sentenceAfter: ' सह वर्तते।',
        kannadaTranslation: 'दड्ड मरवु हसिरु लतेयिन्द कूडिकोण्डु शोभिसुत्तदे।',
        englishTranslation: 'The grand tree stands together with the green creeper.',
        vibhakti: 'तृतीया विभक्तिः (करणम् / सह-योगः)',
        ruleHint: "'सह' योगे 'लता' शब्दस्य तृतीया-एकवचने 'लतया' इति रूपम्।",
        options: ['लतया', 'लताम्', 'लतायै', 'लतायाः'],
        correctAnswer: 'लतया'
      },
      {
        id: 's4-4',
        sentenceBefore: 'उद्यानपालकः तृषितायै ',
        sentenceAfter: ' जलं सिञ्चति।',
        kannadaTranslation: 'तोटगारनु बट्ट लतेगे नीरन्नु चिमकिसुत्ताने।',
        englishTranslation: 'The gardener sprinkles water for the creeper.',
        vibhakti: 'चतुर्थी विभक्तिः (सम्प्रदानम्)',
        ruleHint: "आकारान्त-स्त्रीलिङ्गे सम्प्रदाने 'लता' शब्दस्य चतुर्थ्याम् 'लतायै' भवति।",
        options: ['लतायै', 'लतायाः', 'लतया', 'लतायाम्'],
        correctAnswer: 'लतायै'
      },
      {
        id: 's4-5',
        sentenceBefore: 'पक्वम् ',
        sentenceAfter: ' वृक्षात् भूमौ पतति।',
        kannadaTranslation: 'हण्णाद हण्णु मरदिन्द नेलक्के बीळुत्तदे।',
        englishTranslation: 'The ripe fruit falls from the tree to the ground.',
        vibhakti: 'प्रथमा विभक्तिः (नपुंसकलिङ्ग-कर्ता)',
        ruleHint: "नपुंसकलिङ्गे 'फल' शब्दस्य कर्तरि प्रथमा-एकवचने 'फलम्' भवति।",
        options: ['फलम्', 'फलेन', 'फलाय', 'फलात्'],
        correctAnswer: 'फलम्'
      },
      {
        id: 's4-6',
        sentenceBefore: 'पिपासितः वानरः मधुरं ',
        sentenceAfter: ' खादति।',
        kannadaTranslation: 'कोतियु मधुरवाद हण्णन्नु तिन्नुत्तदे।',
        englishTranslation: 'The monkey eats the sweet fruit.',
        vibhakti: 'द्वितीया विभक्तिः (नपुंसकलिङ्ग-कर्म)',
        ruleHint: "नपुंसकलिङ्गे कर्मणि अपि द्वितीया-एकवचने 'फलम्' इति भवति।",
        options: ['फलम्', 'फलेन', 'फलाय', 'फले'],
        correctAnswer: 'फलम्'
      },
      {
        id: 's4-7',
        sentenceBefore: 'एषा रमणीया भूमिः पुण्यवत्याः ',
        sentenceAfter: ' तटे अस्ति।',
        kannadaTranslation: 'ई सुन्दर भूमि पवित्र नदिय दडदल्लिदे।',
        englishTranslation: 'This sacred land is on the bank of the holy river.',
        vibhakti: 'षष्ठी विभक्तिः (सम्बन्धः)',
        ruleHint: "'नदी' शब्दस्य सम्बन्धे षष्ठी-एकवचने 'नद्याः' इति रूपं भवति।",
        options: ['नद्याः', 'नद्यै', 'नद्या', 'नद्याम्'],
        correctAnswer: 'नद्याः'
      },
      {
        id: 's4-8',
        sentenceBefore: 'अस्मिन् रसाले ',
        sentenceAfter: ' मिष्टः रसः अस्ति।',
        kannadaTranslation: 'ई हण्णिनल्लि सिहियाद रसविदे।',
        englishTranslation: 'In this juicy fruit, there is sweet nectar.',
        vibhakti: 'सप्तमी विभक्तिः (अधिकरणम्)',
        ruleHint: "'फल' शब्दस्य आधारे सप्तमी-एकवचने 'फले' इति रूपं भवति।",
        options: ['फले', 'फलात्', 'फलस्य', 'फलेन'],
        correctAnswer: 'फले'
      }
    ]
  }
];
