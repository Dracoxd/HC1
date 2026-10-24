import React, { useState } from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { ANALYTICS_DATA, ZONES_COVERAGE } from '../data/healthCenterData';
import { BarChart3, TrendingUp, Users, HeartHandshake, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { t, language } = useHealthCenter();

  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  return (
    <section id="analytics" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">


        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-teal-700" />
              <span>{language === 'fil' ? 'Pampublikong Estadistika ng Kalusugan' : 'Public Health Telemetry & Efficacy'}</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight" style={{ textWrap: 'balance' }}>
              {t.analyticsTitle}
            </h2>
            <p className="text-sm text-slate-600">
              {t.analyticsSubtitle}
            </p>
          </div>


          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl shrink-0 self-start md:self-auto">
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${
                timeRange === 'month' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
              }`}
            >
              Current Month
            </button>
            <button
              onClick={() => setTimeRange('quarter')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${
                timeRange === 'quarter' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
              }`}
            >
              Q1 2026 (OPT Drive)
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${
                timeRange === 'year' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
              }`}
            >
              Year-to-Date
            </button>
          </div>
        </div>


        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs text-slate-500 font-medium">{t.kpiConsultations}</div>
            <div className="text-3xl font-extrabold text-slate-950 font-mono tabular-nums">
              {ANALYTICS_DATA.monthlyConsultations.toLocaleString()}
            </div>
            <div className="text-[11px] text-teal-700 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12.4% vs last month</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs text-slate-500 font-medium">{t.kpiSatisfaction}</div>
            <div className="text-3xl font-extrabold text-teal-800 font-mono tabular-nums">
              {ANALYTICS_DATA.satisfactionRate}%
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Patient exit survey rating
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs text-slate-500 font-medium">{t.kpiOptScreening}</div>
            <div className="text-3xl font-extrabold text-slate-950 font-mono tabular-nums">
              {ANALYTICS_DATA.optScreeningProgress}%
            </div>
            <div className="text-[11px] text-amber-700 font-medium">
              0-59 months enrolled (Jan-Mar)
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs text-slate-500 font-medium">{t.kpiMedsDispensed}</div>
            <div className="text-3xl font-extrabold text-teal-800 font-mono tabular-nums">
              {ANALYTICS_DATA.freePrescriptionsDispensed.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              100% Free DOH maintenance packs
            </div>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">


          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{t.chartServiceVolume}</h3>
                <p className="text-xs text-slate-500">Patient distribution across 7 public programs</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">Total: 1,842</span>
            </div>

            <div className="space-y-3">
              {ANALYTICS_DATA.serviceBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-800">{item.service}</span>
                    <span className="font-mono tabular-nums text-slate-600 font-semibold">{item.patients} pts ({item.share})</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-700 h-2 rounded-full"
                      style={{ width: item.share }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>


          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{t.chartZoneFootfall}</h3>
                <p className="text-xs text-slate-500">San Pedro, Magtanggol, and Tabacalera breakdown</p>
              </div>
              <span className="text-xs text-teal-800 font-semibold">98.3% Total Reach</span>
            </div>

            <div className="space-y-4">
              {ANALYTICS_DATA.zoneDistribution.map((zone, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-900">{zone.name}</span>
                    <span className="font-mono tabular-nums text-teal-900">{zone.count} consultations ({zone.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${idx === 0 ? 'bg-teal-700' : (idx === 1 ? 'bg-teal-800' : 'bg-teal-600')}`}
                      style={{ width: `${zone.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-xs text-slate-500 italic">
              *Field outreach led by BNS scholars Monina De Borja, Emily Velarde, and Maria Teresa Castillo.
            </div>
          </div>

        </div>


        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">{t.chartNutritionStatus}</h3>
              <p className="text-xs text-slate-500">
                Data collected by Barangay Nutrition Scholars (BNS) across puroks (Jan - March)
              </p>
            </div>
            <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded">
              Active Assessment Cycle
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {ANALYTICS_DATA.nutritionClassificationsJanMarch.map((status, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-center">
                <div className="text-xs text-slate-600 font-medium truncate" title={status.status}>
                  {status.status}
                </div>
                <div className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {status.count}
                </div>
                <div className="text-[11px] text-teal-700 font-semibold font-mono tabular-nums">
                  {status.percentage}% of cohort
                </div>
              </div>
            ))}
          </div>
        </div>


        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">{t.chartInventoryStatus}</h3>
              <p className="text-xs text-slate-500">Real-time pharmacy stock monitoring & buffer levels</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ANALYTICS_DATA.medicineInventoryStatus.map((med, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <span className="font-bold text-slate-900">{med.medication}</span>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
                    {med.healthScore}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Current Stock:</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">{med.stock.toLocaleString()} units</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Safety Threshold:</span>
                  <span className="font-mono tabular-nums">{med.threshold} units</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
