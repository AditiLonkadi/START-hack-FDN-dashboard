import { z } from "zod";
import { gamesSchema, matchupSchema, matrixSchema, performanceSchema, transactionsSchema, type Game, type Matchup, type Matrix, type Performance, type Transaction } from "@/lib/quantco/types";

const BASE_URL = "https://c2f.public.quantco.cloud";
const TEAM = "FDN";
const RETRIES = 2;

export class QuantcoApiError extends Error {
  constructor(message: string, public readonly status?: number) { super(message); }
}

async function request<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    try {
      // A visible dashboard refreshes at most once every 30–60 seconds. Avoid
      // Next's Data Cache here so a completed-game response is not reused after
      // the client has explicitly requested a fresh server render.
      const response = await fetch(`${BASE_URL}${path}`, { cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) throw new QuantcoApiError(`QuantCo API returned ${response.status} for ${path}`, response.status);
      return schema.parse(await response.json());
    } catch (error) {
      lastError = error;
      if (attempt < RETRIES) await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new QuantcoApiError("QuantCo API request failed");
}

export const quantco = {
  baseUrl: BASE_URL,
  team: TEAM,
  matrix: () => request("/leaderboard/api/matrix?page=1&game_limit=100", matrixSchema),
  performance: () => request(`/leaderboard/api/performance?team=${encodeURIComponent(TEAM)}`, performanceSchema),
  performanceForTeam: (team: string) => request(`/leaderboard/api/performance?team=${encodeURIComponent(team)}`, performanceSchema),
  completedGames: async (): Promise<Game[]> => (await request("/leaderboard/api/games?completed_only=true&page_size=1000", gamesSchema)).items,
  allGames: async (): Promise<Game[]> => (await request("/leaderboard/api/games?page=1&page_size=1000", gamesSchema)).items,
  matchup: (): Promise<Matchup> => request(`/leaderboard/api/matchup?team=${encodeURIComponent(TEAM)}&page=1&game_limit=100`, matchupSchema),
  matchupForTeam: (team: string): Promise<Matchup> => request(`/leaderboard/api/matchup?team=${encodeURIComponent(team)}&page=1&game_limit=100`, matchupSchema),
  transactions: async (gameId: number): Promise<Transaction[]> => {
    const first = await request(`/leaderboard/api/transactions?game_id=${gameId}&team=${encodeURIComponent(TEAM)}&page=1`, transactionsSchema);
    const pages = await Promise.all(Array.from({ length: Math.max(0, first.total_pages - 1) }, (_, index) =>
      request(`/leaderboard/api/transactions?game_id=${gameId}&team=${encodeURIComponent(TEAM)}&page=${index + 2}`, transactionsSchema),
    ));
    return [first, ...pages].flatMap((page) => page.items);
  },
};

export type QuantcoPayload = { matrix: Matrix; performance: Performance; games: Game[]; transactions: Map<number, Transaction[]> };
