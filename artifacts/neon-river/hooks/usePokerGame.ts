import { useCallback, useEffect, useRef, useState } from 'react';
import { AIDifficulty, AIAction, getAIDecision, getAIDelay, getRaiseAmount } from '../lib/aiBot';
import { Card, createDeck, determineWinners, shuffleDeck } from '../lib/pokerEngine';

const SMALL_BLIND = 50;
const BIG_BLIND = 100;
const TIMER_SECONDS = 30;
const AI_NAMES = ['Ace', 'Blaze', 'Shadow', 'Vegas', 'Ghost'];

export type GamePhase = 'idle' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'handover';
export type PlayerStatus = 'active' | 'folded' | 'allIn';

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

function doShowdown(state: GameState): GameState {
  // Always complete the board before evaluating
  const s = runOutBoard(state);

  const eligible = s.players.filter(p => p.status === 'active' || p.status === 'allIn');
  if (eligible.length === 0) return { ...s, phase: 'handover' };

  const potSize = s.pot;

  if (eligible.length === 1) {
    const winner = eligible[0];
    const players = s.players.map(p =>
      p.id === winner.id
        ? { ...p, chips: p.chips + potSize, chipDelta: p.chipDelta + potSize }
        : p
    );
    return {
      ...s,
      players,
      phase: 'handover',
      showCards: true,
      allInRunout: false,
      winnerIds: [winner.id],
      winnerHand: '',
      winnerPot: potSize,
      message: `${winner.name} wins!`,
      pot: 0,
    };
  }

  const winners = determineWinners(
    eligible.map(p => ({ id: p.id, holeCards: p.holeCards })),
    s.communityCards
  );
  const winnerIds = winners.map(w => w.winnerId);
  const share = Math.floor(potSize / winnerIds.length);
  const winnerHand = winners[0]?.handResult.name ?? '';

  const players = s.players.map(p =>
    winnerIds.includes(p.id)
      ? { ...p, chips: p.chips + share, chipDelta: p.chipDelta + share }
      : p
  );

  const winnerNames = players
    .filter(p => winnerIds.includes(p.id))
    .map(p => p.name)
    .join(' & ');

  return {
    ...s,
    players,
    phase: 'handover',
    showCards: true,
    allInRunout: false,
    winnerIds,
    winnerHand,
    winnerPot: potSize,
    message: `${winnerNames} wins with ${winnerHand}!`,
    pot: 0,
  };
}

function advancePhase(state: GameState): GameState {
  const active = getActivePlayers(state.players);

  // No active players → everyone is all-in or folded → run board and showdown
  if (active.length === 0) return doShowdown(state);
  // Only one active → they win (others folded)
  if (active.length === 1) return doShowdown(state);

  const players = state.players.map(p => ({ ...p, betInRound: 0 }));
  const base = { ...state, players, currentBet: 0, minRaise: BIG_BLIND };

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

function dealAndPostBlinds(players: GamePlayer[], dealerIdx: number): GameState {
  const deck = shuffleDeck(createDeck());
  const ps = players.map(p => ({
    ...p,
    holeCards: [] as Card[],
    betInRound: 0,
    chipDelta: 0,
    status: 'active' as PlayerStatus,
    isDealer: false,
    isSmallBlind: false,
    isBigBlind: false,
  }));
  ps[dealerIdx].isDealer = true;

  let deckCursor = 0;
  for (let round = 0; round < 2; round++) {
    for (const p of ps) p.holeCards.push(deck[deckCursor++]);
  }

  const sbIdx = (dealerIdx + 1) % ps.length;
  const bbIdx = (dealerIdx + 2) % ps.length;

  const sbAmt = Math.min(SMALL_BLIND, ps[sbIdx].chips);
  ps[sbIdx].chips -= sbAmt;
  ps[sbIdx].betInRound = sbAmt;
  ps[sbIdx].chipDelta = -sbAmt;
  ps[sbIdx].isSmallBlind = true;
  if (ps[sbIdx].chips === 0) ps[sbIdx].status = 'allIn';

  const bbAmt = Math.min(BIG_BLIND, ps[bbIdx].chips);
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
    currentBet: BIG_BLIND,
    currentPlayerIndex: firstActor,
    lastAggressorIndex: bbIdx,
    dealerIndex: dealerIdx,
    numToAct: active.length,
    timer: TIMER_SECONDS,
    message: 'Cards dealt!',
  };
}

function executeAIAction(prev: GameState): GameState {
  const player = prev.players[prev.currentPlayerIndex];
  if (!player || player.isHuman) return prev;
  if (player.status !== 'active') return prev;

  const decision = getAIDecision({
    holeCards: player.holeCards,
    communityCards: prev.communityCards,
    myChips: player.chips,
    pot: prev.pot,
    currentBet: prev.currentBet,
    myBetInRound: player.betInRound,
    minRaise: prev.minRaise,
    difficulty: player.difficulty,
    phase: prev.phase as 'preflop' | 'flop' | 'turn' | 'river',
    numActivePlayers: getActivePlayers(prev.players).length,
  });

  let raiseAmt: number | undefined;
  if (decision === 'raise') {
    raiseAmt = getRaiseAmount(player.difficulty, prev.pot, player.chips, prev.minRaise, 0.5);
  }

  return applyAction(prev, decision, raiseAmt);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePokerGame(difficulty: AIDifficulty, humanName: string, humanChips: number) {
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

  const startNewHand = useCallback((dealerIdx: number = 0) => {
    clearTimer();
    clearAI();

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
        seatIndex: 0,
        isDealer: false,
        isSmallBlind: false,
        isBigBlind: false,
        avatarIndex: 0,
      },
      ...AI_NAMES.slice(0, 4).map((name, i) => ({
        id: `ai_${i}`,
        name,
        chips: 1200 + i * 150,
        holeCards: [] as Card[],
        betInRound: 0,
        chipDelta: 0,
        status: 'active' as PlayerStatus,
        isHuman: false,
        difficulty,
        seatIndex: i + 1,
        isDealer: false,
        isSmallBlind: false,
        isBigBlind: false,
        avatarIndex: i + 1,
      })),
    ];

    setState(dealAndPostBlinds(players, dealerIdx));
  }, [difficulty, humanName, humanChips, clearTimer, clearAI]);

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

      return dealAndPostBlinds(cleanPlayers, nextDealer);
    });
  }, [clearTimer, clearAI]);

  return { state, startNewHand, handleAction, skipBotTurn, skipToShowdown, continueAfterHand };
}
