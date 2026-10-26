import React, { useState } from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { STAFF_DIRECTORY } from '../data/healthCenterData';
import { Department } from '../types';
import { Search, Clock, MapPin, Award, ArrowRight } from 'lucide-react';

export const StaffDirectory: React.FC = () => {
  const { t, language, setActiveSection } = useHealthCenter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department | 'all'>('doctors');

  const filteredStaff = STAFF_DIRECTORY.filter((staff) => {
    const matchesDept = selectedDept === 'all' || staff.department === selectedDept;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      staff.name.toLowerCase().includes(query) ||
      staff.role.toLowerCase().includes(query) ||
      staff.roleFil.toLowerCase().includes(query) ||
      staff.departmentName.toLowerCase().includes(query) ||
      staff.qualifications.toLowerCase().includes(query);

    return matchesDept && matchesSearch;
  });

  const departmentTabs: Array<{ id: Department | 'all'; label: string }> = [
    { id: 'all', label: t.deptAll },
    { id: 'doctors', label: t.deptDoctors },
    { id: 'nutrition_bns', label: t.deptNutrition },
    { id: 'dental', label: t.deptDental },
    { id: 'radiology_lab', label: t.deptRadiology },
    { id: 'nursing_midwifery', label: t.deptNursing },
    { id: 'admin_support', label: t.deptAdmin },
  ];

  return (
    <section id="staff" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">


        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-bold text-teal-800 uppercase tracking-wider">
              {language === 'fil' ? 'Pampublikong Serbisyong Medikal' : 'Official Public Health Roster'}
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight" style={{ textWrap: 'balance' }}>
              {t.staffTitle}
            </h2>
            <p className="text-sm text-slate-600">
              {t.staffSubtitle}
            </p>
          </div>


          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.staffSearchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 shadow-2xs"
            />
          </div>
        </div>


        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl overflow-x-auto">
          {departmentTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedDept(tab.id)}
              className={`min-h-11 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedDept === tab.id
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="space-y-4">

                <div className="flex items-start gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                    staff.isHead
                      ? 'bg-teal-700 text-white'
                      : (staff.department === 'nutrition_bns' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-800')
                  }`}>
                    {staff.avatarInitials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-950 break-words">
                        {staff.name}
                      </h3>
                      {staff.isHead && (
                        <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">
                          {t.badgeHead}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-teal-700 mt-0.5">
                      {language === 'fil' ? staff.roleFil : staff.role}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {staff.departmentName}
                    </div>
                  </div>
                </div>


                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                  <Award className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{staff.qualifications}</span>
                </div>


                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-slate-800">{t.labelDutyHours}:</span>{' '}
                      <span className="text-slate-700">
                        {language === 'fil' ? staff.scheduleFil : staff.schedule}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-slate-800">{t.labelOfficeRoom}:</span>{' '}
                      <span className="text-slate-700">{staff.location}</span>
                    </div>
                  </div>
                </div>
              </div>


              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setActiveSection('contact');
                    const element = document.getElementById('contact');
                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs font-semibold text-teal-800 hover:text-teal-900 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{language === 'fil' ? 'Makipag-ugnayan' : 'Contact the clinic'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-2">
            <div className="text-sm font-semibold text-slate-700">No personnel found</div>
            <div className="text-xs text-slate-500">Try adjusting your search criteria or department filter.</div>
          </div>
        )}

      </div>
    </section>
  );
};
