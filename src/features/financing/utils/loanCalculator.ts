// Utilities for computing loan amortization schedules for Bolívar Digital
// Supports French (fixed payment) and Linear (declining payment) methods.

export type ScheduleRow = {
  period: number;
  payment: number; // total payment for the period
  interest: number; // interest portion
  principal: number; // principal amortized
  remaining: number; // remaining principal after payment
};

export type ScheduleResult = {
  schedule: ScheduleRow[];
  totalInterest: number;
  totalPaid: number;
  monthlyPayment?: number; // only for French
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// French amortization (fixed payment per period)
// principal: initial amount
// rateMonthly: periodic interest rate (e.g. 0.02 for 2% monthly)
// months: number of periods
export function computeFrenchSchedule(principal: number, rateMonthly: number, months: number): ScheduleResult {
  if (principal <= 0 || months <= 0) {
    return { schedule: [], totalInterest: 0, totalPaid: 0, monthlyPayment: 0 };
  }

  const i = rateMonthly;
  const annuity = i === 0 ? principal / months : (principal * i) / (1 - Math.pow(1 + i, -months));
  let remaining = principal;
  const schedule: ScheduleRow[] = [];
  let totalInterest = 0;

  for (let p = 1; p <= months; p++) {
    const interest = i === 0 ? 0 : remaining * i;
    const principalPart = annuity - interest;
    remaining = Math.max(0, remaining - principalPart);
    schedule.push({
      period: p,
      payment: round2(annuity),
      interest: round2(interest),
      principal: round2(principalPart),
      remaining: round2(remaining),
    });
    totalInterest += interest;
  }

  const totalPaid = schedule.reduce((sum, r) => sum + r.payment, 0);
  return {
    schedule,
    totalInterest: round2(totalInterest),
    totalPaid: round2(totalPaid),
    monthlyPayment: round2(annuity),
  };
}

// Linear amortization (equal principal each period; payment declines over time)
export function computeLinearSchedule(principal: number, rateMonthly: number, months: number): ScheduleResult {
  if (principal <= 0 || months <= 0) {
    return { schedule: [], totalInterest: 0, totalPaid: 0 };
  }

  const principalPerPeriod = principal / months;
  let remaining = principal;
  const schedule: ScheduleRow[] = [];
  let totalInterest = 0;

  for (let p = 1; p <= months; p++) {
    const interest = remaining * rateMonthly;
    const payment = principalPerPeriod + interest;
    remaining = Math.max(0, remaining - principalPerPeriod);
    schedule.push({
      period: p,
      payment: round2(payment),
      interest: round2(interest),
      principal: round2(principalPerPeriod),
      remaining: round2(remaining),
    });
    totalInterest += interest;
  }

  const totalPaid = schedule.reduce((sum, r) => sum + r.payment, 0);
  return {
    schedule,
    totalInterest: round2(totalInterest),
    totalPaid: round2(totalPaid),
  };
}
