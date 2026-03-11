interface Player {
  id: string;
  name: string;
}

interface TimeSlotConfig {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface GeneratedMatch {
  player1Id: string;
  player2Id: string;
  scheduledAt: Date | null;
}

/**
 * Generate all round-robin matchups for a list of players.
 * Uses the circle method to ensure balanced scheduling.
 */
export function generateRoundRobinMatchups(players: Player[]): { player1Id: string; player2Id: string }[] {
  const matchups: { player1Id: string; player2Id: string }[] = [];
  const n = players.length;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      matchups.push({
        player1Id: players[i].id,
        player2Id: players[j].id,
      });
    }
  }

  // Shuffle for variety
  for (let i = matchups.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [matchups[i], matchups[j]] = [matchups[j], matchups[i]];
  }

  return matchups;
}

/**
 * Assign matchups to available time slots starting from a given date.
 * Each slot can hold 1 match (1 table).
 */
export function assignMatchesToSlots(
  matchups: { player1Id: string; player2Id: string }[],
  slots: TimeSlotConfig[],
  startDate: Date
): GeneratedMatch[] {
  if (slots.length === 0) {
    // No slots configured: return matches without scheduled times
    return matchups.map((m) => ({ ...m, scheduledAt: null }));
  }

  const result: GeneratedMatch[] = [];
  let currentDate = new Date(startDate);
  let matchIndex = 0;

  // Generate dates for up to 6 months ahead
  const maxDate = new Date(startDate);
  maxDate.setMonth(maxDate.getMonth() + 6);

  while (matchIndex < matchups.length && currentDate < maxDate) {
    const dayOfWeek = currentDate.getDay();
    const daySlots = slots
      .filter((s) => s.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (const slot of daySlots) {
      if (matchIndex >= matchups.length) break;

      const [hours, minutes] = slot.startTime.split(":").map(Number);
      const scheduledAt = new Date(currentDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      result.push({
        ...matchups[matchIndex],
        scheduledAt,
      });
      matchIndex++;
    }

    // Next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // If we ran out of slots, assign remaining without dates
  while (matchIndex < matchups.length) {
    result.push({
      ...matchups[matchIndex],
      scheduledAt: null,
    });
    matchIndex++;
  }

  return result;
}

/**
 * Calculate total matches for N players in round-robin.
 */
export function totalRoundRobinMatches(playerCount: number): number {
  return (playerCount * (playerCount - 1)) / 2;
}

/**
 * Estimate weeks needed given matches per week.
 */
export function estimateWeeks(playerCount: number, matchesPerWeek: number): number {
  const total = totalRoundRobinMatches(playerCount);
  return Math.ceil(total / matchesPerWeek);
}
