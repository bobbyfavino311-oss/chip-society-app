/**
 * Ultimate Texas Hold'em — pure game engine
 * No UI concerns. Stateless pure functions only.
 */
import { createDeck, shuffleDeck, getBestHand, compareHands } from './pokerEngine';
import type { Card, HandResult } from './pokerEngine';

export type { Card, HandResult };

// ─── Re-export deck helpers ───────────────────────────────────────────────────
export function createUTHDeck(): Card[] { return createDeck(); }
export function shuffleUTHDeck(deck: Card[]): Card[] { return shuffleDeck(deck); }

// ─── Deal ─────────────────────────────────────────────────────────────────────
export interface UTHDeal {
  playerHole:  Card[];   // 2 player hole cards
  dealerHole:  Card[];   // 2 dealer hole cards (initially face-down)
  community:   Card[];   // 5 community cards (dealt sequentially)
}

export function dealUTHHands(deck: Card[]): UTHDeal {
  const d = [...deck];
  return {
    playerHole:  [d[0], d[1]],
    dealerHole:  [d[2], d[3]],
    community:   [d[4], d[5], d[6], d[7], d[8]],
  };
}

// ─── Qualification ────────────────────────────────────────────────────────────
/** Dealer must have Pair or better to qualify */
export function uthDealerQualifies(hand: HandResult): boolean {
  return hand.rank >= 1;
}

// ─── Blind pay table ──────────────────────────────────────────────────────────
/** Returns the multiplier for the Blind bet (0 = push) */
export function getBlindMultiplier(hand: HandResult): number {
  if (hand.name === 'Royal Flush')     return 500;
  if (hand.name === 'Straight Flush')  return 50;
  if (hand.name === 'Four of a Kind')  return 10;
  if (hand.name === 'Full House')      return 3;
  if (hand.name === 'Flush')           return 1.5;
  if (hand.name === 'Straight')        return 1;
  return 0; // push
}

// ─── Trips pay table ──────────────────────────────────────────────────────────
/** Returns the Trips multiplier for the player's best hand (0 = loss) */
export function getTripsMultiplier(hand: HandResult): number {
  if (hand.name === 'Royal Flush')     return 50;
  if (hand.name === 'Straight Flush')  return 40;
  if (hand.name === 'Four of a Kind')  return 30;
  if (hand.name === 'Full House')      return 8;
  if (hand.name === 'Flush')           return 6;
  if (hand.name === 'Straight')        return 5;
  if (hand.name === 'Three of a Kind') return 3;
  return 0; // loss
}

// ─── Result ───────────────────────────────────────────────────────────────────
export type UTHComparison = 'player' | 'dealer' | 'tie' | 'folded';

export interface UTHResult {
  playerHand:        HandResult;
  dealerHand:        HandResult;
  dealerQualified:   boolean;
  comparison:        UTHComparison;

  /** Net win/loss on the PLAY wager (before adding back the bet). 0 = push. */
  playNet:    number;
  /** Net win/loss on the ANTE wager. 0 = push / dealer didn't qualify. */
  anteNet:    number;
  /** Net bonus on the BLIND wager (0 = push; never negative). */
  blindNet:   number;
  /** Net win/loss on the TRIPS side bet (negative = lost stake). */
  tripsNet:   number;
  /** Total chips to ADD back to player (after already removing all bets). */
  chipReturn: number;
}

/**
 * Resolve a complete UTH hand.
 *
 * Call this at showdown. The chip math works as follows:
 *   - On DEAL:  removeChips(ante + ante + tripsBet)          [ante + blind + trips]
 *   - On PLAY:  removeChips(ante * playMult)  (0 if folded)
 *   - At result: addChips(result.chipReturn)
 *
 * @param ante       The Ante (= Blind) wager amount.
 * @param playMult   0 if folded, else 1 / 2 / 3 / 4.
 * @param tripsBet   Absolute chip amount on Trips (may be 0).
 * @param folded     true if player folded instead of making a Play.
 */
export function resolveUTH(
  playerHole: Card[],
  dealerHole: Card[],
  community:  Card[],
  ante:       number,
  playMult:   number,
  tripsBet:   number,
  folded:     boolean,
): UTHResult {
  const playerHand = getBestHand(playerHole, community);
  const dealerHand = getBestHand(dealerHole, community);
  const dealerQualified = uthDealerQualifies(dealerHand);

  const cmp = compareHands(playerHand, dealerHand);
  const playerWins = cmp > 0;
  const dealerWins = cmp < 0;

  let comparison: UTHComparison = folded ? 'folded' : playerWins ? 'player' : dealerWins ? 'dealer' : 'tie';

  // ── TRIPS (independent of dealer, resolves on player's best hand) ──────────
  const tripsMult = getTripsMultiplier(playerHand);
  const tripsNet  = tripsMult > 0
    ? Math.floor(tripsBet * tripsMult)   // win
    : -tripsBet;                          // loss
  const tripsReturn = tripsMult > 0 ? tripsBet + Math.floor(tripsBet * tripsMult) : 0;

  // ── FOLD path ──────────────────────────────────────────────────────────────
  if (folded) {
    return {
      playerHand, dealerHand, dealerQualified, comparison,
      playNet:  0,
      anteNet:  -ante,   // lost ante
      blindNet: 0,       // lost blind
      tripsNet,
      chipReturn: tripsReturn,   // only trips returned
    };
  }

  // ── PLAY wager ────────────────────────────────────────────────────────────
  const playBet = ante * playMult;
  let playNet: number;
  let playReturn: number;
  if (playerWins)     { playNet = playBet;  playReturn = playBet * 2; }
  else if (dealerWins){ playNet = -playBet; playReturn = 0; }
  else                { playNet = 0;        playReturn = playBet; }   // push

  // ── ANTE wager ────────────────────────────────────────────────────────────
  let anteNet: number;
  let anteReturn: number;
  if (!dealerQualified) {
    // Ante pushes regardless of outcome
    anteNet = 0; anteReturn = ante;
  } else if (playerWins)  { anteNet = ante;  anteReturn = ante * 2; }
  else if (dealerWins)    { anteNet = -ante; anteReturn = 0; }
  else                    { anteNet = 0;     anteReturn = ante; }   // tie push

  // ── BLIND wager ───────────────────────────────────────────────────────────
  // Pays only when player beats dealer AND has Straight or better
  let blindNet: number;
  let blindReturn: number;
  if (playerWins) {
    const bm = getBlindMultiplier(playerHand);
    if (bm > 0) {
      blindNet    = Math.floor(ante * bm);
      blindReturn = ante + Math.floor(ante * bm);
    } else {
      // Straight or better required; push otherwise
      blindNet    = 0;
      blindReturn = ante;
    }
  } else {
    // Dealer wins or tie → blind pushes
    blindNet    = 0;
    blindReturn = ante;
  }

  const chipReturn = playReturn + anteReturn + blindReturn + tripsReturn;

  return {
    playerHand, dealerHand, dealerQualified, comparison,
    playNet, anteNet, blindNet, tripsNet,
    chipReturn,
  };
}

// ─── Live hand description ────────────────────────────────────────────────────
/**
 * Given hole cards + however many community cards have been revealed,
 * returns the current best hand name for the live analyzer.
 */
export function getLiveHandName(holeCards: Card[], revealed: Card[]): string {
  if (holeCards.length === 0) return '';
  const all = [...holeCards, ...revealed];
  if (all.length < 5) {
    // Can't form a 5-card hand; show highest hole card
    const sorted = [...holeCards].sort((a, b) => b.value - a.value);
    return `HIGH CARD`;
  }
  const hand = getBestHand(holeCards, revealed);
  return hand.name.toUpperCase();
}
