
import { GoogleGenAI } from "@google/genai";
import { SimulationParams, SimulationResults } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSimulation = async (params: SimulationParams, results: SimulationResults): Promise<string> => {
  const prompt = `
    헤이븐 2(Haven 2) 구독 모델 시뮬레이션 결과를 분석하고 전략적 조언을 제공해주세요.
    
    [입력 파라미터]
    - 제조원가: ${params.manufacturingCost.toLocaleString()}원
    - 초기판매비(회수금/판가): ${params.initialInstallationFee.toLocaleString()}원
    - 설치 원가(비용): ${params.installationCost.toLocaleString()}원
    - 판매수수료율: ${params.salesCommissionRate}% (판가 기준)
    - 대당 연간 클라우드 운영비: ${params.variableCost.toLocaleString()}원
    - 대당 연간 CS 비용: ${params.annualCsCost.toLocaleString()}원
    - 구독 티어 비율: 
      * 4,900원 요금제: ${params.tier1Ratio}%
      * 9,900원 요금제: ${params.tier2Ratio}%
      * 18,750원 요금제: ${params.tier3Ratio}%
    - 무상기간: ${params.freeMonths}개월
    - 월 신규 가입자: ${params.acquisitionRate}명
    - 이탈률: ${params.churnRate}%
    
    [시뮬레이션 결과 (${params.simulationMonths}개월 기준)]
    - 최종 총 사용자: ${results.totalUsers.toLocaleString()}명
    - 손익분기점(BEP): ${results.breakEvenMonth ? results.breakEvenMonth + '개월 차' : '달성 불가'}
    - 총 누적 손익: ${results.totalProfit.toLocaleString()}원
    
    다음 내용을 포함하여 한국어로 답변해주세요:
    1. 구독 티어 믹스(Mix) 및 판매수수료가 ARPU 및 순이익에 미치는 영향 분석
    2. 초기판매비, 설치 원가, 판매수수료의 삼각 관계가 BEP 및 초기 현금흐름에 미치는 영향 평가
    3. 수익성 개선을 위한 핵심 변수 조정 제안 (예: 고가 요금제 유도 전략, 유통 채널별 수수료 최적화 등)
    4. 리스크 요인 및 향후 전략 방향
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });
    return response.text || "분석 결과를 가져오지 못했습니다.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
};

export const getCompetitorBenchmark = async (weightedAvgFee: number) => {
  const prompt = `
    Compare current global and Korean smart home security subscription plans (like Ring Protect, Nest Aware, Arlo Secure, and Korean providers like KT/SKT home security).
    The user's current project "Haven 2" has a weighted average monthly fee of ₩${Math.round(weightedAvgFee).toLocaleString()}.
    
    Please provide:
    1. A comparison table of top 3 global and top 1 local competitors.
    2. An analysis of Haven 2's price competitiveness compared to these market leaders.
    3. Suggested features to justify the 18,750 KRW high-tier plan.
    
    Answer in Korean. Focus on the most recent 2024-2025 pricing.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // High quality for search
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Competitor Search Error:", error);
    throw error;
  }
};
