import { useCallback, useEffect, useRef, useState } from 'react';
import { AIDifficulty, AIAction, AIPersonality, getAIDecision, getAIDelay, getRaiseAmount, getBotPersonality, analyzeBoardTexture } from '../lib/aiBot';
import { Card, createVariantDeck, describeHand, determineWinnersVariant, GameVariant, getPreflopStrength, getPostflopStrengthVariant, shuffleDeck } from '../lib/pokerEngine';

const SMALL_BLIND = 50;
const BIG_BLIND = 100;

/**
 * Generates a bot chip stack matched to the human player's bankroll.
 * Bots are spread between ~50% and ~200% of humanChips so every seat looks
 * like a real player at the same stake level. Clamped to at least minBuyIn
 * so every bot qualifies to sit at the table.
 */
function generateMatchedBotStack(humanChips: number, minBuyIn: number, botIndex: number): number {
  // Predetermined spread: bots range from 62% to 185% of humanChips.
  // This creates a realistic table — some opponents a little short, some deep.
  const RATIOS = [0.62, 0.85, 1.10, 1.48, 1.85];
  const ratio  = RATIOS[botIndex % RATIOS.length];
  const jitter = 0.88 + Math.random() * 0.24; // ±12% session variance
  const raw    = humanChips * ratio * jitter;
  // Round to denomination appropriate for this chip level
  const denom =
    humanChips >= 1_000_000 ? 100_000 :
    humanChips >= 100_000   ? 10_000  :
    humanChips >= 10_000    ? 1_000   :
    humanChips >= 1_000     ? 500     : 100;
  return Math.max(Math.round(raw / denom) * denom, minBuyIn);
}
const TIMER_SECONDS = 20;
const AI_NAMES = ['Ace', 'Blaze', 'Shadow', 'Vegas', 'Ghost'];

export type GamePhase = 'idle' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'handover';
export type PlayerStatus = 'active' | 'folded' | 'allIn';

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface PotResult {
  label: string;       // 'MAIN POT' | 'SIDE POT 1' | ...
  amount: number;
  winnerIds: string[];
  winnerHand: string;  // best hand description, empty for fold-wins or returns
  isReturned: boolean; // true = unmatched excess chips returned, no contest
}

export interface TableConfig {
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
}

const DEFAULT_TABLE_CONFIG: TableConfig = { smallBlind: SMALL_BLIND, bigBlind: BIG_BLIND, minBuyIn: 5_000 };

export interface GamePlayer {
  id: string;
  name: string;
  chips: number;
  holeCards: Card[];
  betInRound: number;
  status: PlayerStatus;
  isHuman: boolean;
  difficulty: AIDifficulty;
  seatIndex: number;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  avatarIndex: number;
  personality: AIPersonality;
  lastAction?: string; // last action label for seat display ('FOLD' | 'CHECK' | 'CALL' | 'RAISE' | 'ALL IN')
  chipDelta: number; // chips won/lost this hand (shown at handover)
}

export interface GameState {
  phase: GamePhase;
  players: GamePlayer[];
  deck: Card[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  currentPlayerIndex: number;
  dealerIndex: number;
  timer: number;
  message: string;
  lastAggressorIndex: number;
  minRaise: number;
  numToAct: number;
  showCards: boolean;
  winnerIds: string[];
  winnerHand: string;
  winnerPot: number; // pot size at time of win (for display)
  allInRunout: boolean; // true when we are running out the board with all players all-in
  sidePots: SidePot[];  // populated when at least one player is all-in for less
  isSplitPot: boolean;  // true when two or more players tie for the same pot
  bigBlind: number;     // table big blind — used for minRaise reset between streets
  variant: GameVariant; // which poker variant is being played
  potResults: PotResult[];              // per-pot winners populated at handover
  playerContribs: Record<string, number>; // chips each player invested this hand (pre-win)
  returnedChips: Record<string, number>;  // unmatched excess returned to each player
}

const INITIAL_STATE: GameState = {
  phase: 'idle',
  players: [],
  deck: [],
  communityCards: [],
  pot: 0,
  currentBet: 0,
  currentPlayerIndex: 0,
  dealerIndex: 0,
  timer: TIMER_SECONDS,
  message: '',
  lastAggressorIndex: -1,
  minRaise: BIG_BLIND,
  numToAct: 0,
  showCards: false,
  winnerIds: [],
  winnerHand: '',
  winnerPot: 0,
  allInRunout: false,
  sidePots: [],
  isSplitPot: false,
  bigBlind: BIG_BLIND,
  variant: 'texas_holdem',
  potResults: [],
  playerContribs: {},
  returnedChips: {},
};

function getActivePlayers(players: GamePlayer[]): GamePlayer[] {
  return players.filter(p => p.status === 'active');
}

function nextActiveIndex(players: GamePlayer[], from: number): number {
  let next = (from + 1) % players.length;
  for (let i = 0; i < players.length; i++) {
    if (players[next].status === 'active') return next;
    next = (next + 1) % players.length;
  }
  return from; // fallback – should never happen if numToAct > 0
}

// Deal any missing community cards (flop / turn / river runout)
function runOutBoard(state: GameState): GameState {
  let { communityCards, deck } = state;
  if (communityCards.length < 3 && deck.length >= 3) {
    communityCards = [deck[0], deck[1], deck[2]];
    deck = deck.slice(3);
  }
  if (communityCards.length < 4 && deck.length >= 1) {
    communityCards = [...communityCards, deck[0]];
    deck = deck.slice(1);
  }
  if (communityCards.length < 5 && deck.length >= 1) {
    communityCards = [...communityCards, deck[0]];
    deck = deck.slice(1);
  }
  return { ...state, communityCards, deck };
}

// ─── Side-pot computation ────────────────────────────────────────────────────
// chipDelta is negative for every chip invested during the hand (before winnings).
// So -player.chipDelta = total chips that player put into the pot this hand.

function computeSidePots(players: GamePlayer[]): SidePot[] {
  const contribs = players.map(p => ({
    id: p.id,
    invested: -p.chipDelta,
    isEligible: p.status === 'active' || p.status === 'allIn',
    isAllIn: p.status === 'allIn',
  }));

  const eligible = contribs.filter(c => c.isEligible);
  if (eligible.length <= 1) return [];

  // All-in "cap" levels sorted ascending
  const allInLevels = [...new Set(
    contribs.filter(c => c.isAllIn).map(c => c.invested)
  )].sort((a, b) => a - b);

  if (allInLevels.length === 0) return []; // no all-ins → single pot

  const maxInvested = Math.max(...contribs.map(c => c.invested));
  // Build unique level breakpoints, ending with the max contribution
  const levels = [...allInLevels, maxInvested]
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => a - b);

  const pots: SidePot[] = [];
  let prevLevel = 0;

  for (const level of levels) {
    if (level <= prevLevel) continue;
    const diff = level - prevLevel;

    let potAmount = 0;
    for (const c of contribs) {
      potAmount += Math.min(Math.max(0, c.invested - prevLevel), diff);
    }

    const eligibleForThis = eligible
      .filter(c => c.invested >= level)
      .map(c => c.id);

    if (potAmount > 0 && eligibleForThis.length > 0) {
      pots.push({ amount: potAmount, eligiblePlayerIds: eligibleForThis });
    }
    prevLevel = level;
  }

  return pots;
}

function makeWinnerLabel(players: GamePlayer[], winnerIds: string[]): string {
  return players
    .filter(p => winnerIds.includes(p.id))
    .map(p => (p.isHuman ? 'You' : p.name))
    .join(' & ');
}

function buildContribs(players: GamePlayer[]): Record<string, number> {
  const c: Record<string, number> = {};
  for (const p of players) c[p.id] = Math.max(0, -p.chipDelta);
  return c;
}

function doShowdown(state: GameState): GameState {
  // Check single-survivor BEFORE running out the board — fold wins must not
  // reveal community cards that were never dealt in the real hand.
  const eligible = state.players.filter(p => p.status === 'active' || p.status === 'allIn');
  if (eligible.length === 0) return { ...state, phase: 'handover', sidePots: [], isSplitPot: false, potResults: [], playerContribs: {}, returnedChips: {} };

  // ── Single survivor — everyone else folded, no board runout ────────────
  if (eligible.length === 1) {
    const winner = eligible[0];
    const potSize = state.pot;
    const playerContribs = buildContribs(state.players);
    const players = state.players.map(p =>
      p.id === winner.id
        ? { ...p, chips: p.chips + potSize, chipDelta: p.chipDelta + potSize }
        : p
    );
    const msg = winner.isHuman
      ? 'Everyone folded — you win!'
      : `Everyone folded — ${winner.name} wins!`;
    const potResults: PotResult[] = [{ label: 'MAIN POT', amount: potSize, winnerIds: [winner.id], winnerHand: '', isReturned: false }];
    return {
      ...state, players, phase: 'handover', showCards: false, allInRunout: false,
      winnerIds: [winner.id], winnerHand: '', winnerPot: potSize,
      message: msg,
      pot: 0, sidePots: [], isSplitPot: false,
      potResults, playerContribs, returnedChips: {},
    };
  }

  // ── 2+ eligible players — run remaining board cards then evaluate ───────
  const s = runOutBoard(state);
  const potSize = s.pot;

  // ── Compute side pots ──────────────────────────────────────────────────
  const sidePots = computeSidePots(s.players);

  if (sidePots.length >= 1) {
    // Capture contributions before distributing wins
    const playerContribs = buildContribs(s.players);

    // Evaluate each pot separately and distribute chips
    let playersMut = s.players.map(p => ({ ...p }));
    const chipGains: Record<string, number> = {};
    const returnedChips: Record<string, number> = {};
    const potResults: PotResult[] = [];
    // Track the first contested pot's winners for the headline display
    let mainWinnerIds: string[] = [];
    let mainWinnerHand = '';
    let mainPotIdx = -1; // index of first contested pot

    for (let pi = 0; pi < sidePots.length; pi++) {
      const pot = sidePots[pi];
      const potEligible = eligible.filter(p => pot.eligiblePlayerIds.includes(p.id));
      if (potEligible.length === 0) continue;

      const label = potResults.filter(r => !r.isReturned).length === 0 ? 'MAIN POT' : `SIDE POT ${potResults.filter(r => !r.isReturned).length}`;

      // Single eligible player = unmatched excess returned, no contest
      if (potEligible.length === 1) {
        const r = potEligible[0];
        chipGains[r.id] = (chipGains[r.id] ?? 0) + pot.amount;
        returnedChips[r.id] = (returnedChips[r.id] ?? 0) + pot.amount;
        potResults.push({ label, amount: pot.amount, winnerIds: [r.id], winnerHand: '', isReturned: true });
        continue;
      }

      const potWinners = determineWinnersVariant(
        potEligible.map(p => ({ id: p.id, holeCards: p.holeCards })),
        s.communityCards,
        s.variant
      );
      const potWinnerIds = potWinners.map(w => w.winnerId);
      const share = Math.floor(pot.amount / potWinnerIds.length);
      for (const wid of potWinnerIds) chipGains[wid] = (chipGains[wid] ?? 0) + share;
      const potHand = potWinners[0] ? describeHand(potWinners[0].handResult) : '';
      potResults.push({ label, amount: pot.amount, winnerIds: potWinnerIds, winnerHand: potHand, isReturned: false });

      if (mainPotIdx === -1) {
        mainPotIdx = pi;
        mainWinnerIds = potWinnerIds;
        mainWinnerHand = potHand;
      }
    }

    playersMut = playersMut.map(p => {
      const gain = chipGains[p.id] ?? 0;
      return { ...p, chips: p.chips + gain, chipDelta: p.chipDelta + gain };
    });

    if (mainWinnerIds.length === 0) mainWinnerIds = [eligible[0].id];
    const isSplit = mainWinnerIds.length > 1;
    const isHumanWinner = mainWinnerIds.includes('human');
    const label = makeWinnerLabel(playersMut, mainWinnerIds);
    const message = isSplit ? `Split pot — ${label}` : (isHumanWinner ? 'You won!' : `${label} wins!`);

    return {
      ...s, players: playersMut, phase: 'handover', showCards: true, allInRunout: false,
      winnerIds: mainWinnerIds, winnerHand: mainWinnerHand, winnerPot: potSize,
      message, pot: 0, sidePots, isSplitPot: isSplit,
      potResults, playerContribs, returnedChips,
    };
  }

  // ── Standard showdown (single pot, no side pots) ────────────────────────
  const playerContribs = buildContribs(s.players);

  const winners = determineWinnersVariant(
    eligible.map(p => ({ id: p.id, holeCards: p.holeCards })),
    s.communityCards,
    s.variant
  );
  const winnerIds = winners.map(w => w.winnerId);
  const share = Math.floor(potSize / winnerIds.length);
  const winnerHand = winners[0] ? describeHand(winners[0].handResult) : '';

  const players = s.players.map(p =>
    winnerIds.includes(p.id)
      ? { ...p, chips: p.chips + share, chipDelta: p.chipDelta + share }
      : p
  );

  const isSplit = winnerIds.length > 1;
  const isHumanWinner = winnerIds.includes('human');
  const label = makeWinnerLabel(players, winnerIds);
  const message = isSplit
    ? `Split pot — ${label}`
    : isHumanWinner ? 'You won!' : `${label} wins!`;

  const potResults: PotResult[] = [{ label: 'MAIN POT', amount: potSize, winnerIds, winnerHand, isReturned: false }];

  return {
    ...s, players, phase: 'handover', showCards: true, allInRunout: false,
    winnerIds, winnerHand, winnerPot: potSize,
    message, pot: 0, sidePots: [], isSplitPot: isSplit,
    potResults, playerContribs, returnedChips: {},
  };
}

function advancePhase(state: GameState): GameState {
  const active = getActivePlayers(state.players);

  // No active players → everyone is all-in or folded → run board and showdown
  if (active.length === 0) return doShowdown(state);
  // Only one active → they win (others folded)
  if (active.length === 1) return doShowdown(state);

  const players = state.players.map(p => ({ ...p, betInRound: 0, lastAction: undefined }));
  const base = { ...state, players, currentBet: 0, minRaise: state.bigBlind };

  let firstActor = (state.dealerIndex + 1) % players.length;
  for (let i = 0; i < players.length; i++) {
    if (players[firstActor].status === 'active') break;
    firstActor = (firstActor + 1) % players.length;
  }

  const numToAct = active.length;

  if (state.phase === 'preflop') {
    const flop = [state.deck[0], state.deck[1], state.deck[2]];
    return { ...base, phase: 'flop', communityCards: flop, deck: state.deck.slice(3), currentPlayerIndex: firstActor, numToAct, timer: TIMER_SECONDS, lastAggressorIndex: firstActor };
  }
  if (state.phase === 'flop') {
    return { ...base, phase: 'turn', communityCards: [...state.communityCards, state.deck[0]], deck: state.deck.slice(1), currentPlayerIndex: firstActor, numToAct, timer: TIMER_SECONDS, lastAggressorIndex: firstActor };
  }
  if (state.phase === 'turn') {
    return { ...base, phase: 'river', communityCards: [...state.communityCards, state.deck[0]], deck: state.deck.slice(1), currentPlayerIndex: firstActor, numToAct, timer: TIMER_SECONDS, lastAggressorIndex: firstActor };
  }
  if (state.phase === 'river') {
    return doShowdown({ ...base, phase: 'showdown' });
  }
  return state;
}

function checkRoundOver(state: GameState): GameState {
  const active = getActivePlayers(state.players);
  if (active.length <= 1) return doShowdown(state);
  if (state.numToAct <= 0) return advancePhase(state);
  return state;
}

function applyAction(state: GameState, action: AIAction, raiseAmount?: number): GameState {
  const players = state.players.map(p => ({ ...p }));
  const player = players[state.currentPlayerIndex];
  let { pot, currentBet, lastAggressorIndex, minRaise } = state;
  let numToAct = state.numToAct - 1;

  switch (action) {
    case 'fold':
      player.status = 'folded';
      break;
    case 'check':
      break;
    case 'call': {
      const callAmt = Math.min(currentBet - player.betInRound, player.chips);
      player.chips -= callAmt;
      player.chipDelta -= callAmt;
      player.betInRound += callAmt;
      pot += callAmt;
      if (player.chips === 0) player.status = 'allIn';
      break;
    }
    case 'raise': {
      const rAmt = raiseAmount ?? minRaise;
      const toCall = currentBet - player.betInRound;
      const total = Math.min(toCall + rAmt, player.chips);
      player.chips -= total;
      player.chipDelta -= total;
      pot += total;
      const newBet = player.betInRound + total;
      if (newBet > currentBet) {
        minRaise = newBet - currentBet;
        currentBet = newBet;
        lastAggressorIndex = state.currentPlayerIndex;
        numToAct = players.filter(p => p.status === 'active' && p.id !== player.id).length;
      }
      player.betInRound = newBet;
      if (player.chips === 0) player.status = 'allIn';
      break;
    }
    case 'allin': {
      const allInAmt = player.chips;
      pot += allInAmt;
      player.chipDelta -= allInAmt;
      player.betInRound += allInAmt;
      if (player.betInRound > currentBet) {
        minRaise = player.betInRound - currentBet;
        currentBet = player.betInRound;
        lastAggressorIndex = state.currentPlayerIndex;
        numToAct = players.filter(p => p.status === 'active' && p.id !== player.id).length;
      }
      player.chips = 0;
      player.status = 'allIn';
      break;
    }
  }

  // Record the last action label on the acting player for seat display
  const ACTION_LABELS: Record<string, string> = {
    fold: 'FOLD', check: 'CHECK', call: 'CALL', raise: 'RAISE', allin: 'ALL IN',
  };
  player.lastAction = ACTION_LABELS[action];

  const active = players.filter(p => p.status === 'active');
  const next = active.length > 0 ? nextActiveIndex(players, state.currentPlayerIndex) : state.currentPlayerIndex;

  const nextState: GameState = {
    ...state,
    players,
    pot,
    currentBet,
    lastAggressorIndex,
    minRaise,
    numToAct: Math.max(0, numToAct),
    currentPlayerIndex: next,
    timer: TIMER_SECONDS,
    message: getActionMsg(player.name, action, raiseAmount ?? minRaise),
  };

  return checkRoundOver(nextState);
}

function getActionMsg(name: string, action: AIAction, amount: number): string {
  return {
    fold: `${name} folds`,
    check: `${name} checks`,
    call: `${name} calls`,
    raise: `${name} raises ${amount}`,
    allin: `${name} goes ALL IN!`,
  }[action];
}

function dealAndPostBlinds(players: GamePlayer[], dealerIdx: number, sb: number = SMALL_BLIND, bb: number = BIG_BLIND, variant: GameVariant = 'texas_holdem'): GameState {
  const deck = shuffleDeck(createVariantDeck(variant));
  const ps = players.map(p => ({
    ...p,
    holeCards: [] as Card[],
    betInRound: 0,
    chipDelta: 0,
    lastAction: undefined,
    status: 'active' as PlayerStatus,
    isDealer: false,
    isSmallBlind: false,
    isBigBlind: false,
  }));
  ps[dealerIdx].isDealer = true;

  let deckCursor = 0;
  const numHoleCards = variant === 'omaha_holdem' ? 4 : 2;
  for (let round = 0; round < numHoleCards; round++) {
    for (const p of ps) p.holeCards.push(deck[deckCursor++]);
  }

  const sbIdx = (dealerIdx + 1) % ps.length;
  const bbIdx = (dealerIdx + 2) % ps.length;

  const sbAmt = Math.min(sb, ps[sbIdx].chips);
  ps[sbIdx].chips -= sbAmt;
  ps[sbIdx].betInRound = sbAmt;
  ps[sbIdx].chipDelta = -sbAmt;
  ps[sbIdx].isSmallBlind = true;
  if (ps[sbIdx].chips === 0) ps[sbIdx].status = 'allIn';

  const bbAmt = Math.min(bb, ps[bbIdx].chips);
  ps[bbIdx].chips -= bbAmt;
  ps[bbIdx].betInRound = bbAmt;
  ps[bbIdx].chipDelta = -bbAmt;
  ps[bbIdx].isBigBlind = true;
  if (ps[bbIdx].chips === 0) ps[bbIdx].status = 'allIn';

  let firstActor = (bbIdx + 1) % ps.length;
  for (let i = 0; i < ps.length; i++) {
    if (ps[firstActor].status === 'active') break;
    firstActor = (firstActor + 1) % ps.length;
  }

  const active = ps.filter(p => p.status === 'active');

  return {
    ...INITIAL_STATE,
    players: ps,
    deck: deck.slice(deckCursor),
    phase: 'preflop',
    pot: sbAmt + bbAmt,
    currentBet: bb,
    minRaise: bb,
    bigBlind: bb,
    currentPlayerIndex: firstActor,
    lastAggressorIndex: bbIdx,
    dealerIndex: dealerIdx,
    numToAct: active.length,
    timer: TIMER_SECONDS,
    message: 'Cards dealt!',
    variant,
  };
}

function executeAIAction(prev: GameState): GameState {
  const player = prev.players[prev.currentPlayerIndex];
  if (!player || player.isHuman) return prev;
  if (player.status !== 'active') return prev;

  const playerCount = prev.players.length;
  const relPos = (prev.currentPlayerIndex - prev.dealerIndex + playerCount) % playerCount;
  const positionAdvantage = Math.min(2, (relPos / Math.max(1, playerCount - 1)) * 2);
  const board = analyzeBoardTexture(prev.communityCards);
  const handStrength = prev.phase === 'preflop'
    ? getPreflopStrength(player.holeCards)
    : getPostflopStrengthVariant(player.holeCards, prev.communityCards, prev.variant);

  const decision = getAIDecision({
    holeCards: player.holeCards,
    communityCards: prev.communityCards,
    myChips: player.chips,
    pot: prev.pot,
    currentBet: prev.currentBet,
    myBetInRound: player.betInRound,
    minRaise: prev.minRaise,
    difficulty: player.difficulty,
    personality: player.personality,
    phase: prev.phase as 'preflop' | 'flop' | 'turn' | 'river',
    numActivePlayers: getActivePlayers(prev.players).length,
    positionAdvantage,
  });

  let raiseAmt: number | undefined;
  if (decision === 'raise') {
    raiseAmt = getRaiseAmount(
      player.difficulty, prev.pot, player.chips, prev.minRaise,
      handStrength, player.personality, board.wetness,
    );
  }

  return applyAction(prev, decision, raiseAmt);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePokerGame(
  difficulty: AIDifficulty,
  humanName: string,
  humanChips: number,
  numPlayers: number = 5,
  tableConfig: TableConfig = DEFAULT_TABLE_CONFIG,
  variant: GameVariant = 'texas_holdem',
) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track which player+phase we already scheduled AI for (prevents double-fire)
  const aiKeyRef = useRef<string>('');

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const clearAI = useCallback(() => {
    if (aiRef.current) { clearTimeout(aiRef.current); aiRef.current = null; }
    aiKeyRef.current = '';
  }, []);

  // ── Countdown timer (runs for ALL players; only auto-folds the human) ──────
  useEffect(() => {
    clearTimer();
    const s = state;
    if (s.phase === 'idle' || s.phase === 'handover' || s.phase === 'showdown') return;
    if (s.allInRunout) return;

    timerRef.current = setInterval(() => {
      setState(prev => {
        if (prev.phase === 'idle' || prev.phase === 'handover' || prev.phase === 'showdown') return prev;
        if (prev.allInRunout) return prev;
        if (prev.timer <= 1) {
          const cur = prev.players[prev.currentPlayerIndex];
          if (cur?.isHuman && cur.status === 'active') return applyAction(prev, 'fold');
          return { ...prev, timer: 1 }; // freeze at 1 for AI (they fire via their own timeout)
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);

    return clearTimer;
  // Re-run whenever the active player or phase changes (not on isProcessing)
  }, [state.currentPlayerIndex, state.phase, state.allInRunout]); // eslint-disable-line

  // ── AI turn handler ───────────────────────────────────────────────────────
  useEffect(() => {
    const s = state;
    if (s.phase === 'idle' || s.phase === 'handover' || s.phase === 'showdown') return;
    if (s.allInRunout) return;

    const currentPlayer = s.players[s.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isHuman) return;
    if (currentPlayer.status !== 'active') return;

    const key = `${s.currentPlayerIndex}-${s.phase}-${s.numToAct}`;
    if (aiKeyRef.current === key) return; // already scheduled
    aiKeyRef.current = key;

    clearAI();
    const delay = getAIDelay(currentPlayer.difficulty);
    aiRef.current = setTimeout(() => {
      setState(prev => {
        const p = prev.players[prev.currentPlayerIndex];
        if (!p || p.isHuman || p.status !== 'active') return prev;
        return executeAIAction(prev);
      });
    }, delay);
    // Note: intentionally NOT returning clearAI here so state changes don't
    // cancel the already-scheduled timeout. aiKeyRef prevents duplicates.
  }, [state.currentPlayerIndex, state.phase, state.numToAct, state.allInRunout]); // eslint-disable-line

  // ── Unmount cleanup — kills both timers so setState never fires after nav-back
  useEffect(() => {
    return () => {
      clearTimer();
      clearAI();
    };
  }, []); // eslint-disable-line

  const startNewHand = useCallback((dealerIdx: number = 0, overrideNumAI?: number) => {
    clearTimer();
    clearAI();

    const numAI = Math.min(5, Math.max(3, overrideNumAI ?? (numPlayers - 1)));

    const players: GamePlayer[] = [
      {
        id: 'human',
        name: humanName,
        chips: humanChips,
        holeCards: [],
        betInRound: 0,
        chipDelta: 0,
        status: 'active',
        isHuman: true,
        difficulty,
        personality: 'passive' as AIPersonality,
        seatIndex: 0,
        isDealer: false,
        isSmallBlind: false,
        isBigBlind: false,
        avatarIndex: 0,
      },
      ...AI_NAMES.slice(0, numAI).map((name, i) => ({
        id: `ai_${i}`,
        name,
        // Bot stacks are 50-200% of humanChips so every opponent is bankroll-matched.
        chips: generateMatchedBotStack(humanChips, tableConfig.minBuyIn, i),
        holeCards: [] as Card[],
        betInRound: 0,
        chipDelta: 0,
        status: 'active' as PlayerStatus,
        isHuman: false,
        difficulty,
        personality: getBotPersonality(i),
        seatIndex: i + 1,
        isDealer: false,
        isSmallBlind: false,
        isBigBlind: false,
        avatarIndex: [9, 13, 12, 15, 7][i % 5],
      })),
    ];

    setState(dealAndPostBlinds(players, dealerIdx, tableConfig.smallBlind, tableConfig.bigBlind, variant));
  }, [difficulty, humanName, humanChips, numPlayers, tableConfig, variant, clearTimer, clearAI]);

  const handleAction = useCallback((action: AIAction, raiseAmount?: number) => {
    clearTimer();
    clearAI();
    setState(prev => {
      const current = prev.players[prev.currentPlayerIndex];
      if (!current?.isHuman || current.status !== 'active') return prev;
      return applyAction(prev, action, raiseAmount);
    });
  }, [clearTimer, clearAI]);

  // Skip a single bot turn immediately
  const skipBotTurn = useCallback(() => {
    clearAI();
    setState(prev => {
      const player = prev.players[prev.currentPlayerIndex];
      if (!player || player.isHuman || player.status !== 'active') return prev;
      return executeAIAction(prev);
    });
  }, [clearAI]);

  // Run out all remaining streets and go straight to showdown
  const skipToShowdown = useCallback(() => {
    clearTimer();
    clearAI();
    setState(prev => {
      if (prev.phase === 'idle' || prev.phase === 'handover' || prev.phase === 'showdown') return prev;
      return doShowdown({ ...prev, allInRunout: false });
    });
  }, [clearTimer, clearAI]);

  const continueAfterHand = useCallback(() => {
    clearTimer();
    clearAI();
    setState(prev => {
      const surviving = prev.players.filter(p => p.chips > 0);
      if (surviving.length < 2) return { ...INITIAL_STATE, message: 'Not enough chips to continue!' };

      const nextDealer = (prev.dealerIndex + 1) % surviving.length;
      const cleanPlayers: GamePlayer[] = surviving.map(p => ({
        ...p,
        holeCards: [],
        betInRound: 0,
        chipDelta: 0,
        status: 'active',
        isDealer: false,
        isSmallBlind: false,
        isBigBlind: false,
      }));

      return dealAndPostBlinds(cleanPlayers, nextDealer, tableConfig.smallBlind, tableConfig.bigBlind, variant);
    });
  }, [clearTimer, clearAI, tableConfig, variant]);

  return { state, startNewHand, handleAction, skipBotTurn, skipToShowdown, continueAfterHand };
}
