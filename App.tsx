
import React, { useState, useMemo } from 'react';
import { 
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Bar
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, Calculator, Info, Zap, Sparkles, RefreshCcw, 
  Calendar, Flag, CreditCard, PieChart, Table as TableIcon, HelpCircle, Package, Settings, BarChart3, Layers, Clock, Search, ExternalLink, Globe, Percent
} from 'lucide-react';
import { SimulationParams, SimulationResults, MonthlyData } from './types';
import InputGroup from './components/InputGroup';
import { analyzeSimulation, getCompetitorBenchmark } from './services/geminiService';

const TIER_FEES = {
  T1: 4900,
  T2: 9900,
  T3: 18750
};

const App: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    manufacturingCost: 152000,
    initialInstallationFee: 348000,
    installationCost: 50000, 
    salesCommissionRate: 7, // 판매수수료율 디폴트 7%로 수정
    variableCost: 2544,
    annualCsCost: 2700,
    tier1Ratio: 60,
    tier2Ratio: 30,
    tier3Ratio: 10,
    freeMonths: 6,
    acquisitionRate: 200,
    churnRate: 3,
    simulationMonths: 60,
  });

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [competitorInfo, setCompetitorInfo] = useState<{text: string, sources: any[]} | null>(null);
  const [isSearchingCompetitors, setIsSearchingCompetitors] = useState(false);

  const weightedAvgMonthlyFee = useMemo(() => {
    const totalRatio = params.tier1Ratio + params.tier2Ratio + params.tier3Ratio;
    if (totalRatio === 0) return 0;
    return (
      (TIER_FEES.T1 * params.tier1Ratio +
       TIER_FEES.T2 * params.tier2Ratio +
       TIER_FEES.T3 * params.tier3Ratio) / totalRatio
    );
  }, [params.tier1Ratio, params.tier2Ratio, params.tier3Ratio]);

  const results = useMemo((): SimulationResults => {
    const monthlyData: MonthlyData[] = [];
    let cumulativeProfit = 0;
    let totalUsers = 0;
    let breakEvenMonth: number | null = null;

    const cohorts: { monthStarted: number; count: number }[] = [];

    for (let m = 1; m <= params.simulationMonths; m++) {
      const newUsers = params.acquisitionRate;
      cohorts.push({ monthStarted: m, count: newUsers });
      
      totalUsers = (totalUsers * (1 - params.churnRate / 100)) + newUsers;

      let payingUsers = 0;
      cohorts.forEach(cohort => {
        const monthsActive = m - cohort.monthStarted + 1;
        if (monthsActive > params.freeMonths) {
          const currentCohortSize = cohort.count * Math.pow(1 - params.churnRate/100, monthsActive - 1);
          payingUsers += currentCohortSize;
        }
      });

      const installationRevenue = newUsers * params.initialInstallationFee;
      const subscriptionRevenue = payingUsers * weightedAvgMonthlyFee;
      const revenue = installationRevenue + subscriptionRevenue;
      
      const mfgCost = newUsers * params.manufacturingCost;
      const installationExpense = newUsers * params.installationCost;
      const commissionExpense = installationRevenue * (params.salesCommissionRate / 100); // 판가(initialInstallationFee)의 %
      const monthlyOpCost = (totalUsers * params.variableCost) / 12;
      const monthlyCsCost = (totalUsers * params.annualCsCost) / 12;
      
      const totalMonthlyCost = mfgCost + installationExpense + commissionExpense + monthlyOpCost + monthlyCsCost;
      const profit = revenue - totalMonthlyCost;
      cumulativeProfit += profit;

      if (breakEvenMonth === null && cumulativeProfit > 0) {
        breakEvenMonth = m;
      }

      monthlyData.push({
        month: m,
        newUsers,
        totalUsers: Math.round(totalUsers),
        payingUsers: Math.round(payingUsers),
        installationRevenue,
        subscriptionRevenue,
        revenue,
        costs: { 
          mfg: mfgCost, 
          installation: installationExpense, 
          commission: commissionExpense,
          op: monthlyOpCost, 
          cs: monthlyCsCost 
        },
        totalCost: totalMonthlyCost,
        profit,
        cumulativeProfit
      });
    }

    const ltv = (weightedAvgMonthlyFee - (params.variableCost / 12) - (params.annualCsCost / 12)) / (params.churnRate / 100 || 0.001);

    return { monthlyData, breakEvenMonth, totalProfit: cumulativeProfit, totalUsers: Math.round(totalUsers), clv: ltv };
  }, [params, weightedAvgMonthlyFee]);

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    const analysis = await analyzeSimulation(params, results);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const handleCompetitorSearch = async () => {
    setIsSearchingCompetitors(true);
    try {
      const info = await getCompetitorBenchmark(weightedAvgMonthlyFee);
      setCompetitorInfo(info);
    } catch (e) {
      alert("경쟁사 분석 중 오류가 발생했습니다.");
    } finally {
      setIsSearchingCompetitors(false);
    }
  };

  const formatCurrency = (val: number) => {
    const absVal = Math.abs(val);
    if (absVal >= 100000000) return `${(val / 100000000).toFixed(2)}억`;
    if (absVal >= 10000) return `${(val / 10000).toFixed(1)}만`;
    return val.toLocaleString();
  };

  const unitCommission = params.initialInstallationFee * (params.salesCommissionRate / 100);
  const totalCapExPerUnit = params.manufacturingCost + params.installationCost + unitCommission;

  return (
    <div className="min-h-screen pb-12 bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Zap className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Guard G1 Pro Simulation</h1>
          </div>
          <div className="flex items-center gap-3">
             <button 
              onClick={handleCompetitorSearch}
              disabled={isSearchingCompetitors}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white rounded-lg text-sm font-semibold transition-all shadow-md"
            >
              {isSearchingCompetitors ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              시장 경쟁사 분석
            </button>
             <button 
              onClick={handleAiAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-sm font-semibold transition-all shadow-md"
            >
              {isAnalyzing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI 전략 리포트
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-y-auto max-h-[calc(100vh-120px)] custom-scrollbar">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-800 uppercase tracking-tight">Financial Parameters</h2>
            </div>
            
            <div className="space-y-8">
              {/* CapEx Group */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-500" />
                    <h3 className="text-xs font-bold text-slate-500 uppercase">CapEx (초기 투자 원가)</h3>
                  </div>
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">대당 합계 ₩{Math.round(totalCapExPerUnit).toLocaleString()}</span>
                </div>
                <InputGroup label="제조원가" unit="원" value={params.manufacturingCost} min={50000} max={1000000} step={1000} onChange={(v) => setParams(prev => ({ ...prev, manufacturingCost: v }))} />
                <InputGroup label="설치 원가" unit="원" value={params.installationCost} min={0} max={500000} step={1000} onChange={(v) => setParams(prev => ({ ...prev, installationCost: v }))} />
                <InputGroup 
                  label="판매수수료율 (판가 기준)" 
                  unit="%" 
                  value={params.salesCommissionRate} 
                  min={0} max={50} step={0.5} 
                  onChange={(v) => setParams(prev => ({ ...prev, salesCommissionRate: v }))}
                  description={`판가(₩${params.initialInstallationFee.toLocaleString()})의 ${params.salesCommissionRate}% = 대당 ₩${Math.round(unitCommission).toLocaleString()}`}
                />
              </div>

              {/* Subscription Mix Group */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-xs font-bold text-slate-500 uppercase">Subscription Mix</h3>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">평균 ₩{Math.round(weightedAvgMonthlyFee).toLocaleString()}</span>
                </div>
                <InputGroup label="4,900원 (%)" unit="%" value={params.tier1Ratio} min={0} max={100} onChange={(v) => setParams(prev => ({ ...prev, tier1Ratio: v }))} />
                <InputGroup label="9,900원 (%)" unit="%" value={params.tier2Ratio} min={0} max={100} onChange={(v) => setParams(prev => ({ ...prev, tier2Ratio: v }))} />
                <InputGroup label="18,750원 (%)" unit="%" value={params.tier3Ratio} min={0} max={100} onChange={(v) => setParams(prev => ({ ...prev, tier3Ratio: v }))} />
                <InputGroup label="무상기간" unit="개월" value={params.freeMonths} min={0} max={24} step={1} onChange={(v) => setParams(prev => ({ ...prev, freeMonths: v }))} />
              </div>

              {/* OpEx & Growth Group */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-500" />
                    <h3 className="text-xs font-bold text-slate-500 uppercase">OpEx & Growth</h3>
                  </div>
                </div>
                <InputGroup label="초기판매비 (판가)" unit="원" value={params.initialInstallationFee} min={0} max={1000000} step={1000} onChange={(v) => setParams(prev => ({ ...prev, initialInstallationFee: v }))} />
                <InputGroup label="클라우드 운영비 (연)" unit="원" value={params.variableCost} min={0} max={50000} onChange={(v) => setParams(prev => ({ ...prev, variableCost: v }))} />
                <InputGroup label="CS 비용 (연)" unit="원" value={params.annualCsCost} min={0} max={50000} onChange={(v) => setParams(prev => ({ ...prev, annualCsCost: v }))} />
                <InputGroup label="월 신규 가입" unit="명" value={params.acquisitionRate} min={10} max={5000} onChange={(v) => setParams(prev => ({ ...prev, acquisitionRate: v }))} />
                <InputGroup label="월 이탈률" unit="%" value={params.churnRate} min={0.1} max={15} step={0.1} onChange={(v) => setParams(prev => ({ ...prev, churnRate: v }))} />
              </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">누적 손익 (5년)</span>
              <div className="mt-2"><span className={`text-xl font-bold ${results.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>₩{formatCurrency(results.totalProfit)}</span></div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">BEP 도달</span>
              <div className="mt-2"><span className="text-xl font-bold text-slate-800">{results.breakEvenMonth ? `${results.breakEvenMonth}개월` : '달성 불가'}</span></div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">최종 사용자</span>
              <div className="mt-2"><span className="text-xl font-bold text-slate-800">{results.totalUsers.toLocaleString()}명</span></div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">LTV</span>
              <div className="mt-2"><span className="text-xl font-bold text-blue-600">₩{formatCurrency(results.clv)}</span></div>
            </div>
          </div>

          {/* 시장 경쟁사 분석 결과 섹션 */}
          {competitorInfo && (
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 p-2 rounded-lg"><Globe className="w-5 h-5" /></div>
                  <h3 className="font-bold text-lg">Market Benchmark: 실시간 경쟁사 분석</h3>
                </div>
                <button onClick={() => setCompetitorInfo(null)} className="text-slate-400 hover:text-white transition-colors">닫기</button>
              </div>
              
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                {competitorInfo.text}
              </div>

              {competitorInfo.sources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">Data Sources (Verified by Google Search)</span>
                  <div className="flex flex-wrap gap-2">
                    {competitorInfo.sources.map((chunk: any, i: number) => (
                      chunk.web && (
                        <a 
                          key={i} 
                          href={chunk.web.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-blue-400 rounded-full transition-all border border-slate-700"
                        >
                          <ExternalLink size={10} />
                          {chunk.web.title || "출처 확인"}
                        </a>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {aiAnalysis && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 relative">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-indigo-900">AI 전략 분석 리포트</h3>
              </div>
              <div className="text-sm text-indigo-800 leading-relaxed whitespace-pre-wrap font-medium">
                {aiAnalysis}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><TableIcon className="w-5 h-5 text-indigo-600" /> 연차별 비즈니스 마일스톤</h3>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-black text-slate-500 uppercase">
                      <th className="px-6 py-4">연차</th>
                      <th className="px-6 py-4">개월</th>
                      <th className="px-6 py-4">사용자</th>
                      <th className="px-6 py-4 text-emerald-600">판매 매출</th>
                      <th className="px-6 py-4 text-blue-600">구독 매출</th>
                      <th className="px-6 py-4 text-rose-500">총 비용</th>
                      <th className="px-6 py-4 bg-indigo-50 text-indigo-700">누적 손익</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[12, 24, 36, 48, 60].map((m, idx) => {
                      const data = results.monthlyData[m - 1];
                      return (
                        <tr key={m} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-indigo-600">{idx + 1}년차</td>
                          <td className="px-6 py-4 text-slate-500">{m}m</td>
                          <td className="px-6 py-4 font-semibold">{data?.totalUsers.toLocaleString()}명</td>
                          <td className="px-6 py-4 font-bold text-emerald-600">₩{formatCurrency(data?.installationRevenue || 0)}</td>
                          <td className="px-6 py-4 font-bold text-blue-600">₩{formatCurrency(data?.subscriptionRevenue || 0)}</td>
                          <td className="px-6 py-4 font-bold text-rose-500">₩{formatCurrency(data?.totalCost || 0)}</td>
                          <td className={`px-6 py-4 font-black ${data?.cumulativeProfit >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>₩{formatCurrency(data?.cumulativeProfit || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* 공식 참조 섹션 (CapEx 업데이트) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-100/50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-slate-400" />
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">총비용(Total Cost) 계산 공식</h4>
                </div>
                <div className="text-[11px] text-slate-600 font-medium space-y-1 bg-white/50 p-3 rounded-lg border border-slate-100 font-mono min-h-[80px] flex flex-col justify-center">
                  <p>총비용 = (월 신규 가입자 × CapEx 합계) + (총 사용자 × OpEx 합계 / 12)</p>
                  <div className="mt-2 pt-2 border-t border-slate-200/50 text-[10px] text-slate-400 leading-relaxed">
                    <span className="font-bold text-slate-500">* CapEx:</span> 제조원가 + 설치 원가 + <span className="text-orange-600">(판가 × 판매수수료율)</span> <br/>
                    <span className="font-bold text-slate-500">* OpEx:</span> 연간 클라우드 운영비 + 연간 CS 비용
                  </div>
                </div>
              </div>

              <div className="bg-slate-100/50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">LTV(Lifetime Value) 계산 공식</h4>
                </div>
                <div className="text-[11px] text-slate-600 font-medium space-y-1 bg-white/50 p-3 rounded-lg border border-slate-100 font-mono min-h-[80px] flex flex-col justify-center">
                  <p>LTV = (가중평균 구독료 - 월 OpEx 합계) / (월 이탈률 / 100)</p>
                  <div className="mt-2 pt-2 border-t border-slate-200/50 text-[10px] text-slate-400 leading-relaxed">
                    <span className="font-bold text-slate-500">* 가중평균 구독료:</span> 티어별 요금 × 티어별 비중의 합 <br/>
                    <span className="font-bold text-slate-500">* 월 OpEx:</span> (연간 클라우드비 + 연간 CS비) / 12
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 통합 대시보드 차트 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-8"><TrendingUp className="w-5 h-5 text-indigo-600" /> 5개년 재무 시뮬레이션 추이</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={results.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} interval={5} />
                  <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/10000}만`} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fill: '#6366f1'}} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/10000}만`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '11px' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="installationRevenue" name="판매 매출" stackId="revenue" fill="#10b981" />
                  <Bar yAxisId="left" dataKey="subscriptionRevenue" name="구독 매출" stackId="revenue" fill="#3b82f6" />
                  <Bar yAxisId="left" dataKey="totalCost" name="총 비용" fill="#f43f5e" opacity={0.6} />
                  <Area yAxisId="right" type="monotone" dataKey="cumulativeProfit" name="누적 손익" fill="url(#colorCumulative)" stroke="#6366f1" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>
      <footer className="max-w-7xl mx-auto px-4 mt-12 pb-8 text-center text-slate-300 text-[10px] font-medium tracking-widest uppercase">
        Guard G1 Pro Project • Market Intelligence Edition v2.9
      </footer>
    </div>
  );
};

export default App;
