import { LanguageUnit, LanguageInfo, LanguageProfile, TargetLanguage } from '../types';

export const AVAILABLE_LANGUAGES: LanguageInfo[] = [
  {
    id: 'spanish',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    level: 'A1 - B2 Fluent',
    totalUnits: 4,
  },
  {
    id: 'japanese',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    level: 'N5 - N4 Beginner',
    totalUnits: 2,
  },
  {
    id: 'german',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    level: 'A1 - A2 Elementary',
    totalUnits: 2,
  },
  {
    id: 'french',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    level: 'A1 - A2 Elementary',
    totalUnits: 2,
  },
];

export const INITIAL_LANGUAGE_PROFILE: LanguageProfile = {
  targetLanguage: 'spanish',
  hearts: 5,
  maxHearts: 5,
  streakDays: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  dailyGoalLessons: 3,
  dailyLessonsCompletedToday: 0,
  customVocab: [],
};

export const INITIAL_SPANISH_UNITS: LanguageUnit[] = [
  {
    id: 'unit-es-1',
    language: 'spanish',
    unitNumber: 1,
    title: 'Unit 1: Foundations, Greetings & Core Tech Terms',
    description: 'Master everyday greetings, polite expressions, self-introductions, and fundamental tech vocabulary.',
    cefrLevel: 'A1',
    icon: 'Sparkles',
    color: 'emerald',
    lessons: [
      {
        id: 'les-es-101',
        unitId: 'unit-es-1',
        lessonNumber: 1,
        title: 'Essential Greetings & Introductions',
        type: 'vocabulary',
        xpReward: 35,
        completed: false,
        grammarNotes: 'In Spanish, question marks (¿?) and exclamation marks (¡!) are used at both the beginning and end of sentences. Adjectives usually follow the noun they modify.',
        vocabItems: [
          {
            id: 'v-es-1',
            term: 'Hola, ¿cómo estás?',
            translation: 'Hello, how are you?',
            phoneticIPA: '/ˈola ˈkomo esˈtas/',
            partOfSpeech: 'phrase',
            exampleSource: 'Hola, ¿cómo estás? Mucho gusto en conocerte.',
            exampleTarget: 'Hello, how are you? Nice to meet you.',
            masteryLevel: 5,
            language: 'spanish',
          },
          {
            id: 'v-es-2',
            term: 'Buenos días',
            translation: 'Good morning',
            phoneticIPA: '/ˈbwenoz ˈði.as/',
            partOfSpeech: 'phrase',
            exampleSource: 'Buenos días a todo el equipo de desarrollo.',
            exampleTarget: 'Good morning to the entire development team.',
            masteryLevel: 5,
            language: 'spanish',
          },
          {
            id: 'v-es-3',
            term: 'Mucho gusto',
            translation: 'Pleased to meet you',
            phoneticIPA: '/ˈmut͡ʃo ˈɣusto/',
            partOfSpeech: 'phrase',
            exampleSource: 'Mucho gusto, soy el nuevo arquitecto de software.',
            exampleTarget: 'Pleased to meet you, I am the new software architect.',
            masteryLevel: 4,
            language: 'spanish',
          },
          {
            id: 'v-es-4',
            term: 'El ingeniero / La ingeniera',
            translation: 'The engineer',
            phoneticIPA: '/iŋxeˈnjeɾo/',
            partOfSpeech: 'noun',
            gender: 'masculine',
            exampleSource: 'La ingeniera optimizó la base de datos distribuida.',
            exampleTarget: 'The engineer optimized the distributed database.',
            masteryLevel: 4,
            language: 'spanish',
          },
        ],
        drills: [
          {
            id: 'dr-es-1',
            type: 'multiple_choice',
            prompt: 'Choose the correct translation for "Good morning":',
            sourcePhrase: 'Good morning',
            targetPhrase: 'Buenos días',
            options: ['Buenas noches', 'Buenos días', 'Hasta luego', 'Por favor'],
            correctOptionIndex: 1,
            audioText: 'Buenos días',
            grammarExplanation: '"Buenos días" is masculine plural, matching the masculine noun "el día".',
          },
          {
            id: 'dr-es-2',
            type: 'word_order',
            prompt: 'Assemble the translated sentence in correct order:',
            sourcePhrase: 'Hello, nice to meet you today.',
            targetPhrase: 'Hola, mucho gusto en conocerte hoy.',
            scrambledWords: ['mucho', 'Hola,', 'conocerte', 'gusto', 'en', 'hoy.', 'ayer', 'nunca'],
            audioText: 'Hola, mucho gusto en conocerte hoy.',
          },
          {
            id: 'dr-es-3',
            type: 'fill_in_blank',
            prompt: 'Complete the sentence with the missing word:',
            sourcePhrase: 'How are you?',
            targetPhrase: '¿Cómo estás tú?',
            blankText: '¿Cómo ____ tú hoy?',
            acceptedAnswers: ['estás', 'estas'],
            hint: 'Second-person singular of estar (you are)',
            grammarExplanation: 'Use "estás" (from estar) for temporary states, locations, and personal health.',
          },
        ],
      },
      {
        id: 'les-es-102',
        unitId: 'unit-es-1',
        lessonNumber: 2,
        title: 'Tech & Workplace Vocabulary',
        type: 'sentence_builder',
        xpReward: 45,
        completed: false,
        grammarNotes: 'Technical verbs like "desarrollar" (to develop), "diseñar" (to design), and "programar" (to code) follow regular -ar conjugation patterns.',
        vocabItems: [
          {
            id: 'v-es-5',
            term: 'El código',
            translation: 'The code',
            phoneticIPA: '/el ˈkodiɣo/',
            partOfSpeech: 'noun',
            gender: 'masculine',
            exampleSource: 'El código fuente está limpio y documentado.',
            exampleTarget: 'The source code is clean and documented.',
            masteryLevel: 4,
            language: 'spanish',
          },
          {
            id: 'v-es-6',
            term: 'Desarrollar',
            translation: 'To develop',
            phoneticIPA: '/desa.roˈʎaɾ/',
            partOfSpeech: 'verb',
            exampleSource: 'Queremos desarrollar aplicaciones escalables.',
            exampleTarget: 'We want to develop scalable applications.',
            masteryLevel: 3,
            language: 'spanish',
          },
          {
            id: 'v-es-7',
            term: 'La reunión',
            translation: 'The meeting',
            phoneticIPA: '/la rewˈnjon/',
            partOfSpeech: 'noun',
            gender: 'feminine',
            exampleSource: 'Tenemos una reunión de planificación a las diez.',
            exampleTarget: 'We have a planning meeting at ten o\'clock.',
            masteryLevel: 4,
            language: 'spanish',
          },
          {
            id: 'v-es-8',
            term: 'La base de datos',
            translation: 'The database',
            phoneticIPA: '/la ˈbase ðe ˈðatos/',
            partOfSpeech: 'noun',
            gender: 'feminine',
            exampleSource: 'La base de datos maneja un alto volumen de transacciones.',
            exampleTarget: 'The database handles a high volume of transactions.',
            masteryLevel: 3,
            language: 'spanish',
          },
        ],
        drills: [
          {
            id: 'dr-es-4',
            type: 'word_order',
            prompt: 'Assemble the sentence in Spanish:',
            sourcePhrase: 'I develop software with modern clean code.',
            targetPhrase: 'Yo desarrollo software con código limpio y moderno.',
            scrambledWords: ['Yo', 'desarrollo', 'software', 'con', 'código', 'limpio', 'y', 'moderno.', 'casa', 'azul'],
            audioText: 'Yo desarrollo software con código limpio y moderno.',
          },
          {
            id: 'dr-es-5',
            type: 'listening',
            prompt: 'Listen to the audio and select the correct translation:',
            sourcePhrase: 'The meeting starts in five minutes.',
            targetPhrase: 'La reunión comienza en cinco minutos.',
            options: [
              'La reunión termina ahora mismo.',
              'La reunión comienza en cinco minutos.',
              'El proyecto tiene errores graves.',
              'Nos vemos en la cafetería mañana.',
            ],
            correctOptionIndex: 1,
            audioText: 'La reunión comienza en cinco minutos.',
          },
        ],
      },
      {
        id: 'les-es-103',
        unitId: 'unit-es-1',
        lessonNumber: 3,
        title: 'Verbs: Ser vs Estar Distinction',
        type: 'grammar_drill',
        xpReward: 50,
        completed: false,
        grammarNotes: `### Ser vs Estar Matrix
- **SER (DOCTOR)**: Description, Occupation, Characteristic, Time, Origin, Relationship.
  * e.g. "Yo *soy* ingeniero de software." (Occupation)
- **ESTAR (PLACE)**: Position, Location, Action (present progressive), Condition, Emotion.
  * e.g. "El servidor *está* en la nube." (Location)`,
        vocabItems: [
          {
            id: 'v-es-9',
            term: 'Ser (soy, eres, es, somos, son)',
            translation: 'To be (permanent / identity)',
            phoneticIPA: '/seɾ/',
            partOfSpeech: 'verb',
            exampleSource: 'Ella es muy inteligente y analítica.',
            exampleTarget: 'She is very smart and analytical.',
            masteryLevel: 2,
            language: 'spanish',
          },
          {
            id: 'v-es-10',
            term: 'Estar (estoy, estás, está, estamos, están)',
            translation: 'To be (state / location)',
            phoneticIPA: '/esˈtaɾ/',
            partOfSpeech: 'verb',
            exampleSource: 'El servidor está activo y funcionando.',
            exampleTarget: 'The server is active and running.',
            masteryLevel: 2,
            language: 'spanish',
          },
        ],
        drills: [
          {
            id: 'dr-es-6',
            type: 'conjugation',
            prompt: 'Choose the correct verb form for identity vs location:',
            sourcePhrase: 'The engineer is in Madrid and is very competent.',
            targetPhrase: 'El ingeniero está en Madrid y es muy competente.',
            options: [
              'El ingeniero es en Madrid y está muy competente.',
              'El ingeniero está en Madrid y es muy competente.',
              'El ingeniero son en Madrid y son muy competente.',
              'El ingeniero ser en Madrid y estar muy competente.',
            ],
            correctOptionIndex: 1,
            audioText: 'El ingeniero está en Madrid y es muy competente.',
            grammarExplanation: 'Use "está" for physical location (en Madrid) and "es" for innate capability (competente).',
          },
          {
            id: 'dr-es-7',
            type: 'fill_in_blank',
            prompt: 'Fill in the correct form of "ser" or "estar":',
            sourcePhrase: 'We are ready for the sprint demo.',
            targetPhrase: 'Nosotros estamos listos para la demostración.',
            blankText: 'Nosotros ____ listos para la demostración.',
            acceptedAnswers: ['estamos'],
            hint: 'First person plural (we) of estar',
            grammarExplanation: '"Estar listo" means to be ready (temporary state). "Ser listo" means to be clever.',
          },
        ],
      },
    ],
  },
  {
    id: 'unit-es-2',
    language: 'spanish',
    unitNumber: 2,
    title: 'Unit 2: Daily Routines, Food & Ordering at Cafes',
    description: 'Learn reflexive daily verbs, ordering food and drinks, discussing schedules, and navigating Spanish cities.',
    cefrLevel: 'A2',
    icon: 'Utensils',
    color: 'amber',
    lessons: [
      {
        id: 'les-es-201',
        unitId: 'unit-es-2',
        lessonNumber: 1,
        title: 'Ordering at a Spanish Cafe & Tapas Bar',
        type: 'vocabulary',
        xpReward: 40,
        completed: false,
        vocabItems: [
          {
            id: 'v-es-11',
            term: 'Un café con leche',
            translation: 'A coffee with milk (latte)',
            phoneticIPA: '/un kaˈfe kon ˈlet͡ʃe/',
            partOfSpeech: 'noun',
            gender: 'masculine',
            exampleSource: 'Por favor, ¿me puede traer un café con leche y una tostada?',
            exampleTarget: 'Please, could you bring me a coffee with milk and toast?',
            masteryLevel: 3,
            language: 'spanish',
          },
          {
            id: 'v-es-12',
            term: 'La cuenta, por favor',
            translation: 'The bill / check, please',
            phoneticIPA: '/la ˈkwenta poɾ faˈβoɾ/',
            partOfSpeech: 'phrase',
            exampleSource: 'Camarero, ¿nos trae la cuenta, por favor?',
            exampleTarget: 'Waiter, could you bring us the bill, please?',
            masteryLevel: 4,
            language: 'spanish',
          },
          {
            id: 'v-es-13',
            term: '¿Tiene opciones vegetarianas?',
            translation: 'Do you have vegetarian options?',
            phoneticIPA: '/ˈtjene opˈsjonez bexetaˈɾjanas/',
            partOfSpeech: 'phrase',
            exampleSource: 'Disculpe, ¿tiene opciones vegetarianas en el menú?',
            exampleTarget: 'Excuse me, do you have vegetarian options on the menu?',
            masteryLevel: 2,
            language: 'spanish',
          },
        ],
        drills: [
          {
            id: 'dr-es-8',
            type: 'word_order',
            prompt: 'Assemble the polite cafe order:',
            sourcePhrase: 'I would like a coffee with milk and a croissant, please.',
            targetPhrase: 'Quisiera un café con leche y un cruasán, por favor.',
            scrambledWords: ['Quisiera', 'un', 'café', 'con', 'leche', 'y', 'un', 'cruasán,', 'por', 'favor.', 'coche', 'rojo'],
            audioText: 'Quisiera un café con leche y un cruasán, por favor.',
          },
        ],
      },
      {
        id: 'les-es-202',
        unitId: 'unit-es-2',
        lessonNumber: 2,
        title: 'Interactive Dialogue: Cafe in Madrid',
        type: 'dialogue',
        xpReward: 60,
        completed: false,
        dialogueScenario: {
          id: 'sc-es-1',
          title: 'Morning Espresso & Planning in Plaza Mayor',
          setting: 'Historic Cafe in Madrid, Spain',
          roleUser: 'Visiting Software Professional',
          rolePartner: 'Camarero (Carlos)',
          initialMessage: '¡Buenos días! Bienvenido al Café Central. ¿Qué le gustaría tomar hoy?',
          turns: [
            {
              id: 't-1',
              speaker: 'partner',
              text: '¡Buenos días! Bienvenido al Café Central. ¿Qué le gustaría tomar hoy?',
              translation: 'Good morning! Welcome to Cafe Central. What would you like to have today?',
              suggestedUserResponses: [
                {
                  text: 'Buenos días. Quisiera un café con leche y una tostada con tomate, por favor.',
                  translation: 'Good morning. I would like a coffee with milk and toast with tomato, please.',
                  hint: 'Traditional Spanish breakfast order',
                },
                {
                  text: 'Hola. Solo un café solo doble sin azúcar, gracias.',
                  translation: 'Hello. Just a double espresso without sugar, thanks.',
                  hint: 'Direct espresso request',
                },
              ],
            },
            {
              id: 't-2',
              speaker: 'partner',
              text: '¡Excelente elección! ¿La tostada la prefiere con aceite de oliva y jamón ibérico?',
              translation: 'Excellent choice! Do you prefer the toast with olive oil and Iberian ham?',
              suggestedUserResponses: [
                {
                  text: 'Sí, con jamón ibérico y un poco de sal, por favor.',
                  translation: 'Yes, with Iberian ham and a bit of salt, please.',
                },
                {
                  text: 'No, solo con aceite de oliva y tomate, muchas gracias.',
                  translation: 'No, just with olive oil and tomato, thank you very much.',
                },
              ],
            },
            {
              id: 't-3',
              speaker: 'partner',
              text: 'Marchando. Aquí tiene su café recién hecho. ¿Desea la clave del Wi-Fi para trabajar?',
              translation: 'Coming right up! Here is your freshly brewed coffee. Would you like the Wi-Fi password for working?',
              suggestedUserResponses: [
                {
                  text: '¡Sí, por favor! Necesito revisar unos commits en mi portátil.',
                  translation: 'Yes, please! I need to review some commits on my laptop.',
                },
                {
                  text: 'No es necesario hoy, pero muchas gracias por su amabilidad.',
                  translation: 'Not necessary today, but thank you very much for your kindness.',
                },
              ],
            },
          ],
        },
        vocabItems: [],
        drills: [],
      },
    ],
  },
  {
    id: 'unit-es-3',
    language: 'spanish',
    unitNumber: 3,
    title: 'Unit 3: Past Tenses & Systems Architecture in Spanish',
    description: 'Contrast Pretérito Indefinido (completed past actions) vs Pretérito Imperfecto (ongoing background states).',
    cefrLevel: 'B1',
    icon: 'History',
    color: 'indigo',
    lessons: [
      {
        id: 'les-es-301',
        unitId: 'unit-es-3',
        lessonNumber: 1,
        title: 'Pretérito Perfecto vs Indefinido: Deploying Systems',
        type: 'grammar_drill',
        xpReward: 55,
        completed: false,
        grammarNotes: `### Pretérito Indefinido (Specific Completed Actions)
- Yo *desplegué* el microservicio ayer. (I deployed the microservice yesterday).
- El equipo *resolvió* la incidencia de latencia. (The team resolved the latency incident).`,
        vocabItems: [
          {
            id: 'v-es-14',
            term: 'Ayer desplegamos el servidor',
            translation: 'Yesterday we deployed the server',
            phoneticIPA: '/aˈʝeɾ despleˈɣamos el seɾβiˈðoɾ/',
            partOfSpeech: 'phrase',
            exampleSource: 'Ayer desplegamos el nuevo microservicio en producción.',
            exampleTarget: 'Yesterday we deployed the new microservice to production.',
            masteryLevel: 1,
            language: 'spanish',
          },
        ],
        drills: [
          {
            id: 'dr-es-9',
            type: 'fill_in_blank',
            prompt: 'Complete with the correct past tense form of "escribir" (to write):',
            sourcePhrase: 'Last week I wrote three comprehensive test suites.',
            targetPhrase: 'La semana pasada yo escribí tres suites de prueba.',
            blankText: 'La semana pasada yo ____ tres suites de prueba.',
            acceptedAnswers: ['escribí', 'escribi'],
            hint: 'First person past tense (yo escribí)',
          },
        ],
      },
    ],
  },
  {
    id: 'unit-es-4',
    language: 'spanish',
    unitNumber: 4,
    title: 'Unit 4: Advanced Professional Negotiation & Agile Sprints',
    description: 'Conduct technical standups, negotiate architecture trade-offs, and express hypothetical conditions using the Subjunctive mood.',
    cefrLevel: 'B2',
    icon: 'Briefcase',
    color: 'violet',
    lessons: [
      {
        id: 'les-es-401',
        unitId: 'unit-es-4',
        lessonNumber: 1,
        title: 'Presente de Subjuntivo in Technical Standups',
        type: 'sentence_builder',
        xpReward: 65,
        completed: false,
        grammarNotes: 'Use the subjunctive when expressing desires, recommendations, or uncertainties: "Es importante que optimicemos la memoria."',
        vocabItems: [
          {
            id: 'v-es-15',
            term: 'Es fundamental que optimicemos...',
            translation: 'It is essential that we optimize...',
            phoneticIPA: '/es fundamenˈtal ke optimiˈsemos/',
            partOfSpeech: 'phrase',
            exampleSource: 'Es fundamental que optimicemos el consumo de memoria en el cluster.',
            exampleTarget: 'It is essential that we optimize memory consumption in the cluster.',
            masteryLevel: 1,
            language: 'spanish',
          },
        ],
        drills: [
          {
            id: 'dr-es-10',
            type: 'word_order',
            prompt: 'Assemble the subjunctive recommendation:',
            sourcePhrase: 'I suggest that we review the code before merging.',
            targetPhrase: 'Sugiero que revisemos el código antes de fusionar.',
            scrambledWords: ['Sugiero', 'que', 'revisemos', 'el', 'código', 'antes', 'de', 'fusionar.', 'perro', 'comer'],
            audioText: 'Sugiero que revisemos el código antes de fusionar.',
          },
        ],
      },
    ],
  },
];

export const INITIAL_JAPANESE_UNITS: LanguageUnit[] = [
  {
    id: 'unit-ja-1',
    language: 'japanese',
    unitNumber: 1,
    title: 'Unit 1: Hiragana & Essential Tech Greetings (初級)',
    description: 'Master Hiragana phonetic alphabet, polite self-introductions, and basic tech terms in Tokyo.',
    cefrLevel: 'A1',
    icon: 'Languages',
    color: 'rose',
    lessons: [
      {
        id: 'les-ja-101',
        unitId: 'unit-ja-1',
        lessonNumber: 1,
        title: 'Greetings & Introduction (こんにちは)',
        type: 'vocabulary',
        xpReward: 35,
        completed: false,
        grammarNotes: 'Japanese word order is Subject-Object-Verb (SOV). The particle は (wa) marks the topic of the sentence, and です (desu) functions as the polite copula "to be".',
        vocabItems: [
          {
            id: 'v-ja-1',
            term: 'こんにちは (Konnichiwa)',
            translation: 'Hello / Good afternoon',
            phoneticIPA: '/koɲɲit͡ɕiwa/',
            partOfSpeech: 'phrase',
            exampleSource: 'こんにちは！エンジニアのアレックスです。',
            exampleTarget: 'Hello! I am Alex, the engineer.',
            masteryLevel: 3,
            language: 'japanese',
          },
          {
            id: 'v-ja-2',
            term: 'よろしくお願いします (Yoroshiku onegaishimasu)',
            translation: 'Nice to work with you / Pleased to meet you',
            phoneticIPA: '/joɾoɕikɯ oneɡaiɕimasɯ/',
            partOfSpeech: 'phrase',
            exampleSource: '新しいプロジェクトでよろしくお願いします。',
            exampleTarget: 'Looking forward to working together on the new project.',
            masteryLevel: 2,
            language: 'japanese',
          },
          {
            id: 'v-ja-3',
            term: '開発 (Kaihatsu)',
            translation: 'Development (Software/Engineering)',
            phoneticIPA: '/kaihatsɯ/',
            partOfSpeech: 'noun',
            exampleSource: 'システム開発を始めましょう。',
            exampleTarget: 'Let us begin the system development.',
            masteryLevel: 2,
            language: 'japanese',
          },
        ],
        drills: [
          {
            id: 'dr-ja-1',
            type: 'multiple_choice',
            prompt: 'Select the meaning of よろしくお願いします (Yoroshiku onegaishimasu):',
            sourcePhrase: 'よろしくお願いします',
            targetPhrase: 'Nice to work with you / Please treat me well',
            options: [
              'Good evening',
              'Nice to work with you / Please treat me well',
              'Goodbye',
              'Thank you for the meal',
            ],
            correctOptionIndex: 1,
            audioText: 'よろしくお願いします',
          },
        ],
      },
    ],
  },
];

export const INITIAL_GERMAN_UNITS: LanguageUnit[] = [
  {
    id: 'unit-de-1',
    language: 'german',
    unitNumber: 1,
    title: 'Unit 1: Deutsch Grundlagen & Software Engineering',
    description: 'Articles (der/die/das), verb conjugation, and technical discussions in Berlin startups.',
    cefrLevel: 'A1',
    icon: 'Layers',
    color: 'amber',
    lessons: [
      {
        id: 'les-de-101',
        unitId: 'unit-de-1',
        lessonNumber: 1,
        title: 'Begrüßungen & Entwickler Wortschatz',
        type: 'vocabulary',
        xpReward: 35,
        completed: false,
        grammarNotes: 'German capitalizes all nouns. Verbs in standard main clauses are always positioned second (V2 rule).',
        vocabItems: [
          {
            id: 'v-de-1',
            term: 'Guten Tag, wie geht es Ihnen?',
            translation: 'Good day, how are you? (Formal)',
            phoneticIPA: '/ˈɡuːtn̩ taːk viː ɡeːt ɛs ˈiːnən/',
            partOfSpeech: 'phrase',
            exampleSource: 'Guten Tag! Ich bin der neue Softwareentwickler.',
            exampleTarget: 'Good day! I am the new software developer.',
            masteryLevel: 3,
            language: 'german',
          },
          {
            id: 'v-de-2',
            term: 'Die Softwarearchitektur',
            translation: 'The software architecture',
            phoneticIPA: '/diː ˈzɔftvɛːɐ̯ˌʔaʁçitɛkˈtuːɐ̯/',
            partOfSpeech: 'noun',
            gender: 'feminine',
            exampleSource: 'Die Softwarearchitektur ist hochgradig modular.',
            exampleTarget: 'The software architecture is highly modular.',
            masteryLevel: 2,
            language: 'german',
          },
        ],
        drills: [
          {
            id: 'dr-de-1',
            type: 'multiple_choice',
            prompt: 'Which article is correct for "Softwarearchitektur"?',
            sourcePhrase: 'Softwarearchitektur',
            targetPhrase: 'Die Softwarearchitektur',
            options: ['Der', 'Die', 'Das', 'Den'],
            correctOptionIndex: 1,
            audioText: 'Die Softwarearchitektur',
            grammarExplanation: 'Nouns ending in -ur (like Architektur, Kultur) are feminine and take "die".',
          },
        ],
      },
    ],
  },
];

export const INITIAL_FRENCH_UNITS: LanguageUnit[] = [
  {
    id: 'unit-fr-1',
    language: 'french',
    unitNumber: 1,
    title: 'Unit 1: Bonjour & Les Fondations du Code',
    description: 'Pronunciation, nasal vowels, liaisons, and tech workplace etiquette in Paris.',
    cefrLevel: 'A1',
    icon: 'Sparkles',
    color: 'sky',
    lessons: [
      {
        id: 'les-fr-101',
        unitId: 'unit-fr-1',
        lessonNumber: 1,
        title: 'Salutations & Présentations',
        type: 'vocabulary',
        xpReward: 35,
        completed: false,
        grammarNotes: 'In French, adjectives agree in gender and number with the noun. Silent letters at the end of words often pronounce when followed by a vowel (liaison).',
        vocabItems: [
          {
            id: 'v-fr-1',
            term: 'Bonjour, enchanté(e)',
            translation: 'Hello, delighted to meet you',
            phoneticIPA: '/bɔ̃.ʒuʁ ɑ̃.ʃɑ̃.te/',
            partOfSpeech: 'phrase',
            exampleSource: 'Bonjour, enchanté de vous rencontrer pour ce sprint.',
            exampleTarget: 'Hello, delighted to meet you for this sprint.',
            masteryLevel: 3,
            language: 'french',
          },
        ],
        drills: [
          {
            id: 'dr-fr-1',
            type: 'multiple_choice',
            prompt: 'Translate "Enchanté":',
            sourcePhrase: 'Enchanté',
            targetPhrase: 'Pleased / Delighted to meet you',
            options: ['Goodbye', 'Pleased to meet you', 'Please', 'Good evening'],
            correctOptionIndex: 1,
            audioText: 'Enchanté',
          },
        ],
      },
    ],
  },
];

// Helper to get units for a language
export const getUnitsForLanguage = (language: TargetLanguage): LanguageUnit[] => {
  switch (language) {
    case 'spanish':
      return INITIAL_SPANISH_UNITS;
    case 'japanese':
      return INITIAL_JAPANESE_UNITS;
    case 'german':
      return INITIAL_GERMAN_UNITS;
    case 'french':
      return INITIAL_FRENCH_UNITS;
    default:
      return INITIAL_SPANISH_UNITS;
  }
};

// Web Speech API text-to-speech helper with language codes
export const speakLanguagePhrase = (text: string, language: TargetLanguage = 'spanish') => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this environment');
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map language to BCP 47 code
    const langCodeMap: Record<TargetLanguage, string> = {
      spanish: 'es-ES',
      japanese: 'ja-JP',
      german: 'de-DE',
      french: 'fr-FR',
      mandarin: 'zh-CN',
      italian: 'it-IT',
    };

    utterance.lang = langCodeMap[language] || 'es-ES';
    utterance.rate = 0.9; // Slightly clearer pace for learning
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Failed to synthesize speech', err);
  }
};
