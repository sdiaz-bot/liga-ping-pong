interface MatchResult {
  id: string;
  player1Id: string;
  player2Id: string;
  winnerId: string | null;
  status: string;
  sets: { player1Score: number; player2Score: number }[];
}

export interface PlayerStanding {
  playerId: string;
  playerName: string;
  department: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  setsWon: number;
  setsLost: number;
  setDiff: number;
  pointsScored: number;
  pointsConceded: number;
  pointDiff: number;
  position: number;
  qualified: boolean;
}

export function calculateStandings(
  players: { id: string; name: string; department: string }[],
  matches: MatchResult[],
  playoffSize: number = 8
): PlayerStanding[] {
  const standingsMap = new Map<string, PlayerStanding>();

  // Initialize standings for all players
  for (const player of players) {
    standingsMap.set(player.id, {
      playerId: player.id,
      playerName: player.name,
      department: player.department,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      setsWon: 0,
      setsLost: 0,
      setDiff: 0,
      pointsScored: 0,
      pointsConceded: 0,
      pointDiff: 0,
      position: 0,
      qualified: false,
    });
  }

  // Process completed matches (round_robin only)
  const completedMatches = matches.filter(
    (m) => m.status === "completed" && m.winnerId
  );

  for (const match of completedMatches) {
    const p1 = standingsMap.get(match.player1Id);
    const p2 = standingsMap.get(match.player2Id);
    if (!p1 || !p2) continue;

    p1.played++;
    p2.played++;

    // Points: Win = 3, Loss = 1
    if (match.winnerId === match.player1Id) {
      p1.won++;
      p1.points += 3;
      p2.lost++;
      p2.points += 1;
    } else {
      p2.won++;
      p2.points += 3;
      p1.lost++;
      p1.points += 1;
    }

    // Set and point stats
    for (const set of match.sets) {
      p1.setsWon += set.player1Score > set.player2Score ? 1 : 0;
      p1.setsLost += set.player1Score < set.player2Score ? 1 : 0;
      p2.setsWon += set.player2Score > set.player1Score ? 1 : 0;
      p2.setsLost += set.player2Score < set.player1Score ? 1 : 0;
      p1.pointsScored += set.player1Score;
      p1.pointsConceded += set.player2Score;
      p2.pointsScored += set.player2Score;
      p2.pointsConceded += set.player1Score;
    }
  }

  // Process forfeited matches
  const forfeitedMatches = matches.filter((m) => m.status === "forfeited");
  for (const match of forfeitedMatches) {
    const p1 = standingsMap.get(match.player1Id);
    const p2 = standingsMap.get(match.player2Id);
    if (!p1 || !p2) continue;

    p1.played++;
    p2.played++;

    if (match.winnerId === match.player1Id) {
      p1.won++;
      p1.points += 3;
      p2.lost++;
      // Forfeit: loser gets 0 points
    } else if (match.winnerId === match.player2Id) {
      p2.won++;
      p2.points += 3;
      p1.lost++;
    }
  }

  // Calculate diffs
  const standings = Array.from(standingsMap.values());
  for (const s of standings) {
    s.setDiff = s.setsWon - s.setsLost;
    s.pointDiff = s.pointsScored - s.pointsConceded;
  }

  // Build head-to-head lookup for tiebreaking
  const h2h = new Map<string, Map<string, number>>();
  for (const match of completedMatches) {
    if (match.winnerId) {
      if (!h2h.has(match.winnerId)) h2h.set(match.winnerId, new Map());
      const loserId =
        match.winnerId === match.player1Id
          ? match.player2Id
          : match.player1Id;
      const wins = h2h.get(match.winnerId)!.get(loserId) || 0;
      h2h.get(match.winnerId)!.set(loserId, wins + 1);
    }
  }

  // Sort: points desc, then h2h, then set diff, then point diff
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;

    // Head-to-head
    const aWinsVsB = h2h.get(a.playerId)?.get(b.playerId) || 0;
    const bWinsVsA = h2h.get(b.playerId)?.get(a.playerId) || 0;
    if (aWinsVsB !== bWinsVsA) return bWinsVsA - aWinsVsB;

    if (b.setDiff !== a.setDiff) return b.setDiff - a.setDiff;
    return b.pointDiff - a.pointDiff;
  });

  // Assign positions and qualification
  for (let i = 0; i < standings.length; i++) {
    standings[i].position = i + 1;
    standings[i].qualified = i < playoffSize;
  }

  return standings;
}
