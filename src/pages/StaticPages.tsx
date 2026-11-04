import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Phone, MapPin, Award, BookOpen, AlertCircle, FileText } from 'lucide-react';

interface StaticPageProps {
  page: 'about' | 'blog' | 'contact' | 'terms' | 'privacy' | 'refund' | 'disclaimer';
  onNavigate: (view: string, param?: string) => void;
}

export const StaticPages: React.FC<StaticPageProps> = ({ page, onNavigate }) => {
  const { t } = useAuth();

  if (page === 'about') {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-slate-800">
          <div className="border-b border-slate-100 pb-6">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">About CYBEROSH PARIKSHA</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Prepare Smart. Practice More. Succeed.
            </h1>
          </div>

          <p className="text-sm sm:text-base leading-relaxed text-slate-700">
            CYBEROSH PARIKSHA is India’s premier centralized competitive examination preparation ecosystem, developed to bridge the digital and educational divide for students across Bihar and throughout India.
          </p>

          <h3 className="text-lg font-bold text-slate-900 pt-2">Our Core Mission</h3>
          <p className="text-sm leading-relaxed text-slate-600">
            For decades, competitive aspirants from tier-2 and rural regions struggled with lack of authentic computer-based testing (CBT) infrastructure, quality bilingual notes, and transparent evaluation. CYBEROSH PARIKSHA delivers authentic server-timed examination environments matching NTA, BSEB and TCS-iON standards, accessible from any browser or mobile phone.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 text-sm block mb-1">Authentic CBT Engine</span>
              <p className="text-xs text-slate-500">True server-side timer, negative marking deductions, and rank benchmarking.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 text-sm block mb-1">Bihar Special Focus</span>
              <p className="text-xs text-slate-500">Deep coverage of Bihar STET, BPSC TRE, BPSC CCE, and Bihar Police.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 text-sm block mb-1">Bilingual Education</span>
              <p className="text-xs text-slate-500">Instant toggle between Hindi and English across all questions and answers.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'contact') {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">Get in Touch</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Student Support & Academic Campus</h1>
          </div>

          <p className="text-sm text-slate-600">
            Our academic counselors and technical support engineers are available Monday through Saturday from 9:00 AM to 7:00 PM IST to assist with examination preparation, mock tests, and pass activations.
          </p>

          <div className="space-y-4 pt-2 text-sm text-slate-700">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Headquarters & Academic Center</span>
                <span>CYBEROSH Academic Tower, Bailey Road, Patna, Bihar 800001, India</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <Mail className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Student Support Email</span>
                <a href="mailto:support@cyberoshpariksha.in" className="text-blue-600 hover:underline">
                  support@cyberoshpariksha.in
                </a>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <Phone className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Helpline Numbers</span>
                <span>+91 98765 43210 / +91 91234 56789</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'blog') {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900">Preparation Strategy & Articles</h1>
            <p className="text-sm text-slate-600">Expert guidance from top rankers and educators for competitive examinations.</p>
          </div>

          <div className="space-y-6">
            <article className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700">Bihar STET Strategy</span>
              <h2 className="text-lg font-bold text-slate-900">How to Master Pedagogy & Art of Teaching for Bihar STET 2026</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                A structured breakdown of the 50-mark general aptitude and pedagogy section. Learn how Piaget, Kohlberg, and NEP 2020 frameworks appear in recent BSEB examination trends.
              </p>
            </article>

            <article className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">BPSC 71st Prelims</span>
              <h2 className="text-lg font-bold text-slate-900">Tackling 1/3rd Negative Marking in BPSC Combined Competitive Exam</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strategic elimination techniques and risk-to-reward ratios for the updated BPSC negative marking format to ensure qualification past the preliminary cutoff.
              </p>
            </article>
          </div>
        </div>
      </div>
    );
  }

  // Legal Pages
  const titles = {
    terms: 'Terms and Conditions',
    privacy: 'Privacy Policy',
    refund: 'Refund & Cancellation Policy',
    disclaimer: 'Content Disclaimer & Non-Affiliation'
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">{titles[page]}</h1>

        {page === 'terms' && (
          <>
            <p>Welcome to CYBEROSH PARIKSHA. By registering for or using our website, mock test engine, and digital educational notes, you agree to comply with and be bound by the following terms.</p>
            <h4 className="font-bold text-slate-900 text-sm pt-2">1. Account Security & Prohibited Activities</h4>
            <p>Each student account is for individual preparation. Sharing login credentials, unauthorized scraping of question banks, or reverse-engineering the CBT engine will result in immediate suspension without refund.</p>
            <h4 className="font-bold text-slate-900 text-sm pt-2">2. Intellectual Property</h4>
            <p>All model questions, pedagogical solutions, original study guides, and layout assets are copyrighted by CYBEROSH PARIKSHA and its contributing faculties.</p>
          </>
        )}

        {page === 'privacy' && (
          <>
            <p>Your privacy is paramount. CYBEROSH PARIKSHA adheres to strict data protection standards and does not sell or share student personal information with unauthorized third parties.</p>
            <h4 className="font-bold text-slate-900 text-sm pt-2">Information Collected</h4>
            <p>We collect your email, full name, selected target examination, and mock test responses solely to calculate personalized analytics and monitor preparation streaks.</p>
            <h4 className="font-bold text-slate-900 text-sm pt-2">Payment Security</h4>
            <p>We do not store your credit card or UPI credentials on our servers. All transactions are processed securely through Razorpay using industry-standard 256-bit encryption.</p>
          </>
        )}

        {page === 'refund' && (
          <>
            <p>We strive to deliver the highest standard of examination preparation products.</p>
            <h4 className="font-bold text-slate-900 text-sm pt-2">Digital Pass Cancellation Policy</h4>
            <p>If you experience any technical defect preventing access to mock tests or purchased study handbooks, you may request a refund within 48 hours of purchase by contacting support@cyberoshpariksha.in with your order ID.</p>
            <p>Approved refunds are credited to the original payment method within 5-7 business days.</p>
          </>
        )}

        {page === 'disclaimer' && (
          <>
            <p>CYBEROSH PARIKSHA is an independent EdTech platform developed by CYBEROSH to facilitate examination preparation.</p>
            <h4 className="font-bold text-slate-900 text-sm pt-2">Non-Affiliation Notice</h4>
            <p>CYBEROSH PARIKSHA is not affiliated with, authorized, or endorsed by the Bihar School Examination Board (BSEB), Bihar Public Service Commission (BPSC), National Testing Agency (NTA), Central Board of Secondary Education (CBSE), or the Ministry of Railways.</p>
            <p>Official examination notifications, admit cards, and final recruitments are conducted exclusively by the respective statutory bodies. Our mock papers represent practice simulations and do not guarantee selection or identical questions in the actual examination.</p>
          </>
        )}
      </div>
    </div>
  );
};
