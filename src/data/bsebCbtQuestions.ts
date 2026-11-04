import { MockTest, Question } from '../types';

export const bseb12thCsTests: MockTest[] = Array.from({ length: 10 }, (_, i) => {
  const setNum = String(i + 1).padStart(2, '0');
  return {
    id: `test_bseb_12_cs_set_${setNum}`,
    exam_id: 'exam_bseb_12_cs',
    exam_name: 'Bihar Board XII Computer Science',
    category_name: 'School & University Entrance',
    title: `BSEB 12th Computer Science (Theory) - CBT Practice Test (Model Set ${setNum})`,
    slug: `bseb-12th-cs-cbt-practice-set-${setNum}`,
    description: `Official BSEB Class 12 blueprint CBT test for Model Question Set ${setNum}. Covers C++, OOP, Data Structures, DBMS, SQL queries, and Boolean Algebra with instant scoring and complete solutions.`,
    test_type: 'full_mock',
    duration_minutes: 15,
    total_questions: 5,
    total_marks: 5,
    passing_marks: 2,
    negative_marking: 0.0,
    is_free: 1,
    is_published: 1,
    review_available: 1,
    created_at: new Date().toISOString()
  };
});

export const bseb12thCsQuestions: Question[] = [
  // --- SET 01 QUESTIONS ---
  {
    id: 'q_bseb_s1_1',
    test_id: 'test_bseb_12_cs_set_01',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'C++ & OOP',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'What is an object in C++ Object-Oriented Programming?',
    question_hi: 'C++ ऑब्जेक्ट-ओरिएंटेड प्रोग्रामिंग में ऑब्जेक्ट क्या है?',
    correct_answer: 'B',
    solution_en: 'An object is an identifiable entity with characteristics and behavior, representing a real-world runtime instance of a class.',
    solution_hi: 'ऑब्जेक्ट एक क्लास का रन-टाइम इंस्टेंस (उदाहरण) होता है जिसकी अपनी विशेषताएं और व्यवहार होते हैं।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s1_1', option_key: 'A', option_en: 'A variable of primitive data type', option_hi: 'प्राथमिक डेटा प्रकार का एक वेरिएबल' },
      { id: '2', question_id: 'q_bseb_s1_1', option_key: 'B', option_en: 'A runtime instance of a class', option_hi: 'एक क्लास का रन-टाइम इंस्टेंस' },
      { id: '3', question_id: 'q_bseb_s1_1', option_key: 'C', option_en: 'A header file in standard library', option_hi: 'मानक लाइब्रेरी में एक हेडर फ़ाइल' },
      { id: '4', question_id: 'q_bseb_s1_1', option_key: 'D', option_en: 'A preprocessor directive', option_hi: 'एक प्रीप्रोसेसर डायरेक्टिव' }
    ]
  },
  {
    id: 'q_bseb_s1_2',
    test_id: 'test_bseb_12_cs_set_01',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'C++ & OOP',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'By default, the members of a class in C++ are:',
    question_hi: 'डिफ़ॉल्ट रूप से C++ में एक क्लास के सदस्य होते हैं:',
    correct_answer: 'A',
    solution_en: 'In C++, all members of a class are private by default, whereas members of a struct are public by default.',
    solution_hi: 'C++ में क्लास के सभी सदस्य डिफ़ॉल्ट रूप से प्राइवेट (private) होते हैं।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s1_2', option_key: 'A', option_en: 'private', option_hi: 'प्राइवेट (private)' },
      { id: '2', question_id: 'q_bseb_s1_2', option_key: 'B', option_en: 'public', option_hi: 'पब्लिक (public)' },
      { id: '3', question_id: 'q_bseb_s1_2', option_key: 'C', option_en: 'protected', option_hi: 'प्रोटेक्टेड (protected)' },
      { id: '4', question_id: 'q_bseb_s1_2', option_key: 'D', option_en: 'global', option_hi: 'ग्लोबल (global)' }
    ]
  },
  {
    id: 'q_bseb_s1_3',
    test_id: 'test_bseb_12_cs_set_01',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Data Structures',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'A Stack is based on which data structure principle?',
    question_hi: 'स्टैक (Stack) किस डेटा संरचना सिद्धांत पर आधारित है?',
    correct_answer: 'B',
    solution_en: 'Stack follows the LIFO (Last In First Out) principle, where the last element inserted is the first one to be removed.',
    solution_hi: 'स्टैक LIFO (लास्ट इन फर्स्ट आउट) सिद्धांत पर काम करता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s1_3', option_key: 'A', option_en: 'FIFO (First In First Out)', option_hi: 'FIFO (फर्स्ट इन फर्स्ट आउट)' },
      { id: '2', question_id: 'q_bseb_s1_3', option_key: 'B', option_en: 'LIFO (Last In First Out)', option_hi: 'LIFO (लास्ट इन फर्स्ट आउट)' },
      { id: '3', question_id: 'q_bseb_s1_3', option_key: 'C', option_en: 'Random access', option_hi: 'रैंडम एक्सेस' },
      { id: '4', question_id: 'q_bseb_s1_3', option_key: 'D', option_en: 'Round Robin', option_hi: 'राउंड रॉबिन' }
    ]
  },
  {
    id: 'q_bseb_s1_4',
    test_id: 'test_bseb_12_cs_set_01',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'DBMS & SQL',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'In a Relational Database, a single row in a table is called a:',
    question_hi: 'रिलेशनल डेटाबेस में टेबल की एक पंक्ति (row) को क्या कहा जाता है?',
    correct_answer: 'C',
    solution_en: 'A single record or row in a relation/table is called a Tuple.',
    solution_hi: 'रिलेशनल डेटाबेस टेबल की एक पंक्ति को टुपल (Tuple) या रिकॉर्ड कहा जाता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s1_4', option_key: 'A', option_en: 'Attribute', option_hi: 'एट्रिब्यूट (Attribute)' },
      { id: '2', question_id: 'q_bseb_s1_4', option_key: 'B', option_en: 'Domain', option_hi: 'डोमेन (Domain)' },
      { id: '3', question_id: 'q_bseb_s1_4', option_key: 'C', option_en: 'Tuple', option_hi: 'टुपल (Tuple)' },
      { id: '4', question_id: 'q_bseb_s1_4', option_key: 'D', option_en: 'Relation', option_hi: 'रिलेशन (Relation)' }
    ]
  },
  {
    id: 'q_bseb_s1_5',
    test_id: 'test_bseb_12_cs_set_01',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Boolean Algebra',
    question_type: 'single_mcq',
    difficulty: 'medium',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which of the following are universal logic gates?',
    question_hi: 'निम्नलिखित में से कौन से यूनिवर्सल लॉजिक गेट हैं?',
    correct_answer: 'D',
    solution_en: 'NAND and NOR gates are universal gates because any boolean function can be implemented using only NAND or only NOR gates.',
    solution_hi: 'NAND और NOR गेट्स यूनिवर्सल गेट कहलाते हैं क्योंकि इनके द्वारा सभी लॉजिक गेट बनाए जा सकते हैं।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s1_5', option_key: 'A', option_en: 'AND and OR', option_hi: 'AND और OR' },
      { id: '2', question_id: 'q_bseb_s1_5', option_key: 'B', option_en: 'OR and NOT', option_hi: 'OR और NOT' },
      { id: '3', question_id: 'q_bseb_s1_5', option_key: 'C', option_en: 'XOR and XNOR', option_hi: 'XOR और XNOR' },
      { id: '4', question_id: 'q_bseb_s1_5', option_key: 'D', option_en: 'NAND and NOR', option_hi: 'NAND और NOR' }
    ]
  },

  // --- SET 02 QUESTIONS ---
  {
    id: 'q_bseb_s2_1',
    test_id: 'test_bseb_12_cs_set_02',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'C++ & OOP',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which OOP feature facilitates code reusability and hierarchical classification?',
    question_hi: 'OOP की कौन सी विशेषता कोड के पुनः उपयोग और पदानुक्रमिक वर्गीकरण की सुविधा प्रदान करती है?',
    correct_answer: 'C',
    solution_en: 'Inheritance enables a new class to inherit attributes and methods from an existing base class.',
    solution_hi: 'इनहेरिटेंस (Inheritance) कोड पुन: प्रयोज्यता की अनुमति देता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s2_1', option_key: 'A', option_en: 'Encapsulation', option_hi: 'एनकैप्सुलेशन' },
      { id: '2', question_id: 'q_bseb_s2_1', option_key: 'B', option_en: 'Abstraction', option_hi: 'एब्सट्रैक्शन' },
      { id: '3', question_id: 'q_bseb_s2_1', option_key: 'C', option_en: 'Inheritance', option_hi: 'इनहेरिटेंस' },
      { id: '4', question_id: 'q_bseb_s2_1', option_key: 'D', option_en: 'Polymorphism', option_hi: 'पॉलीमॉर्फिज्म' }
    ]
  },
  {
    id: 'q_bseb_s2_2',
    test_id: 'test_bseb_12_cs_set_02',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'C++ & OOP',
    question_type: 'single_mcq',
    difficulty: 'medium',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which operator is used for dynamic memory allocation in C++?',
    question_hi: 'C++ में डायनामिक मेमोरी आवंटन के लिए किस ऑपरेटर का उपयोग किया जाता है?',
    correct_answer: 'A',
    solution_en: 'The "new" operator dynamically allocates memory at runtime on the free store (heap).',
    solution_hi: 'C++ में रनटाइम पर मेमोरी आवंटित करने के लिए "new" ऑपरेटर का उपयोग होता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s2_2', option_key: 'A', option_en: 'new', option_hi: 'new' },
      { id: '2', question_id: 'q_bseb_s2_2', option_key: 'B', option_en: 'malloc()', option_hi: 'malloc()' },
      { id: '3', question_id: 'q_bseb_s2_2', option_key: 'C', option_en: 'alloc', option_hi: 'alloc' },
      { id: '4', question_id: 'q_bseb_s2_2', option_key: 'D', option_en: 'create', option_hi: 'create' }
    ]
  },
  {
    id: 'q_bseb_s2_3',
    test_id: 'test_bseb_12_cs_set_02',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'DBMS & SQL',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which SQL clause is used to filter records in a SELECT query?',
    question_hi: 'SELECT क्वेरी में रिकॉर्ड्स को फ़िल्टर करने के लिए किस SQL क्लॉज का उपयोग किया जाता है?',
    correct_answer: 'B',
    solution_en: 'The WHERE clause specifies search conditions to filter rows returned by a query.',
    solution_hi: 'WHERE क्लॉज का उपयोग दी गई शर्तों के आधार पर पंक्तियों को फ़िल्टर करने के लिए किया जाता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s2_3', option_key: 'A', option_en: 'ORDER BY', option_hi: 'ORDER BY' },
      { id: '2', question_id: 'q_bseb_s2_3', option_key: 'B', option_en: 'WHERE', option_hi: 'WHERE' },
      { id: '3', question_id: 'q_bseb_s2_3', option_key: 'C', option_en: 'GROUP BY', option_hi: 'GROUP BY' },
      { id: '4', question_id: 'q_bseb_s2_3', option_key: 'D', option_en: 'FILTER', option_hi: 'FILTER' }
    ]
  },
  {
    id: 'q_bseb_s2_4',
    test_id: 'test_bseb_12_cs_set_02',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Boolean Algebra',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: "According to De Morgan's first theorem, (A + B)' is equal to:",
    question_hi: "डी मॉर्गन के प्रथम प्रमेय के अनुसार, (A + B)' किसके बराबर होता है?",
    correct_answer: 'B',
    solution_en: "De Morgan's first theorem states that (A + B)' = A' . B'.",
    solution_hi: "डी मॉर्गन का पहला नियम: (A + B)' = A' . B' होता है।",
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s2_4', option_key: 'A', option_en: "A' + B'", option_hi: "A' + B'" },
      { id: '2', question_id: 'q_bseb_s2_4', option_key: 'B', option_en: "A' . B'", option_hi: "A' . B'" },
      { id: '3', question_id: 'q_bseb_s2_4', option_key: 'C', option_en: "A . B", option_hi: "A . B" },
      { id: '4', question_id: 'q_bseb_s2_4', option_key: 'D', option_en: "A + B", option_hi: "A + B" }
    ]
  },
  {
    id: 'q_bseb_s2_5',
    test_id: 'test_bseb_12_cs_set_02',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Networking',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'In which network topology are all devices connected to a central controller or hub?',
    question_hi: 'किस नेटवर्क टोपोलॉजी में सभी उपकरण एक केंद्रीय हब या स्विच से जुड़े होते हैं?',
    correct_answer: 'B',
    solution_en: 'In Star Topology, each device is connected to a central hub, switch, or computer.',
    solution_hi: 'स्टार टोपोलॉजी में सभी नोड्स एक केंद्रीय हब से जुड़े होते हैं।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s2_5', option_key: 'A', option_en: 'Ring Topology', option_hi: 'रिंग टोपोलॉजी' },
      { id: '2', question_id: 'q_bseb_s2_5', option_key: 'B', option_en: 'Star Topology', option_hi: 'स्टार टोपोलॉजी' },
      { id: '3', question_id: 'q_bseb_s2_5', option_key: 'C', option_en: 'Bus Topology', option_hi: 'बस टोपोलॉजी' },
      { id: '4', question_id: 'q_bseb_s2_5', option_key: 'D', option_en: 'Mesh Topology', option_hi: 'मेश टोपोलॉजी' }
    ]
  },

  // --- SET 03 QUESTIONS ---
  {
    id: 'q_bseb_s3_1',
    test_id: 'test_bseb_12_cs_set_03',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Data Structures',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'In a singly linked list, each node contains at least:',
    question_hi: 'सिंगली लिंक्ड लिस्ट में प्रत्येक नोड में कम से कम क्या होता है?',
    correct_answer: 'C',
    solution_en: 'A singly linked list node contains two fields: the data/info field and a pointer (link) to the next node.',
    solution_hi: 'एक नोड में डेटा फ़ील्ड और अगले नोड का पॉइंटर (Next Pointer) होता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s3_1', option_key: 'A', option_en: 'Two data fields only', option_hi: 'केवल दो डेटा फ़ील्ड' },
      { id: '2', question_id: 'q_bseb_s3_1', option_key: 'B', option_en: 'Two address pointers only', option_hi: 'केवल दो एड्रेस पॉइंटर्स' },
      { id: '3', question_id: 'q_bseb_s3_1', option_key: 'C', option_en: 'Data field and next node pointer', option_hi: 'डेटा फ़ील्ड और अगले नोड का पॉइंटर' },
      { id: '4', question_id: 'q_bseb_s3_1', option_key: 'D', option_en: 'Array index and size', option_hi: 'ऐरे इंडेक्स और साइज़' }
    ]
  },
  {
    id: 'q_bseb_s3_2',
    test_id: 'test_bseb_12_cs_set_03',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'DBMS & SQL',
    question_type: 'single_mcq',
    difficulty: 'medium',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'The number of attributes (columns) in a relation is known as its:',
    question_hi: 'एक रिलेशन में एट्रिब्यूट्स (कॉलमों) की कुल संख्या को क्या कहा जाता है?',
    correct_answer: 'A',
    solution_en: 'The degree of a relation is the number of attributes/columns, while cardinality is the number of rows.',
    solution_hi: 'रिलेशन में कॉलमों की संख्या को डिग्री (Degree) और पंक्तियों की संख्या को कार्डिनैलिटी (Cardinality) कहते हैं।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s3_2', option_key: 'A', option_en: 'Degree', option_hi: 'डिग्री (Degree)' },
      { id: '2', question_id: 'q_bseb_s3_2', option_key: 'B', option_en: 'Cardinality', option_hi: 'कार्डिनैलिटी (Cardinality)' },
      { id: '3', question_id: 'q_bseb_s3_2', option_key: 'C', option_en: 'Domain', option_hi: 'डोमेन (Domain)' },
      { id: '4', question_id: 'q_bseb_s3_2', option_key: 'D', option_en: 'Instance', option_hi: 'इंस्टेंस (Instance)' }
    ]
  },
  {
    id: 'q_bseb_s3_3',
    test_id: 'test_bseb_12_cs_set_03',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'C++ & OOP',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which stream class is specifically used for writing data into files in C++?',
    question_hi: 'C++ में फ़ाइल में डेटा लिखने के लिए विशेष रूप से किस स्ट्रीम क्लास का उपयोग किया जाता है?',
    correct_answer: 'B',
    solution_en: 'ofstream (output file stream) is used for writing data to files in C++.',
    solution_hi: 'फ़ाइल में लिखने के लिए ofstream का उपयोग किया जाता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s3_1', option_key: 'A', option_en: 'ifstream', option_hi: 'ifstream' },
      { id: '2', question_id: 'q_bseb_s3_1', option_key: 'B', option_en: 'ofstream', option_hi: 'ofstream' },
      { id: '3', question_id: 'q_bseb_s3_1', option_key: 'C', option_en: 'filebuf', option_hi: 'filebuf' },
      { id: '4', question_id: 'q_bseb_s3_1', option_key: 'D', option_en: 'fout', option_hi: 'fout' }
    ]
  },
  {
    id: 'q_bseb_s3_4',
    test_id: 'test_bseb_12_cs_set_03',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Boolean Algebra',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'A Karnaugh Map (K-Map) for 3 Boolean variables has how many cells?',
    question_hi: '3 बूलियन चरों के लिए कॉर्नो मैप (K-Map) में कितने सेल होते हैं?',
    correct_answer: 'B',
    solution_en: 'The number of cells in a K-Map is 2^n. For n = 3 variables, total cells = 2^3 = 8 cells.',
    solution_hi: 'सेल की संख्या 2^n होती है, 3 चरों के लिए 2^3 = 8 सेल होते हैं।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s3_4', option_key: 'A', option_en: '4', option_hi: '4' },
      { id: '2', question_id: 'q_bseb_s3_4', option_key: 'B', option_en: '8', option_hi: '8' },
      { id: '3', question_id: 'q_bseb_s3_4', option_key: 'C', option_en: '16', option_hi: '16' },
      { id: '4', question_id: 'q_bseb_s3_4', option_key: 'D', option_en: '6', option_hi: '6' }
    ]
  },
  {
    id: 'q_bseb_s3_5',
    test_id: 'test_bseb_12_cs_set_03',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Networking',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'What protocol is standard for sending electronic mail (email) over the Internet?',
    question_hi: 'इंटरनेट पर ईमेल भेजने के लिए कौन सा प्रोटोकॉल मानक है?',
    correct_answer: 'A',
    solution_en: 'SMTP (Simple Mail Transfer Protocol) is used for sending and routing outgoing email messages.',
    solution_hi: 'ईमेल भेजने के लिए SMTP (Simple Mail Transfer Protocol) का उपयोग किया जाता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s3_5', option_key: 'A', option_en: 'SMTP', option_hi: 'SMTP' },
      { id: '2', question_id: 'q_bseb_s3_5', option_key: 'B', option_en: 'HTTP', option_hi: 'HTTP' },
      { id: '3', question_id: 'q_bseb_s3_5', option_key: 'C', option_en: 'FTP', option_hi: 'FTP' },
      { id: '4', question_id: 'q_bseb_s3_5', option_key: 'D', option_en: 'DNS', option_hi: 'DNS' }
    ]
  },

  // --- SET 04 QUESTIONS ---
  {
    id: 'q_bseb_s4_1',
    test_id: 'test_bseb_12_cs_set_04',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'C++ & OOP',
    question_type: 'single_mcq',
    difficulty: 'medium',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which access specifier makes members accessible to derived classes but not to outside functions?',
    question_hi: 'कौन सा एक्सेस विनिर्देशक सदस्यों को व्युत्पन्न (derived) वर्गों के लिए सुलभ बनाता है लेकिन बाहरी कार्यों के लिए नहीं?',
    correct_answer: 'C',
    solution_en: 'The "protected" access specifier permits access to member functions of the same class and derived classes.',
    solution_hi: 'प्रोटेक्टेड (protected) सदस्य समान क्लास और डिराइव्ड क्लास में एक्सेस किए जा सकते हैं।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s4_1', option_key: 'A', option_en: 'private', option_hi: 'प्राइवेट' },
      { id: '2', question_id: 'q_bseb_s4_1', option_key: 'B', option_en: 'public', option_hi: 'पब्लिक' },
      { id: '3', question_id: 'q_bseb_s4_1', option_key: 'C', option_en: 'protected', option_hi: 'प्रोटेक्टेड' },
      { id: '4', question_id: 'q_bseb_s4_1', option_key: 'D', option_en: 'internal', option_hi: 'इंटरनल' }
    ]
  },
  {
    id: 'q_bseb_s4_2',
    test_id: 'test_bseb_12_cs_set_04',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'DBMS & SQL',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which SQL keyword removes duplicate rows from query results?',
    question_hi: 'क्वेरी परिणामों से डुप्लिकेट पंक्तियों को हटाने के लिए किस SQL कीवर्ड का उपयोग किया जाता है?',
    correct_answer: 'A',
    solution_en: 'The DISTINCT keyword ensures only unique values are returned in the result set.',
    solution_hi: 'DISTINCT कीवर्ड डुप्लिकेट परिणामों को हटाकर केवल अद्वितीय मान लौटाता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s4_2', option_key: 'A', option_en: 'DISTINCT', option_hi: 'DISTINCT' },
      { id: '2', question_id: 'q_bseb_s4_2', option_key: 'B', option_en: 'UNIQUE', option_hi: 'UNIQUE' },
      { id: '3', question_id: 'q_bseb_s4_2', option_key: 'C', option_en: 'DIFFERENT', option_hi: 'DIFFERENT' },
      { id: '4', question_id: 'q_bseb_s4_2', option_key: 'D', option_en: 'SEPARATE', option_hi: 'SEPARATE' }
    ]
  },
  {
    id: 'q_bseb_s4_3',
    test_id: 'test_bseb_12_cs_set_04',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Data Structures',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Accessing and processing each element of an array exactly once is known as:',
    question_hi: 'ऐरे के प्रत्येक तत्व को ठीक एक बार एक्सेस और प्रोसेस करने को क्या कहा जाता है?',
    correct_answer: 'B',
    solution_en: 'Traversing means visiting and processing each element of a data structure sequentially.',
    solution_hi: 'प्रत्येक तत्व को एक बार विज़िट करने की प्रक्रिया को ट्रैवर्सल (Traversing) कहते हैं।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s4_3', option_key: 'A', option_en: 'Searching', option_hi: 'सर्चिंग' },
      { id: '2', question_id: 'q_bseb_s4_3', option_key: 'B', option_en: 'Traversing', option_hi: 'ट्रैवर्सिंग' },
      { id: '3', question_id: 'q_bseb_s4_3', option_key: 'C', option_en: 'Sorting', option_hi: 'सॉर्टिंग' },
      { id: '4', question_id: 'q_bseb_s4_3', option_key: 'D', option_en: 'Merging', option_hi: 'मर्जिंग' }
    ]
  },
  {
    id: 'q_bseb_s4_4',
    test_id: 'test_bseb_12_cs_set_04',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Boolean Algebra',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: "According to the Involution Law in Boolean algebra, (A')' is:",
    question_hi: "बूलियन बीजगणित में इनवोल्यूशन नियम के अनुसार, (A')' का मान क्या होता है?",
    correct_answer: 'A',
    solution_en: "The Involution law states that the double complement of a variable returns the original variable: (A')' = A.",
    solution_hi: "डबल कॉम्प्लिमेंट (A')' मूल वेरिएबल A के बराबर होता है।",
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s4_4', option_key: 'A', option_en: 'A', option_hi: 'A' },
      { id: '2', question_id: 'q_bseb_s4_4', option_key: 'B', option_en: "A'", option_hi: "A'" },
      { id: '3', question_id: 'q_bseb_s4_4', option_key: 'C', option_en: '1', option_hi: '1' },
      { id: '4', question_id: 'q_bseb_s4_4', option_key: 'D', option_en: '0', option_hi: '0' }
    ]
  },
  {
    id: 'q_bseb_s4_5',
    test_id: 'test_bseb_12_cs_set_04',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Networking',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'What was the first operational packet-switching computer network?',
    question_hi: 'पहला परिचालन पैकेट-स्विच्ड कंप्यूटर नेटवर्क कौन सा था?',
    correct_answer: 'A',
    solution_en: 'ARPANET (Advanced Research Projects Agency Network) developed in 1969 was the precursor to the modern Internet.',
    solution_hi: 'ARPANET 1969 में विकसित दुनिया का पहला पैकेट-स्विचिंग नेटवर्क था।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s4_5', option_key: 'A', option_en: 'ARPANET', option_hi: 'ARPANET' },
      { id: '2', question_id: 'q_bseb_s4_5', option_key: 'B', option_en: 'NSFNET', option_hi: 'NSFNET' },
      { id: '3', question_id: 'q_bseb_s4_5', option_key: 'C', option_en: 'INTERNET', option_hi: 'INTERNET' },
      { id: '4', question_id: 'q_bseb_s4_5', option_key: 'D', option_en: 'ETHERNET', option_hi: 'ETHERNET' }
    ]
  },

  // --- SET 05 QUESTIONS ---
  {
    id: 'q_bseb_s5_1',
    test_id: 'test_bseb_12_cs_set_05',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'C++ & OOP',
    question_type: 'single_mcq',
    difficulty: 'medium',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'An inheritance where one derived class inherits from two or more base classes is called:',
    question_hi: 'ऐसा इनहेरिटेंस जिसमें एक डिराइव्ड क्लास दो या दो से अधिक बेस क्लासों से इनहेरिट करती है, कहलाता है:',
    correct_answer: 'B',
    solution_en: 'Multiple Inheritance allows a derived class to have multiple direct base classes.',
    solution_hi: 'मल्टीपल इनहेरिटेंस (Multiple Inheritance) में एक चाइल्ड क्लास के एक से अधिक पैरेंट क्लास होते हैं।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s5_1', option_key: 'A', option_en: 'Multilevel Inheritance', option_hi: 'मल्टीलेवल इनहेरिटेंस' },
      { id: '2', question_id: 'q_bseb_s5_1', option_key: 'B', option_en: 'Multiple Inheritance', option_hi: 'मल्टीपल इनहेरिटेंस' },
      { id: '3', question_id: 'q_bseb_s5_1', option_key: 'C', option_en: 'Hierarchical Inheritance', option_hi: 'हाइरार्किकल इनहेरिटेंस' },
      { id: '4', question_id: 'q_bseb_s5_1', option_key: 'D', option_en: 'Single Inheritance', option_hi: 'सिंगल इनहेरिटेंस' }
    ]
  },
  {
    id: 'q_bseb_s5_2',
    test_id: 'test_bseb_12_cs_set_05',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Data Structures',
    question_type: 'single_mcq',
    difficulty: 'medium',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Evaluating the postfix expression "5 3 + 2 *" gives:',
    question_hi: 'पोस्टफिक्स एक्सप्रेशन "5 3 + 2 *" का मूल्यांकन करने पर क्या प्राप्त होता है?',
    correct_answer: 'B',
    solution_en: 'First, 5 and 3 are pushed, then added: 5 + 3 = 8. Next, 2 is pushed. Finally, 8 * 2 = 16.',
    solution_hi: '5 और 3 जुड़कर 8 बनता है, फिर 8 * 2 = 16 परिणाम आता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s5_2', option_key: 'A', option_en: '11', option_hi: '11' },
      { id: '2', question_id: 'q_bseb_s5_2', option_key: 'B', option_en: '16', option_hi: '16' },
      { id: '3', question_id: 'q_bseb_s5_2', option_key: 'C', option_en: '13', option_hi: '13' },
      { id: '4', question_id: 'q_bseb_s5_2', option_key: 'D', option_en: '25', option_hi: '25' }
    ]
  },
  {
    id: 'q_bseb_s5_3',
    test_id: 'test_bseb_12_cs_set_05',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'DBMS & SQL',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which SQL command permanently removes a table along with its structure and data?',
    question_hi: 'कौन सा SQL कमांड किसी टेबल को उसकी संरचना और डेटा सहित पूरी तरह नष्ट कर देता है?',
    correct_answer: 'C',
    solution_en: 'DROP TABLE removes the definition and all data, indices, and constraints for the table.',
    solution_hi: 'DROP TABLE पूरी टेबल और स्कीमा को हमेशा के लिए हटा देता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s5_3', option_key: 'A', option_en: 'DELETE TABLE', option_hi: 'DELETE TABLE' },
      { id: '2', question_id: 'q_bseb_s5_3', option_key: 'B', option_en: 'REMOVE TABLE', option_hi: 'REMOVE TABLE' },
      { id: '3', question_id: 'q_bseb_s5_3', option_key: 'C', option_en: 'DROP TABLE', option_hi: 'DROP TABLE' },
      { id: '4', question_id: 'q_bseb_s5_3', option_key: 'D', option_en: 'TRUNCATE', option_hi: 'TRUNCATE' }
    ]
  },
  {
    id: 'q_bseb_s5_4',
    test_id: 'test_bseb_12_cs_set_05',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Boolean Algebra',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'In a Karnaugh Map, a group of 4 adjacent 1s is called a:',
    question_hi: 'कॉर्नो मैप में 4 आसन्न 1s के समूह को क्या कहा जाता है?',
    correct_answer: 'B',
    solution_en: 'A group of 4 adjacent cells containing 1s in a K-Map is called a Quad and eliminates 2 variables.',
    solution_hi: '4 सेल के समूह को क्वाड (Quad) कहा जाता है जो 2 चरों को समाप्त करता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s5_4', option_key: 'A', option_en: 'Pair', option_hi: 'पेयर (Pair)' },
      { id: '2', question_id: 'q_bseb_s5_4', option_key: 'B', option_en: 'Quad', option_hi: 'क्वाड (Quad)' },
      { id: '3', question_id: 'q_bseb_s5_4', option_key: 'C', option_en: 'Octet', option_hi: 'ऑक्टेट (Octet)' },
      { id: '4', question_id: 'q_bseb_s5_4', option_key: 'D', option_en: 'Single', option_hi: 'सिंगल (Single)' }
    ]
  },
  {
    id: 'q_bseb_s5_5',
    test_id: 'test_bseb_12_cs_set_05',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Networking',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which device is used to connect dissimilar networks that use different protocols?',
    question_hi: 'विभिन्न प्रोटोकॉल का उपयोग करने वाले असमान नेटवर्कों को जोड़ने के लिए किस उपकरण का उपयोग किया जाता है?',
    correct_answer: 'B',
    solution_en: 'A Gateway converts protocols between two completely different network architectures.',
    solution_hi: 'गेटवे (Gateway) विभिन्न आर्किटेक्चर और प्रोटोकॉल वाले नेटवर्कों को जोड़ता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s5_5', option_key: 'A', option_en: 'Repeater', option_hi: 'रिपीटर' },
      { id: '2', question_id: 'q_bseb_s5_5', option_key: 'B', option_en: 'Gateway', option_hi: 'गेटवे' },
      { id: '3', question_id: 'q_bseb_s5_5', option_key: 'C', option_en: 'Hub', option_hi: 'हब' },
      { id: '4', question_id: 'q_bseb_s5_5', option_key: 'D', option_en: 'Bridge', option_hi: 'ब्रिज' }
    ]
  }
];

export const bseb12thCsQuestionsSet6To10: Question[] = [
  // --- SET 06 QUESTIONS ---
  {
    id: 'q_bseb_s6_1',
    test_id: 'test_bseb_12_cs_set_06',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'C++ & OOP',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which OOP concept refers to the act of representing essential features without including background details?',
    question_hi: 'OOP की कौन सी अवधारणा आवश्यक विशेषताओं को बिना पृष्ठभूमि विवरण के प्रदर्शित करने से संबंधित है?',
    correct_answer: 'B',
    solution_en: 'Data Abstraction focuses on what an object does rather than how it works internally.',
    solution_hi: 'डेटा अमूर्तता (Data Abstraction) केवल आवश्यक जानकारी दिखाती है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s6_1', option_key: 'A', option_en: 'Polymorphism', option_hi: 'पॉलीमॉर्फिज्म' },
      { id: '2', question_id: 'q_bseb_s6_1', option_key: 'B', option_en: 'Data Abstraction', option_hi: 'डेटा एब्सट्रैक्शन' },
      { id: '3', question_id: 'q_bseb_s6_1', option_key: 'C', option_en: 'Encapsulation', option_hi: 'एनकैप्सुलेशन' },
      { id: '4', question_id: 'q_bseb_s6_1', option_key: 'D', option_en: 'Inheritance', option_hi: 'इनहेरिटेंस' }
    ]
  },
  {
    id: 'q_bseb_s6_2',
    test_id: 'test_bseb_12_cs_set_06',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Data Structures',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'In a standard Linear Queue, insertion takes place at which end?',
    question_hi: 'एक मानक लीनियर कतार (Queue) में प्रविष्टि (insertion) किस छोर पर होती है?',
    correct_answer: 'B',
    solution_en: 'Insertion is done at the Rear end and deletion is performed from the Front end in a queue.',
    solution_hi: 'क्यू में प्रविष्टि रियर (Rear) छोर पर और निष्कासन फ्रंट (Front) से होता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s6_2', option_key: 'A', option_en: 'Front', option_hi: 'फ्रंट (Front)' },
      { id: '2', question_id: 'q_bseb_s6_2', option_key: 'B', option_en: 'Rear', option_hi: 'रियर (Rear)' },
      { id: '3', question_id: 'q_bseb_s6_2', option_key: 'C', option_en: 'Middle', option_hi: 'मिडिल' },
      { id: '4', question_id: 'q_bseb_s6_2', option_key: 'D', option_en: 'Top', option_hi: 'टॉप' }
    ]
  },
  {
    id: 'q_bseb_s6_3',
    test_id: 'test_bseb_12_cs_set_06',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'DBMS & SQL',
    question_type: 'single_mcq',
    difficulty: 'medium',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which SQL clause is used to filter group results produced by GROUP BY?',
    question_hi: 'GROUP BY द्वारा उत्पादित समूह परिणामों को फ़िल्टर करने के लिए किस SQL क्लॉज का उपयोग किया जाता है?',
    correct_answer: 'C',
    solution_en: 'HAVING sets conditions on aggregate groups, unlike WHERE which filters individual rows.',
    solution_hi: 'समूहों (groups) पर शर्तें लगाने के लिए HAVING क्लॉज का उपयोग किया जाता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s6_3', option_key: 'A', option_en: 'WHERE', option_hi: 'WHERE' },
      { id: '2', question_id: 'q_bseb_s6_3', option_key: 'B', option_en: 'ORDER BY', option_hi: 'ORDER BY' },
      { id: '3', question_id: 'q_bseb_s6_3', option_key: 'C', option_en: 'HAVING', option_hi: 'HAVING' },
      { id: '4', question_id: 'q_bseb_s6_3', option_key: 'D', option_en: 'CHECK', option_hi: 'CHECK' }
    ]
  },
  {
    id: 'q_bseb_s6_4',
    test_id: 'test_bseb_12_cs_set_06',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Boolean Algebra',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'In a 4-variable K-Map, an Octet (group of 8 cells) eliminates how many variables?',
    question_hi: '4-चर K-Map में, एक ऑक्टेट (8 सेल का समूह) कितने चरों को समाप्त करता है?',
    correct_answer: 'C',
    solution_en: 'An octet covers 8 (2^3) cells and therefore eliminates 3 variables.',
    solution_hi: 'ऑक्टेट (8 सेल) 3 चरों को समाप्त करता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s6_4', option_key: 'A', option_en: '1 variable', option_hi: '1 चर' },
      { id: '2', question_id: 'q_bseb_s6_4', option_key: 'B', option_en: '2 variables', option_hi: '2 चर' },
      { id: '3', question_id: 'q_bseb_s6_4', option_key: 'C', option_en: '3 variables', option_hi: '3 चर' },
      { id: '4', question_id: 'q_bseb_s6_4', option_key: 'D', option_en: '4 variables', option_hi: '4 चर' }
    ]
  },
  {
    id: 'q_bseb_s6_5',
    test_id: 'test_bseb_12_cs_set_06',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Networking',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which secure communication protocol is used for encrypted web browsing?',
    question_hi: 'एन्क्रिप्टेड वेब ब्राउजिंग के लिए किस सुरक्षित संचार प्रोटोकॉल का उपयोग किया जाता है?',
    correct_answer: 'B',
    solution_en: 'HTTPS (Hypertext Transfer Protocol Secure) encrypts communications using TLS/SSL.',
    solution_hi: 'HTTPS सुरक्षित और एन्क्रिप्टेड वेब ब्राउज़िंग प्रदान करता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s6_5', option_key: 'A', option_en: 'HTTP', option_hi: 'HTTP' },
      { id: '2', question_id: 'q_bseb_s6_5', option_key: 'B', option_en: 'HTTPS', option_hi: 'HTTPS' },
      { id: '3', question_id: 'q_bseb_s6_5', option_key: 'C', option_en: 'FTP', option_hi: 'FTP' },
      { id: '4', question_id: 'q_bseb_s6_5', option_key: 'D', option_en: 'Telnet', option_hi: 'Telnet' }
    ]
  },

  // --- SET 07 QUESTIONS ---
  {
    id: 'q_bseb_s7_1',
    test_id: 'test_bseb_12_cs_set_07',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'C++ & OOP',
    question_type: 'single_mcq',
    difficulty: 'medium',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'A class containing at least one pure virtual function is known as an:',
    question_hi: 'कम से कम एक प्योर वर्चुअल फ़ंक्शन वाली क्लास को क्या कहा जाता है?',
    correct_answer: 'C',
    solution_en: 'An Abstract Class contains at least one pure virtual function (= 0) and cannot be instantiated directly.',
    solution_hi: 'एब्सट्रैक्ट क्लास (Abstract Class) का सीधा ऑब्जेक्ट नहीं बनाया जा सकता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s7_1', option_key: 'A', option_en: 'Inline Class', option_hi: 'इनलाइन क्लास' },
      { id: '2', question_id: 'q_bseb_s7_1', option_key: 'B', option_en: 'Friend Class', option_hi: 'फ्रेंड क्लास' },
      { id: '3', question_id: 'q_bseb_s7_1', option_key: 'C', option_en: 'Abstract Class', option_hi: 'एब्सट्रैक्ट क्लास' },
      { id: '4', question_id: 'q_bseb_s7_1', option_key: 'D', option_en: 'Static Class', option_hi: 'स्टैटिक क्लास' }
    ]
  },
  {
    id: 'q_bseb_s7_2',
    test_id: 'test_bseb_12_cs_set_07',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'DBMS & SQL',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which SQL command is used to modify existing records in a database table?',
    question_hi: 'डेटाबेस तालिका में मौजूदा रिकॉर्ड को संशोधित करने के लिए किस SQL कमांड का उपयोग किया जाता है?',
    correct_answer: 'B',
    solution_en: 'The UPDATE command modifies existing attribute values in rows of a table.',
    solution_hi: 'मौजूदा डेटा को अपडेट करने के लिए UPDATE कमांड का उपयोग किया जाता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s7_2', option_key: 'A', option_en: 'MODIFY', option_hi: 'MODIFY' },
      { id: '2', question_id: 'q_bseb_s7_2', option_key: 'B', option_en: 'UPDATE', option_hi: 'UPDATE' },
      { id: '3', question_id: 'q_bseb_s7_2', option_key: 'C', option_en: 'ALTER', option_hi: 'ALTER' },
      { id: '4', question_id: 'q_bseb_s7_2', option_key: 'D', option_en: 'CHANGE', option_hi: 'CHANGE' }
    ]
  },
  {
    id: 'q_bseb_s7_3',
    test_id: 'test_bseb_12_cs_set_07',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Data Structures',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which data structure is most suitable for implementing Undo/Redo in a software editor?',
    question_hi: 'सॉफ्टवेयर एडिटर में Undo/Redo लागू करने के लिए कौन सी डेटा संरचना सबसे उपयुक्त है?',
    correct_answer: 'A',
    solution_en: 'A Stack is ideal for Undo/Redo because recent user actions are retrieved in reverse LIFO order.',
    solution_hi: 'हाल ही में की गई क्रियाओं को उलटने के लिए स्टैक (LIFO) सबसे उपयुक्त है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s7_3', option_key: 'A', option_en: 'Stack', option_hi: 'स्टैक (Stack)' },
      { id: '2', question_id: 'q_bseb_s7_3', option_key: 'B', option_en: 'Queue', option_hi: 'क्यू (Queue)' },
      { id: '3', question_id: 'q_bseb_s7_3', option_key: 'C', option_en: 'Binary Tree', option_hi: 'बाइनरी ट्री' },
      { id: '4', question_id: 'q_bseb_s7_3', option_key: 'D', option_en: 'Graph', option_hi: 'ग्राफ़' }
    ]
  },
  {
    id: 'q_bseb_s7_4',
    test_id: 'test_bseb_12_cs_set_07',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Networking',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'The hardware physical address permanently assigned to a Network Interface Card is:',
    question_hi: 'नेटवर्क इंटरफ़ेस कार्ड को स्थायी रूप से सौंपा गया हार्डवेयर भौतिक पता क्या कहलाता है?',
    correct_answer: 'B',
    solution_en: 'The MAC (Media Access Control) address is the unique 48-bit physical identifier of a NIC.',
    solution_hi: 'इसे MAC एड्रेस (Media Access Control) कहा जाता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s7_4', option_key: 'A', option_en: 'IP Address', option_hi: 'आईपी एड्रेस' },
      { id: '2', question_id: 'q_bseb_s7_4', option_key: 'B', option_en: 'MAC Address', option_hi: 'मैक एड्रेस' },
      { id: '3', question_id: 'q_bseb_s7_4', option_key: 'C', option_en: 'Port Number', option_hi: 'पोर्ट नंबर' },
      { id: '4', question_id: 'q_bseb_s7_4', option_key: 'D', option_en: 'URL', option_hi: 'URL' }
    ]
  },
  {
    id: 'q_bseb_s7_5',
    test_id: 'test_bseb_12_cs_set_07',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Boolean Algebra',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: "De Morgan's second theorem states that (A . B)' is equal to:",
    question_hi: "डी मॉर्गन के दूसरे प्रमेय के अनुसार, (A . B)' किसके बराबर होता है?",
    correct_answer: 'B',
    solution_en: "De Morgan's second theorem: (A . B)' = A' + B'.",
    solution_hi: "डी मॉर्गन का दूसरा नियम: (A . B)' = A' + B' होता है।",
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s7_5', option_key: 'A', option_en: "A' . B'", option_hi: "A' . B'" },
      { id: '2', question_id: 'q_bseb_s7_5', option_key: 'B', option_en: "A' + B'", option_hi: "A' + B'" },
      { id: '3', question_id: 'q_bseb_s7_5', option_key: 'C', option_en: 'A + B', option_hi: 'A + B' },
      { id: '4', question_id: 'q_bseb_s7_5', option_key: 'D', option_en: 'A . B', option_hi: 'A . B' }
    ]
  },

  // --- SET 08 QUESTIONS ---
  {
    id: 'q_bseb_s8_1',
    test_id: 'test_bseb_12_cs_set_08',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'C++ & OOP',
    question_type: 'single_mcq',
    difficulty: 'medium',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'A non-member function granted full access to private and protected members of a class is called a:',
    question_hi: 'एक गैर-सदस्यीय फ़ंक्शन जिसे क्लास के प्राइवेट और प्रोटेक्टेड सदस्यों तक पूरी पहुंच दी जाती है, कहलाता है:',
    correct_answer: 'C',
    solution_en: 'A Friend Function is not a member function but has access to private and protected members of the class.',
    solution_hi: 'फ्रेंड फ़ंक्शन (Friend Function) क्लास का सदस्य न होते हुए भी उसके प्राइवेट सदस्यों तक पहुँच सकता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s8_1', option_key: 'A', option_en: 'Virtual function', option_hi: 'वर्चुअल फ़ंक्शन' },
      { id: '2', question_id: 'q_bseb_s8_1', option_key: 'B', option_en: 'Inline function', option_hi: 'इनलाइन फ़ंक्शन' },
      { id: '3', question_id: 'q_bseb_s8_1', option_key: 'C', option_en: 'Friend function', option_hi: 'फ्रेंड फ़ंक्शन' },
      { id: '4', question_id: 'q_bseb_s8_1', option_key: 'D', option_en: 'Static function', option_hi: 'स्टैटिक फ़ंक्शन' }
    ]
  },
  {
    id: 'q_bseb_s8_2',
    test_id: 'test_bseb_12_cs_set_08',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Data Structures',
    question_type: 'single_mcq',
    difficulty: 'medium',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'When a two-dimensional array is stored row by row sequentially in memory, it is called:',
    question_hi: 'जब एक 2-आयामी ऐरे को मेमोरी में पंक्ति-दर-पंक्ति संग्रहीत किया जाता है, तो इसे क्या कहा जाता है?',
    correct_answer: 'A',
    solution_en: 'Row Major Order places elements of row 0 first, followed by row 1, row 2, and so forth in contiguous memory.',
    solution_hi: 'इसे रो मेजर ऑर्डर (Row Major Order) कहा जाता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s8_2', option_key: 'A', option_en: 'Row Major Order', option_hi: 'रो मेजर ऑर्डर' },
      { id: '2', question_id: 'q_bseb_s8_2', option_key: 'B', option_en: 'Column Major Order', option_hi: 'कॉलम मेजर ऑर्डर' },
      { id: '3', question_id: 'q_bseb_s8_2', option_key: 'C', option_en: 'Block Order', option_hi: 'ब्लॉक ऑर्डर' },
      { id: '4', question_id: 'q_bseb_s8_2', option_key: 'D', option_en: 'Random Order', option_hi: 'रैंडम ऑर्डर' }
    ]
  },
  {
    id: 'q_bseb_s8_3',
    test_id: 'test_bseb_12_cs_set_08',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'DBMS & SQL',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which SQL command is used to add a new column or modify the schema of an existing table?',
    question_hi: 'मौजूदा टेबल में नया कॉलम जोड़ने या उसकी संरचना बदलने के लिए किस SQL कमांड का उपयोग किया जाता है?',
    correct_answer: 'B',
    solution_en: 'ALTER TABLE is used to add, delete, or modify columns in an existing table structure.',
    solution_hi: 'ALTER TABLE कमांड टेबल की संरचना में संशोधन करता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s8_3', option_key: 'A', option_en: 'UPDATE', option_hi: 'UPDATE' },
      { id: '2', question_id: 'q_bseb_s8_3', option_key: 'B', option_en: 'ALTER TABLE', option_hi: 'ALTER TABLE' },
      { id: '3', question_id: 'q_bseb_s8_3', option_key: 'C', option_en: 'MODIFY TABLE', option_hi: 'MODIFY TABLE' },
      { id: '4', question_id: 'q_bseb_s8_3', option_key: 'D', option_en: 'INSERT TABLE', option_hi: 'INSERT TABLE' }
    ]
  },
  {
    id: 'q_bseb_s8_4',
    test_id: 'test_bseb_12_cs_set_08',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Networking',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which transmission media carries data as light pulses and is completely immune to electrical noise?',
    question_hi: 'कौन सा ट्रांसमिशन माध्यम डेटा को प्रकाश दालों (light pulses) के रूप में ले जाता है और विद्युत हस्तक्षेप से अप्रभावित रहता है?',
    correct_answer: 'B',
    solution_en: 'Fiber Optic Cable uses light pulses through glass/plastic core and is immune to EMI.',
    solution_hi: 'ऑप्टिकल फाइबर केबल प्रकाश तरंगों का उपयोग करती है और विद्युत शोर से अप्रभावित रहती है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s8_4', option_key: 'A', option_en: 'Coaxial Cable', option_hi: 'कोएक्सिअल केबल' },
      { id: '2', question_id: 'q_bseb_s8_4', option_key: 'B', option_en: 'Optical Fiber Cable', option_hi: 'ऑप्टिकल फाइबर केबल' },
      { id: '3', question_id: 'q_bseb_s8_4', option_key: 'C', option_en: 'Twisted Pair Cable', option_hi: 'ट्विस्टेड पेयर केबल' },
      { id: '4', question_id: 'q_bseb_s8_4', option_key: 'D', option_en: 'Ethernet Cable', option_hi: 'ईथरनेट केबल' }
    ]
  },
  {
    id: 'q_bseb_s8_5',
    test_id: 'test_bseb_12_cs_set_08',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Boolean Algebra',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'What is the output of an XOR logic gate when both inputs are equal to 1?',
    question_hi: 'जब दोनों इनपुट 1 के बराबर हों, तो XOR लॉजिक गेट का आउटपुट क्या होता है?',
    correct_answer: 'B',
    solution_en: 'An XOR gate outputs 1 only when inputs differ. When both inputs are 1 (equal), output is 0.',
    solution_hi: 'समान इनपुट (1, 1) पर XOR गेट का आउटपुट 0 होता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s8_5', option_key: 'A', option_en: '1', option_hi: '1' },
      { id: '2', question_id: 'q_bseb_s8_5', option_key: 'B', option_en: '0', option_hi: '0' },
      { id: '3', question_id: 'q_bseb_s8_5', option_key: 'C', option_en: 'Indeterminate', option_hi: 'अनिश्चित' },
      { id: '4', question_id: 'q_bseb_s8_5', option_key: 'D', option_en: '-1', option_hi: '-1' }
    ]
  },

  // --- SET 09 QUESTIONS ---
  {
    id: 'q_bseb_s9_1',
    test_id: 'test_bseb_12_cs_set_09',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'C++ & OOP',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'How many arguments can a C++ class destructor accept?',
    question_hi: 'C++ क्लास डिस्ट्रक्टर कितने तर्क (arguments) स्वीकार कर सकता है?',
    correct_answer: 'A',
    solution_en: 'A destructor takes no parameters and has no return value.',
    solution_hi: 'डिस्ट्रक्टर कोई तर्क (argument) नहीं लेता है (शून्य तर्क)।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s9_1', option_key: 'A', option_en: 'Zero arguments', option_hi: 'शून्य (0)' },
      { id: '2', question_id: 'q_bseb_s9_1', option_key: 'B', option_en: 'One argument', option_hi: 'एक (1)' },
      { id: '3', question_id: 'q_bseb_s9_1', option_key: 'C', option_en: 'Two arguments', option_hi: 'दो (2)' },
      { id: '4', question_id: 'q_bseb_s9_1', option_key: 'D', option_en: 'Any number', option_hi: 'कितने भी' }
    ]
  },
  {
    id: 'q_bseb_s9_2',
    test_id: 'test_bseb_12_cs_set_09',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'DBMS & SQL',
    question_type: 'single_mcq',
    difficulty: 'medium',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which SQL command rapidly deletes all rows from a table without individual row logging?',
    question_hi: 'कौन सा SQL कमांड बिना अलग-अलग पंक्ति लॉगिंग के टेबल की सभी पंक्तियों को तेजी से हटा देता है?',
    correct_answer: 'C',
    solution_en: 'TRUNCATE TABLE removes all rows immediately and resets identity counters without logging individual row deletions.',
    solution_hi: 'TRUNCATE TABLE सभी डेटा को तुरंत खाली कर देता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s9_2', option_key: 'A', option_en: 'DELETE', option_hi: 'DELETE' },
      { id: '2', question_id: 'q_bseb_s9_2', option_key: 'B', option_en: 'REMOVE ALL', option_hi: 'REMOVE ALL' },
      { id: '3', question_id: 'q_bseb_s9_2', option_key: 'C', option_en: 'TRUNCATE TABLE', option_hi: 'TRUNCATE TABLE' },
      { id: '4', question_id: 'q_bseb_s9_2', option_key: 'D', option_en: 'CLEAR TABLE', option_hi: 'CLEAR TABLE' }
    ]
  },
  {
    id: 'q_bseb_s9_3',
    test_id: 'test_bseb_12_cs_set_09',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Boolean Algebra',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'According to the Idempotent Law in Boolean algebra, A . A is equal to:',
    question_hi: 'बूलियन बीजगणित में आइडेम्पोटेंट नियम के अनुसार, A . A का मान किसके बराबर होता है?',
    correct_answer: 'A',
    solution_en: 'The idempotent law states that A . A = A and A + A = A.',
    solution_hi: 'आइडेम्पोटेंट नियम के अनुसार A . A = A होता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s9_3', option_key: 'A', option_en: 'A', option_hi: 'A' },
      { id: '2', question_id: 'q_bseb_s9_3', option_key: 'B', option_en: '1', option_hi: '1' },
      { id: '3', question_id: 'q_bseb_s9_3', option_key: 'C', option_en: '0', option_hi: '0' },
      { id: '4', question_id: 'q_bseb_s9_3', option_key: 'D', option_en: '2A', option_hi: '2A' }
    ]
  },
  {
    id: 'q_bseb_s9_4',
    test_id: 'test_bseb_12_cs_set_09',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Networking',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'A network that spans a large geographical area across cities, states or continents is called a:',
    question_hi: 'शहरों, राज्यों या देशों में फैले एक बड़े भौगोलिक क्षेत्र वाले नेटवर्क को क्या कहा जाता है?',
    correct_answer: 'C',
    solution_en: 'WAN (Wide Area Network) connects computers across large distances and global scales.',
    solution_hi: 'विस्तृत भौगोलिक क्षेत्र वाले नेटवर्क को WAN (Wide Area Network) कहा जाता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s9_4', option_key: 'A', option_en: 'LAN', option_hi: 'LAN' },
      { id: '2', question_id: 'q_bseb_s9_4', option_key: 'B', option_en: 'MAN', option_hi: 'MAN' },
      { id: '3', question_id: 'q_bseb_s9_4', option_key: 'C', option_en: 'WAN', option_hi: 'WAN' },
      { id: '4', question_id: 'q_bseb_s9_4', option_key: 'D', option_en: 'PAN', option_hi: 'PAN' }
    ]
  },
  {
    id: 'q_bseb_s9_5',
    test_id: 'test_bseb_12_cs_set_09',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Networking',
    question_type: 'single_mcq',
    difficulty: 'medium',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'At which layer of the OSI model does a Network Switch primarily operate?',
    question_hi: 'OSI मॉडल की किस परत पर एक नेटवर्क स्विच मुख्य रूप से काम करता है?',
    correct_answer: 'B',
    solution_en: 'A standard network switch operates at the Data Link Layer (Layer 2) using MAC addresses.',
    solution_hi: 'नेटवर्क स्विच डेटा लिंक लेयर (Layer 2) पर कार्य करता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s9_5', option_key: 'A', option_en: 'Physical Layer', option_hi: 'फिजिकल लेयर' },
      { id: '2', question_id: 'q_bseb_s9_5', option_key: 'B', option_en: 'Data Link Layer', option_hi: 'डेटा लिंक लेयर' },
      { id: '3', question_id: 'q_bseb_s9_5', option_key: 'C', option_en: 'Network Layer', option_hi: 'नेटवर्क लेयर' },
      { id: '4', question_id: 'q_bseb_s9_5', option_key: 'D', option_en: 'Transport Layer', option_hi: 'ट्रांसपोर्ट लेयर' }
    ]
  },

  // --- SET 10 QUESTIONS ---
  {
    id: 'q_bseb_s10_1',
    test_id: 'test_bseb_12_cs_set_10',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'C++ & OOP',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'What is the minimum memory size allocated to an empty class in C++?',
    question_hi: 'C++ में एक खाली क्लास को आवंटित न्यूनतम मेमोरी आकार क्या होता है?',
    correct_answer: 'B',
    solution_en: 'In C++, an empty class has a minimum size of 1 byte to ensure different object instances have distinct addresses.',
    solution_hi: 'C++ में एक खाली क्लास का आकार कम से कम 1 बाइट (1 byte) होता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s10_1', option_key: 'A', option_en: '0 bytes', option_hi: '0 बाइट' },
      { id: '2', question_id: 'q_bseb_s10_1', option_key: 'B', option_en: '1 byte', option_hi: '1 बाइट' },
      { id: '3', question_id: 'q_bseb_s10_1', option_key: 'C', option_en: '2 bytes', option_hi: '2 बाइट' },
      { id: '4', question_id: 'q_bseb_s10_1', option_key: 'D', option_en: '4 bytes', option_hi: '4 बाइट' }
    ]
  },
  {
    id: 'q_bseb_s10_2',
    test_id: 'test_bseb_12_cs_set_10',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Data Structures',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Attempting to insert an element into an already full Stack causes:',
    question_hi: 'पहले से भरे हुए स्टैक में एक तत्व सम्मिलित करने का प्रयास करने पर क्या होता है?',
    correct_answer: 'B',
    solution_en: 'Stack Overflow occurs when PUSH is executed on a stack that has reached maximum capacity.',
    solution_hi: 'भरे हुए स्टैक में प्रविष्टि करने से स्टैक ओवरफ्लो (Stack Overflow) होता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s10_2', option_key: 'A', option_en: 'Underflow', option_hi: 'अंडरफ्लो' },
      { id: '2', question_id: 'q_bseb_s10_2', option_key: 'B', option_en: 'Overflow', option_hi: 'ओवरफ्लो' },
      { id: '3', question_id: 'q_bseb_s10_2', option_key: 'C', option_en: 'Deadlock', option_hi: 'डेडलोक' },
      { id: '4', question_id: 'q_bseb_s10_2', option_key: 'D', option_en: 'Syntax Error', option_hi: 'सिंटैक्स त्रुटि' }
    ]
  },
  {
    id: 'q_bseb_s10_3',
    test_id: 'test_bseb_12_cs_set_10',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'DBMS & SQL',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which SQL operator is used to test whether a value matches any value in a designated list?',
    question_hi: 'यह जांचने के लिए किस SQL ऑपरेटर का उपयोग किया जाता है कि क्या कोई मान निर्दिष्ट सूची में किसी मान से मेल खाता है?',
    correct_answer: 'B',
    solution_en: 'The IN operator allows you to specify multiple values in a WHERE clause.',
    solution_hi: 'सूची में तुलना करने के लिए IN ऑपरेटर का उपयोग किया जाता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s10_3', option_key: 'A', option_en: 'BETWEEN', option_hi: 'BETWEEN' },
      { id: '2', question_id: 'q_bseb_s10_3', option_key: 'B', option_en: 'IN', option_hi: 'IN' },
      { id: '3', question_id: 'q_bseb_s10_3', option_key: 'C', option_en: 'EXISTS', option_hi: 'EXISTS' },
      { id: '4', question_id: 'q_bseb_s10_3', option_key: 'D', option_en: 'LIKE', option_hi: 'LIKE' }
    ]
  },
  {
    id: 'q_bseb_s10_4',
    test_id: 'test_bseb_12_cs_set_10',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Networking',
    question_type: 'single_mcq',
    difficulty: 'medium',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'Which OSI model layer is responsible for logical routing of packets across networks?',
    question_hi: 'नेटवर्क में पैकेटों के तार्किक रूटिंग के लिए OSI मॉडल की कौन सी परत जिम्मेदार है?',
    correct_answer: 'C',
    solution_en: 'The Network Layer (Layer 3) handles IP addressing, routing, and packet forwarding.',
    solution_hi: 'नेटवर्क लेयर (Layer 3) पैकेट रूटिंग और आईपी एड्रेसिंग का प्रबंधन करती है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s10_4', option_key: 'A', option_en: 'Physical Layer', option_hi: 'फिजिकल लेयर' },
      { id: '2', question_id: 'q_bseb_s10_4', option_key: 'B', option_en: 'Data Link Layer', option_hi: 'डेटा लिंक लेयर' },
      { id: '3', question_id: 'q_bseb_s10_4', option_key: 'C', option_en: 'Network Layer', option_hi: 'नेटवर्क लेयर' },
      { id: '4', question_id: 'q_bseb_s10_4', option_key: 'D', option_en: 'Application Layer', option_hi: 'एप्लीकेशन लेयर' }
    ]
  },
  {
    id: 'q_bseb_s10_5',
    test_id: 'test_bseb_12_cs_set_10',
    exam_id: 'exam_bseb_12_cs',
    subject_name: 'Networking',
    question_type: 'single_mcq',
    difficulty: 'easy',
    marks: 1.0,
    negative_marks: 0.0,
    question_en: 'A small text file saved on the client machine by a web server to store state and user preferences is a:',
    question_hi: 'उपयोगकर्ता प्राथमिकताओं को संग्रहीत करने के लिए वेब सर्वर द्वारा क्लाइंट मशीन पर सहेजी गई एक छोटी टेक्स्ट फ़ाइल क्या है?',
    correct_answer: 'B',
    solution_en: 'A Cookie is a small piece of data stored in the user browser by web servers.',
    solution_hi: 'इसे कुकी (Cookie) कहा जाता है।',
    status: 'published',
    options: [
      { id: '1', question_id: 'q_bseb_s10_5', option_key: 'A', option_en: 'Cache', option_hi: 'कैश (Cache)' },
      { id: '2', question_id: 'q_bseb_s10_5', option_key: 'B', option_en: 'Cookie', option_hi: 'कुकी (Cookie)' },
      { id: '3', question_id: 'q_bseb_s10_5', option_key: 'C', option_en: 'Firewall', option_hi: 'फ़ायरवॉल' },
      { id: '4', question_id: 'q_bseb_s10_5', option_key: 'D', option_en: 'Plug-in', option_hi: 'प्लग-इन' }
    ]
  }
];

export const allBsebQuestions: Question[] = [
  ...bseb12thCsQuestions,
  ...bseb12thCsQuestionsSet6To10
];
