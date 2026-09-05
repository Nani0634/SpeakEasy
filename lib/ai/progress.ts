export type DailyProgress = {
  date: string;
  minutes: number;
  goal: number;
};

const STORAGE_KEY = "speakeasy-daily-progress";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export function getDailyProgress(): DailyProgress {
  if (typeof window === "undefined") {
    return {
      date: getToday(),
      minutes: 0,
      goal: 10,
    };
  }

  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return {
      date: getToday(),
      minutes: 0,
      goal: 10,
    };
  }

  try {
    const parsed = JSON.parse(saved);

    if (parsed.date !== getToday()) {
      const fresh = {
        date: getToday(),
        minutes: 0,
        goal: parsed.goal || 10,
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(fresh)
      );

      return fresh;
    }

    return parsed;
  } catch {
    return {
      date: getToday(),
      minutes: 0,
      goal: 10,
    };
  }
}

export function addDailyMinutes(minutes: number) {
  const current = getDailyProgress();

  const updated = {
    ...current,
    minutes: Math.min(
      current.minutes + minutes,
      current.goal
    ),
  };

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated)
  );

  return updated;
}