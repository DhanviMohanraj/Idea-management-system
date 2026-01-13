const pad2 = (n) => String(n).padStart(2, "0");

const toDateKey = (d) => {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// Stable daily forecast for sparse count data:
// - EWMA captures recent rate changes without overreacting to spikes.
// - Day-of-week seasonality prevents a flat (constant) forecast.
// - Poisson predictive interval provides uncertainty bounds.
const ewmaSeasonalPoissonForecast = (
  y,
  dates,
  horizon,
  { span = 10, seasonalitySmoothing = 1, interval = 0.8 } = {}
) => {
  const series = Array.isArray(y) ? y.map((v) => Math.max(0, Number(v) || 0)) : [];
  const obsDates = Array.isArray(dates) ? dates : [];
  const n = series.length;
  const h = Math.max(0, Math.min(60, Number(horizon) || 0));
  const ci = clamp(Number(interval) || 0.8, 0.5, 0.95);

  const sum = series.reduce((acc, v) => acc + v, 0);
  const overallMean = n > 0 ? sum / n : 0;

  // EWMA recent rate
  const safeSpan = clamp(Math.floor(Number(span) || 10), 3, 30);
  const alpha = 2 / (safeSpan + 1);
  let ewma = n > 0 ? series[0] : 0;
  for (let i = 1; i < n; i += 1) {
    ewma = alpha * series[i] + (1 - alpha) * ewma;
  }

  // Small drift based on last vs previous week (bounded so it can't go wild)
  const w = Math.min(7, n);
  const w2 = Math.min(14, n);
  const last = w > 0 ? series.slice(n - w).reduce((a, v) => a + v, 0) / w : overallMean;
  const prev =
    w2 > w
      ? series.slice(n - w2, n - w).reduce((a, v) => a + v, 0) / (w2 - w)
      : last;
  const rawDailyDrift = (last - prev) / Math.max(1, w);
  const maxDrift = Math.max(0.25, 0.25 * Math.max(1, ewma));
  const dailyDrift = clamp(rawDailyDrift, -maxDrift, maxDrift);

  // Day-of-week seasonality (0=Sun..6=Sat), smoothed towards 1.
  const s = Math.max(0, Number(seasonalitySmoothing) || 1);
  const sumByDow = Array(7).fill(0);
  const cntByDow = Array(7).fill(0);
  for (let i = 0; i < n; i += 1) {
    const d = obsDates[i] instanceof Date ? obsDates[i] : null;
    const dow = d ? d.getDay() : null;
    if (dow === null) continue;
    sumByDow[dow] += series[i];
    cntByDow[dow] += 1;
  }
  const seasonal = Array.from({ length: 7 }).map((_, dow) => {
    const muDow = cntByDow[dow] > 0 ? sumByDow[dow] / cntByDow[dow] : overallMean;
    const ratio = (muDow + s) / (overallMean + s);
    return clamp(ratio, 0.6, 1.6);
  });

  const poissonQuantile = (lambda, prob) => {
    const lam = Math.max(0, Number(lambda) || 0);
    const p = clamp(Number(prob) || 0, 0, 1);
    if (lam <= 0) return 0;
    if (p <= 0) return 0;

    // Normal approximation for large lambda
    if (lam > 80) {
      // Approx inverse normal (Acklam) for p
      const invNorm = (pp) => {
        const a = [
          -3.969683028665376e1,
          2.209460984245205e2,
          -2.759285104469687e2,
          1.38357751867269e2,
          -3.066479806614716e1,
          2.506628277459239,
        ];
        const b = [
          -5.447609879822406e1,
          1.615858368580409e2,
          -1.556989798598866e2,
          6.680131188771972e1,
          -1.328068155288572e1,
        ];
        const c = [
          -7.784894002430293e-3,
          -3.223964580411365e-1,
          -2.400758277161838,
          -2.549732539343734,
          4.374664141464968,
          2.938163982698783,
        ];
        const d = [
          7.784695709041462e-3,
          3.224671290700398e-1,
          2.445134137142996,
          3.754408661907416,
        ];
        const plow = 0.02425;
        const phigh = 1 - plow;
        if (pp < plow) {
          const q = Math.sqrt(-2 * Math.log(pp));
          return (
            (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
          );
        }
        if (pp > phigh) {
          const q = Math.sqrt(-2 * Math.log(1 - pp));
          return -(
            (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
          );
        }
        const q = pp - 0.5;
        const r = q * q;
        return (
          (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
          (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
        );
      };

      const z = invNorm(p);
      const x = lam + z * Math.sqrt(lam);
      return Math.max(0, Math.round(x));
    }

    // Exact CDF summation for small/moderate lambda
    const maxK = Math.max(30, Math.ceil(lam + 12 * Math.sqrt(lam + 1) + 10));
    let k = 0;
    let pmf = Math.exp(-lam);
    let cdf = pmf;
    while (cdf < p && k < maxK) {
      k += 1;
      pmf = (pmf * lam) / k;
      cdf += pmf;
    }
    return k;
  };

  const lowerQ = (1 - ci) / 2;
  const upperQ = 1 - lowerQ;

  const baseRate = Math.max(0, ewma);
  const forecast = [];
  const lower = [];
  const upper = [];

  for (let i = 0; i < h; i += 1) {
    const drifted = Math.max(0, baseRate + dailyDrift * i);
    const date = addDays(obsDates[n - 1] || new Date(), i + 1);
    const dow = date.getDay();
    const seasonalRate = drifted * (seasonal[dow] || 1);

    // Gentle shrinkage towards overall mean for stability.
    const mean = 0.75 * seasonalRate + 0.25 * overallMean;
    const mean2 = Math.max(0, Number(mean.toFixed(2)));

    forecast.push(mean2);
    lower.push(poissonQuantile(mean2, lowerQ));
    upper.push(poissonQuantile(mean2, upperQ));
  }

  return {
    forecast,
    lower,
    upper,
    model: {
      method: "ewma_seasonal_poisson",
      span: safeSpan,
      alpha: Number(alpha.toFixed(3)),
      baseEwma: Number(baseRate.toFixed(3)),
      dailyDrift: Number(dailyDrift.toFixed(3)),
      overallMean: Number(overallMean.toFixed(3)),
      seasonality: seasonal.map((v) => Number(v.toFixed(3))),
      interval: ci,
    },
  };
};

export const buildIdeaTrendForecast = (ideas, { daysBack = 30, forecastDays = 7 } = {}) => {
  const safeDaysBack = Math.max(7, Math.min(180, Number(daysBack) || 30));
  const fd = Number(forecastDays);
  const safeForecastDays = Math.max(0, Math.min(60, Number.isFinite(fd) ? fd : 7));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = addDays(today, -(safeDaysBack - 1));
  const labelDates = Array.from({ length: safeDaysBack }).map((_, idx) => addDays(start, idx));

  const labels = Array.from({ length: safeDaysBack }).map((_, idx) => {
    const d = addDays(start, idx);
    return toDateKey(d);
  });

  const countsByDay = new Map(labels.map((k) => [k, 0]));
  for (const idea of Array.isArray(ideas) ? ideas : []) {
    const k = toDateKey(idea?.createdAt);
    if (!k) continue;
    if (countsByDay.has(k)) countsByDay.set(k, (countsByDay.get(k) || 0) + 1);
  }

  const actual = labels.map((k) => countsByDay.get(k) || 0);
  const span = Math.max(5, Math.min(18, Math.floor(safeDaysBack / 3)));
  const { forecast, lower, upper, model } = ewmaSeasonalPoissonForecast(
    actual,
    labelDates,
    safeForecastDays,
    { span, seasonalitySmoothing: 1, interval: 0.8 }
  );

  const forecastLabels = Array.from({ length: safeForecastDays }).map((_, idx) => {
    const d = addDays(today, idx + 1);
    return toDateKey(d);
  });

  return {
    labels,
    actual,
    forecastLabels,
    forecast,
    lower,
    upper,
    model,
  };
};
