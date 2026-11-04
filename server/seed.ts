import bcrypt from 'bcryptjs';
import { db, initDatabase } from './db.js';

function ensureBsebPapers() {
  try {
    // Ensure school category exists
    db.prepare(`
      INSERT OR IGNORE INTO exam_categories (id, name, slug, description, icon, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run('cat_school', 'School & University Entrance', 'school-foundation', 'CUET UG/PG, Bihar Board (BSEB) 10th & 12th, Olympiads', 'GraduationCap', 9);

    // Ensure BSEB 12th CS examination exists
    db.prepare(`
      INSERT OR IGNORE INTO examinations (id, category_id, name, slug, full_name, eligibility, frequency, conducting_body, official_website, description, pattern_json, is_featured, is_active, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'exam_bseb_12_cs',
      'cat_school',
      'Bihar Board XII Computer Science',
      'bihar-board-xii-computer-science',
      'Bihar School Examination Board (BSEB) Intermediate Class 12 Computer Science (Theory)',
      'Class 12 Intermediate Student (Science, Arts, Commerce with Computer Science)',
      'Annual Board Examination (Feb)',
      'Bihar School Examination Board (BSEB)',
      'https://biharboardonline.bihar.gov.in',
      'Official model question sets and practice papers for Bihar Board Class 12 Intermediate Computer Science (Theory) with C++, Data Structures, DBMS, SQL, Networking, and Boolean Algebra. Subject Code: 122 / 221 / 328.',
      JSON.stringify({ total_questions: 96, total_marks: 70, duration_minutes: 195, negative_marking: 0 }),
      1,
      1,
      9
    );

    const bsebPapers = [
      { id: 'paper_bseb_12_cs_set_01', name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 01 (Bilingual)', pdf: '/assets/aistudio/BSEB_Computer_Science_Model_Set_01_Bilingual_72d391e9.pdf' },
      { id: 'paper_bseb_12_cs_set_02', name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 02 (Bilingual)', pdf: '/assets/aistudio/BSEB_Computer_Science_Model_Set_02_Bilingual_1014e699.pdf' },
      { id: 'paper_bseb_12_cs_set_03', name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 03 (Bilingual)', pdf: '/assets/aistudio/BSEB_Computer_Science_Model_Set_03_Bilingual_f19c6a1f.pdf' },
      { id: 'paper_bseb_12_cs_set_04', name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 04 (Bilingual)', pdf: '/assets/aistudio/BSEB_Computer_Science_Model_Set_04_Bilingual_896ee56e.pdf' },
      { id: 'paper_bseb_12_cs_set_05', name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 05 (Bilingual)', pdf: '/assets/aistudio/BSEB_Computer_Science_Model_Set_05_Bilingual_278fabdf.pdf' },
      { id: 'paper_bseb_12_cs_set_06', name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 06 (Bilingual)', pdf: '/assets/aistudio/BSEB_Computer_Science_Model_Set_06_Bilingual_f6514ded.pdf' },
      { id: 'paper_bseb_12_cs_set_07', name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 07 (Bilingual)', pdf: '/assets/aistudio/BSEB_Computer_Science_Model_Set_07_Bilingual_87a1150d.pdf' },
      { id: 'paper_bseb_12_cs_set_08', name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 08 (Bilingual)', pdf: '/assets/aistudio/BSEB_Computer_Science_Model_Set_08_Bilingual_21d1daae.pdf' },
      { id: 'paper_bseb_12_cs_set_09', name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 09 (Bilingual)', pdf: '/assets/aistudio/BSEB_Computer_Science_Model_Set_09_Bilingual_4fcc00cf.pdf' },
      { id: 'paper_bseb_12_cs_set_10', name: 'BSEB Intermediate Class 12 Computer Science Model Question Set 10 (Bilingual)', pdf: '/assets/aistudio/BSEB_Computer_Science_Model_Set_10_Bilingual_a9f46ec0.pdf' }
    ];

    const insertPaper = db.prepare(`
      INSERT OR IGNORE INTO model_papers (id, exam_id, year, paper_name, duration_minutes, max_marks, total_questions, negative_marking_ratio, paper_type, pdf_url, answer_key_url, is_active)
      VALUES (?, 'exam_bseb_12_cs', 2026, ?, 195, 70, 96, 0.0, 'model', ?, ?, 1)
    `);

    bsebPapers.forEach(p => {
      insertPaper.run(p.id, p.name, p.pdf, p.pdf);
    });
  } catch (err) {
    console.warn('[Seed] Error ensuring BSEB model papers in SQLite:', err);
  }
}

export function seedDatabase() {
  initDatabase();
  ensureBsebPapers();

  // Check if already seeded
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('Admin@123', salt);
  const studentHash = bcrypt.hashSync('Student@123', salt);

  const now = new Date().toISOString();

  // 1. SEED USERS
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, phone, role, status, avatar_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'usr_admin_1',
    'admin@cyberoshpariksha.in',
    adminHash,
    'CYBEROSH Academic Administrator',
    '+91-9876543210',
    'super_admin',
    'active',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    now,
    now
  );

  insertUser.run(
    'usr_student_1',
    'student@cyberoshpariksha.in',
    studentHash,
    'Aarav Kumar (Patna)',
    '+91-9123456789',
    'student',
    'active',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    now,
    now
  );

  db.prepare(`
    INSERT INTO student_profiles (user_id, target_exam_id, category, state, city, preparation_year, streak_days, last_active_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('usr_student_1', 'exam_bihar_stet', 'OBC', 'Bihar', 'Patna', 2026, 7, now);

  // 2. SEED EXAM CATEGORIES (10 Categories)
  const categories = [
    { id: 'cat_teaching', name: 'Teaching & Teacher Eligibility', slug: 'teaching', desc: 'Bihar STET, BPSC TRE, CTET, UPTET, KVS, NVS, PRT, TGT, PGT', icon: 'BookOpen', order: 1 },
    { id: 'cat_civil', name: 'Civil Services & State PSC', slug: 'civil-services', desc: 'BPSC, UPSC, UPPSC, State Administrative & Subordinate Services', icon: 'Award', order: 2 },
    { id: 'cat_engineering', name: 'Engineering Entrance', slug: 'engineering', desc: 'JEE Main, JEE Advanced, State CETs, Polytechnic Entrance Exam', icon: 'Cpu', order: 3 },
    { id: 'cat_medical', name: 'Medical Entrance', slug: 'medical', desc: 'NEET UG, Paramedical, Nursing & Allied Health Science Entrances', icon: 'Stethoscope', order: 4 },
    { id: 'cat_railway', name: 'Railway Recruitment Board', slug: 'railway', desc: 'RRB NTPC, RRB Group D, RRB ALP, RRB Technician & JE', icon: 'Train', order: 5 },
    { id: 'cat_banking', name: 'Banking & Insurance', slug: 'banking', desc: 'IBPS PO, IBPS Clerk, SBI PO, SBI Clerk, RBI Grade B & Assistant', icon: 'Landmark', order: 6 },
    { id: 'cat_ssc', name: 'Staff Selection Commission', slug: 'ssc', desc: 'SSC CGL, SSC CHSL, SSC GD Constable, SSC MTS, CPO', icon: 'ShieldCheck', order: 7 },
    { id: 'cat_police', name: 'Police & Defence', slug: 'police-defence', desc: 'Bihar Police Constable, Bihar SI (Daroga), NDA, CDS, CAPF', icon: 'Shield', order: 8 },
    { id: 'cat_school', name: 'School & University Entrance', slug: 'school-foundation', desc: 'CUET UG/PG, Bihar Board (BSEB) 10th & 12th, Olympiads', icon: 'GraduationCap', order: 9 },
    { id: 'cat_other', name: 'Other State & Technical Exams', slug: 'other', desc: 'BSSC Inter Level, CGL, High Court Clerk, Stenographer, ITI', icon: 'Layers', order: 10 }
  ];

  const insertCategory = db.prepare(`
    INSERT INTO exam_categories (id, name, slug, description, icon, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);
  categories.forEach(c => insertCategory.run(c.id, c.name, c.slug, c.desc, c.icon, c.order));

  // 3. SEED 21+ EXAMINATIONS
  const exams = [
    {
      id: 'exam_bihar_stet',
      cat_id: 'cat_teaching',
      name: 'Bihar STET',
      slug: 'bihar-stet',
      full_name: 'Bihar Secondary Teachers Eligibility Test',
      eligibility: 'B.Ed with Graduation / Post Graduation in relevant discipline',
      frequency: 'Annual / Bi-annual',
      conducting_body: 'Bihar School Examination Board (BSEB)',
      website: 'https://bsebstet.com',
      desc: 'Mandatory certification test conducted by BSEB for recruitment of secondary (Paper 1 - Classes 9-10) and senior secondary (Paper 2 - Classes 11-12) teachers in Bihar government schools.',
      is_featured: 1,
      order: 1,
      pattern: JSON.stringify({
        total_questions: 150,
        total_marks: 150,
        duration_minutes: 150,
        negative_marking: 0,
        sections: [
          { name: 'Specific Subject Discipline', questions: 100, marks: 100 },
          { name: 'Teaching Art & General Skills', questions: 50, marks: 50 }
        ]
      }),
      syllabus: JSON.stringify({
        subject_topics: ['Pedagogy & Child Development', 'General Knowledge & Bihar Current Affairs', 'Environmental Science', 'Mathematical Aptitude', 'Reasoning Ability'],
        core_subjects: ['Science', 'Mathematics', 'Social Science', 'Hindi', 'English', 'Sanskrit', 'Computer Science']
      })
    },
    {
      id: 'exam_bpsc_tre',
      cat_id: 'cat_teaching',
      name: 'Bihar BPSC TRE',
      slug: 'bihar-bpsc-tre',
      full_name: 'BPSC School Teacher Recruitment Examination (TRE 4.0)',
      eligibility: 'CTET / Bihar STET + B.Ed / D.El.Ed',
      frequency: 'Annual Recruitment Cycle',
      conducting_body: 'Bihar Public Service Commission (BPSC)',
      website: 'https://bpsc.bih.nic.in',
      desc: 'Direct teacher appointment competitive examination across Primary (1-5), Middle (6-8), Secondary (9-10) and Higher Secondary (11-12) schools in Bihar.',
      is_featured: 1,
      order: 2,
      pattern: JSON.stringify({ total_questions: 150, total_marks: 150, duration_minutes: 150, negative_marking: 0 }),
      syllabus: JSON.stringify({ subjects: ['Language (Qualifying)', 'General Studies', 'Discipline Core Subject'] })
    },
    {
      id: 'exam_bpsc_cce',
      cat_id: 'cat_civil',
      name: 'BPSC Combined Competitive Exam',
      slug: 'bpsc',
      full_name: 'BPSC 71st Combined (Preliminary) Competitive Examination',
      eligibility: 'Graduate in any discipline from recognized university',
      frequency: 'Annual',
      conducting_body: 'Bihar Public Service Commission (BPSC)',
      website: 'https://bpsc.bih.nic.in',
      desc: 'Premier state civil service examination for appointment to Deputy Collector (BAS), DSP, Revenue Officer, Block Panchayati Raj Officer, and allied state services in Bihar.',
      is_featured: 1,
      order: 3,
      pattern: JSON.stringify({ total_questions: 150, total_marks: 150, duration_minutes: 120, negative_marking: 0.33 }),
      syllabus: JSON.stringify({ subjects: ['General Science', 'Current Events of National & Bihar Importance', 'History of India & Bihar Special', 'Geography of Bihar & India', 'Indian Polity & Economy'] })
    },
    {
      id: 'exam_jee_main',
      cat_id: 'cat_engineering',
      name: 'JEE Main',
      slug: 'jee-main',
      full_name: 'Joint Entrance Examination (Main)',
      eligibility: '10+2 with Physics, Chemistry, and Mathematics (PCM)',
      frequency: 'Twice a year (Jan & April Sessions)',
      conducting_body: 'National Testing Agency (NTA)',
      website: 'https://jeemain.nta.ac.in',
      desc: 'All-India CBT examination for admission to premier NITs, IIITs, CFTIs, and qualifying gate for JEE Advanced (IITs).',
      is_featured: 1,
      order: 4,
      pattern: JSON.stringify({ total_questions: 90, total_marks: 300, duration_minutes: 180, negative_marking: 1.0 }),
      syllabus: JSON.stringify({ subjects: ['Physics', 'Chemistry', 'Mathematics'] })
    },
    {
      id: 'exam_neet_ug',
      cat_id: 'cat_medical',
      name: 'NEET UG',
      slug: 'neet-ug',
      full_name: 'National Eligibility cum Entrance Test (UG)',
      eligibility: '10+2 with Physics, Chemistry, and Biology (PCB)',
      frequency: 'Annual (May)',
      conducting_body: 'National Testing Agency (NTA)',
      website: 'https://exams.nta.ac.in/NEET',
      desc: 'National single medical entrance test for admission to MBBS, BDS, BAMS, BHMS, and veterinary courses across government and private medical colleges in India.',
      is_featured: 1,
      order: 5,
      pattern: JSON.stringify({ total_questions: 200, total_marks: 720, duration_minutes: 200, negative_marking: 1.0 }),
      syllabus: JSON.stringify({ subjects: ['Physics', 'Chemistry', 'Botany', 'Zoology'] })
    },
    {
      id: 'exam_ctet',
      cat_id: 'cat_teaching',
      name: 'CTET',
      slug: 'ctet',
      full_name: 'Central Teacher Eligibility Test',
      eligibility: 'D.El.Ed / B.Ed',
      frequency: 'Twice a year',
      conducting_body: 'CBSE',
      website: 'https://ctet.nic.in',
      desc: 'National benchmark eligibility test for teachers in Central Government schools like KVS, NVS, and Central Tibetan Schools.',
      is_featured: 1,
      order: 6,
      pattern: JSON.stringify({ total_questions: 150, total_marks: 150, duration_minutes: 150, negative_marking: 0 }),
      syllabus: JSON.stringify({ subjects: ['CDP', 'Language I', 'Language II', 'Mathematics', 'EVS / Social Studies'] })
    },
    {
      id: 'exam_rrb_ntpc',
      cat_id: 'cat_railway',
      name: 'RRB NTPC',
      slug: 'rrb-ntpc',
      full_name: 'Railway Non-Technical Popular Categories',
      eligibility: '12th Pass or Graduate based on post level',
      frequency: 'Periodic Recruitment',
      conducting_body: 'Railway Recruitment Boards (RRBs)',
      website: 'https://indianrailways.gov.in',
      desc: 'Prestigious Indian Railways recruitment for Station Master, Goods Train Manager, Commercial Apprentice, Junior Clerk, and Typists.',
      is_featured: 1,
      order: 7,
      pattern: JSON.stringify({ total_questions: 100, total_marks: 100, duration_minutes: 90, negative_marking: 0.33 }),
      syllabus: JSON.stringify({ subjects: ['General Awareness', 'Mathematics', 'General Intelligence & Reasoning'] })
    },
    {
      id: 'exam_ibps_po',
      cat_id: 'cat_banking',
      name: 'IBPS PO',
      slug: 'ibps-po',
      full_name: 'Institute of Banking Personnel Selection - Probationary Officer',
      eligibility: 'Graduate in any discipline',
      frequency: 'Annual',
      conducting_body: 'IBPS',
      website: 'https://ibps.in',
      desc: 'Centralized banking examination for recruitment of scale-I Probationary Officers / Management Trainees in 11 participating Public Sector Banks.',
      is_featured: 1,
      order: 8,
      pattern: JSON.stringify({ total_questions: 100, total_marks: 100, duration_minutes: 60, negative_marking: 0.25 }),
      syllabus: JSON.stringify({ subjects: ['English Language', 'Quantitative Aptitude', 'Reasoning Ability'] })
    },
    {
      id: 'exam_ssc_cgl',
      cat_id: 'cat_ssc',
      name: 'SSC CGL',
      slug: 'ssc-cgl',
      full_name: 'Staff Selection Commission - Combined Graduate Level',
      eligibility: 'Bachelor Degree',
      frequency: 'Annual',
      conducting_body: 'SSC',
      website: 'https://ssc.gov.in',
      desc: 'Recruitment for Group B & C Gazetted and Non-Gazetted posts in Central Ministries, CBI, Income Tax, Customs, Enforcement Directorate and CAG.',
      is_featured: 1,
      order: 9,
      pattern: JSON.stringify({ total_questions: 100, total_marks: 200, duration_minutes: 60, negative_marking: 0.5 }),
      syllabus: JSON.stringify({ subjects: ['General Intelligence', 'General Awareness', 'Quantitative Aptitude', 'English Comprehension'] })
    },
    {
      id: 'exam_bihar_police',
      cat_id: 'cat_police',
      name: 'Bihar Police Constable',
      slug: 'bihar-police',
      full_name: 'Central Selection Board of Constable (CSBC) Bihar Police',
      eligibility: '10+2 (Intermediate) Pass',
      frequency: 'Annual Recruitment',
      conducting_body: 'CSBC Bihar',
      website: 'https://csbc.bih.nic.in',
      desc: 'Written CBT test and physical efficiency evaluation for constable recruits across Bihar Police, Bihar Special Armed Police, and Industrial Security Battalions.',
      is_featured: 1,
      order: 10,
      pattern: JSON.stringify({ total_questions: 100, total_marks: 100, duration_minutes: 120, negative_marking: 0 }),
      syllabus: JSON.stringify({ subjects: ['Hindi', 'English', 'Mathematics', 'History & Civics', 'Geography', 'Physics & Chemistry', 'Current Affairs'] })
    },
    { id: 'exam_jee_adv', cat_id: 'cat_engineering', name: 'JEE Advanced', slug: 'jee-advanced', full_name: 'Joint Entrance Examination (Advanced)', eligibility: 'Top rankers of JEE Main', frequency: 'Annual', conducting_body: 'IITs / JAB', website: 'https://jeeadv.ac.in', desc: 'Elite examination for admission to 23 Indian Institutes of Technology (IITs).', is_featured: 0, order: 11, pattern: '{}', syllabus: '{}' },
    { id: 'exam_sbi_po', cat_id: 'cat_banking', name: 'SBI PO', slug: 'sbi-po', full_name: 'State Bank of India - Probationary Officer', eligibility: 'Graduation', frequency: 'Annual', conducting_body: 'State Bank of India', website: 'https://sbi.co.in/careers', desc: 'Premier banking career entrance for India’s largest public commercial bank.', is_featured: 0, order: 12, pattern: '{}', syllabus: '{}' },
    { id: 'exam_ibps_clerk', cat_id: 'cat_banking', name: 'IBPS Clerk', slug: 'ibps-clerk', full_name: 'IBPS Clerical Cadre Common Recruitment Process', eligibility: 'Graduation', frequency: 'Annual', conducting_body: 'IBPS', website: 'https://ibps.in', desc: 'Direct recruitment of customer service associates in nationalized banks.', is_featured: 0, order: 13, pattern: '{}', syllabus: '{}' },
    { id: 'exam_rrb_group_d', cat_id: 'cat_railway', name: 'RRB Group D (Level 1)', slug: 'rrb-group-d', full_name: 'Railway Track Maintainer & Pointsman Level 1', eligibility: '10th Pass or ITI', frequency: 'Periodic', conducting_body: 'RRB / RRC', website: 'https://indianrailways.gov.in', desc: 'Entry-level recruitment for track maintenance and technical operations.', is_featured: 0, order: 14, pattern: '{}', syllabus: '{}' },
    { id: 'exam_rrb_alp', cat_id: 'cat_railway', name: 'RRB ALP & Technician', slug: 'rrb-alp', full_name: 'Assistant Loco Pilot & Technician Grade III', eligibility: 'Matriculation + ITI / Diploma', frequency: 'Periodic', conducting_body: 'RRBs', website: 'https://indianrailways.gov.in', desc: 'Operational pilot and mechanical electrical railway technicians.', is_featured: 0, order: 15, pattern: '{}', syllabus: '{}' },
    { id: 'exam_ssc_chsl', cat_id: 'cat_ssc', name: 'SSC CHSL', slug: 'ssc-chsl', full_name: 'Combined Higher Secondary Level (10+2)', eligibility: '12th Pass', frequency: 'Annual', conducting_body: 'SSC', website: 'https://ssc.gov.in', desc: 'LDC, Junior Secretariat Assistant, and Data Entry Operators in Central Govt.', is_featured: 0, order: 16, pattern: '{}', syllabus: '{}' },
    { id: 'exam_ssc_gd', cat_id: 'cat_ssc', name: 'SSC GD Constable', slug: 'ssc-gd', full_name: 'General Duty Constable in CAPFs, SSF, Rifleman in Assam Rifles', eligibility: '10th Pass', frequency: 'Annual', conducting_body: 'SSC', website: 'https://ssc.gov.in', desc: 'Paramilitary forces constable recruitment (BSF, CISF, CRPF, ITBP, SSB).', is_featured: 0, order: 17, pattern: '{}', syllabus: '{}' },
    { id: 'exam_upsc_cse', cat_id: 'cat_civil', name: 'UPSC Civil Services', slug: 'upsc-cse', full_name: 'Union Public Service Commission - CSE (Prelims & Mains)', eligibility: 'Graduation', frequency: 'Annual', conducting_body: 'UPSC', website: 'https://upsc.gov.in', desc: 'India’s most prestigious examination for IAS, IPS, IFS, and IRS.', is_featured: 0, order: 18, pattern: '{}', syllabus: '{}' },
    { id: 'exam_nda', cat_id: 'cat_police', name: 'NDA & NA Examination', slug: 'nda', full_name: 'National Defence Academy & Naval Academy Examination', eligibility: '10+2 with PCM for Navy/Air Force', frequency: 'Twice a year', conducting_body: 'UPSC', website: 'https://upsc.gov.in', desc: 'Direct officer commission in Indian Army, Indian Navy, and Indian Air Force.', is_featured: 0, order: 19, pattern: '{}', syllabus: '{}' },
    { id: 'exam_cuet', cat_id: 'cat_school', name: 'CUET UG', slug: 'cuet-ug', full_name: 'Common University Entrance Test (Undergraduate)', eligibility: 'Class 12 Appearing / Passed', frequency: 'Annual', conducting_body: 'NTA', website: 'https://exams.nta.ac.in/CUET-UG', desc: 'Single window admission portal for Delhi University, BHU, JNU, and 200+ Central and State Universities.', is_featured: 0, order: 20, pattern: '{}', syllabus: '{}' },
    { id: 'exam_polytechnic', cat_id: 'cat_engineering', name: 'Bihar Polytechnic (DCECE)', slug: 'bihar-polytechnic', full_name: 'Diploma Certificate Entrance Competitive Examination', eligibility: '10th Pass', frequency: 'Annual', conducting_body: 'BCECEB', website: 'https://bceceboard.bihar.gov.in', desc: 'State entrance for 3-year government polytechnic engineering diploma programs in Bihar.', is_featured: 0, order: 21, pattern: '{}', syllabus: '{}' }
  ];

  const insertExam = db.prepare(`
    INSERT INTO examinations (id, category_id, name, slug, full_name, eligibility, frequency, conducting_body, official_website, description, syllabus_json, pattern_json, is_featured, is_active, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);
  exams.forEach(e => insertExam.run(e.id, e.cat_id, e.name, e.slug, e.full_name, e.eligibility, e.frequency, e.conducting_body, e.website, e.desc, e.syllabus, e.pattern, e.is_featured, e.order));

  // 4. SEED SUBJECTS & CHAPTERS
  const subjectsData = [
    { id: 'sub_stet_pedagogy', exam_id: 'exam_bihar_stet', name: 'Art of Teaching & Pedagogy', code: 'STET-PED', desc: 'Teaching methodologies, learner evaluation, classroom management' },
    { id: 'sub_stet_gk', exam_id: 'exam_bihar_stet', name: 'General Knowledge & Bihar Current Affairs', code: 'STET-GK', desc: 'Bihar history, geography, policies, and national affairs' },
    { id: 'sub_stet_math', exam_id: 'exam_bihar_stet', name: 'Mathematical Aptitude & Reasoning', code: 'STET-MAT', desc: 'Quantitative aptitude, number systems, and logical reasoning' },
    { id: 'sub_bpsc_hist', exam_id: 'exam_bpsc_cce', name: 'History of India & Bihar Special', code: 'BPSC-HIS', desc: 'Ancient, medieval, modern India and Bihar 1857-1947 freedom movement' },
    { id: 'sub_bpsc_polity', exam_id: 'exam_bpsc_cce', name: 'Indian Polity & Governance', code: 'BPSC-POL', desc: 'Constitution of India, Panchayati Raj, fundamental rights, judiciary' },
    { id: 'sub_jee_phy', exam_id: 'exam_jee_main', name: 'Physics', code: 'JEE-PHY', desc: 'Mechanics, electrodynamics, optics, modern physics' },
    { id: 'sub_jee_math', exam_id: 'exam_jee_main', name: 'Mathematics', code: 'JEE-MAT', desc: 'Calculus, algebra, coordinate geometry, vectors' },
    { id: 'sub_neet_bio', exam_id: 'exam_neet_ug', name: 'Biology (Botany & Zoology)', code: 'NEET-BIO', desc: 'Human physiology, genetics, plant physiology, cell biology' },
    { id: 'sub_rrb_math', exam_id: 'exam_rrb_ntpc', name: 'Quantitative Aptitude', code: 'RRB-MAT', desc: 'Arithmetic, algebra, trigonometry, data interpretation' },
    { id: 'sub_ibps_reasoning', exam_id: 'exam_ibps_po', name: 'Reasoning Ability', code: 'IBPS-REA', desc: 'Puzzles, seating arrangement, syllogism, coding decoding' }
  ];

  const insertSubject = db.prepare(`
    INSERT INTO subjects (id, exam_id, name, code, description, display_order)
    VALUES (?, ?, ?, ?, ?, 1)
  `);
  subjectsData.forEach(s => insertSubject.run(s.id, s.exam_id, s.name, s.code, s.desc));

  // 5. SEED QUESTION BANK (40+ Bilingual Questions with Options and Step-by-Step Solutions)
  const questionsData = [
    {
      id: 'q_stet_1',
      exam_id: 'exam_bihar_stet',
      subject_id: 'sub_stet_pedagogy',
      type: 'single_mcq',
      difficulty: 'medium',
      marks: 1.0,
      neg: 0.0,
      q_en: 'According to Jean Piaget’s theory of cognitive development, in which stage does a child develop the ability for abstract propositional thinking and hypothetical deductive reasoning?',
      q_hi: 'जीन पियाजे के संज्ञानात्मक विकास के सिद्धांत के अनुसार, बच्चा किस अवस्था में अमूर्त प्रस्तावपरक चिंतन तथा परिकल्पित निगमनात्मक तर्क विकसित करता है?',
      ans: 'D',
      sol_en: 'The Formal Operational Stage (11 years and above) is characterized by abstract thinking, hypothetical-deductive reasoning, and meta-cognition.',
      sol_hi: 'औपचारिक संक्रियात्मक अवस्था (11 वर्ष और उससे अधिक) की विशेषता अमूर्त सोच, परिकल्पनात्मक-निगमनात्मक तर्क और अमूर्त विचारों को तार्किक रूप से हल करने की क्षमता है।',
      options: [
        { k: 'A', en: 'Sensorimotor Stage (0-2 years)', hi: 'संवेदी-गामक अवस्था (0-2 वर्ष)' },
        { k: 'B', en: 'Pre-operational Stage (2-7 years)', hi: 'पूर्व-संक्रियात्मक अवस्था (2-7 वर्ष)' },
        { k: 'C', en: 'Concrete Operational Stage (7-11 years)', hi: 'मूर्त संक्रियात्मक अवस्था (7-11 वर्ष)' },
        { k: 'D', en: 'Formal Operational Stage (11 years and above)', hi: 'औपचारिक संक्रियात्मक अवस्था (11 वर्ष और उससे अधिक)' }
      ]
    },
    {
      id: 'q_stet_2',
      exam_id: 'exam_bihar_stet',
      subject_id: 'sub_stet_pedagogy',
      type: 'single_mcq',
      difficulty: 'easy',
      marks: 1.0,
      neg: 0.0,
      q_en: 'Which of the following principles forms the core philosophy of National Education Policy (NEP) 2020 regarding school curriculum?',
      q_hi: 'राष्ट्रीय शिक्षा नीति (NEP) 2020 में स्कूली पाठ्यक्रम के संबंध में निम्नलिखित में से कौन सा सिद्धांत मुख्य केंद्र है?',
      ans: 'B',
      sol_en: 'NEP 2020 strongly advocates shifting from rote learning towards conceptual understanding, experiential learning, and critical thinking.',
      sol_hi: 'NEP 2020 रटंत अधिगम से वैचारिक समझ (Conceptual Understanding), अनुभवात्मक शिक्षा और आलोचनात्मक सोच की ओर बदलाव पर विशेष बल देती है।',
      options: [
        { k: 'A', en: 'Promoting rote memorization and rigid textbook learning', hi: 'रटंत स्मृति और कठोर पाठ्यपुस्तकीय अधिगम को बढ़ावा देना' },
        { k: 'B', en: 'Conceptual understanding, critical thinking and experiential learning', hi: 'वैचारिक समझ, आलोचनात्मक चिंतन और अनुभवात्मक अधिगम' },
        { k: 'C', en: 'Evaluation based exclusively on end-of-term summative exams', hi: 'केवल सत्रांत योगात्मक परीक्षाओं पर आधारित मूल्यांकन' },
        { k: 'D', en: 'Segregation of arts and science streams without flexibility', hi: 'कला और विज्ञान संकायों का बिना किसी लचीलेपन के कठोर विभाजन' }
      ]
    },
    {
      id: 'q_stet_3',
      exam_id: 'exam_bihar_stet',
      subject_id: 'sub_stet_gk',
      type: 'single_mcq',
      difficulty: 'medium',
      marks: 1.0,
      neg: 0.0,
      q_en: 'Which ancient university in Bihar was founded during the Gupta Empire by Emperor Kumaragupta I?',
      q_hi: 'बिहार का कौन सा प्राचीन विश्वविद्यालय गुप्त काल में सम्राट कुमारगुप्त प्रथम द्वारा स्थापित किया गया था?',
      ans: 'A',
      sol_en: 'Nalanda Mahavihara was founded by Gupta Emperor Kumaragupta I in the 5th century CE near modern Rajgir/Nalanda.',
      sol_hi: 'नालंदा महाविहार की स्थापना 5वीं शताब्दी ईस्वी में गुप्त सम्राट कुमारगुप्त प्रथम ने आधुनिक राजगीर/नालंदा के समीप की थी।',
      options: [
        { k: 'A', en: 'Nalanda Mahavihara', hi: 'नालंदा महाविहार' },
        { k: 'B', en: 'Vikramashila University', hi: 'विक्रमशिला विश्वविद्यालय' },
        { k: 'C', en: 'Odantapuri University', hi: 'ओदंतपुरी विश्वविद्यालय' },
        { k: 'D', en: 'Telhara Monastery', hi: 'तेलहाड़ा महाविहार' }
      ]
    },
    {
      id: 'q_stet_4',
      exam_id: 'exam_bihar_stet',
      subject_id: 'sub_stet_math',
      type: 'single_mcq',
      difficulty: 'medium',
      marks: 1.0,
      neg: 0.0,
      q_en: 'If a sum of ₹12,000 amounts to ₹14,520 in 2 years compounded annually, what is the annual rate of interest?',
      q_hi: 'यदि ₹12,000 की राशि 2 वर्षों में वार्षिक चक्रवृद्धि ब्याज से ₹14,520 हो जाती है, तो वार्षिक ब्याज दर क्या है?',
      ans: 'C',
      sol_en: 'A = P(1 + r/100)^2 => 14520/12000 = 1.21 => 1 + r/100 = sqrt(1.21) = 1.1 => r = 10%.',
      sol_hi: 'A = P(1 + r/100)^2 => 14520/12000 = 1.21 => 1 + r/100 = 1.1 => r/100 = 0.1 => r = 10% वार्षिक।',
      options: [
        { k: 'A', en: '8% per annum', hi: '8% प्रति वर्ष' },
        { k: 'B', en: '9% per annum', hi: '9% प्रति वर्ष' },
        { k: 'C', en: '10% per annum', hi: '10% प्रति वर्ष' },
        { k: 'D', en: '12% per annum', hi: '12% प्रति वर्ष' }
      ]
    },
    {
      id: 'q_bpsc_1',
      exam_id: 'exam_bpsc_cce',
      subject_id: 'sub_bpsc_hist',
      type: 'single_mcq',
      difficulty: 'hard',
      marks: 1.0,
      neg: 0.33,
      q_en: 'Who led the Revolt of 1857 in Bihar from the Jagdishpur (Bhojpur) region?',
      q_hi: 'बिहार के जगदीशपुर (भोजपुर) क्षेत्र से 1857 के विद्रोह का नेतृत्व किसने किया था?',
      ans: 'B',
      sol_en: 'Veer Kunwar Singh, the octogenarian chieftain of Jagdishpur, led the heroic resistance in Bihar during the 1857 revolt.',
      sol_hi: 'जगदीशपुर के 80 वर्षीय वीर कुंवर सिंह ने 1857 के स्वतंत्रता संग्राम में बिहार में ब्रिटिश हुकूमत के खिलाफ ऐतिहासिक नेतृत्व किया था।',
      options: [
        { k: 'A', en: 'Pir Ali Khan', hi: 'पीर अली खान' },
        { k: 'B', en: 'Veer Kunwar Singh', hi: 'वीर कुंवर सिंह' },
        { k: 'C', en: 'Amar Singh', hi: 'अमर सिंह' },
        { k: 'D', en: 'Maulvi Ahmadullah', hi: 'मौलवी अहमदुल्लाह' }
      ]
    },
    {
      id: 'q_bpsc_2',
      exam_id: 'exam_bpsc_cce',
      subject_id: 'sub_bpsc_polity',
      type: 'single_mcq',
      difficulty: 'medium',
      marks: 1.0,
      neg: 0.33,
      q_en: 'Under which Article of the Indian Constitution is the provision for the establishment of a State Public Service Commission (BPSC) made?',
      q_hi: 'भारतीय संविधान के किस अनुच्छेद के तहत राज्य लोक सेवा आयोग (BPSC) के गठन का प्रावधान किया गया है?',
      ans: 'C',
      sol_en: 'Article 315 of the Constitution of India provides for the establishment of Public Service Commission for the Union and for the States.',
      sol_hi: 'भारतीय संविधान का अनुच्छेद 315 संघ और राज्यों के लिए लोक सेवा आयोगों की स्थापना का प्रावधान करता है।',
      options: [
        { k: 'A', en: 'Article 280', hi: 'अनुच्छेद 280' },
        { k: 'B', en: 'Article 324', hi: 'अनुच्छेद 324' },
        { k: 'C', en: 'Article 315', hi: 'अनुच्छेद 315' },
        { k: 'D', en: 'Article 356', hi: 'अनुच्छेद 356' }
      ]
    },
    {
      id: 'q_jee_1',
      exam_id: 'exam_jee_main',
      subject_id: 'sub_jee_phy',
      type: 'single_mcq',
      difficulty: 'medium',
      marks: 4.0,
      neg: 1.0,
      q_en: 'A particle of mass m moves in a circular orbit of radius r under the influence of an attractive central force F = -k/r^2. What is the total mechanical energy of the particle?',
      q_hi: 'द्रव्यमान m का एक कण एक आकर्षक केंद्रीय बल F = -k/r^2 के प्रभाव में त्रिज्या r की वृत्ताकार कक्षा में गति करता है। कण की कुल यांत्रिक ऊर्जा क्या है?',
      ans: 'B',
      sol_en: 'F = mv^2/r = k/r^2 => mv^2 = k/r. KE = 1/2 mv^2 = k/(2r). Potential energy U = -k/r. Total energy E = KE + U = k/(2r) - k/r = -k/(2r).',
      sol_hi: 'अभिकेंद्रीय बल: mv^2/r = k/r^2 => mv^2 = k/r। गतिज ऊर्जा KE = k/(2r)। स्थितिज ऊर्जा U = -k/r। कुल ऊर्जा E = KE + U = -k/(2r)।',
      options: [
        { k: 'A', en: '-k/r', hi: '-k/r' },
        { k: 'B', en: '-k/(2r)', hi: '-k/(2r)' },
        { k: 'C', en: '+k/(2r)', hi: '+k/(2r)' },
        { k: 'D', en: '0', hi: 'शून्य' }
      ]
    },
    {
      id: 'q_jee_2',
      exam_id: 'exam_jee_main',
      subject_id: 'sub_jee_math',
      type: 'single_mcq',
      difficulty: 'hard',
      marks: 4.0,
      neg: 1.0,
      q_en: 'Evaluate the limit: lim(x -> 0) [ (sin x - x) / x^3 ].',
      q_hi: 'सीमा का मान ज्ञात कीजिए: lim(x -> 0) [ (sin x - x) / x^3 ]।',
      ans: 'A',
      sol_en: 'Using Taylor expansion: sin x = x - x^3/3! + x^5/5! ... Therefore (sin x - x)/x^3 = -1/6 + O(x^2). As x -> 0, the limit is -1/6.',
      sol_hi: 'टेलर श्रेणी प्रसार से: sin x = x - x^3/6 + x^5/120 ... अतः (sin x - x)/x^3 = -1/6 + O(x^2)। जब x -> 0, सीमा का मान -1/6 प्राप्त होता है।',
      options: [
        { k: 'A', en: '-1/6', hi: '-1/6' },
        { k: 'B', en: '1/6', hi: '1/6' },
        { k: 'C', en: '-1/3', hi: '-1/3' },
        { k: 'D', en: '0', hi: '0' }
      ]
    },
    {
      id: 'q_neet_1',
      exam_id: 'exam_neet_ug',
      subject_id: 'sub_neet_bio',
      type: 'single_mcq',
      difficulty: 'easy',
      marks: 4.0,
      neg: 1.0,
      q_en: 'Which cell organelle is known as the "protein factory" of the eukaryotic cell?',
      q_hi: 'यूकेरियोटिक कोशिका के किस कोशिकांग को "प्रोटीन की फैक्ट्री" के रूप में जाना जाता है?',
      ans: 'C',
      sol_en: 'Ribosomes are the cellular machines responsible for translating mRNA into polypeptide chains (proteins).',
      sol_hi: 'राइबोसोम (Ribosomes) को कोशिका की प्रोटीन फैक्ट्री कहा जाता है, जहाँ प्रोटीन संश्लेषण की प्रक्रिया संपन्न होती है।',
      options: [
        { k: 'A', en: 'Mitochondria', hi: 'माइटोकॉन्ड्रिया' },
        { k: 'B', en: 'Golgi Apparatus', hi: 'गॉल्जी काय' },
        { k: 'C', en: 'Ribosome', hi: 'राइबोसोम' },
        { k: 'D', en: 'Lysosome', hi: 'लाइसोसोम' }
      ]
    },
    {
      id: 'q_rrb_1',
      exam_id: 'exam_rrb_ntpc',
      subject_id: 'sub_rrb_math',
      type: 'single_mcq',
      difficulty: 'medium',
      marks: 1.0,
      neg: 0.33,
      q_en: 'A train 180 meters long is travelling at 54 km/h. How many seconds will it take to cross a bridge 120 meters long?',
      q_hi: '180 मीटर लंबी एक रेलगाड़ी 54 किमी/घंटा की गति से चल रही है। 120 मीटर लंबे पुल को पार करने में इसे कितने सेकंड का समय लगेगा?',
      ans: 'B',
      sol_en: 'Speed in m/s = 54 * (5/18) = 15 m/s. Total distance = Train length + Bridge length = 180 + 120 = 300 m. Time = Distance / Speed = 300 / 15 = 20 seconds.',
      sol_hi: 'चाल = 54 * 5/18 = 15 मी/से। कुल दूरी = 180 + 120 = 300 मीटर। समय = 300 / 15 = 20 सेकंड।',
      options: [
        { k: 'A', en: '15 seconds', hi: '15 सेकंड' },
        { k: 'B', en: '20 seconds', hi: '20 सेकंड' },
        { k: 'C', en: '25 seconds', hi: '25 सेकंड' },
        { k: 'D', en: '30 seconds', hi: '30 सेकंड' }
      ]
    }
  ];

  const insertQ = db.prepare(`
    INSERT INTO questions (id, exam_id, subject_id, question_type, difficulty, marks, negative_marks, question_en, question_hi, correct_answer, solution_en, solution_hi, status, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 'usr_admin_1', ?)
  `);

  const insertOpt = db.prepare(`
    INSERT INTO question_options (id, question_id, option_key, option_en, option_hi, is_correct)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  questionsData.forEach(q => {
    insertQ.run(q.id, q.exam_id, q.subject_id, q.type, q.difficulty, q.marks, q.neg, q.q_en, q.q_hi, q.ans, q.sol_en, q.sol_hi, now);
    q.options.forEach(opt => {
      insertOpt.run(`${q.id}_${opt.k}`, q.id, opt.k, opt.en, opt.hi, opt.k === q.ans ? 1 : 0);
    });
  });

  // 6. SEED MOCK TESTS (Full CBT Tests)
  const tests = [
    {
      id: 'test_stet_full_1',
      exam_id: 'exam_bihar_stet',
      title: 'Bihar STET 2026 Paper 1 (Secondary) Full Mock Test 01',
      slug: 'bihar-stet-paper-1-mock-01',
      desc: 'Complete mock test matching exact BSEB STET pattern with bilingual questions, Pedagogy, Art of Teaching, Bihar GK and Aptitude.',
      type: 'full_mock',
      duration: 150,
      total_q: 150,
      total_marks: 150,
      neg: 0.0,
      is_free: 1
    },
    {
      id: 'test_bpsc_pre_1',
      exam_id: 'exam_bpsc_cce',
      title: 'BPSC 71st CCE Prelims Comprehensive General Studies Mock Test 01',
      slug: 'bpsc-71st-prelims-mock-01',
      desc: 'Based on the latest BPSC negative marking pattern (1/3rd negative). Covers Bihar Special, History, Polity, Geography & Science.',
      type: 'full_mock',
      duration: 120,
      total_q: 150,
      total_marks: 150,
      neg: 0.33,
      is_free: 1
    },
    {
      id: 'test_jee_main_1',
      exam_id: 'exam_jee_main',
      title: 'JEE Main 2026 All-India Open Mock Test (Session 1)',
      slug: 'jee-main-2026-open-mock-01',
      desc: 'Full NTA pattern CBT test with Physics, Chemistry, and Mathematics (+4 / -1 marking scheme).',
      type: 'full_mock',
      duration: 180,
      total_q: 90,
      total_marks: 300,
      neg: 1.0,
      is_free: 0
    },
    {
      id: 'test_neet_ug_1',
      exam_id: 'exam_neet_ug',
      title: 'NEET UG 2026 Target 700+ Full Syllabus Mock Test 01',
      slug: 'neet-ug-full-mock-01',
      desc: 'Simulate real NEET test environment with Botany, Zoology, Physics, and Chemistry.',
      type: 'full_mock',
      duration: 200,
      total_q: 200,
      total_marks: 720,
      neg: 1.0,
      is_free: 0
    },
    {
      id: 'test_rrb_ntpc_demo',
      exam_id: 'exam_rrb_ntpc',
      title: 'RRB NTPC Stage-1 CBT Free Practice Test',
      slug: 'rrb-ntpc-stage-1-demo-test',
      desc: 'Speed and accuracy practice for RRB NTPC with instant evaluation and detailed solutions.',
      type: 'sectional',
      duration: 90,
      total_q: 100,
      total_marks: 100,
      neg: 0.33,
      is_free: 1
    }
  ];

  const insertTest = db.prepare(`
    INSERT INTO mock_tests (id, exam_id, title, slug, description, test_type, duration_minutes, total_questions, total_marks, passing_marks, negative_marking, is_free, is_published, review_available, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
  `);

  const insertSection = db.prepare(`
    INSERT INTO test_sections (id, test_id, name, section_order, duration_minutes, total_questions, max_marks)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTestQ = db.prepare(`
    INSERT INTO test_questions (id, test_id, section_id, question_id, question_order, marks, negative_marks)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  tests.forEach(t => {
    insertTest.run(t.id, t.exam_id, t.title, t.slug, t.desc, t.type, t.duration, t.total_q, t.total_marks, t.total_marks * 0.4, t.neg, t.is_free, now);
    
    // Add sections
    const sec1Id = `sec_${t.id}_1`;
    insertSection.run(sec1Id, t.id, 'Section A - Core Subject Knowledge', 1, Math.floor(t.duration * 0.6), 50, t.total_marks * 0.6);
    const sec2Id = `sec_${t.id}_2`;
    insertSection.run(sec2Id, t.id, 'Section B - General Aptitude & Pedagogy', 2, Math.floor(t.duration * 0.4), 25, t.total_marks * 0.4);

    // Link available seeded questions into tests
    questionsData.forEach((q, idx) => {
      insertTestQ.run(`tq_${t.id}_${idx}`, t.id, idx % 2 === 0 ? sec1Id : sec2Id, q.id, idx + 1, q.marks, q.neg);
    });
  });

  // 7. SEED STUDY MATERIALS (Digital Library)
  const materials = [
    {
      id: 'mat_stet_pedagogy',
      exam_id: 'exam_bihar_stet',
      subject_id: 'sub_stet_pedagogy',
      title: 'Art of Teaching & Learning Pedagogy – Complete Revision Guide',
      desc: 'Covers Piaget, Vygotsky, Kohlberg, Bloom Taxonomy, NEP 2020 and inclusive education methodologies.',
      url: '/assets/sample-docs/stet-pedagogy-guide.pdf',
      size: 4.2,
      access: 'free',
      author: 'Prof. R. N. Sinha (Former SCERT Bihar)'
    },
    {
      id: 'mat_bpsc_bihar_special',
      exam_id: 'exam_bpsc_cce',
      subject_id: 'sub_bpsc_hist',
      title: 'Bihar Special GK & Historical Timeline (Ancient Magadha to 1947)',
      desc: 'Crucial for BPSC Prelims & Mains: dynasties, archaeological sites, rivers, soils, and tribal rebellions.',
      url: '/assets/sample-docs/bpsc-bihar-special.pdf',
      size: 6.8,
      access: 'free',
      author: 'CYBEROSH BPSC Research Wing'
    },
    {
      id: 'mat_jee_phy_formulas',
      exam_id: 'exam_jee_main',
      subject_id: 'sub_jee_phy',
      title: 'JEE Main Physics Handbook – High-Yield Formulae & Short Tricks',
      desc: 'All 28 chapters categorized with dimensional analysis, standard graph shapes, and error approximations.',
      url: '/assets/sample-docs/jee-physics-formula-handbook.pdf',
      size: 8.5,
      access: 'premium',
      author: 'Er. S. K. Verma (IIT Kharagpur Alum)'
    },
    {
      id: 'mat_neet_bio_ncert_extract',
      exam_id: 'exam_neet_ug',
      subject_id: 'sub_neet_bio',
      title: 'NEET Biology 100% NCERT Line-by-Line Diagrammatic Notes',
      desc: 'Highlighting every statement from NCERT 11th & 12th tested over the last 10 years in NEET UG.',
      url: '/assets/sample-docs/neet-bio-ncert-extract.pdf',
      size: 11.2,
      access: 'premium',
      author: 'Dr. Ananya Mishra (AIIMS Patna)'
    },
    {
      id: 'mat_rrb_math_shortcuts',
      exam_id: 'exam_rrb_ntpc',
      subject_id: 'sub_rrb_math',
      title: 'Railway & SSC Speed Math Booster: Vedic Math & 50 Shortcut Rules',
      desc: 'Calculate percentages, compound interest, square roots and time-work problems in under 30 seconds.',
      url: '/assets/sample-docs/railway-speed-math.pdf',
      size: 3.1,
      access: 'free',
      author: 'CYBEROSH Quant Team'
    }
  ];

  const insertMaterial = db.prepare(`
    INSERT INTO study_materials (id, exam_id, subject_id, title, description, file_url, file_size_mb, access_level, language, author, downloads_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'both', ?, 428, ?)
  `);
  materials.forEach(m => insertMaterial.run(m.id, m.exam_id, m.subject_id, m.title, m.desc, m.url, m.size, m.access, m.author, now));

  // 8. SEED MODEL PAPERS & PREVIOUS YEAR PAPERS (PYQs)
  const papers = [
    {
      id: 'paper_bpsc_69_pyq',
      exam_id: 'exam_bpsc_cce',
      year: 2024,
      name: 'BPSC 69th Combined Competitive (Preliminary) Official Question Paper',
      duration: 120,
      marks: 150,
      q_count: 150,
      neg: 0.33,
      type: 'pyq',
      pdf: '/assets/sample-docs/bpsc-69-prelims.pdf',
      key: '/assets/sample-docs/bpsc-69-answer-key.pdf'
    },
    {
      id: 'paper_stet_2024_p1',
      exam_id: 'exam_bihar_stet',
      year: 2024,
      name: 'Bihar STET 2024 Paper 1 (Secondary) Official Shift 1 Question Paper',
      duration: 150,
      marks: 150,
      q_count: 150,
      neg: 0.0,
      type: 'pyq',
      pdf: '/assets/sample-docs/stet-2024-p1.pdf',
      key: '/assets/sample-docs/stet-2024-key.pdf'
    },
    {
      id: 'paper_jee_2025_s1',
      exam_id: 'exam_jee_main',
      year: 2025,
      name: 'JEE Main 2025 January Session Official CBT Question Paper with NTA Key',
      duration: 180,
      marks: 300,
      q_count: 90,
      neg: 1.0,
      type: 'pyq',
      pdf: '/assets/sample-docs/jee-main-2025-s1.pdf',
      key: '/assets/sample-docs/jee-main-2025-key.pdf'
    },
    {
      id: 'paper_rrb_ntpc_2023',
      exam_id: 'exam_rrb_ntpc',
      year: 2023,
      name: 'RRB NTPC CBT-1 All-Shifts Solved Model Question Paper Set A',
      duration: 90,
      marks: 100,
      q_count: 100,
      neg: 0.33,
      type: 'model',
      pdf: '/assets/sample-docs/rrb-ntpc-model.pdf',
      key: '/assets/sample-docs/rrb-ntpc-key.pdf'
    }
  ];

  const insertPaper = db.prepare(`
    INSERT INTO model_papers (id, exam_id, year, paper_name, duration_minutes, max_marks, total_questions, negative_marking_ratio, paper_type, pdf_url, answer_key_url, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  papers.forEach(p => insertPaper.run(p.id, p.exam_id, p.year, p.name, p.duration, p.marks, p.q_count, p.neg, p.type, p.pdf, p.key));

  // 9. SEED SUBSCRIPTION PLANS & PRICING
  const plans = [
    {
      id: 'plan_starter_free',
      name: 'Pariksha Starter (Free Demo)',
      code: 'FREE_TRIAL',
      desc: 'Ideal for trying out the CBT platform with demo mock tests and basic PDF notes.',
      price: 0,
      days: 365,
      type: 'all',
      features: JSON.stringify([
        'Access to all Free Demo Mock Tests',
        'Daily GK & Current Affairs Quizzes',
        'Download sample PDF notes and PYQ keys',
        'Basic score breakdown and accuracy report'
      ]),
      is_popular: 0
    },
    {
      id: 'plan_bihar_combo',
      name: 'Bihar State Pariksha Pass',
      code: 'BIHAR_COMBO_PASS',
      desc: 'Complete package for Bihar STET, BPSC TRE 4.0, BPSC CCE, and Bihar Police Constable.',
      price: 149,
      days: 180,
      type: 'category',
      features: JSON.stringify([
        'Unlimited Mock Tests for Bihar STET & BPSC TRE',
        'BPSC 71st Prelims Test Series with detailed solutions',
        'Bihar Special GK + SCERT/NCERT Digital Study Guides',
        'Server-timed CBT environment with NTA interface',
        'State-level percentile and rank benchmarking',
        'Priority Doubt Resolution Support'
      ]),
      is_popular: 1
    },
    {
      id: 'plan_stem_medical',
      name: 'Engineering & Medical Aspirant Pass',
      code: 'STEM_PASS',
      desc: 'Intensive test series and question bank for JEE Main, JEE Advanced and NEET UG 2026.',
      price: 499,
      days: 365,
      type: 'category',
      features: JSON.stringify([
        '50+ Full-Length JEE Main & NEET CBT Mock Tests',
        'Chapter-wise & Sectional topic drills (Physics/Chem/Bio/Math)',
        'Detailed step-by-step video & text solutions in Hindi & English',
        'Weakness detection radar and revision planner',
        'All India Rank (AIR) prediction algorithm'
      ]),
      is_popular: 0
    },
    {
      id: 'plan_all_access_annual',
      name: 'All-India Pariksha Mega Pass (Annual)',
      code: 'ALL_ACCESS_ANNUAL',
      desc: 'Complete unrestricted pass unlocking EVERY examination, test series, question bank, and study note.',
      price: 899,
      days: 365,
      type: 'all',
      features: JSON.stringify([
        'Unrestricted access to all 20+ examination test series',
        'Over 500+ Full-Length & Sectional Mock Tests',
        'Complete digital library of PDF guides & formula books',
        'Unlimited previous year solved question papers',
        'Custom test builder from 25,000+ question bank',
        'Personalized AI learning recommendations & mentor webinars'
      ]),
      is_popular: 0
    }
  ];

  const insertPlan = db.prepare(`
    INSERT INTO subscription_plans (id, name, code, description, price_inr, duration_days, exam_access_type, features_json, is_popular, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  plans.forEach(pl => insertPlan.run(pl.id, pl.name, pl.code, pl.desc, pl.price, pl.days, pl.type, pl.features, pl.is_popular));

  // 10. SEED ACTIVE COUPONS
  const coupons = [
    { code: 'BIHAR50', discount: 50, max: 200, valid: '2027-12-31' },
    { code: 'WELCOME20', discount: 20, max: 150, valid: '2027-12-31' },
    { code: 'STETPASS', discount: 30, max: 100, valid: '2027-12-31' }
  ];

  const insertCoupon = db.prepare(`
    INSERT INTO coupons (id, code, discount_percent, max_discount_inr, valid_until, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);
  coupons.forEach((cp, idx) => insertCoupon.run(`cpn_${idx}`, cp.code, cp.discount, cp.max, cp.valid));

  // 11. SEED CURRENT AFFAIRS & DAILY DIGEST
  const currentAffairsList = [
    {
      id: 'ca_1',
      date: '2026-11-02',
      title: 'Bihar Economic Survey Highlights: Key Infrastructure and Rural Education Initiatives',
      category: 'Bihar State Special',
      summary: 'State budget allocations focus on digitization of secondary schools, expanding STET teacher appointments, and establishing green energy corridors across South Bihar.',
      content: 'The Department of Finance, Government of Bihar, presented the latest comprehensive economic indicators highlighting sustained double-digit growth in tertiary sector services, rural drinking water coverage, and accelerated appointment cycles for primary and secondary school educators via BPSC TRE.',
      source: 'State Directorate of Economics and Statistics, Bihar'
    },
    {
      id: 'ca_2',
      date: '2026-11-01',
      title: 'National Green Hydrogen Mission Achieves Milestone in Clean Energy Transition',
      category: 'National & Environment',
      summary: 'India inaugurates pilot commercial green ammonia production facilities, advancing decarbonization targets for steel and fertilizer sectors.',
      content: 'Under the ambitious National Green Hydrogen Mission spearheaded by the Ministry of New and Renewable Energy, substantial electrolyser manufacturing capacities have gone live with private and public sector consortia, bolstering the nation’s renewable energy independence.',
      source: 'Press Information Bureau (PIB), New Delhi'
    },
    {
      id: 'ca_3',
      date: '2026-10-31',
      title: 'ISRO Announces Launch Schedule for Next-Gen Earth Observation Satellite System',
      category: 'Science & Technology',
      summary: 'PSLV-C62 mission set to deploy advanced synthetic aperture radar payload for real-time agricultural and disaster monitoring.',
      content: 'The Indian Space Research Organisation (ISRO) successfully concluded integrated launcher compatibility tests at Satish Dhawan Space Centre (SDSC) SHAR, Sriharikota, for deployment of high-resolution SAR satellites benefiting disaster management in flood-prone river basins.',
      source: 'ISRO Official Bulletin'
    }
  ];

  const insertCA = db.prepare(`
    INSERT INTO current_affairs (id, date, title, category, summary, content, source, language, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'both', ?)
  `);
  currentAffairsList.forEach(ca => insertCA.run(ca.id, ca.date, ca.title, ca.category, ca.summary, ca.content, ca.source, now));

  // 12. SEED SAMPLE TEST ATTEMPT (for student analytics demo)
  const attemptId = 'att_sample_01';
  db.prepare(`
    INSERT INTO test_attempts (
      id, user_id, test_id, started_at, server_deadline, submitted_at, time_taken_seconds,
      status, total_score, max_marks, accuracy, correct_count, incorrect_count, unattempted_count, percentile, rank, rules_snapshot_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    attemptId,
    'usr_student_1',
    'test_stet_full_1',
    new Date(Date.now() - 3600000).toISOString(),
    new Date(Date.now() + 5400000).toISOString(),
    new Date(Date.now() - 1800000).toISOString(),
    1800,
    'submitted',
    128.0,
    150.0,
    88.5,
    32,
    4,
    4,
    94.2,
    42,
    JSON.stringify({ negative_marking: 0, duration_minutes: 150 })
  );

  // Student answer records
  const insertAns = db.prepare(`
    INSERT INTO student_answers (id, attempt_id, question_id, selected_option, status, time_spent_seconds, is_correct, marks_awarded, saved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAns.run('ans_1', attemptId, 'q_stet_1', 'D', 'answered', 45, 1, 1.0, now);
  insertAns.run('ans_2', attemptId, 'q_stet_2', 'B', 'answered', 38, 1, 1.0, now);
  insertAns.run('ans_3', attemptId, 'q_stet_3', 'A', 'answered', 25, 1, 1.0, now);
  insertAns.run('ans_4', attemptId, 'q_stet_4', 'B', 'answered', 65, 0, 0.0, now); // intentional error for analytics

  // Give student an initial active entitlement for Bihar Pass
  db.prepare(`
    INSERT INTO entitlements (id, user_id, plan_id, exam_id, start_date, end_date, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run('ent_1', 'usr_student_1', 'plan_bihar_combo', 'exam_bihar_stet', now, '2027-11-01T00:00:00.000Z');

  // Insert initial audit log
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('log_init', 'usr_admin_1', 'SYSTEM_INITIALIZATION', 'SYSTEM', 'PARIKSHA_ROOT', JSON.stringify({ seeded: true, exams_count: exams.length }), now);

  console.log(`[CYBEROSH PARIKSHA] Database seeded successfully: ${categories.length} categories, ${exams.length} examinations, ${questionsData.length} questions, ${tests.length} mock tests.`);
}
