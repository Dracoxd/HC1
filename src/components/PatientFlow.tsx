import React from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';

export const PatientFlow: React.FC = () => {
  const { language } = useHealthCenter();
  const isFilipino = language === 'fil';

  return (
    <section aria-labelledby="patient-flow-title" className="site-section-bg section-enter border-t border-slate-200 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="mb-8 max-w-2xl">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-teal-800">{isFilipino ? 'Gabay sa pagbisita' : 'Plan your visit'}</div>
          <h2 id="patient-flow-title" className="text-3xl font-bold uppercase text-slate-950 sm:text-4xl">{isFilipino ? 'Daloy ng pasyente' : 'Patient flow'}</h2>
          <p className="mt-3 text-base text-slate-600">{isFilipino ? 'Magsimula sa registration at susundan kayo ng kawani sa tamang serbisyo.' : 'Start at registration and staff will guide you to the right service.'}</p>
        </div>

        <div className="reveal-stagger grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              <div className="flex gap-4 py-4">
                <span className="text-sm font-bold tabular-nums text-teal-800">01</span>
                <div><h3 className="text-base font-bold uppercase text-slate-900">{isFilipino ? 'Registration' : 'Registration'}</h3><p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Ihanda ang pangalan, address, at cellphone number.' : 'Provide your name, address, and cellphone number.'}</p></div>
              </div>
              <div className="flex gap-4 py-4">
                <span className="text-sm font-bold tabular-nums text-teal-800">02</span>
                <div><h3 className="text-base font-bold uppercase text-slate-900">{isFilipino ? 'Piliin ang tamang care desk' : 'Initial screening'}</h3><p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Dental, pediatric, o women’s health ang magtatakda ng susunod na hakbang.' : 'Dental, pediatric, or women’s health staff will guide the next step.'}</p></div>
              </div>
              <div className="grid gap-5 py-5 sm:grid-cols-3">
                <div><h3 className="text-sm font-bold uppercase text-slate-900">{isFilipino ? 'Dental · edad 20 pataas' : 'Dental · age 20+'}</h3><p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Risk assessment at TB FAST screening. Kung kailangan: PhilHealth enrollment, booklet, at pag-dispense ng gamot.' : 'Risk assessment and TB FAST screening. If needed: PhilHealth enrollment, a booklet, and medicine dispensing.'}</p></div>
                <div><h3 className="text-sm font-bold uppercase text-slate-900">{isFilipino ? 'Pedia · wala pang 20' : 'Pediatrics · under 20'}</h3><p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Vital signs, timbang, at taas. May bakuna at pagtimbang para sa well-baby.' : 'Vital signs, weight, and height. Well-baby visits include vaccination and weighing.'}</p></div>
                <div><h3 className="text-sm font-bold uppercase text-slate-900">{isFilipino ? 'Women’s health' : 'Women’s health'}</h3><p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Family planning, VIA, prenatal care, at konsultasyon.' : 'Family planning, VIA, prenatal care, and consultation.'}</p></div>
              </div>
              <div className="flex gap-4 py-4">
                <span className="text-sm font-bold tabular-nums text-teal-800">03</span>
                <div><h3 className="text-base font-bold uppercase text-slate-900">{isFilipino ? 'Konsultasyon at follow-up' : 'Consultation and follow-up'}</h3><p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Ang mga may sakit ay sasailalim sa chief-complaint review at konsultasyon; ire-refer kung kailangan. Magpa-iskedyul ng follow-up check-up.' : 'Patients who are sick are assessed by chief complaint and seen for consultation, with referral when needed. Schedule a follow-up check-up.'}</p></div>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold text-teal-900">{isFilipino ? 'May iron (ferrous sulfate) at calcium na ibinibigay sa Women’s Health Clinic.' : 'Ferrous sulfate and calcium are dispensed through the Women’s Health Clinic.'}</p>
          </div>

          <div className="divide-y divide-slate-200 border-y border-slate-200">
            <details className="group py-4" open>
              <summary className="cursor-pointer list-none text-base font-bold uppercase text-slate-900">{isFilipino ? 'Bago pumunta sa Dental' : 'Before a dental visit'}</summary>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                <li>{isFilipino ? 'Kumain ng almusal; maligo at magsipilyo.' : 'Eat breakfast, bathe, and brush your teeth.'}</li>
                <li>{isFilipino ? 'Magsuot ng malinis na damit; bawal ang sando.' : 'Wear clean clothes; tank tops are not allowed.'}</li>
                <li>{isFilipino ? 'Magdala ng bimpo o panyo.' : 'Bring a small towel or handkerchief.'}</li>
                <li>{isFilipino ? 'Edad 19 pataas: magpa-blood pressure sa Admission Area, 3rd floor.' : 'Age 19+: have your blood pressure checked at the 3rd-floor Admission Area.'}</li>
              </ul>
            </details>
            <div className="py-4">
              <h3 className="text-base font-bold uppercase text-slate-900">Pateros X-ray Clinic</h3>
              <p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Lunes 8:00-10:00 AM; Martes-Biyernes 7:00-10:00 AM. 3rd floor.' : 'Monday 8:00-10:00 AM; Tuesday-Friday 7:00-10:00 AM. 3rd floor.'}</p>
              <p className="mt-1 text-sm text-slate-600">{isFilipino ? '2:00 PM ang release ng resulta. Kumpirmahin sa X-ray desk ang araw ng pagkuha kapag nagsumite ng request.' : 'Results are released at 2:00 PM. Confirm the pickup day with the X-ray desk when submitting your request.'}</p>
            </div>
            <div className="py-4">
              <h3 className="text-base font-bold uppercase text-slate-900">Social Hygiene Clinic</h3>
              <p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Lunes 8:00 AM-3:00 PM; Martes-Biyernes 9:00 AM-3:00 PM.' : 'Monday 8:00 AM-3:00 PM; Tuesday-Friday 9:00 AM-3:00 PM.'}</p>
              <p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Para sa buntis na may laboratory testing: 8:00-9:00 AM. Tumatanggap ng walk-in na buntis para sa testing.' : 'Pregnancy laboratory testing: 8:00-9:00 AM. Walk-in pregnant patients are accepted for testing.'}</p>
            </div>
            <div className="py-4 text-sm text-rose-900">
              <h3 className="font-bold uppercase">{isFilipino ? 'Kagat ng hayop' : 'Animal bite care'}</h3>
              <p className="mt-1">{isFilipino ? 'Magpatingin agad sa clinic para masuri ng health worker. Huwag magpasya online na hindi kailangan ang bakuna o follow-up.' : 'Visit the clinic promptly for assessment by a health worker. Do not use an online chart to decide that vaccination or follow-up is unnecessary.'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
