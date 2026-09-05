const STREAK_KEY = "speakeasy-streak";

type StreakData = {
  count: number;
  lastPracticeDate: string | null;
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export function getStreak(): StreakData {
  if (typeof window === "undefined") {
    return {
      count: 0,
      lastPracticeDate: null,
    };
  }

  const saved = localStorage.getItem(STREAK_KEY);

  if (!saved) {
    return {
      count: 0,
      lastPracticeDate: null,
    };
  }

  try {
    return JSON.parse(saved);
  } catch {
    return {
      count: 0,
      lastPracticeDate: null,
    };
  }
}

export function updateStreak() {
  const current = getStreak();
  const today = getToday();

  if (current.lastPracticeDate === today) {
    return current;
  }

  let count = current.count;

  if (current.lastPracticeDate) {
    const previous = new Date(current.lastPracticeDate);
    const currentDate = new Date(today);

    const difference =
      Math.floor(
        (currentDate.getTime() - previous.getTime()) /
          (1000 * 60 * 60 * 24)
      );

    if (difference === 1) {
      count += 1;
    } else {
      count = 1;
    }
  } else {
    count = 1;
  }

  const updated = {
    count,
    lastPracticeDate: today,
  };

  localStorage.setItem(
    STREAK_KEY,
    JSON.stringify(updated)
  );

  return updated;
}