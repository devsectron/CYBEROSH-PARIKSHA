import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  User,
  Examination,
  ExamCategory,
  MockTest,
  Question,
  StudyMaterial,
  ModelPaper,
  SubscriptionPlan,
  TestAttempt,
  SavedAnswer,
  Entitlement,
  CurrentAffairsItem
} from '../types';
import { bseb12thCsTests, allBsebQuestions } from '../data/bsebCbtQuestions';

// Pre-seeded initial dataset for Firestore bootstrap
const initialCategories: ExamCategory[] = [
  { id: 'cat_teaching', name: 'Teaching & Teacher Eligibility', slug: 'teaching', description: 'Bihar STET, BPSC TRE, CTET, UPTET, KVS, NVS, PRT, TGT, PGT', icon: 'BookOpen', display_order: 1 },
  { id: 'cat_civil', name: 'Civil Services & State PSC', slug: 'civil-services', description: 'BPSC, UPSC, UPPSC, State Administrative & Subordinate Services', icon: 'Award', display_order: 2 },
  { id: 'cat_engineering', name: 'Engineering Entrance', slug: 'engineering', description: 'JEE Main, JEE Advanced, State CETs, Polytechnic Entrance Exam', icon: 'Cpu', display_order: 3 },
  { id: 'cat_medical', name: 'Medical Entrance', slug: 'medical', description: 'NEET UG, Paramedical, Nursing & Allied Health Science Entrances', icon: 'Stethoscope', display_order: 4 },
  { id: 'cat_railway', name: 'Railway Recruitment Board', slug: 'railway', description: 'RRB NTPC, RRB Group D, RRB ALP, RRB Technician & JE', icon: 'Train', display_order: 5 },
  { id: 'cat_banking', name: 'Banking & Insurance', slug: 'banking', description: 'IBPS PO, IBPS Clerk, SBI PO, SBI Clerk, RBI Grade B & Assistant', icon: 'Landmark', display_order: 6 },
  { id: 'cat_ssc', name: 'Staff Selection Commission', slug: 'ssc', description: 'SSC CGL, SSC CHSL, SSC GD Constable, SSC MTS, CPO', icon: 'ShieldCheck', display_order: 7 },
  { id: 'cat_police', name: 'Police & Defence', slug: 'police-defence', description: 'Bihar Police Constable, Bihar SI (Daroga), NDA, CDS, CAPF', icon: 'Shield', display_order: 8 },
  { id: 'cat_school', name: 'School & University Entrance', slug: 'school-foundation', description: 'CUET UG/PG, Bihar Board (BSEB) 10th & 12th, Olympiads', icon: 'GraduationCap', display_order: 9 },
  { id: 'cat_other', name: 'Other State & Technical Exams', slug: 'other', description: 'BSSC Inter Level, CGL, High Court Clerk, Stenographer, ITI', icon: 'Layers', display_order: 10 }
];

const initialExams: Examination[] = [
  {
    id: 'exam_bihar_stet',
    category_id: 'cat_teaching',
    category_name: 'Teaching & Teacher Eligibility',
    name: 'Bihar STET',
    slug: 'bihar-stet',
    full_name: 'Bihar Secondary Teachers Eligibility Test',
    eligibility: 'B.Ed with Graduation / Post Graduation in relevant discipline',
    frequency: 'Annual / Bi-annual',
    conducting_body: 'Bihar School Examination Board (BSEB)',
    official_website: 'https://bsebstet.com',
    description: 'Mandatory certification test conducted by BSEB for recruitment of secondary (Paper 1 - Classes 9-10) and senior secondary (Paper 2 - Classes 11-12) teachers in Bihar government schools.',
    is_featured: 1,
    is_active: 1,
    display_order: 1,
    pattern: { total_questions: 150, total_marks: 150, duration_minutes: 150, negative_marking: 0 },
    test_count: 5,
    material_count: 8,
    paper_count: 4
  },
  {
    id: 'exam_bpsc_tre',
    category_id: 'cat_teaching',
    category_name: 'Teaching & Teacher Eligibility',
    name: 'Bihar BPSC TRE',
    slug: 'bihar-bpsc-tre',
    full_name: 'BPSC School Teacher Recruitment Examination (TRE 4.0)',
    eligibility: 'CTET / Bihar STET + B.Ed / D.El.Ed',
    frequency: 'Annual Recruitment Cycle',
    conducting_body: 'Bihar Public Service Commission (BPSC)',
    official_website: 'https://bpsc.bih.nic.in',
    description: 'Direct teacher appointment competitive examination across Primary (1-5), Middle (6-8), Secondary (9-10) and Higher Secondary (11-12) schools in Bihar.',
    is_featured: 1,
    is_active: 1,
    display_order: 2,
    pattern: { total_questions: 150, total_marks: 150, duration_minutes: 150, negative_marking: 0 },
    test_count: 4,
    material_count: 6,
    paper_count: 3
  },
  {
    id: 'exam_bpsc_cce',
    category_id: 'cat_civil',
    category_name: 'Civil Services & State PSC',
    name: 'BPSC Combined Competitive Exam',
    slug: 'bpsc',
    full_name: 'BPSC 71st Combined (Preliminary) Competitive Examination',
    eligibility: 'Graduate in any discipline from recognized university',
    frequency: 'Annual',
    conducting_body: 'Bihar Public Service Commission (BPSC)',
    official_website: 'https://bpsc.bih.nic.in',
    description: 'Premier state civil service examination for appointment to Deputy Collector (BAS), DSP, Revenue Officer, and allied state services in Bihar.',
    is_featured: 1,
    is_active: 1,
    display_order: 3,
    pattern: { total_questions: 150, total_marks: 150, duration_minutes: 120, negative_marking: 0.33 },
    test_count: 6,
    material_count: 10,
    paper_count: 5
  },
  {
    id: 'exam_jee_main',
    category_id: 'cat_engineering',
    category_name: 'Engineering Entrance',
    name: 'JEE Main',
    slug: 'jee-main',
    full_name: 'Joint Entrance Examination (Main)',
    eligibility: '10+2 with Physics, Chemistry, and Mathematics (PCM)',
    frequency: 'Twice a year (Jan & April Sessions)',
    conducting_body: 'National Testing Agency (NTA)',
    official_website: 'https://jeemain.nta.ac.in',
    description: 'All-India CBT examination for admission to premier NITs, IIITs, CFTIs, and qualifying gate for JEE Advanced (IITs).',
    is_featured: 1,
    is_active: 1,
    display_order: 4,
    pattern: { total_questions: 90, total_marks: 300, duration_minutes: 180, negative_marking: 1.0 },
    test_count: 8,
    material_count: 12,
    paper_count: 6
  },
  {
    id: 'exam_neet_ug',
    category_id: 'cat_medical',
    category_name: 'Medical Entrance',
    name: 'NEET UG',
    slug: 'neet-ug',
    full_name: 'National Eligibility cum Entrance Test (UG)',
    eligibility: '10+2 with Physics, Chemistry, and Biology (PCB)',
    frequency: 'Annual (May)',
    conducting_body: 'National Testing Agency (NTA)',
    official_website: 'https://exams.nta.ac.in/NEET',
    description: 'National single medical entrance test for admission to MBBS, BDS, BAMS, BHMS, and veterinary courses across India.',
    is_featured: 1,
    is_active: 1,
    display_order: 5,
    pattern: { total_questions: 200, total_marks: 720, duration_minutes: 200, negative_marking: 1.0 },
    test_count: 8,
    material_count: 14,
    paper_count: 6
  },
  {
    id: 'exam_rrb_ntpc',
    category_id: 'cat_railway',
    category_name: 'Railway Recruitment Board',
    name: 'RRB NTPC',
    slug: 'rrb-ntpc',
    full_name: 'Railway Non-Technical Popular Categories',
    eligibility: '12th Pass or Graduate based on post level',
    frequency: 'Periodic Recruitment',
    conducting_body: 'Railway Recruitment Boards (RRBs)',
    official_website: 'https://indianrailways.gov.in',
    description: 'Prestigious Indian Railways recruitment for Station Master, Goods Train Manager, Commercial Apprentice, Junior Clerk, and Typists.',
    is_featured: 1,
    is_active: 1,
    display_order: 6,
    pattern: { total_questions: 100, total_marks: 100, duration_minutes: 90, negative_marking: 0.33 },
    test_count: 5,
    material_count: 7,
    paper_count: 4
  },
  {
    id: 'exam_ibps_po',
    category_id: 'cat_banking',
    category_name: 'Banking & Insurance',
    name: 'IBPS PO',
    slug: 'ibps-po',
    full_name: 'Institute of Banking Personnel Selection - Probationary Officer',
    eligibility: 'Graduate in any discipline',
    frequency: 'Annual',
    conducting_body: 'IBPS',
    official_website: 'https://ibps.in',
    description: 'Centralized banking examination for recruitment of scale-I Probationary Officers / Management Trainees in nationalized banks.',
    is_featured: 1,
    is_active: 1,
    display_order: 7,
    pattern: { total_questions: 100, total_marks: 100, duration_minutes: 60, negative_marking: 0.25 },
    test_count: 4,
    material_count: 6,
    paper_count: 4
  },
  {
    id: 'exam_bihar_police',
    category_id: 'cat_police',
    category_name: 'Police & Defence',
    name: 'Bihar Police Constable',
    slug: 'bihar-police',
    full_name: 'Central Selection Board of Constable (CSBC) Bihar Police',
    eligibility: '10+2 (Intermediate) Pass',
    frequency: 'Annual Recruitment',
    conducting_body: 'CSBC Bihar',
    official_website: 'https://csbc.bih.nic.in',
    description: 'Written CBT test and physical evaluation for constable recruits across Bihar Police.',
    is_featured: 1,
    is_active: 1,
    display_order: 8,
    pattern: { total_questions: 100, total_marks: 100, duration_minutes: 120, negative_marking: 0 },
    test_count: 4,
    material_count: 5,
    paper_count: 3
  },
  {
    id: 'exam_bseb_12_cs',
    category_id: 'cat_school',
    category_name: 'School & University Entrance',
    name: 'Bihar Board XII Computer Science',
    slug: 'bihar-board-xii-computer-science',
    full_name: 'Bihar School Examination Board (BSEB) Intermediate Class 12 Computer Science (Theory)',
    eligibility: 'Class 12 Intermediate Student (Science, Arts, Commerce with Computer Science)',
    frequency: 'Annual Board Examination (Feb)',
    conducting_body: 'Bihar School Examination Board (BSEB)',
    official_website: 'https://biharboardonline.bihar.gov.in',
    description: 'Official model question sets and practice papers for Bihar Board Class 12 Intermediate Computer Science (Theory) with C++, Data Structures, DBMS, SQL, Networking, and Boolean Algebra. Subject Code: 122 / 221 / 328.',
    is_featured: 1,
    is_active: 1,
    display_order: 9,
    pattern: { total_questions: 96, total_marks: 70, duration_minutes: 195, negative_marking: 0 },
    test_count: 10,
    material_count: 10,
    paper_count: 10
  }
];

const initialQuestions: Question[] = [
  {
    id: 'q_stet_1',
    exam_id: 'exam_bihar_stet',
    subject_name: 'Art of Teaching & Pedagogy',
    question_type: 'single_mcq',
    difficulty: 'medium',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'According to Jean Piaget’s theory of cognitive development, in which stage does a child develop the ability for abstract propositional thinking and hypothetical deductive reasoning?',
    question_hi: 'जीन पियाजे के संज्ञानात्मक विकास के सिद्धांत के अनुसार, बच्चा किस अवस्था में अमूर्त प्रस्तावपरक चिंतन तथा परिकल्पित निगमनात्मक तर्क विकसित करता है?',
    correct_answer: 'D',
    solution_en: 'The Formal Operational Stage (11 years and above) is characterized by abstract thinking, hypothetical-deductive reasoning, and meta-cognition.',
    solution_hi: 'औपचारिक संक्रियात्मक अवस्था (11 वर्ष और उससे अधिक) की विशेषता अमूर्त सोच, परिकल्पनात्मक-निगमनात्मक तर्क है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_stet_1', option_key: 'A', option_en: 'Sensorimotor Stage (0-2 years)', option_hi: 'संवेदी-गामक अवस्था (0-2 वर्ष)' },
      { id: '2', question_id: 'q_stet_1', option_key: 'B', option_en: 'Pre-operational Stage (2-7 years)', option_hi: 'पूर्व-संक्रियात्मक अवस्था (2-7 वर्ष)' },
      { id: '3', question_id: 'q_stet_1', option_key: 'C', option_en: 'Concrete Operational Stage (7-11 years)', option_hi: 'मूर्त संक्रियात्मक अवस्था (7-11 वर्ष)' },
      { id: '4', question_id: 'q_stet_1', option_key: 'D', option_en: 'Formal Operational Stage (11 years and above)', option_hi: 'औपचारिक संक्रियात्मक अवस्था (11 वर्ष और उससे अधिक)' }
    ]
  },
  {
    id: 'q_stet_2',
    exam_id: 'exam_bihar_stet',
    subject_name: 'Art of Teaching & Pedagogy',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which of the following principles forms the core philosophy of National Education Policy (NEP) 2020 regarding school curriculum?',
    question_hi: 'राष्ट्रीय शिक्षा नीति (NEP) 2020 में स्कूली पाठ्यक्रम के संबंध में निम्नलिखित में से कौन सा सिद्धांत मुख्य केंद्र है?',
    correct_answer: 'B',
    solution_en: 'NEP 2020 strongly advocates shifting from rote learning towards conceptual understanding, experiential learning, and critical thinking.',
    solution_hi: 'NEP 2020 रटंत अधिगम से वैचारिक समझ (Conceptual Understanding), अनुभवात्मक शिक्षा पर बल देती है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_stet_2', option_key: 'A', option_en: 'Promoting rote memorization and rigid textbook learning', option_hi: 'रटंत स्मृति और कठोर पाठ्यपुस्तकीय अधिगम को बढ़ावा देना' },
      { id: '2', question_id: 'q_stet_2', option_key: 'B', option_en: 'Conceptual understanding, critical thinking and experiential learning', option_hi: 'वैचारिक समझ, आलोचनात्मक चिंतन और अनुभवात्मक अधिगम' },
      { id: '3', question_id: 'q_stet_2', option_key: 'C', option_en: 'Evaluation based exclusively on end-of-term summative exams', option_hi: 'केवल सत्रांत योगात्मक परीक्षाओं पर आधारित मूल्यांकन' },
      { id: '4', question_id: 'q_stet_2', option_key: 'D', option_en: 'Segregation of arts and science streams without flexibility', option_hi: 'कला और विज्ञान संकायों का कठोर विभाजन' }
    ]
  },
  {
    id: 'q_bpsc_1',
    exam_id: 'exam_bpsc_cce',
    subject_name: 'History of India & Bihar Special',
    question_type: 'single_mcq',
    difficulty: 'medium',
    marks: 1.0,
    negative_marks: 0.33,
    question_en: 'Who led the Revolt of 1857 in Bihar from the Jagdishpur (Bhojpur) region?',
    question_hi: 'बिहार के जगदीशपुर (भोजपुर) क्षेत्र से 1857 के विद्रोह का नेतृत्व किसने किया था?',
    correct_answer: 'B',
    solution_en: 'Veer Kunwar Singh, the chieftain of Jagdishpur, led the heroic resistance in Bihar during the 1857 revolt.',
    solution_hi: 'जगदीशपुर के वीर कुंवर सिंह ने 1857 के स्वतंत्रता संग्राम में बिहार में नेतृत्व किया था।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bpsc_1', option_key: 'A', option_en: 'Pir Ali Khan', option_hi: 'पीर अली खान' },
      { id: '2', question_id: 'q_bpsc_1', option_key: 'B', option_en: 'Veer Kunwar Singh', option_hi: 'वीर कुंवर सिंह' },
      { id: '3', question_id: 'q_bpsc_1', option_key: 'C', option_en: 'Amar Singh', option_hi: 'अमर सिंह' },
      { id: '4', question_id: 'q_bpsc_1', option_key: 'D', option_en: 'Maulvi Ahmadullah', option_hi: 'मौलवी अहमदुल्लाह' }
    ]
  },
  {
    id: 'q_jee_1',
    exam_id: 'exam_jee_main',
    subject_name: 'Physics',
    question_type: 'single_mcq',
    difficulty: 'medium',
    marks: 4.0,
    negative_marks: 1.0,
    question_en: 'A particle of mass m moves in a circular orbit of radius r under the influence of an attractive central force F = -k/r^2. What is the total mechanical energy of the particle?',
    question_hi: 'द्रव्यमान m का एक कण एक आकर्षक केंद्रीय बल F = -k/r^2 के प्रभाव में त्रिज्या r की वृत्ताकार कक्षा में गति करता है। कण की कुल यांत्रिक ऊर्जा क्या है?',
    correct_answer: 'B',
    solution_en: 'F = mv^2/r = k/r^2 => mv^2 = k/r. KE = 1/2 mv^2 = k/(2r). Potential energy U = -k/r. Total energy E = -k/(2r).',
    solution_hi: 'अभिकेंद्रीय बल: mv^2/r = k/r^2 => गतिज ऊर्जा k/(2r), स्थितिज ऊर्जा -k/r। कुल ऊर्जा = -k/(2r)।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_jee_1', option_key: 'A', option_en: '-k/r', option_hi: '-k/r' },
      { id: '2', question_id: 'q_jee_1', option_key: 'B', option_en: '-k/(2r)', option_hi: '-k/(2r)' },
      { id: '3', question_id: 'q_jee_1', option_key: 'C', option_en: '+k/(2r)', option_hi: '+k/(2r)' },
      { id: '4', question_id: 'q_jee_1', option_key: 'D', option_en: '0', option_hi: 'शून्य' }
    ]
  },
  {
    id: 'q_neet_1',
    exam_id: 'exam_neet_ug',
    subject_name: 'Biology',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 4.0,
    negative_marks: 1.0,
    question_en: 'Which cell organelle is known as the "protein factory" of the eukaryotic cell?',
    question_hi: 'यूकेरियोटिक कोशिका के किस कोशिकांग को "प्रोटीन की फैक्ट्री" के रूप में जाना जाता है?',
    correct_answer: 'C',
    solution_en: 'Ribosomes are the cellular machines responsible for translating mRNA into proteins.',
    solution_hi: 'राइबोसोम (Ribosomes) को कोशिका की प्रोटीन फैक्ट्री कहा जाता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_neet_1', option_key: 'A', option_en: 'Mitochondria', option_hi: 'माइटोकॉन्ड्रिया' },
      { id: '2', question_id: 'q_neet_1', option_key: 'B', option_en: 'Golgi Apparatus', option_hi: 'गॉल्जी काय' },
      { id: '3', question_id: 'q_neet_1', option_key: 'C', option_en: 'Ribosome', option_hi: 'राइबोसोम' },
      { id: '4', question_id: 'q_neet_1', option_key: 'D', option_en: 'Lysosome', option_hi: 'लाइसोसोम' }
    ]
  },
  ...allBsebQuestions
];

const initialTests: MockTest[] = [
  {
    id: 'test_stet_full_1',
    exam_id: 'exam_bihar_stet',
    exam_name: 'Bihar STET',
    title: 'Bihar STET 2026 Paper 1 (Secondary) Full Mock Test 01',
    slug: 'bihar-stet-paper-1-mock-01',
    description: 'Complete mock test matching exact BSEB STET pattern with bilingual questions, Pedagogy, Art of Teaching, Bihar GK and Aptitude.',
    test_type: 'full_mock',
    duration_minutes: 150,
    total_questions: 150,
    total_marks: 150,
    passing_marks: 75,
    negative_marking: 0.0,
    is_free: 1,
    is_published: 1,
    review_available: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 'test_bpsc_pre_1',
    exam_id: 'exam_bpsc_cce',
    exam_name: 'BPSC Combined Competitive Exam',
    title: 'BPSC 71st CCE Prelims Comprehensive General Studies Mock Test 01',
    slug: 'bpsc-71st-prelims-mock-01',
    description: 'Based on the latest BPSC negative marking pattern (1/3rd negative). Covers Bihar Special, History, Polity, Geography & Science.',
    test_type: 'full_mock',
    duration_minutes: 120,
    total_questions: 150,
    total_marks: 150,
    passing_marks: 80,
    negative_marking: 0.33,
    is_free: 1,
    is_published: 1,
    review_available: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 'test_jee_main_1',
    exam_id: 'exam_jee_main',
    exam_name: 'JEE Main',
    title: 'JEE Main 2026 All-India Open Mock Test (Session 1)',
    slug: 'jee-main-2026-open-mock-01',
    description: 'Full NTA pattern CBT test with Physics, Chemistry, and Mathematics (+4 / -1 marking scheme).',
    test_type: 'full_mock',
    duration_minutes: 180,
    total_questions: 90,
    total_marks: 300,
    passing_marks: 100,
    negative_marking: 1.0,
    is_free: 0,
    is_published: 1,
    review_available: 1,
    created_at: new Date().toISOString()
  },
  {
    id: 'test_neet_ug_1',
    exam_id: 'exam_neet_ug',
    exam_name: 'NEET UG',
    title: 'NEET UG 2026 Target 700+ Full Syllabus Mock Test 01',
    slug: 'neet-ug-full-mock-01',
    description: 'Simulate real NEET test environment with Botany, Zoology, Physics, and Chemistry.',
    test_type: 'full_mock',
    duration_minutes: 200,
    total_questions: 200,
    total_marks: 720,
    passing_marks: 150,
    negative_marking: 1.0,
    is_free: 0,
    is_published: 1,
    review_available: 1,
    created_at: new Date().toISOString()
  },
  ...bseb12thCsTests
];

const initialPlans: SubscriptionPlan[] = [
  {
    id: 'plan_starter_free',
    name: 'Pariksha Starter (Free Demo)',
    code: 'FREE_TRIAL',
    description: 'Ideal for trying out the CBT platform with demo mock tests and basic PDF notes.',
    price_inr: 0,
    duration_days: 365,
    exam_access_type: 'all',
    features: [
      'Access to all Free Demo Mock Tests',
      'Daily GK & Current Affairs Quizzes',
      'Download sample PDF notes and PYQ keys',
      'Basic score breakdown and accuracy report'
    ],
    is_popular: 0,
    is_active: 1
  },
  {
    id: 'plan_bihar_combo',
    name: 'Bihar State Pariksha Pass',
    code: 'BIHAR_COMBO_PASS',
    description: 'Complete package for Bihar STET, BPSC TRE 4.0, BPSC CCE, and Bihar Police Constable.',
    price_inr: 149,
    duration_days: 180,
    exam_access_type: 'category',
    features: [
      'Unlimited Mock Tests for Bihar STET & BPSC TRE',
      'BPSC 71st Prelims Test Series with detailed solutions',
      'Bihar Special GK + SCERT/NCERT Digital Study Guides',
      'Server-timed CBT environment with NTA interface',
      'State-level percentile and rank benchmarking',
      'Priority Doubt Resolution Support'
    ],
    is_popular: 1,
    is_active: 1
  },
  {
    id: 'plan_all_access_annual',
    name: 'All-India Pariksha Mega Pass (Annual)',
    code: 'ALL_ACCESS_ANNUAL',
    description: 'Complete unrestricted pass unlocking EVERY examination, test series, question bank, and study note.',
    price_inr: 899,
    duration_days: 365,
    exam_access_type: 'all',
    features: [
      'Unrestricted access to all 21+ examination test series',
      'Over 500+ Full-Length & Sectional Mock Tests',
      'Complete digital library of PDF guides & formula books',
      'Unlimited previous year solved question papers',
      'Custom test builder from 25,000+ question bank'
    ],
    is_popular: 0,
    is_active: 1
  }
];

const initialPapers: ModelPaper[] = [
  {
    id: 'paper_bseb_12_cs_set_01',
    exam_id: 'exam_bseb_12_cs',
    exam_name: 'Bihar Board XII Computer Science',
    exam_slug: 'bihar-board-xii-computer-science',
    year: 2026,
    set_number: 1,
    subject_code: '122 / 221 / 328',
    paper_name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 01 (Bilingual)',
    duration_minutes: 195,
    max_marks: 70,
    total_questions: 96,
    negative_marking_ratio: 0.0,
    paper_type: 'model',
    pdf_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_01_Bilingual_72d391e9.pdf',
    answer_key_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_01_Bilingual_72d391e9.pdf',
    description: 'Bilingual (Hindi & English) Model Set 01: 70 Objective MCQs, 20 Short Answer & 6 Long Answer questions. Includes complete answer key and C++/SQL solutions.',
    has_full_solutions: true,
    cbt_test_id: 'test_bseb_12_cs_set_01'
  },
  {
    id: 'paper_bseb_12_cs_set_02',
    exam_id: 'exam_bseb_12_cs',
    exam_name: 'Bihar Board XII Computer Science',
    exam_slug: 'bihar-board-xii-computer-science',
    year: 2026,
    set_number: 2,
    subject_code: '122 / 221 / 328',
    paper_name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 02 (Bilingual)',
    duration_minutes: 195,
    max_marks: 70,
    total_questions: 96,
    negative_marking_ratio: 0.0,
    paper_type: 'model',
    pdf_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_02_Bilingual_1014e699.pdf',
    answer_key_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_02_Bilingual_1014e699.pdf',
    description: 'Bilingual Model Set 02: Covering OOP principles in C++, constructors/destructors, inheritance, arrays, and relational database management systems with complete answer keys.',
    has_full_solutions: true,
    cbt_test_id: 'test_bseb_12_cs_set_02'
  },
  {
    id: 'paper_bseb_12_cs_set_03',
    exam_id: 'exam_bseb_12_cs',
    exam_name: 'Bihar Board XII Computer Science',
    exam_slug: 'bihar-board-xii-computer-science',
    year: 2026,
    set_number: 3,
    subject_code: '122 / 221 / 328',
    paper_name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 03 (Bilingual)',
    duration_minutes: 195,
    max_marks: 70,
    total_questions: 96,
    negative_marking_ratio: 0.0,
    paper_type: 'model',
    pdf_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_03_Bilingual_f19c6a1f.pdf',
    answer_key_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_03_Bilingual_f19c6a1f.pdf',
    description: 'Bilingual Model Set 03: Data Structures (stacks, queues, linked lists), Boolean Algebra truth tables, logic gates, and networking protocols with full solutions.',
    has_full_solutions: true,
    cbt_test_id: 'test_bseb_12_cs_set_03'
  },
  {
    id: 'paper_bseb_12_cs_set_04',
    exam_id: 'exam_bseb_12_cs',
    exam_name: 'Bihar Board XII Computer Science',
    exam_slug: 'bihar-board-xii-computer-science',
    year: 2026,
    set_number: 4,
    subject_code: '122 / 221 / 328',
    paper_name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 04 (Bilingual)',
    duration_minutes: 195,
    max_marks: 70,
    total_questions: 96,
    negative_marking_ratio: 0.0,
    paper_type: 'model',
    pdf_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_04_Bilingual_896ee56e.pdf',
    answer_key_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_04_Bilingual_896ee56e.pdf',
    description: 'Bilingual Model Set 04: SQL queries (SELECT, GROUP BY, ORDER BY), Karnaugh Map minimization, and file handling in C++ with step-by-step solutions.',
    has_full_solutions: true,
    cbt_test_id: 'test_bseb_12_cs_set_04'
  },
  {
    id: 'paper_bseb_12_cs_set_05',
    exam_id: 'exam_bseb_12_cs',
    exam_name: 'Bihar Board XII Computer Science',
    exam_slug: 'bihar-board-xii-computer-science',
    year: 2026,
    set_number: 5,
    subject_code: '122 / 221 / 328',
    paper_name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 05 (Bilingual)',
    duration_minutes: 195,
    max_marks: 70,
    total_questions: 96,
    negative_marking_ratio: 0.0,
    paper_type: 'model',
    pdf_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_05_Bilingual_278fabdf.pdf',
    answer_key_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_05_Bilingual_278fabdf.pdf',
    description: 'Bilingual Model Set 05: Pointer arithmetic, function overloading, transmission media, network topologies, and De Morgan’s laws with detailed bilingual answer keys.',
    has_full_solutions: true,
    cbt_test_id: 'test_bseb_12_cs_set_05'
  },
  {
    id: 'paper_bseb_12_cs_set_06',
    exam_id: 'exam_bseb_12_cs',
    exam_name: 'Bihar Board XII Computer Science',
    exam_slug: 'bihar-board-xii-computer-science',
    year: 2026,
    set_number: 6,
    subject_code: '122 / 221 / 328',
    paper_name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 06 (Bilingual)',
    duration_minutes: 195,
    max_marks: 70,
    total_questions: 96,
    negative_marking_ratio: 0.0,
    paper_type: 'model',
    pdf_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_06_Bilingual_f6514ded.pdf',
    answer_key_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_06_Bilingual_f6514ded.pdf',
    description: 'Bilingual Model Set 06: Advanced C++ classes, DBMS keys (Primary, Candidate, Foreign), cyber safety, and open source concepts accompanied by complete solutions.',
    has_full_solutions: true,
    cbt_test_id: 'test_bseb_12_cs_set_06'
  },
  {
    id: 'paper_bseb_12_cs_set_07',
    exam_id: 'exam_bseb_12_cs',
    exam_name: 'Bihar Board XII Computer Science',
    exam_slug: 'bihar-board-xii-computer-science',
    year: 2026,
    set_number: 7,
    subject_code: '122 / 221 / 328',
    paper_name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 07 (Bilingual)',
    duration_minutes: 195,
    max_marks: 70,
    total_questions: 96,
    negative_marking_ratio: 0.0,
    paper_type: 'model',
    pdf_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_07_Bilingual_87a1150d.pdf',
    answer_key_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_07_Bilingual_87a1150d.pdf',
    description: 'Bilingual Model Set 07: Standard library headers, stack push/pop algorithms, SQL aggregate functions, and bilingual answer keys.',
    has_full_solutions: true,
    cbt_test_id: 'test_bseb_12_cs_set_07'
  },
  {
    id: 'paper_bseb_12_cs_set_08',
    exam_id: 'exam_bseb_12_cs',
    exam_name: 'Bihar Board XII Computer Science',
    exam_slug: 'bihar-board-xii-computer-science',
    year: 2026,
    set_number: 8,
    subject_code: '122 / 221 / 328',
    paper_name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 08 (Bilingual)',
    duration_minutes: 195,
    max_marks: 70,
    total_questions: 96,
    negative_marking_ratio: 0.0,
    paper_type: 'model',
    pdf_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_08_Bilingual_21d1daae.pdf',
    answer_key_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_08_Bilingual_21d1daae.pdf',
    description: 'Bilingual Model Set 08: C++ stream I/O, binary files, relational algebra operators, and network security mechanisms with full marking scheme.',
    has_full_solutions: true,
    cbt_test_id: 'test_bseb_12_cs_set_08'
  },
  {
    id: 'paper_bseb_12_cs_set_09',
    exam_id: 'exam_bseb_12_cs',
    exam_name: 'Bihar Board XII Computer Science',
    exam_slug: 'bihar-board-xii-computer-science',
    year: 2026,
    set_number: 9,
    subject_code: '122 / 221 / 328',
    paper_name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 09 (Bilingual)',
    duration_minutes: 195,
    max_marks: 70,
    total_questions: 96,
    negative_marking_ratio: 0.0,
    paper_type: 'model',
    pdf_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_09_Bilingual_4fcc00cf.pdf',
    answer_key_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_09_Bilingual_4fcc00cf.pdf',
    description: 'Bilingual Model Set 09: Circular queues, multi-table SQL JOIN queries, canonical SOP/POS expressions, and OSI reference model layers with explanations.',
    has_full_solutions: true,
    cbt_test_id: 'test_bseb_12_cs_set_09'
  },
  {
    id: 'paper_bseb_12_cs_set_10',
    exam_id: 'exam_bseb_12_cs',
    exam_name: 'Bihar Board XII Computer Science',
    exam_slug: 'bihar-board-xii-computer-science',
    year: 2026,
    set_number: 10,
    subject_code: '122 / 221 / 328',
    paper_name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 10 (Bilingual)',
    duration_minutes: 195,
    max_marks: 70,
    total_questions: 96,
    negative_marking_ratio: 0.0,
    paper_type: 'model',
    pdf_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_10_Bilingual_a9f46ec0.pdf',
    answer_key_url: '/assets/aistudio/BSEB_Computer_Science_Model_Set_10_Bilingual_a9f46ec0.pdf',
    description: 'Bilingual Model Set 10: Grand revision final rehearsal paper strictly matching BSEB Class 12 Intermediate pattern with 70 MCQs, 20 short answer, and 6 long answer questions with verified solutions.',
    has_full_solutions: true,
    cbt_test_id: 'test_bseb_12_cs_set_10'
  },
  {
    id: 'paper_bpsc_69_pyq',
    exam_id: 'exam_bpsc_cce',
    exam_name: 'BPSC Combined Competitive Exam',
    exam_slug: 'bpsc',
    year: 2024,
    paper_name: 'BPSC 69th Combined Competitive (Preliminary) Official Question Paper',
    duration_minutes: 120,
    max_marks: 150,
    total_questions: 150,
    negative_marking_ratio: 0.33,
    paper_type: 'pyq',
    pdf_url: '/assets/sample-docs/bpsc-69-prelims.pdf',
    answer_key_url: '/assets/sample-docs/bpsc-69-answer-key.pdf',
    description: 'Official 69th BPSC Prelims question paper with official master key.'
  },
  {
    id: 'paper_stet_2024_p1',
    exam_id: 'exam_bihar_stet',
    exam_name: 'Bihar STET',
    exam_slug: 'bihar-stet',
    year: 2024,
    paper_name: 'Bihar STET 2024 Paper 1 (Secondary) Official Shift 1 Question Paper',
    duration_minutes: 150,
    max_marks: 150,
    total_questions: 150,
    negative_marking_ratio: 0.0,
    paper_type: 'pyq',
    pdf_url: '/assets/sample-docs/stet-2024-p1.pdf',
    answer_key_url: '/assets/sample-docs/stet-2024-key.pdf',
    description: 'BSEB STET Paper 1 Secondary exam question paper with answer key.'
  },
  {
    id: 'paper_jee_2025_s1',
    exam_id: 'exam_jee_main',
    exam_name: 'JEE Main',
    exam_slug: 'jee-main',
    year: 2025,
    paper_name: 'JEE Main 2025 January Session Official CBT Question Paper with NTA Key',
    duration_minutes: 180,
    max_marks: 300,
    total_questions: 90,
    negative_marking_ratio: 1.0,
    paper_type: 'pyq',
    pdf_url: '/assets/sample-docs/jee-main-2025-s1.pdf',
    answer_key_url: '/assets/sample-docs/jee-main-2025-key.pdf',
    description: 'NTA Official CBT Question Paper with answer keys.'
  },
  {
    id: 'paper_rrb_ntpc_2023',
    exam_id: 'exam_rrb_ntpc',
    exam_name: 'RRB NTPC',
    exam_slug: 'rrb-ntpc',
    year: 2023,
    paper_name: 'RRB NTPC CBT-1 All-Shifts Solved Model Question Paper Set A',
    duration_minutes: 90,
    max_marks: 100,
    total_questions: 100,
    negative_marking_ratio: 0.33,
    paper_type: 'model',
    pdf_url: '/assets/sample-docs/rrb-ntpc-model.pdf',
    answer_key_url: '/assets/sample-docs/rrb-ntpc-key.pdf',
    description: 'Standard RRB NTPC Model Practice paper with detailed solutions.'
  }
];

export const firebaseService = {
  // Ensure default data exists in Firestore
  bootstrapFirestore: async () => {
    try {
      const snap = await getDocs(collection(db, 'examinations'));
      if (snap.empty) {
        const batch = writeBatch(db);

        initialCategories.forEach(cat => {
          batch.set(doc(db, 'exam_categories', cat.id), cat);
        });

        initialExams.forEach(exam => {
          batch.set(doc(db, 'examinations', exam.id), exam);
        });

        initialQuestions.forEach(q => {
          batch.set(doc(db, 'questions', q.id), q);
        });

        initialTests.forEach(test => {
          batch.set(doc(db, 'mock_tests', test.id), test);
        });

        initialPlans.forEach(plan => {
          batch.set(doc(db, 'subscription_plans', plan.id), plan);
        });

        initialPapers.forEach(paper => {
          batch.set(doc(db, 'model_papers', paper.id), paper);
        });

        await batch.commit();
        console.log('[Firebase] Bootstrapped Firestore collections with initial catalog.');
      } else {
        // Check if model_papers collection needs bootstrapping
        const papersSnap = await getDocs(collection(db, 'model_papers'));
        if (papersSnap.empty) {
          const paperBatch = writeBatch(db);
          initialPapers.forEach(paper => {
            paperBatch.set(doc(db, 'model_papers', paper.id), paper);
          });
          await paperBatch.commit();
          console.log('[Firebase] Bootstrapped model_papers collection with BSEB 12th CS sets.');
        }
      }
    } catch (err) {
      console.warn('Bootstrap check skipped or error:', err);
    }
  },

  // Categories & Examinations
  getCategories: async (): Promise<ExamCategory[]> => {
    try {
      const snap = await getDocs(collection(db, 'exam_categories'));
      if (snap.empty) return initialCategories;
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ExamCategory));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'exam_categories');
    }
  },

  getExams: async (params?: { featured?: boolean; search?: string }): Promise<Examination[]> => {
    try {
      const snap = await getDocs(collection(db, 'examinations'));
      if (snap.empty) return initialExams;
      let exams = snap.docs.map(d => ({ id: d.id, ...d.data() } as Examination));

      if (params?.featured) {
        exams = exams.filter(e => e.is_featured === 1 || e.is_featured === true as any);
      }
      if (params?.search) {
        const term = params.search.toLowerCase();
        exams = exams.filter(e =>
          e.name.toLowerCase().includes(term) ||
          e.full_name?.toLowerCase().includes(term) ||
          e.description?.toLowerCase().includes(term)
        );
      }
      return exams;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'examinations');
    }
  },

  getExamBySlug: async (slug: string) => {
    try {
      const q = query(collection(db, 'examinations'), where('slug', '==', slug), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const exam = { id: snap.docs[0].id, ...snap.docs[0].data() } as Examination;
        return {
          success: true,
          exam,
          subjects: [],
          mockTests: initialTests.filter(t => t.exam_id === exam.id),
          materials: [],
          papers: initialPapers.filter(p => p.exam_id === exam.id)
        };
      }

      const fallback = initialExams.find(e => e.slug === slug);
      if (fallback) {
        return {
          success: true,
          exam: fallback,
          subjects: [],
          mockTests: initialTests.filter(t => t.exam_id === fallback.id),
          materials: [],
          papers: initialPapers.filter(p => p.exam_id === fallback.id)
        };
      }

      return { success: false, message: 'Exam not found.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `examinations/${slug}`);
    }
  },

  // Mock Tests & CBT Engine
  getTests: async (params?: { free_only?: boolean; search?: string }): Promise<MockTest[]> => {
    try {
      const snap = await getDocs(collection(db, 'mock_tests'));
      if (snap.empty) return initialTests;
      let tests = snap.docs.map(d => ({ id: d.id, ...d.data() } as MockTest));
      if (params?.free_only) {
        tests = tests.filter(t => t.is_free === 1 || t.is_free === true as any);
      }
      if (params?.search) {
        const term = params.search.toLowerCase();
        tests = tests.filter(t => t.title.toLowerCase().includes(term));
      }
      return tests;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'mock_tests');
    }
  },

  startAttempt: async (testId: string, userId: string) => {
    try {
      const testDoc = await getDoc(doc(db, 'mock_tests', testId));
      const test = testDoc.exists() ? testDoc.data() as MockTest : initialTests.find(t => t.id === testId);

      const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date();
      const durationMins = test?.duration_minutes || 45;
      const deadline = new Date(now.getTime() + durationMins * 60 * 1000 + 15000).toISOString();

      const attemptData = {
        user_id: userId,
        test_id: testId,
        started_at: now.toISOString(),
        server_deadline: deadline,
        status: 'in_progress',
        time_taken_seconds: 0
      };

      await setDoc(doc(db, 'test_attempts', attemptId), attemptData);

      // Find questions specific to this test
      const matchedByTestId = initialQuestions.filter(q => q.test_id === testId);
      const testQuestions = matchedByTestId.length > 0
        ? matchedByTestId
        : (test?.exam_id ? initialQuestions.filter(q => q.exam_id === test.exam_id) : initialQuestions);

      // Return questions without answers
      const safeQuestions = testQuestions.map(q => ({
        ...q,
        correct_answer: undefined,
        solution_en: undefined,
        solution_hi: undefined
      }));

      const sectionTitle = test?.title?.includes('BSEB')
        ? 'Section A - Objective Questions (द्विभाषी प्रश्न)'
        : 'Section A - Core Subject Knowledge';

      return {
        success: true,
        attempt_id: attemptId,
        started_at: now.toISOString(),
        server_deadline: deadline,
        remaining_seconds: durationMins * 60,
        test,
        sections: [
          {
            id: 'sec_1',
            test_id: testId,
            name: sectionTitle,
            section_order: 1,
            total_questions: safeQuestions.length,
            max_marks: test?.total_marks || safeQuestions.length
          }
        ],
        questions: safeQuestions,
        saved_answers: []
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'test_attempts');
    }
  },

  saveAnswer: async (attemptId: string, answer: SavedAnswer) => {
    try {
      const answerRef = doc(db, 'test_attempts', attemptId, 'student_answers', answer.question_id);
      await setDoc(answerRef, {
        ...answer,
        saved_at: new Date().toISOString()
      }, { merge: true });
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `test_attempts/${attemptId}/student_answers`);
    }
  },

  submitAttempt: async (attemptId: string) => {
    try {
      const attemptRef = doc(db, 'test_attempts', attemptId);
      const attemptDoc = await getDoc(attemptRef);
      const attemptData = attemptDoc.data() as TestAttempt;
      const testId = attemptData?.test_id;
      const test = initialTests.find(t => t.id === testId);

      const answersSnap = await getDocs(collection(db, 'test_attempts', attemptId, 'student_answers'));
      const studentAnswers: Record<string, SavedAnswer> = {};
      answersSnap.docs.forEach(d => {
        studentAnswers[d.id] = d.data() as SavedAnswer;
      });

      const matchedByTestId = initialQuestions.filter(q => q.test_id === testId);
      const targetQuestions = matchedByTestId.length > 0
        ? matchedByTestId
        : (test?.exam_id ? initialQuestions.filter(q => q.exam_id === test.exam_id) : initialQuestions);

      let correctCount = 0;
      let incorrectCount = 0;
      let unattemptedCount = 0;
      let totalScore = 0;

      targetQuestions.forEach(q => {
        const ans = studentAnswers[q.id];
        if (!ans || !ans.selected_option) {
          unattemptedCount++;
        } else if (ans.selected_option.trim().toUpperCase() === q.correct_answer?.trim().toUpperCase()) {
          correctCount++;
          totalScore += (q.marks || 1.0);
        } else {
          incorrectCount++;
          totalScore -= (q.negative_marks || 0.0);
        }
      });

      const totalAttempted = correctCount + incorrectCount;
      const accuracy = totalAttempted > 0 ? Number(((correctCount / totalAttempted) * 100).toFixed(1)) : 0;
      const finalScore = Number(Math.max(0, totalScore).toFixed(2));
      const testMaxMarks = test?.total_marks || targetQuestions.length;
      const now = new Date().toISOString();

      await updateDoc(attemptRef, {
        submitted_at: now,
        status: 'submitted',
        total_score: finalScore,
        max_marks: testMaxMarks,
        accuracy,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        unattempted_count: unattemptedCount,
        percentile: 95.0,
        rank: 1
      });

      return {
        success: true,
        result: {
          attempt_id: attemptId,
          test_id: testId,
          total_score: finalScore,
          max_marks: testMaxMarks,
          accuracy,
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          unattempted_count: unattemptedCount,
          percentile: 95.0,
          rank: 1
        }
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `test_attempts/${attemptId}`);
    }
  },

  getAttemptResult: async (attemptId: string) => {
    try {
      const attemptDoc = await getDoc(doc(db, 'test_attempts', attemptId));
      const attempt = attemptDoc.exists() ? { id: attemptDoc.id, ...attemptDoc.data() } : null;
      const testId = (attempt as any)?.test_id;
      const test = initialTests.find(t => t.id === testId);

      const matchedByTestId = initialQuestions.filter(q => q.test_id === testId);
      const targetQuestions = matchedByTestId.length > 0
        ? matchedByTestId
        : (test?.exam_id ? initialQuestions.filter(q => q.exam_id === test.exam_id) : initialQuestions);

      const answersSnap = await getDocs(collection(db, 'test_attempts', attemptId, 'student_answers'));
      const ansMap: Record<string, SavedAnswer> = {};
      answersSnap.docs.forEach(d => {
        ansMap[d.id] = d.data() as SavedAnswer;
      });

      let correctCount = 0;
      let incorrectCount = 0;
      let unattemptedCount = 0;
      let userScore = 0;

      const reviewedQuestions = targetQuestions.map((q, idx) => {
        const studentAns = ansMap[q.id]?.selected_option;
        const isCorrect = studentAns && studentAns.trim().toUpperCase() === q.correct_answer?.trim().toUpperCase();
        if (!studentAns) {
          unattemptedCount++;
        } else if (isCorrect) {
          correctCount++;
          userScore += (q.marks || 1.0);
        } else {
          incorrectCount++;
          userScore -= (q.negative_marks || 0.0);
        }
        return {
          ...q,
          question_order: idx + 1,
          selected_option: studentAns || null,
          is_correct: isCorrect ? 1 : (studentAns ? 0 : null)
        };
      });

      const totalAttempted = correctCount + incorrectCount;
      const accuracy = totalAttempted > 0 ? Number(((correctCount / totalAttempted) * 100).toFixed(1)) : 0;
      const finalScore = Number(Math.max(0, userScore).toFixed(2));
      const testMaxMarks = test?.total_marks || targetQuestions.length;

      return {
        success: true,
        attempt: {
          ...attempt,
          test_title: test?.title,
          total_questions: targetQuestions.length,
          max_marks: testMaxMarks,
          total_score: finalScore,
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          unattempted_count: unattemptedCount,
          accuracy
        },
        subject_breakdown: [
          {
            subject: test?.exam_name || 'BSEB Computer Science (Theory)',
            total_questions: targetQuestions.length,
            correct: correctCount,
            incorrect: incorrectCount,
            unattempted: unattemptedCount,
            score: finalScore,
            accuracy
          }
        ],
        questions: reviewedQuestions
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `test_attempts/${attemptId}`);
    }
  },

  // Plans & Payments
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    try {
      const snap = await getDocs(collection(db, 'subscription_plans'));
      if (snap.empty) return initialPlans;
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionPlan));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'subscription_plans');
    }
  },

  createEntitlement: async (userId: string, plan: SubscriptionPlan) => {
    try {
      const entId = `ent_${Date.now()}`;
      const now = new Date();
      const end = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString();

      const entData = {
        user_id: userId,
        plan_id: plan.id,
        plan_name: plan.name,
        plan_code: plan.code,
        start_date: now.toISOString(),
        end_date: end,
        is_active: true
      };

      await setDoc(doc(db, 'entitlements', entId), entData);
      return { success: true, entitlement: entData };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'entitlements');
    }
  },

  getUserEntitlements: async (userId: string): Promise<Entitlement[]> => {
    try {
      const q = query(collection(db, 'entitlements'), where('user_id', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Entitlement));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'entitlements');
    }
  },

  // Model Papers & PYQs
  getPapers: async (params?: { exam_id?: string; paper_type?: string; year?: number }): Promise<ModelPaper[]> => {
    try {
      const snap = await getDocs(collection(db, 'model_papers'));
      let papers: ModelPaper[] = snap.empty
        ? initialPapers
        : snap.docs.map(d => ({ id: d.id, ...d.data() } as ModelPaper));

      if (params?.exam_id && params.exam_id !== 'all') {
        papers = papers.filter(p => p.exam_id === params.exam_id);
      }
      if (params?.paper_type && params.paper_type !== 'all') {
        papers = papers.filter(p => p.paper_type === params.paper_type);
      }
      if (params?.year && String(params.year) !== 'all') {
        papers = papers.filter(p => String(p.year) === String(params.year));
      }
      return papers;
    } catch (err) {
      console.warn('Firestore getPapers error, falling back to local catalog:', err);
      let papers = [...initialPapers];
      if (params?.exam_id && params.exam_id !== 'all') {
        papers = papers.filter(p => p.exam_id === params.exam_id);
      }
      if (params?.paper_type && params.paper_type !== 'all') {
        papers = papers.filter(p => p.paper_type === params.paper_type);
      }
      if (params?.year && String(params.year) !== 'all') {
        papers = papers.filter(p => String(p.year) === String(params.year));
      }
      return papers;
    }
  }
};
