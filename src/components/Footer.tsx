import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ShieldCheck, Mail, Phone, MapPin, ExternalLink, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t } = useAuth();

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <GraduationCap className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <span className="font-extrabold text-xl text-white tracking-tight">CYBEROSH</span>{' '}
                <span className="font-extrabold text-xl text-amber-400 tracking-tight">PARIKSHA</span>
              </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-sm">
              {t(
                'India’s premier online examination preparation ecosystem. Empowering aspirants from Bihar and across India for Teaching, Civil Services, Engineering, Medical, Banking, Railway, and SSC examinations with authentic CBT mock tests and digital study materials.',
                'भारत का अग्रणी ऑनलाइन परीक्षा तैयारी इकोसिस्टम। बिहार और पूरे भारत के छात्रों को प्रामाणिक CBT मॉक टेस्ट, पिछले वर्षों के प्रश्नपत्र और डिजिटल अध्ययन सामग्री के साथ सशक्त बनाना।'
              )}
            </p>

            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>CYBEROSH Academic Tower, Bailey Road, Patna, Bihar 800001</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a href="mailto:support@cyberoshpariksha.in" className="hover:text-amber-400 transition-colors">
                  support@cyberoshpariksha.in
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Student Support Helpline: +91 98765 43210 (9 AM - 7 PM)</span>
              </div>
            </div>
          </div>

          {/* Popular Exams Column */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              {t('Bihar & State Exams', 'बिहार व राज्य परीक्षाएं')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('exam-detail', 'bihar-stet')} className="hover:text-amber-400 transition-colors text-left">
                  Bihar STET Paper 1 & 2
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('exam-detail', 'bihar-bpsc-tre')} className="hover:text-amber-400 transition-colors text-left">
                  BPSC School Teacher (TRE 4.0)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('exam-detail', 'bpsc')} className="hover:text-amber-400 transition-colors text-left">
                  BPSC 71st Combined Prelims
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('exam-detail', 'bihar-police')} className="hover:text-amber-400 transition-colors text-left">
                  Bihar Police Constable & SI
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('exam-detail', 'bihar-polytechnic')} className="hover:text-amber-400 transition-colors text-left">
                  Bihar Polytechnic (DCECE)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('exam-detail', 'ctet')} className="hover:text-amber-400 transition-colors text-left">
                  CTET Central Teacher Test
                </button>
              </li>
            </ul>
          </div>

          {/* All-India National Exams Column */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              {t('National Competitive', 'राष्ट्रीय प्रतियोगी परीक्षाएं')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('exam-detail', 'jee-main')} className="hover:text-amber-400 transition-colors text-left">
                  JEE Main 2026 Test Series
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('exam-detail', 'neet-ug')} className="hover:text-amber-400 transition-colors text-left">
                  NEET UG Medical Mock Tests
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('exam-detail', 'rrb-ntpc')} className="hover:text-amber-400 transition-colors text-left">
                  RRB NTPC & Group D CBT
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('exam-detail', 'ibps-po')} className="hover:text-amber-400 transition-colors text-left">
                  IBPS & SBI Probationary Officer
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('exam-detail', 'ssc-cgl')} className="hover:text-amber-400 transition-colors text-left">
                  SSC CGL & CHSL (Tier 1 & 2)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('exam-detail', 'nda')} className="hover:text-amber-400 transition-colors text-left">
                  NDA & Defence Services
                </button>
              </li>
            </ul>
          </div>

          {/* Platform & Legal Column */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              {t('Platform & Legal', 'मंच व नीतियां')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-amber-400 transition-colors text-left">
                  {t('About Us', 'हमारे बारे में')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('pricing')} className="hover:text-amber-400 transition-colors text-left">
                  {t('Pricing & Preparation Passes', 'पास व शुल्क')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('blog')} className="hover:text-amber-400 transition-colors text-left">
                  {t('Preparation Blog & Strategy', 'रणनीति व ब्लॉग')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-amber-400 transition-colors text-left">
                  {t('Terms and Conditions', 'नियम और शर्तें')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-amber-400 transition-colors text-left">
                  {t('Privacy Policy', 'गोपनीयता नीति')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('refund')} className="hover:text-amber-400 transition-colors text-left">
                  {t('Refund & Cancellation Policy', 'वापसी नीति')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('disclaimer')} className="hover:text-amber-400 transition-colors text-left">
                  {t('Content Disclaimer', 'सामग्री अस्वीकरण')}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-400">
            &copy; {new Date().getFullYear()} CYBEROSH PARIKSHA. {t('All Rights Reserved. An EdTech Initiative of CYBEROSH.', 'सर्वाधिकार सुरक्षित। साइबरोश की एक एडटेक पहल।')}
          </p>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t('Server-Authoritative CBT Protected', 'सर्वर-प्रमाणित सुरक्षित CBT')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
