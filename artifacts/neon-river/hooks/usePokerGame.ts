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
  isProcessing: boolean;
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
  isProcessing: false,
};

function getActivePlayers(players: GamePlayer[]): GamePlayer[] {
  return players.filter(p => p.status === 'active');
}

function nextActiveIndex(players: GamePlayer[], from: number): number {
  let next = (from + 1) % players.length;
  let tries = 0;
  while (players[next].status !== 'active' && tries < players.length) {
    next = (next + 1) % players.length;
    tries++;
  }
  return next;
}

function doShowdown(state: GameState): GameState {
  const eligible = state.players.filter(p => p.status === 'active' || p.status === 'allIn');
  if (eligible.length === 0) return { ...state, phase: 'handover' };

  if (eligible.length === 1) {
    const winner = eligible[0];
    const players = state.players.map(p =>
      p.id === winner.id ? { ...p, chips: p.chips + state.pot } : p
    );
    return {
      ...state,
      players,
      phase: 'handover',
      showCards: true,
      winnerIds: [winner.id],
      winnerHand: '',
      message: `${winner.name} wins ${state.pot} chips!`,
      pot: 0,
    };
  }

  const winners = determineWinners(
    eligible.map(p => ({ id: p.id, holeCards: p.holeCards })),
    state.communityCards
  );
  const winnerIds = winners.map(w => w.winnerId);
  const share = Math.floor(state.pot / winnerIds.length);
  const winnerHand = winners[0]?.handResult.name ?? '';

  const players = state.players.map(p =>
    winnerIds.includes(p.id) ? { ...p, chips: p.chips + share } : p
  );

  const winnerNames = players
    .filter(p => winnerIds.includes(p.id))
    .map(p => p.name)
    .join(' & ');

  return {
    ...state,
    players,
    phase: 'handover',
    showCards: true,
    winnerIds,
    winnerHand,
    message: `${winnerNames} wins with ${winnerHand}!`,
    pot: 0,
  };
}

function advancePhase(state: GameState): GameState {
  const active = getActivePlayers(state.players);
  if (active.length <= 1) return doShowdown(state);

  const players = state.players.map(p => ({ ...p, betInRound: 0 }));
  const base = { ...state, players, currentBet: 0, minRaise: BIG_BLIND };

  let firstActor = (state.dealerIndex + 1) % players.length;
  let tries = 0;
  while (players[firstActor].status !== 'active' && tries < players.length) {
    firstActor = (firstActor + 1) % players.length;
    tries++;
  }

  const numToAct = active.length;

  if (state.phase === 'preflop') {
    const flop = [state.deck[0], state.deck[1], state.deck[2]];
    return { ...base, phase: 'flop', communityCards: flop, deck: state.deck.slice(3), currentPlayerIndex: firstActor, numToAct, timer: TIMER_SECONDS, lastAggressorIndex: firstActor, isProcessing: false };
  }
  if (state.phase === 'flop') {
    return { ...base, phase: 'turn', communityCards: [...state.communityCards, state.deck[0]], deck: state.deck.slice(1), currentPlayerIndex: firstActor, numToAct, timer: TIMER_SECONDS, lastAggressorIndex: firstActor, isProcessing: false };
  }
  if (state.phase === 'turn') {
    return { ...base, phase: 'river', communityCards: [...state.communityCards, state.deck[0]], deck: state.deck.slice(1), currentPlayerIndex: firstActor, numToAct, timer: TIMER_SECONDS, lastAggressorIndex: firstActor, isProcessing: false };
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

  const next = nextActiveIndex(players, state.currentPlayerIndex);
  const msg = getActionMsg(player.name, action, raiseAmount ?? minRaise);

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
    isProcessing: false,
    message: msg,
  };

  return checkRoundOver(nextState);
}

function getActionMsg(name: string, action: AIAction, amount: number): string {
  const msgs: Record<AIAction, string> = {
    fold: `${name} folds`,
    check: `${name} checks`,
    call: `${name} calls`,
    raise: `${name} raises to ${amount}`,
    allin: `${name} goes ALL IN!`,
  };
  return msgs[action];
}

function dealAndPostBlinds(players: GamePlayer[], dealerIdx: number): GameState {
  const deck = shuffleDeck(createDeck());
  const ps = players.map(p => ({ ...p, holeCards: [] as Card[], betInRound: 0, status: 'active' as PlayerStatus, isDealer: false, isSmallBlind: false, isBigBlind: false }));
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
  ps[sbIdx].isSmallBlind = true;
  if (ps[sbIdx].chips === 0) ps[sbIdx].status = 'allIn';

  const bbAmt = Math.min(BIG_BLIND, ps[bbIdx].chips);
  ps[bbIdx].chips -= bbAmt;
  ps[bbIdx].betInRound = bbAmt;
  ps[bbIdx].isBigBlind = true;
  if (ps[bbIdx].chips === 0) ps[bbIdx].status = 'allIn';

  let firstActor = (bbIdx + 1) % ps.length;
  let tries = 0;
  while (ps[firstActor].status !== 'active' && tries < ps.length) {
    firstActor = (firstActor + 1) % ps.length;
    tries++;
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
    message: 'Cards dealt. Your turn...',
  };
}

export function usePokerGame(difficulty: AIDifficulty, humanName: string, humanChips: number) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const clearAI = useCallback(() => {
    if (aiRef.current) { clearTimeout(aiRef.current); aiRef.current = null; }
  }, []);

  useEffect(() => {
    clearTimer();
    const s = state;
    if (s.phase === 'idle' || s.phase === 'handover' || s.phase === 'showdown' || s.isProcessing) return;
    const currentPlayer = s.players[s.currentPlayerIndex];
    if (!currentPlayer?.isHuman) return;

    timerRef.current = setInterval(() => {
      setState(prev => {
        if (!prev.players[prev.currentPlayerIndex]?.isHuman) return prev;
        if (prev.timer <= 1) return applyAction(prev, 'fold');
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);

    return clearTimer;
  }, [state.currentPlayerIndex, state.phase, state.isProcessing]);

  useEffect(() => {
    clearAI();
    const s = state;
    if (s.phase === 'idle' || s.phase === 'handover' || s.phase === 'showdown' || s.isProcessing) return;
    const currentPlayer = s.players[s.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isHuman) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    const delay = getAIDelay(currentPlayer.difficulty);
    aiRef.current = setTimeout(() => {
      setState(prev => {
        const player = prev.players[prev.currentPlayerIndex];
        if (!player || player.isHuman) return { ...prev, isProcessing: false };

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

        return applyAction({ ...prev, isProcessing: false }, decision, raiseAmt);
      });
    }, delay);

    return clearAI;
  }, [state.currentPlayerIndex, state.phase, state.isProcessing]);

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
    setState(prev => {
      const current = prev.players[prev.currentPlayerIndex];
      if (!current?.isHuman) return prev;
      return applyAction(prev, action, raiseAmount);
    });
  }, [clearTimer]);

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
        status: 'active',
        isDealer: false,
        isSmallBlind: false,
        isBigBlind: false,
      }));

      return dealAndPostBlinds(cleanPlayers, nextDealer);
    });
  }, [clearTimer, clearAI]);

  return { state, startNewHand, handleAction, continueAfterHand };
}
