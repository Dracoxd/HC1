import React from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { MapPin, Clock, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t, language, setActiveSection } = useHealthCenter();

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Col 1: Wordmark & Catchment */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <div className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                +
              </div>
              <span>Mr. Flores Health Center</span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              {t.footerDescription}
            </p>

            <div className="text-[11px] text-teal-400 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              <span>Catchment: Barangay San Pedro · Barangay Magtanggol · Barangay Tabacalera</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="md:col-span-3 space-y-2">
            <div className="text-white font-semibold text-xs uppercase tracking-wider">
              {t.footerQuickLinks}
            </div>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <button 
                  onClick={() => handleNavClick('services')} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.navServices}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavClick('staff')} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.navStaff}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavClick('outreach')} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.navOutreach}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavClick('portal')} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.navPortal}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavClick('analytics')} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.navAnalytics}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Operating Hours */}
          <div className="md:col-span-4 space-y-2">
            <div className="text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{language === 'fil' ? 'Iskedyul ng Tanggapan' : 'Clinic Hours'}</span>
            </div>

            <div className="space-y-1 text-slate-400 text-xs">
              <div>Facility Intake: Mon - Fri: 7:00 AM - 4:00 PM</div>
              <div>Doctor Consults: Mon: 8AM-3PM | Tue-Fri: 9AM-3PM</div>
              <div className="text-teal-300">Pateros X-Ray Clinic (3rd Flr): Mon - Fri: 7AM - 10AM</div>
              <div className="text-teal-300">Dental Clinic: Mon, Wed, Fri (M-W-F) Only</div>
            </div>

            <p className="pt-2 text-[11px] text-slate-500">
              {t.footerHoursNotice}
            </p>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Unboxed Note */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <div>
            © {new Date().getFullYear()} Mr. Flores Health Center · Municipality of Pateros
          </div>

          <div className="flex items-center gap-2">
            <span>DOH Certified Public Health Facility</span>
            <span aria-hidden="true">·</span>
            <span>PhilHealth Accredited</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
