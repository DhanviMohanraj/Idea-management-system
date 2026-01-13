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

// Bayesian Poisson forecast (Gamma-Poisson mixture) with exponential decay weights.
// Best fit here: daily submission counts are non-negative integers and usually sparse.
const bayesianPoissonForecast = (
  y,
  horizon,
  {
    halfLifeDays = 14,
    priorAlpha = 1,
    priorBeta = 10,
    interval = 0.8,
  } = {}
) => {
  const series = Array.isArray(y) ? y.map((v) => Math.max(0, Number(v) || 0)) : [];
  const n = series.length;
  const h = Math.max(0, Math.min(60, Number(horizon) || 0));

  const hl = Math.max(3, Math.min(90, Number(halfLifeDays) || 14));
  const decay = Math.log(2) / hl;
  const a0 = Math.max(1e-3, Number(priorAlpha) || 1);
  const b0 = Math.max(1e-3, Number(priorBeta) || 10);
  const ci = Math.max(0.5, Math.min(0.95, Number(interval) || 0.8));

  let sumWX = 0;
  let sumW = 0;
  for (let t = 0; t < n; t += 1) {
    const age = n - 1 - t;
    const w = Math.exp(-decay * age);
    sumW += w;
    sumWX += w * series[t];
  }

  const postAlpha = a0 + sumWX;
  const postBeta = b0 + sumW;
  const lambda = postAlpha / postBeta;
  const mean = Math.max(0, Number(lambda.toFixed(2)));

  // Predictive distribution: Negative Binomial under Gamma-Poisson mixture.
  // r=postAlpha, p=postBeta/(postBeta+1)
  const r = postAlpha;
  const p = postBeta / (postBeta + 1);
  const q = 1 - p;
  const varY = lambda + (lambda * lambda) / r;
  const maxK = Math.max(20, Math.ceil(lambda + 8 * Math.sqrt(varY) + 10));

  const quantile = (target) => {
    if (target <= 0) return 0;
    if (target >= 1) return maxK;

    let pk = Math.exp(r * Math.log(p));
    let cdf = pk;
    if (cdf >= target) return 0;

    for (let k = 0; k < maxK; k += 1) {
      pk = pk * ((k + r) / (k + 1)) * q;
      cdf += pk;
      if (cdf >= target) return k + 1;
    }
    return maxK;
  };

  const lowerQ = (1 - ci) / 2;
  const upperQ = 1 - lowerQ;
  const lo = quantile(lowerQ);
  const hi = quantile(upperQ);

  return {
    forecast: Array(h).fill(mean),
    lower: Array(h).fill(lo),
    upper: Array(h).fill(hi),
    model: {
      method: "bayes_poisson",
      halfLifeDays: hl,
      priorAlpha: a0,
      priorBeta: b0,
      postAlpha: Number(postAlpha.toFixed(2)),
      postBeta: Number(postBeta.toFixed(2)),
      lambda: mean,
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
  const halfLifeDays = Math.max(5, Math.min(30, Math.floor(safeDaysBack / 2)));
  const { forecast, lower, upper, model } = bayesianPoissonForecast(actual, safeForecastDays, {
    halfLifeDays,
    priorAlpha: 1,
    priorBeta: 10,
    interval: 0.8,
  });

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
