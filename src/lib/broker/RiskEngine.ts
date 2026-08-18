import { AssetCategory, BrokerAccount, BrokerPosition, NewBrokerOrder, RiskAnalysisResult, RiskLimits } from '../../types';

export const DEFAULT_RISK_LIMITS: RiskLimits = {
  maxRiskPerTradePercent: 2.0, // Maximum 2.0% equity per trade
  maxDailyLossPercent: 4.0, // Maximum 4.0% daily drawdown limit
  maxOpenPositions: 5, // Maximum 5 concurrent open positions
  maxPositionSizeDollars: 100000, // Maximum single position notional value
};

export class RiskEngine {
  public static calculateRisk(
    account: BrokerAccount,
    positions: BrokerPosition[],
    order: NewBrokerOrder,
    entryPrice: number,
    limits: RiskLimits = DEFAULT_RISK_LIMITS
  ): RiskAnalysisResult {
    const violations: string[] = [];
    const warnings: string[] = [];

    const equity = Math.max(1, account.equity);
    const stopLoss = order.stopLoss;
    const takeProfit = order.takeProfit;
    const isLong = order.direction === 'long';

    // 1. Determine Stop Distance
    let stopDistance = 0;
    if (stopLoss && stopLoss > 0) {
      stopDistance = isLong ? Math.max(0, entryPrice - stopLoss) : Math.max(0, stopLoss - entryPrice);
    } else {
      // Default hypothetical 1.5% distance if not provided
      stopDistance = entryPrice * 0.015;
      warnings.push('No Stop Loss specified. Risk engine using 1.5% baseline stop distance.');
    }

    // 2. Determine Asset Class Multiplier & Pip/Tick Rules
    let pipOrTickValue = 1;
    let lotOrUnitScale = 1;
    let formulaDescription = 'Units = Risk / Price Distance';

    const sym = order.symbol.toUpperCase();
    if (sym === 'EURUSD' || sym === 'GBPUSD' || sym === 'USDJPY') {
      // Forex calculation: standard lot = 100,000 units, pip = 0.0001 (or 0.01 for JPY)
      const pipSize = sym === 'USDJPY' ? 0.01 : 0.0001;
      const pips = stopDistance / pipSize;
      pipOrTickValue = 10; // $10 per pip per standard lot
      lotOrUnitScale = 100000;
      formulaDescription = `Forex Standard Lots: ${pips.toFixed(1)} pips @ $10/pip`;
    } else if (sym === 'NQ') {
      pipOrTickValue = 20; // $20 per point for E-mini NQ
      lotOrUnitScale = 1;
      formulaDescription = `NQ Futures: $20.00/point (${stopDistance.toFixed(2)} pts stop)`;
    } else if (sym === 'ES') {
      pipOrTickValue = 50; // $50 per point for E-mini ES
      lotOrUnitScale = 1;
      formulaDescription = `ES Futures: $50.00/point (${stopDistance.toFixed(2)} pts stop)`;
    } else if (sym === 'XAUUSD') {
      pipOrTickValue = 100; // Gold 100 oz contract
      lotOrUnitScale = 100;
      formulaDescription = `Gold Ounces: $1.00/oz ($100 per standard contract)`;
    } else {
      // Crypto / Equities standard units
      pipOrTickValue = 1;
      lotOrUnitScale = 1;
      formulaDescription = 'Asset Spot Units = Risk Amount / Stop Loss Distance';
    }

    // 3. Compute Risk Amount and Position Size
    const totalOrderRisk = stopDistance * order.quantity * (sym === 'NQ' ? 20 : sym === 'ES' ? 50 : 1);
    const riskPercent = (totalOrderRisk / equity) * 100;

    // Recommended position size based on maxRiskPerTradePercent
    const maxAllowedRiskDollars = (equity * limits.maxRiskPerTradePercent) / 100;
    const pointScale = sym === 'NQ' ? 20 : sym === 'ES' ? 50 : 1;
    const recommendedUnits = stopDistance > 0 ? maxAllowedRiskDollars / (stopDistance * pointScale) : 1;

    // 4. Reward & Risk/Reward Ratio Calculation
    let targetDistance = 0;
    if (takeProfit && takeProfit > 0) {
      targetDistance = isLong ? Math.max(0, takeProfit - entryPrice) : Math.max(0, entryPrice - takeProfit);
    }
    const potentialReward = targetDistance > 0 ? targetDistance * order.quantity * pointScale : 0;
    const riskRewardRatio = totalOrderRisk > 0 && potentialReward > 0 ? potentialReward / totalOrderRisk : 0;

    // 5. Evaluate Institutional Risk Guardrails
    // Rule A: Max Risk per Trade
    if (riskPercent > limits.maxRiskPerTradePercent) {
      violations.push(
        `Risk of ${riskPercent.toFixed(2)}% ($${totalOrderRisk.toFixed(2)}) exceeds maximum allowed risk limit of ${limits.maxRiskPerTradePercent}% ($${maxAllowedRiskDollars.toFixed(2)}).`
      );
    }

    // Rule B: Max Concurrent Open Positions
    if (positions.length >= limits.maxOpenPositions) {
      violations.push(
        `Open positions count (${positions.length}) has reached max capacity (${limits.maxOpenPositions}). Close an existing position before submitting new orders.`
      );
    }

    // Rule C: Maximum Notional Position Size
    const notionalValue = order.quantity * entryPrice * (sym === 'NQ' || sym === 'ES' ? 1 : 1);
    if (notionalValue > limits.maxPositionSizeDollars) {
      violations.push(
        `Position notional value ($${notionalValue.toLocaleString()}) exceeds the maximum allowed ceiling ($${limits.maxPositionSizeDollars.toLocaleString()}).`
      );
    }

    // Rule D: Account Daily Drawdown Check
    const dailyDrawdownPercent = (Math.abs(Math.min(0, account.realizedPnl)) / account.initialCapital) * 100;
    if (dailyDrawdownPercent >= limits.maxDailyLossPercent) {
      violations.push(
        `Account daily loss of ${dailyDrawdownPercent.toFixed(2)}% has breached maximum drawdown limit (${limits.maxDailyLossPercent}%). Trading is halted for today.`
      );
    }

    // Warnings
    if (riskRewardRatio > 0 && riskRewardRatio < 1.5) {
      warnings.push(`Risk/Reward ratio (${riskRewardRatio.toFixed(2)}R) is below the recommended 1.5R minimum.`);
    }

    return {
      allowed: violations.length === 0,
      riskAmount: totalOrderRisk,
      riskPercentOfEquity: Number(riskPercent.toFixed(2)),
      stopDistance: Number(stopDistance.toFixed(4)),
      recommendedPositionSize: Number(recommendedUnits.toFixed(4)),
      maximumLoss: Number(totalOrderRisk.toFixed(2)),
      potentialReward: Number(potentialReward.toFixed(2)),
      riskRewardRatio: Number(riskRewardRatio.toFixed(2)),
      violations,
      warnings,
      assetClassRules: {
        formula: formulaDescription,
        pipOrTickValue,
        lotOrUnitScale,
      },
    };
  }
}
