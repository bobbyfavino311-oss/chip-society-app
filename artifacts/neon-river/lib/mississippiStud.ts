import type { Suit } from './pokerEngine';
import { evaluate5Cards } from './pokerEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MSCard = { suit: Suit; value: number };

export type MSPhase = 'stake' | 'betting' | 'street3' | 'street4' | 'street5' | 'result';

export interface MSResult {
  handName: string;
  handRank: number;
  mainMult: number;             // -1=lose, 0=push, N=win at N:1
  threeCardBonusName: string;
  threeCardBonusMult: number;   // 0=lose
  folded: boolean;
  foldStreet: 3 | 4 | 5 | null;
  anteNet: number;
  street3Net: number;
  street4Net: number;
  street5Net: number;
  threeCardNet: number;
  netChips: number;
}

// ─── Payout table (exported for Info Modal) ───────────────────────────────────

export const MS_PAYOUTS: { hand: string; mult: number | 'push' | 'lose' }[] = [
  { hand: 'Royal Flush',          mult: 500  },
  { hand: 'Straight Flush',       mult: 100  },
  { hand: 'Four of a Kind',       mult: 40   },
  { hand: 'Full House',           mult: 10   },
  { hand: 'Flush',                mult: 6    },
  { hand: 'Straight',             mult: 4    },
  { hand: 'Three of a Kind',      mult: 3    },
  { hand: 'Two Pair',             mult: 2    },
  { hand: 'Pair of Jacks or Better', mult: 1 },
  { hand: 'Pair of 6s – 10s',    mult: 'push' },
  { hand: 'Lower',                mult: 'lose' },
];

export const TCB_PAYOUTS: { hand: string; mult: number }[] = [
  { hand: 'Straight Flush',  mult: 40 },
  { hand: 'Three of a Kind', mult: 30 },
  { hand: 'Straight',        mult: 6  },
  { hand: 'Flush',           mult: 3  },
  { hand: 'Pair',            mult: 1  },
];

// ─── Deck & deal ──────────────────────────────────────────────────────────────

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];

export function dealMississippiStud(): { holeCards: MSCard[]; communityCards: MSCard[] } {
  const deck: MSCard[] = [];
  for (const suit of SUITS) {
    for (let v = 2; v <= 14; v++) deck.push({ suit, value: v });
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return { holeCards: deck.slice(0, 2), communityCards: deck.slice(2, 5) };
}

// ─── Main hand evaluator ──────────────────────────────────────────────────────

/**
 * Returns -1 = lose, 0 = push, N = win at N:1
 */
function getMSMainMult(name: string, values: number[]): number {
  if (name === 'Royal Flush')     return 500;
  if (name === 'Straight Flush')  return 100;
  if (name === 'Four of a Kind')  return 40;
  if (name === 'Full House')      return 10;
  if (name === 'Flush')           return 6;
  if (name === 'Straight')        return 4;
  if (name === 'Three of a Kind') return 3;
  if (name === 'Two Pair')        return 2;
  if (name === 'One Pair') {
    const pairVal = values[0];
    if (pairVal >= 11) return 1;  // Jacks, Queens, Kings, Aces → 1:1
    if (pairVal >= 6)  return 0;  // 6s–10s → Push
    return -1;                     // 2s–5s → Lose
  }
  return -1;  // High Card → Lose
}

// ─── Three Card Bonus evaluator ───────────────────────────────────────────────

function evaluateThreeCards(cards: MSCard[]): { mult: number; name: string } {
  const vals  = cards.map(c => c.value).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const isFlush  = suits[0] === suits[1] && suits[1] === suits[2];
  const isTrips  = vals[0] === vals[1] && vals[1] === vals[2];
  const isNormalStraight = vals[0] - vals[2] === 2 && new Set(vals).size === 3;
  const isWheel  = vals[0] === 14 && vals[1] === 3 && vals[2] === 2; // A-2-3 low
  const isStraight = isNormalStraight || isWheel;
  const isPair   = vals[0] === vals[1] || vals[1] === vals[2];

  if (isFlush && isStraight) return { mult: 40, name: 'Straight Flush' };
  if (isTrips)               return { mult: 30, name: 'Three of a Kind' };
  if (isStraight)            return { mult: 6,  name: 'Straight' };
  if (isFlush)               return { mult: 3,  name: 'Flush' };
  if (isPair)                return { mult: 1,  name: 'Pair' };
  return { mult: 0, name: 'High Card' };
}

// ─── Resolution ───────────────────────────────────────────────────────────────

export interface MSResolveParams {
  holeCards: MSCard[];
  communityCards: MSCard[];  // always 3
  folded: boolean;
  foldStreet: 3 | 4 | 5 | null;
  ante: number;
  street3Bet: number;
  street4Bet: number;
  street5Bet: number;
  threeCardBet: number;
}

export function resolveMississippiStud(p: MSResolveParams): MSResult {
  const eval5 = evaluate5Cards([...p.holeCards, ...p.communityCards]);
  const mainMult = getMSMainMult(eval5.name, eval5.values);

  const tcb = evaluateThreeCards(p.communityCards);

  let anteNet   = 0;
  let street3Net = 0;
  let street4Net = 0;
  let street5Net = 0;

  if (p.folded) {
    // Lose all bets placed so far (unplaced bets = 0 so safe to negate)
    anteNet    = -p.ante;
    street3Net = p.street3Bet > 0 ? -p.street3Bet : 0;
    street4Net = p.street4Bet > 0 ? -p.street4Bet : 0;
    street5Net = p.street5Bet > 0 ? -p.street5Bet : 0;
  } else {
    anteNet    = p.ante    * mainMult;
    street3Net = p.street3Bet * mainMult;
    street4Net = p.street4Bet * mainMult;
    street5Net = p.street5Bet * mainMult;
  }

  const threeCardNet = p.threeCardBet > 0
    ? (tcb.mult > 0 ? p.threeCardBet * tcb.mult : -p.threeCardBet)
    : 0;

  const netChips = anteNet + street3Net + street4Net + street5Net + threeCardNet;

  return {
    handName: eval5.name,
    handRank: eval5.rank,
    mainMult,
    threeCardBonusName: tcb.name,
    threeCardBonusMult: tcb.mult,
    folded: p.folded,
    foldStreet: p.foldStreet,
    anteNet,
    street3Net,
    street4Net,
    street5Net,
    threeCardNet,
    netChips,
  };
}
