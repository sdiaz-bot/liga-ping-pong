import type { PlayerStanding } from "./standings-calculator";

interface BracketMatch {
  player1Id: string | null;
  player2Id: string | null;
  phase: string;
  bracketPosition: number;
}

/**
 * Generate playoff bracket matches from standings.
 * Uses standard seeding: 1v16, 8v9, 5v12, 4v13, 3v14, 6v11, 7v10, 2v15
 */
export function generatePlayoffBracket(
  standings: PlayerStanding[],
  playoffSize: 8 | 16
): BracketMatch[] {
  const qualified = standings.slice(0, playoffSize);
  const matches: BracketMatch[] = [];

  if (playoffSize === 16) {
    // Octavos de final (8 matches)
    const seedOrder16 = [
      [0, 15], [7, 8], [4, 11], [3, 12],
      [2, 13], [5, 10], [6, 9], [1, 14],
    ];
    for (let i = 0; i < seedOrder16.length; i++) {
      const [s1, s2] = seedOrder16[i];
      matches.push({
        player1Id: qualified[s1]?.playerId || null,
        player2Id: qualified[s2]?.playerId || null,
        phase: "octavos",
        bracketPosition: i + 1,
      });
    }

    // Cuartos de final (4 matches) - winners TBD
    for (let i = 0; i < 4; i++) {
      matches.push({
        player1Id: null,
        player2Id: null,
        phase: "cuartos",
        bracketPosition: i + 1,
      });
    }
  } else {
    // Cuartos de final (4 matches) for 8-player bracket
    const seedOrder8 = [
      [0, 7], [3, 4], [2, 5], [1, 6],
    ];
    for (let i = 0; i < seedOrder8.length; i++) {
      const [s1, s2] = seedOrder8[i];
      matches.push({
        player1Id: qualified[s1]?.playerId || null,
        player2Id: qualified[s2]?.playerId || null,
        phase: "cuartos",
        bracketPosition: i + 1,
      });
    }
  }

  // Semifinals (2 matches) - winners TBD
  for (let i = 0; i < 2; i++) {
    matches.push({
      player1Id: null,
      player2Id: null,
      phase: "semis",
      bracketPosition: i + 1,
    });
  }

  // Final (1 match)
  matches.push({
    player1Id: null,
    player2Id: null,
    phase: "final",
    bracketPosition: 1,
  });

  // Third place (1 match)
  matches.push({
    player1Id: null,
    player2Id: null,
    phase: "tercer_puesto",
    bracketPosition: 1,
  });

  return matches;
}

/**
 * Get the next phase after the current one.
 */
export function getNextPhase(currentPhase: string): string | null {
  const order: Record<string, string> = {
    octavos: "cuartos",
    cuartos: "semis",
    semis: "final",
  };
  return order[currentPhase] || null;
}

/**
 * Determine which bracket position in the next phase a winner should go to.
 * E.g., octavos position 1 winner goes to cuartos position 1 (upper slot),
 * octavos position 2 winner goes to cuartos position 1 (lower slot), etc.
 */
export function getNextBracketPosition(
  currentPhase: string,
  currentPosition: number
): { position: number; slot: "player1" | "player2" } {
  const nextPosition = Math.ceil(currentPosition / 2);
  const slot = currentPosition % 2 === 1 ? "player1" : "player2";
  return { position: nextPosition, slot };
}
