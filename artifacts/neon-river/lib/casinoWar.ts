/**
 * Casino War — pure game engine
 * Ace-high, 6-deck shoe shuffled each round.
 * Tie Bet pays 10:1. War tie bonus pays 2:1 on war raise.
 */

import type { Suit } from './pokerEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CWCard {
  rank: string;
  suit: Suit;      // 'S' | 'H' | 'D' | 'C'  — compatible with PlayingCard
  value: number;   // 2–14 (Ace = 14)
  color: 'red' | 'black';
}

export type CWOutcome    = 'player_wins' | 'dealer_wins' | 'tie';
export type CWWarOutcome = 'player_wins' | 'dealer_wins' | 'war_tie';

export interface CWResult {
  outcome:    CWOutcome;
  warOutcome?: CWWarOutcome;
  isSurrender?: boolean;
  ante:        number;
  tieBet:      number;
  /** Net chips gained / lost on the Ante (push = 0) */
  anteNet:     number;
  /** Net chips gained / lost on the Tie Bet */
  tieBetNet:   number;
  /** Net chips gained / lost on the war raise (0 if no war) */
  warNet:      number;
  /** Total net chip change for the full round */
  netChips:    number;
}

// ─── Deck helpers ─────────────────────────────────────────────────────────────

const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'] as const;
const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
const RED_SUITS = new Set<Suit>(['H', 'D']);

function buildDeck(): CWCard[] {
  const deck: CWCard[] = [];
  for (const suit of SUITS) {
    RANKS.forEach((rank, i) => {
      deck.push({ rank, suit, value: i + 2, color: RED_SUITS.has(suit) ? 'red' : 'black' });
    });
  }
  return deck;
}

function shuffle(deck: CWCard[]): CWCard[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Deal the initial two cards.
 * Returns the remaining deck (for a follow-up war deal).
 */
export function dealCasinoWar(): {
  deck: CWCard[];
  playerCard: CWCard;
  dealerCard: CWCard;
  outcome: CWOutcome;
} {
  const deck = shuffle(buildDeck());
  const playerCard = deck[0];
  const dealerCard = deck[1];
  const remaining  = deck.slice(2);

  let outcome: CWOutcome;
  if      (playerCard.value > dealerCard.value) outcome = 'player_wins';
  else if (playerCard.value < dealerCard.value) outcome = 'dealer_wins';
  else                                           outcome = 'tie';

  return { deck: remaining, playerCard, dealerCard, outcome };
}

/**
 * Deal the war cards (player's second card beats dealer's second card).
 * Standard casino war burns 3 cards before the war card — we skip burns
 * since the deck is already freshly shuffled.
 */
export function dealWarCards(deck: CWCard[]): {
  warDealerCard: CWCard;
  warPlayerCard: CWCard;
  warOutcome: CWWarOutcome;
} {
  // Deal order: dealer first, then player (matching UTH / live table convention)
  const warDealerCard = deck[0];
  const warPlayerCard = deck[1];

  let warOutcome: CWWarOutcome;
  if      (warPlayerCard.value > warDealerCard.value) warOutcome = 'player_wins';
  else if (warPlayerCard.value < warDealerCard.value) warOutcome = 'dealer_wins';
  else                                                 warOutcome = 'war_tie';

  return { warDealerCard, warPlayerCard, warOutcome };
}

/**
 * Resolve the complete round and compute net chip change.
 *
 * Chip accounting (ante = 100 for illustration):
 *
 *   Player wins initial:      anteNet = +100,         warNet =    0
 *   Dealer wins initial:      anteNet = −100,         warNet =    0
 *   Tie + Surrender:          anteNet = −50 (floor),  warNet =    0
 *   Tie + War — player wins:  anteNet =    0 (push),  warNet = +100 (raise 1:1)
 *   Tie + War — dealer wins:  anteNet = −100,         warNet = −100 (lose raise)
 *   Tie + War — war tie:      anteNet =    0 (push),  warNet = +200 (raise 2:1 bonus)
 *
 *   Tie Bet (10:1):
 *     Initial tie:            tieBetNet = +10 × tieBet
 *     No tie:                 tieBetNet = −tieBet
 */
export function resolveCasinoWar(params: {
  outcome:      CWOutcome;
  warOutcome?:  CWWarOutcome;
  isSurrender?: boolean;
  ante:         number;
  tieBet:       number;
}): CWResult {
  const { outcome, warOutcome, isSurrender, ante, tieBet } = params;

  // Tie Bet
  const tieBetNet = tieBet > 0
    ? (outcome === 'tie' ? tieBet * 10 : -tieBet)
    : 0;

  let anteNet = 0;
  let warNet  = 0;

  if (outcome === 'player_wins') {
    anteNet = ante;

  } else if (outcome === 'dealer_wins') {
    anteNet = -ante;

  } else {
    // ── TIE ──────────────────────────────────────────────────────────
    if (isSurrender) {
      anteNet = -Math.floor(ante / 2);

    } else {
      // Go to War
      switch (warOutcome) {
        case 'player_wins':
          anteNet = 0;       // original ante pushes
          warNet  = ante;    // win raise 1:1
          break;
        case 'dealer_wins':
          anteNet = -ante;   // lose original ante
          warNet  = -ante;   // lose raise
          break;
        case 'war_tie':
          anteNet = 0;       // original ante pushes
          warNet  = ante * 2;// win raise at 2:1 bonus
          break;
      }
    }
  }

  return {
    outcome,
    warOutcome,
    isSurrender,
    ante,
    tieBet,
    anteNet,
    tieBetNet,
    warNet,
    netChips: anteNet + tieBetNet + warNet,
  };
}

/** Human-readable rank label for display */
export function rankLabel(card: CWCard): string {
  return card.rank;
}
