
export interface SimulationParams {
  manufacturingCost: number;     // 제조원가
  initialInstallationFee: number; // 초기판매비 (회수)
  installationCost: number;      // 설치 원가 (비용)
  salesCommissionRate: number;    // 판매수수료율 (%)
  variableCost: number;          // 대당 연간 클라우드 운영비
  annualCsCost: number;          // 대당 연간 CS 비용
  tier1Ratio: number;            // 4,900원 요금제 비율 (%)
  tier2Ratio: number;            // 9,900원 요금제 비율 (%)
  tier3Ratio: number;            // 18,750원 요금제 비율 (%)
  freeMonths: number;            // 무료 구독 기간 (개월)
  acquisitionRate: number;       // 월 신규 가입자 수
  churnRate: number;             // 월 이탈률 (%)
  simulationMonths: number;      // 시뮬레이션 기간 (개월)
}

export interface MonthlyData {
  month: number;
  newUsers: number;
  totalUsers: number;
  payingUsers: number;
  revenue: number;
  subscriptionRevenue: number;
  installationRevenue: number;
  costs: {
    mfg: number;
    installation: number;
    commission: number; // 추가: 판매 수수료
    op: number;
    cs: number;
  };
  totalCost: number;
  profit: number;
  cumulativeProfit: number;
}

export interface SimulationResults {
  monthlyData: MonthlyData[];
  breakEvenMonth: number | null;
  totalProfit: number;
  totalUsers: number;
  clv: number; // Customer Lifetime Value
}
