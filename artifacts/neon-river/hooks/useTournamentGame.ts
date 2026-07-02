import { useCallback, useEffect, useRef, useState } from 'react';
import { AIDifficulty, AIAction, AIPersonality, getAIDecision, getAIDelay, getRaiseAmount, getBotPersonality, analyzeBoardTexture } from '../lib/aiBot';
import { Card, createVariantDeck, describeHand, determineWinnersVariant, GameVariant, getPreflopStrength, getPostflopStrengthVariant, shuffleDeck } from '../lib/pokerEngine';
import { GamePlayer, GameState, SidePot, PlayerStatus } from './usePokerGame';

// ─── Tournament constants ─────────────────────────────────────────────────────

const STARTING_CHIPS = 1500;
const BUY_IN = 1500;
const TIMER_SECONDS = 20;
const HANDS_PER_LEVEL = 4;

export const BLIND_LEVELS = [
  { sb: 25,  bb: 50   },
  { sb: 50,  bb: 100  },
  { sb: 100, bb: 200  },
  { sb: 200, bb: 400  },
  { sb: 400, bb: 800  },
  { sb: 700, bb: 1400 },
];

const BOT_ROSTER: { name: string; diff: AIDifficulty }[] = [
  { name: 'Ace',    diff: 'casual'      },
  { name: 'Blaze',  diff: 'competitive' },
  { name: 'Shadow', diff: 'competitive' },
  { name: 'Vegas',  diff: 'shark'       },
  { name: 'Ghost',  diff: 'elite'       },
];

// ─── Tournament types ─────────────────────────────────────────────────────────

export interface Standing {
  id: string;
  name: string;
  isHuman: boolean;
  avatarIndex: number;
  finishPlace: number;
  prize: number;
  eliminatedOnHand: number;
}

export interface Prize {
  place: number;
  pct: number;
  amount: number;
}

export interface TournamentMeta {
  phase: 'idle' | 'playing' | 'ended';
  blindLevel: number;
  smallBlind: number;
  bigBlind: number;
  handsPlayed: number;
  handsThisLevel: number;
  activePlayers: number;
  totalPrizePool: number;
  prizes: Prize[];
  standings: Standing[];
  pendingEliminations: Standing[];
  myPlace: number | null;
  myPrize: number | null;
  blindJustIncreased: boolean;
}

function buildPrizes(numPlayers: number, buyIn: number): Prize[] {
  const pool = numPlayers * buyIn;
  if (numPlayers <= 3) return [
    { place: 1, pct: 70, amount: Math.round(pool * 0.7) },
    { place: 2, pct: 30, amount: Math.round(pool * 0.3) },
  ];
  if (numPlayers <= 5) return [
    { place: 1, pct: 50, amount: Math.round(pool * 0.5) },
    { place: 2, pct: 30, amount: Math.round(pool * 0.3) },
    { place: 3, pct: 20, amount: Math.round(pool * 0.2) },
  ];
  return [
    { place: 1, pct: 50, amount: Math.round(pool * 0.5) },
    { place: 2, pct: 30, amount: Math.round(pool * 0.3) },
    { place: 3, pct: 20, amount: Math.round(pool * 0.2) },
  ];
}

// ─── Copy of private poker-core functions from usePokerGame (extended for custom blinds) ──

const INITIAL_GAME: GameState = {
  phase: 'idle', players: [], deck: [], communityCards: [], pot: 0,
  currentBet: 0, currentPlayerIndex: 0, dealerIndex: 0, timer: TIMER_SECONDS,
  message: '', lastAggressorIndex: -1, minRaise: 100, numToAct: 0,
  showCards: false, winnerIds: [], winnerHand: '', winnerPot: 0,
  allInRunout: false, sidePots: [], isSplitPot: false, bigBlind: 100,
  variant: 'texas_holdem' as const,
  potResults: [], playerContribs: {}, returnedChips: {},
};

function getActivePlayers(players: GamePlayer[]) {
  return players.filter(p => p.status === 'active');
}

function nextActiveIndex(players: GamePlayer[], from: number) {
  let next = (from + 1) % players.length;
  for (let i = 0; i < players.length; i++) {
    if (players[next].status === 'active') return next;
    next = (next + 1) % players.length;
  }
  return from;
}

function runOutBoard(state: GameState): GameState {
  let { communityCards, deck } = state;
  if (communityCards.length < 3 && deck.length >= 3) { communityCards = [deck[0], deck[1], deck[2]]; deck = deck.slice(3); }
  if (communityCards.length < 4 && deck.length >= 1) { communityCards = [...communityCards, deck[0]]; deck = deck.slice(1); }
  if (communityCards.length < 5 && deck.length >= 1) { communityCards = [...communityCards, deck[0]]; deck = deck.slice(1); }
  return { ...state, communityCards, deck };
}

function computeSidePots(players: GamePlayer[]): SidePot[] {
  const contribs = players.map(p => ({
    id: p.id, invested: -p.chipDelta,
    isEligible: p.status === 'active' || p.status === 'allIn',
    isAllIn: p.status === 'allIn',
  }));
  const eligible = contribs.filter(c => c.isEligible);
  if (eligible.length <= 1) return [];
  const allInLevels = [...new Set(contribs.filter(c => c.isAllIn).map(c => c.invested))].sort((a, b) => a - b);
  if (allInLevels.length === 0) return [];
  const maxInvested = Math.max(...contribs.map(c => c.invested));
  const levels = [...allInLevels, maxInvested].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
  const pots: SidePot[] = [];
  let prev = 0;
  for (const level of levels) {
    if (level <= prev) continue;
    const diff = level - prev;
    let amt = 0;
    for (const c of contribs) amt += Math.min(Math.max(0, c.invested - prev), diff);
    const el = eligible.filter(c => c.invested >= level).map(c => c.id);
    if (amt > 0 && el.length > 0) pots.push({ amount: amt, eligiblePlayerIds: el });
    prev = level;
  }
  return pots.length > 1 ? pots : [];
}

function doShowdown(state: GameState): GameState {
  const s = runOutBoard(state);
  const eligible = s.players.filter(p => p.status === 'active' || p.status === 'allIn');
  if (eligible.length === 0) return { ...s, phase: 'handover', sidePots: [], isSplitPot: false };
  const potSize = s.pot;

  if (eligible.length === 1) {
    const winner = eligible[0];
    const players = s.players.map(p =>
      p.id === winner.id ? { ...p, chips: p.chips + potSize, chipDelta: p.chipDelta + potSize } : p
    );
    return {
      ...s, players, phase: 'handover', showCards: true, allInRunout: false,
      winnerIds: [winner.id], winnerHand: '', winnerPot: potSize,
      message: winner.isHuman ? 'You won!' : `${winner.name} wins!`,
      pot: 0, sidePots: [], isSplitPot: false,
    };
  }

  const sidePots = computeSidePots(s.players);

  if (sidePots.length > 1) {
    let players = s.players.map(p => ({ ...p }));
    const msgs: string[] = [];
    for (const sp of sidePots) {
      const spEl = players.filter(p => sp.eligiblePlayerIds.includes(p.id) && (p.status === 'active' || p.status === 'allIn'));
      const results = determineWinnersVariant(spEl.map(p => ({ id: p.id, holeCards: p.holeCards })), s.communityCards, s.variant);
      const topScore = Math.max(...results.map(r => r.handResult.rank));
      const winners = results.filter(r => r.handResult.rank === topScore);
      const share = Math.floor(sp.amount / winners.length);
      for (const w of winners) {
        const idx = players.findIndex(p => p.id === w.winnerId);
        if (idx >= 0) { players[idx].chips += share; players[idx].chipDelta += share; }
      }
      const wNames = winners.map(w => players.find(p => p.id === w.winnerId)?.name ?? '').filter(Boolean);
      msgs.push(`${wNames.join(' & ')} takes ${sp.amount}`);
    }
    const allWinners = [...new Set(sidePots.flatMap(sp => {
      const spEl = players.filter(p => sp.eligiblePlayerIds.includes(p.id));
      const results = determineWinnersVariant(spEl.map(p => ({ id: p.id, holeCards: p.holeCards })), s.communityCards, s.variant);
      const top = Math.max(...results.map(r => r.handResult.rank));
      return results.filter(r => r.handResult.rank === top).map(r => r.winnerId);
    }))];
    return {
      ...s, players, phase: 'handover', showCards: true, allInRunout: false,
      winnerIds: allWinners, winnerHand: '', winnerPot: potSize,
      message: msgs.join(' | '), pot: 0, sidePots, isSplitPot: false,
    };
  }

  const results = determineWinnersVariant(eligible.map(p => ({ id: p.id, holeCards: p.holeCards })), s.communityCards, s.variant);
  const topScore = Math.max(...results.map(r => r.handResult.rank));
  const winners = results.filter(r => r.handResult.rank === topScore);
  const isSplit = winners.length > 1;
  const share = Math.floor(potSize / winners.length);

  let players = s.players.map(p => {
    const w = winners.find(w => w.winnerId === p.id);
    return w ? { ...p, chips: p.chips + share, chipDelta: p.chipDelta + share } : p;
  });

  const winnerNames = winners.map(w => players.find(p => p.id === w.winnerId)?.name ?? '');
  const winnerHand = describeHand(winners[0].handResult);
  const humanWon = winners.some(w => w.winnerId === 'human');

  return {
    ...s, players, phase: 'handover', showCards: true, allInRunout: false,
    winnerIds: winners.map(w => w.winnerId),
    winnerHand: `${winnerNames.join(' & ')} · ${winnerHand}`,
    winnerPot: potSize,
    message: humanWon ? `You won with ${winnerHand}!` : `${winnerNames[0]} wins with ${winnerHand}`,
    pot: 0, sidePots: [], isSplitPot: isSplit,
  };
}

function advancePhase(state: GameState): GameState {
  const base: GameState = {
    ...state,
    currentBet: 0,
    lastAggressorIndex: -1,
    players: state.players.map(p => ({
      ...p,
      betInRound: 0,
      status: p.status === 'folded' ? 'folded' : p.status === 'allIn' ? 'allIn' : 'active',
    })),
  };
  const active = base.players.filter(p => p.status === 'active');
  const allIn = base.players.filter(p => p.status === 'allIn');
  if (active.length <= 1 && allIn.length > 0) {
    const newState = { ...base, allInRunout: true, numToAct: 0 };
    return doShowdown(newState);
  }
  const firstActorIdx = base.players.findIndex(p => p.status === 'active');
  const numToAct = active.length;
  if (base.phase === 'preflop') {
    const deck = base.deck;
    return { ...base, phase: 'flop', communityCards: [deck[0], deck[1], deck[2]], deck: deck.slice(3), currentPlayerIndex: firstActorIdx, numToAct };
  }
  if (base.phase === 'flop') {
    return { ...base, phase: 'turn', communityCards: [...base.communityCards, base.deck[0]], deck: base.deck.slice(1), currentPlayerIndex: firstActorIdx, numToAct };
  }
  if (base.phase === 'turn') {
    return { ...base, phase: 'river', communityCards: [...base.communityCards, base.deck[0]], deck: base.deck.slice(1), currentPlayerIndex: firstActorIdx, numToAct };
  }
  if (base.phase === 'river') return doShowdown({ ...base, phase: 'showdown' });
  return state;
}

function checkRoundOver(state: GameState): GameState {
  const active = getActivePlayers(state.players);
  if (active.length <= 1) return doShowdown(state);
  if (state.numToAct <= 0) return advancePhase(state);
  return state;
}

function getActionMsg(name: string, action: AIAction, amount: number): string {
  return ({ fold: `${name} folds`, check: `${name} checks`, call: `${name} calls`, raise: `${name} raises ${amount}`, allin: `${name} goes ALL IN!` })[action];
}

function applyAction(state: GameState, action: AIAction, raiseAmount?: number): GameState {
  const players = state.players.map(p => ({ ...p }));
  const player = players[state.currentPlayerIndex];
  let { pot, currentBet, lastAggressorIndex, minRaise } = state;
  let numToAct = state.numToAct - 1;

  switch (action) {
    case 'fold': player.status = 'folded'; break;
    case 'check': break;
    case 'call': {
      const amt = Math.min(currentBet - player.betInRound, player.chips);
      player.chips -= amt; player.chipDelta -= amt; player.betInRound += amt; pot += amt;
      if (player.chips === 0) player.status = 'allIn';
      break;
    }
    case 'raise': {
      const rAmt = raiseAmount ?? minRaise;
      const toCall = currentBet - player.betInRound;
      const total = Math.min(toCall + rAmt, player.chips);
      player.chips -= total; player.chipDelta -= total; pot += total;
      const newBet = player.betInRound + total;
      if (newBet > currentBet) {
        minRaise = newBet - currentBet; currentBet = newBet; lastAggressorIndex = state.currentPlayerIndex;
        numToAct = players.filter(p => p.status === 'active' && p.id !== player.id).length;
      }
      player.betInRound = newBet;
      if (player.chips === 0) player.status = 'allIn';
      break;
    }
    case 'allin': {
      const amt = player.chips;
      pot += amt; player.chipDelta -= amt; player.betInRound += amt;
      if (player.betInRound > currentBet) {
        minRaise = player.betInRound - currentBet; currentBet = player.betInRound; lastAggressorIndex = state.currentPlayerIndex;
        numToAct = players.filter(p => p.status === 'active' && p.id !== player.id).length;
      }
      player.chips = 0; player.status = 'allIn';
      break;
    }
  }

  const active = players.filter(p => p.status === 'active');
  const next = active.length > 0 ? nextActiveIndex(players, state.currentPlayerIndex) : state.currentPlayerIndex;

  return checkRoundOver({
    ...state, players, pot, currentBet, lastAggressorIndex, minRaise,
    numToAct: Math.max(0, numToAct), currentPlayerIndex: next,
    timer: TIMER_SECONDS, message: getActionMsg(player.name, action, raiseAmount ?? minRaise),
  });
}

function executeAIAction(prev: GameState): GameState {
  const player = prev.players[prev.currentPlayerIndex];
  if (!player || player.isHuman || player.status !== 'active') return prev;
  const playerCount = prev.players.length;
  const relPos = (prev.currentPlayerIndex - prev.dealerIndex + playerCount) % playerCount;
  const positionAdvantage = Math.min(2, (relPos / Math.max(1, playerCount - 1)) * 2);
  const board = analyzeBoardTexture(prev.communityCards);
  const handStrength = prev.phase === 'preflop'
    ? getPreflopStrength(player.holeCards)
    : getPostflopStrengthVariant(player.holeCards, prev.communityCards, prev.variant);

  const decision = getAIDecision({
    holeCards: player.holeCards, communityCards: prev.communityCards,
    myChips: player.chips, pot: prev.pot, currentBet: prev.currentBet,
    myBetInRound: player.betInRound, minRaise: prev.minRaise,
    difficulty: player.difficulty, personality: player.personality,
    phase: prev.phase as 'preflop' | 'flop' | 'turn' | 'river',
    numActivePlayers: getActivePlayers(prev.players).length,
    positionAdvantage,
  });
  const raiseAmt = decision === 'raise'
    ? getRaiseAmount(player.difficulty, prev.pot, player.chips, prev.minRaise,
        handStrength, player.personality, board.wetness)
    : undefined;
  return applyAction(prev, decision, raiseAmt);
}

function dealAndPostBlinds(players: GamePlayer[], dealerIdx: number, smallBlind: number, bigBlind: number, variant: GameVariant = 'texas_holdem'): GameState {
  const deck = shuffleDeck(createVariantDeck(variant));
  const ps = players.map(p => ({
    ...p, holeCards: [] as Card[], betInRound: 0, chipDelta: 0, status: 'active' as PlayerStatus,
    isDealer: false, isSmallBlind: false, isBigBlind: false,
  }));
  ps[dealerIdx].isDealer = true;
  let cur = 0;
  const numHoleCards = variant === 'omaha_holdem' ? 4 : 2;
  for (let r = 0; r < numHoleCards; r++) for (const p of ps) p.holeCards.push(deck[cur++]);

  const sbIdx = (dealerIdx + 1) % ps.length;
  const bbIdx = (dealerIdx + 2) % ps.length;
  const sbAmt = Math.min(smallBlind, ps[sbIdx].chips);
  ps[sbIdx].chips -= sbAmt; ps[sbIdx].betInRound = sbAmt; ps[sbIdx].chipDelta = -sbAmt; ps[sbIdx].isSmallBlind = true;
  if (ps[sbIdx].chips === 0) ps[sbIdx].status = 'allIn';
  const bbAmt = Math.min(bigBlind, ps[bbIdx].chips);
  ps[bbIdx].chips -= bbAmt; ps[bbIdx].betInRound = bbAmt; ps[bbIdx].chipDelta = -bbAmt; ps[bbIdx].isBigBlind = true;
  if (ps[bbIdx].chips === 0) ps[bbIdx].status = 'allIn';

  let firstActor = (bbIdx + 1) % ps.length;
  for (let i = 0; i < ps.length; i++) {
    if (ps[firstActor].status === 'active') break;
    firstActor = (firstActor + 1) % ps.length;
  }

  return {
    ...INITIAL_GAME, players: ps, deck: deck.slice(cur), phase: 'preflop',
    pot: sbAmt + bbAmt, currentBet: bigBlind, bigBlind, currentPlayerIndex: firstActor,
    lastAggressorIndex: bbIdx, dealerIndex: dealerIdx,
    numToAct: ps.filter(p => p.status === 'active').length,
    timer: TIMER_SECONDS, message: 'Cards dealt!', minRaise: bigBlind,
    variant,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const INITIAL_META: TournamentMeta = {
  phase: 'idle', blindLevel: 0, smallBlind: 25, bigBlind: 50,
  handsPlayed: 0, handsThisLevel: 0, activePlayers: 0,
  totalPrizePool: 0, prizes: [], standings: [], pendingEliminations: [],
  myPlace: null, myPrize: null, blindJustIncreased: false,
};

export function useTournamentGame(
  humanName: string,
  numPlayers: 4 | 5 | 6 = 6,
  config?: { startingChips?: number; buyIn?: number; handsPerLevel?: number; blindSchedule?: { sb: number; bb: number }[]; variant?: GameVariant },
) {
  const startingChips = config?.startingChips ?? STARTING_CHIPS;
  const buyIn         = config?.buyIn         ?? BUY_IN;
  const handsPerLevel = config?.handsPerLevel  ?? HANDS_PER_LEVEL;
  const blindLevels   = config?.blindSchedule && config.blindSchedule.length > 0 ? config.blindSchedule : BLIND_LEVELS;
  const variant: GameVariant = config?.variant ?? 'texas_holdem';

  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME);
  const [tournament, setTournament] = useState<TournamentMeta>(INITIAL_META);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiKeyRef = useRef('');

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const clearAI = useCallback(() => {
    if (aiRef.current) { clearTimeout(aiRef.current); aiRef.current = null; }
    aiKeyRef.current = '';
  }, []);

  // ── Countdown timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    clearTimer();
    const s = gameState;
    if (s.phase === 'idle' || s.phase === 'handover' || s.phase === 'showdown' || s.allInRunout) return;
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.phase === 'idle' || prev.phase === 'handover' || prev.phase === 'showdown' || prev.allInRunout) return prev;
        if (prev.timer <= 1) {
          const cur = prev.players[prev.currentPlayerIndex];
          if (cur?.isHuman && cur.status === 'active') return applyAction(prev, 'fold');
          return { ...prev, timer: 1 };
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);
    return clearTimer;
  }, [gameState.currentPlayerIndex, gameState.phase, gameState.allInRunout]); // eslint-disable-line

  // ── AI turns ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const s = gameState;
    if (s.phase === 'idle' || s.phase === 'handover' || s.phase === 'showdown' || s.allInRunout) return;
    const cur = s.players[s.currentPlayerIndex];
    if (!cur || cur.isHuman || cur.status !== 'active') return;
    const key = `${s.currentPlayerIndex}-${s.phase}-${s.numToAct}`;
    if (aiKeyRef.current === key) return;
    aiKeyRef.current = key;
    clearAI();
    aiRef.current = setTimeout(() => {
      setGameState(prev => {
        const p = prev.players[prev.currentPlayerIndex];
        if (!p || p.isHuman || p.status !== 'active') return prev;
        return executeAIAction(prev);
      });
    }, getAIDelay(cur.difficulty));
  }, [gameState.currentPlayerIndex, gameState.phase, gameState.numToAct, gameState.allInRunout]); // eslint-disable-line

  // ── Start tournament ──────────────────────────────────────────────────────────
  const startTournament = useCallback(() => {
    clearTimer(); clearAI();
    const numBots = numPlayers - 1;
    const bots = BOT_ROSTER.slice(0, numBots);
    const prizes = buildPrizes(numPlayers, buyIn);
    const blinds = blindLevels[0];

    const players: GamePlayer[] = [
      {
        id: 'human', name: humanName, chips: startingChips, holeCards: [], betInRound: 0, chipDelta: 0,
        status: 'active', isHuman: true, difficulty: 'competitive', personality: 'passive' as AIPersonality,
        seatIndex: 0, isDealer: false, isSmallBlind: false, isBigBlind: false, avatarIndex: 0,
      },
      ...bots.map((b, i) => ({
        id: `ai_${i}`, name: b.name, chips: startingChips, holeCards: [] as Card[],
        betInRound: 0, chipDelta: 0, status: 'active' as PlayerStatus,
        isHuman: false, difficulty: b.diff, personality: getBotPersonality(i),
        seatIndex: i + 1, isDealer: false, isSmallBlind: false, isBigBlind: false, avatarIndex: [9, 13, 20, 25, 7][i % 5],
      })),
    ];

    setTournament({
      phase: 'playing', blindLevel: 1, smallBlind: blinds.sb, bigBlind: blinds.bb,
      handsPlayed: 0, handsThisLevel: 0, activePlayers: numPlayers,
      totalPrizePool: numPlayers * buyIn, prizes, standings: [], pendingEliminations: [],
      myPlace: null, myPrize: null, blindJustIncreased: false,
    });
    setGameState(dealAndPostBlinds(players, 0, blinds.sb, blinds.bb, variant));
  }, [humanName, numPlayers, buyIn, startingChips, blindLevels, variant, clearTimer, clearAI]);

  // ── Handle player action ──────────────────────────────────────────────────────
  const handleAction = useCallback((action: AIAction, raiseAmount?: number) => {
    clearTimer(); clearAI();
    setGameState(prev => {
      const cur = prev.players[prev.currentPlayerIndex];
      if (!cur?.isHuman || cur.status !== 'active') return prev;
      return applyAction(prev, action, raiseAmount);
    });
  }, [clearTimer, clearAI]);

  // ── Skip bot turn ─────────────────────────────────────────────────────────────
  const skipBotTurn = useCallback(() => {
    clearAI();
    setGameState(prev => {
      const p = prev.players[prev.currentPlayerIndex];
      if (!p || p.isHuman || p.status !== 'active') return prev;
      return executeAIAction(prev);
    });
  }, [clearAI]);

  // ── Skip to showdown ──────────────────────────────────────────────────────────
  const skipToShowdown = useCallback(() => {
    clearTimer(); clearAI();
    setGameState(prev => {
      if (prev.phase === 'idle' || prev.phase === 'handover' || prev.phase === 'showdown') return prev;
      return doShowdown({ ...prev, allInRunout: false });
    });
  }, [clearTimer, clearAI]);

  // ── Next hand (core tournament logic) ────────────────────────────────────────
  const nextHand = useCallback(() => {
    clearTimer(); clearAI();

    setGameState(prev => {
      setTournament(prevT => {
        const handsPlayed = prevT.handsPlayed + 1;
        const handsThisLevel = prevT.handsThisLevel + 1;

        // Check for eliminated players (chips = 0)
        const justEliminated = prev.players.filter(p => p.chips === 0);
        const survivors = prev.players.filter(p => p.chips > 0);
        const numElim = justEliminated.length;

        // Build standings for newly eliminated players
        const currentActive = survivors.length;
        const totalPlayers = prevT.standings.length + survivors.length + numElim;
        const newStandings: typeof prevT.standings = [];
        let placeOffset = currentActive + 1;

        // Assign finish places (last to bust gets higher place if multiple bust same hand)
        for (let i = 0; i < numElim; i++) {
          const p = justEliminated[i];
          const prizeEntry = prevT.prizes.find(pr => pr.place === placeOffset + i);
          newStandings.push({
            id: p.id, name: p.name, isHuman: p.isHuman, avatarIndex: p.avatarIndex,
            finishPlace: placeOffset + i, prize: prizeEntry?.amount ?? 0, eliminatedOnHand: handsPlayed,
          });
        }

        const allStandings = [...prevT.standings, ...newStandings];

        // Check if tournament is over
        if (survivors.length <= 1) {
          const winner = survivors[0];
          const winnerPrize = prevT.prizes.find(p => p.place === 1)?.amount ?? 0;
          const finalStanding: Standing = {
            id: winner?.id ?? 'human', name: winner?.name ?? humanName,
            isHuman: winner?.isHuman ?? true, avatarIndex: winner?.avatarIndex ?? 0,
            finishPlace: 1, prize: winnerPrize, eliminatedOnHand: handsPlayed,
          };
          const myPlace = finalStanding.isHuman ? 1
            : allStandings.find(s => s.isHuman)?.finishPlace ?? null;
          const myPrize = myPlace ? (prevT.prizes.find(p => p.place === myPlace)?.amount ?? 0) : 0;
          return {
            ...prevT, phase: 'ended', standings: [...allStandings, finalStanding].reverse(),
            pendingEliminations: newStandings,
            myPlace, myPrize, handsPlayed, activePlayers: 0,
          };
        }

        // Increase blinds?
        let blindLevel = prevT.blindLevel;
        let newHandsThisLevel = handsThisLevel;
        let blindJustIncreased = false;
        if (handsThisLevel >= handsPerLevel && blindLevel < blindLevels.length) {
          blindLevel = Math.min(prevT.blindLevel, blindLevels.length - 1) + 1;
          newHandsThisLevel = 0;
          blindJustIncreased = true;
        }
        const blindIdx = Math.min(blindLevel - 1, blindLevels.length - 1);
        const { sb, bb } = blindLevels[blindIdx];

        // Deal new hand
        const nextDealer = (prev.dealerIndex + 1) % survivors.length;
        const cleanSurvivors: GamePlayer[] = survivors.map(p => ({
          ...p, holeCards: [], betInRound: 0, chipDelta: 0, status: 'active',
          isDealer: false, isSmallBlind: false, isBigBlind: false,
        }));

        // Schedule the game state update separately after tournament state settles
        setTimeout(() => {
          setGameState(dealAndPostBlinds(cleanSurvivors, nextDealer, sb, bb, variant));
        }, 0);

        return {
          ...prevT, handsPlayed, handsThisLevel: newHandsThisLevel,
          blindLevel, smallBlind: sb, bigBlind: bb,
          activePlayers: survivors.length,
          standings: allStandings,
          pendingEliminations: newStandings,
          blindJustIncreased,
        };
      });

      // Return idle state while we schedule the real deal above
      return { ...prev, phase: 'idle' };
    });
  }, [clearTimer, clearAI, humanName, numPlayers, startingChips, buyIn, handsPerLevel, blindLevels, variant]);

  const clearPendingEliminations = useCallback(() => {
    setTournament(prev => ({ ...prev, pendingEliminations: [], blindJustIncreased: false }));
  }, []);

  return {
    gameState, tournament,
    startTournament, handleAction, nextHand,
    skipBotTurn, skipToShowdown, clearPendingEliminations,
  };
}
