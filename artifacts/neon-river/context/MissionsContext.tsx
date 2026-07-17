import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useUser } from './UserContext';
import { useNotifications } from './NotificationContext';

// ── Event type ─────────────────────────────────────────────────────────────────

export type MissionGame =
  | 'texas_holdem' | 'short_deck_holdem' | 'omaha_holdem' | 'joker_holdem'
  | 'blackjack' | 'social' | 'general';

export type MissionEvent = {
  game: MissionGame;
  action: 'win' | 'play' | 'daily_spin' | 'level_up' | 'post' | 'comment' | 'like' | 'follow' | 'received_like' | 'chip_earn';
  handDesc?: string;
  holeCards?: Array<{ value: number; suit: string }>;
  wasAllIn?: boolean;
  chipsEarned?: number;
  wasDoubleDown?: boolean;
  wasSplit?: boolean;
  isNaturalBlackjack?: boolean;
  dealerBusted?: boolean;
  playerTotal?: number;
};

export type MissionRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type MissionDef = {
  id: string;
  category: string;
  title: string;
  description: string;
  target: number;
  rarity: MissionRarity;
  chipReward: number;
  xpReward: number;
  icon: string;
  iconColor: string;
  check: (event: MissionEvent) => boolean;
};

export type ActiveMission = Omit<MissionDef, 'check'> & {
  progress: number;
  claimed: boolean;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function hasPocketPair(h: Array<{ value: number; suit: string }> | undefined, v: number): boolean {
  return !!h && h.length >= 2 && h[0].value === v && h[1].value === v;
}

function isSuitedConnectors(h: Array<{ value: number; suit: string }> | undefined): boolean {
  if (!h || h.length < 2) return false;
  return h[0].suit === h[1].suit && Math.abs(h[0].value - h[1].value) === 1;
}

function hContains(desc: string | undefined, name: string): boolean {
  return !!desc?.startsWith(name);
}

// ── Mission pool ───────────────────────────────────────────────────────────────

export const MISSION_POOL: MissionDef[] = [
  // ── TEXAS HOLD'EM ──────────────────────────────────────────────────────────
  { id: 'txh_win_1',        category: "Texas Hold'em", title: 'First Blood',     description: "Win 1 hand of Traditional Hold'em",                          target: 1,  rarity: 'common', chipReward: 4000,   xpReward: 30,  icon: 'card-outline',          iconColor: '#00d4ff', check: e => e.game === 'texas_holdem' && e.action === 'win' },
  { id: 'txh_win_3',        category: "Texas Hold'em", title: 'On a Roll',       description: "Win 3 hands of Traditional Hold'em",                          target: 3,  rarity: 'common', chipReward: 7500,   xpReward: 50,  icon: 'card-outline',          iconColor: '#00d4ff', check: e => e.game === 'texas_holdem' && e.action === 'win' },
  { id: 'txh_play_5',       category: "Texas Hold'em", title: 'Show Up',         description: "Play 5 hands of Traditional Hold'em",                         target: 5,  rarity: 'common', chipReward: 3500,   xpReward: 30,  icon: 'repeat-outline',        iconColor: '#00d4ff', check: e => e.game === 'texas_holdem' && (e.action === 'win' || e.action === 'play') },
  { id: 'txh_play_10',      category: "Texas Hold'em", title: 'At the Table',    description: "Play 10 hands of Traditional Hold'em",                         target: 10, rarity: 'common', chipReward: 5000,   xpReward: 40,  icon: 'repeat-outline',        iconColor: '#00d4ff', check: e => e.game === 'texas_holdem' && (e.action === 'win' || e.action === 'play') },
  { id: 'txh_play_25',      category: "Texas Hold'em", title: 'The Grind',       description: "Play 25 hands of Traditional Hold'em",                         target: 25, rarity: 'rare',   chipReward: 8000,   xpReward: 45,  icon: 'repeat-outline',        iconColor: '#00d4ff', check: e => e.game === 'texas_holdem' && (e.action === 'win' || e.action === 'play') },
  { id: 'txh_win_pair',     category: "Texas Hold'em", title: 'Keep it Simple',  description: "Win 3 hands with One Pair in Traditional Hold'em",             target: 3,  rarity: 'common', chipReward: 8000,   xpReward: 50,  icon: 'copy-outline',          iconColor: '#00d4ff', check: e => e.game === 'texas_holdem' && e.action === 'win' && hContains(e.handDesc, 'Pair of') },
  { id: 'txh_win_two_pair', category: "Texas Hold'em", title: 'Two Pair',        description: "Win 2 hands with Two Pair in Traditional Hold'em",             target: 2,  rarity: 'common', chipReward: 10000,  xpReward: 55,  icon: 'layers-outline',        iconColor: '#00d4ff', check: e => e.game === 'texas_holdem' && e.action === 'win' && hContains(e.handDesc, 'Two Pair') },
  { id: 'txh_win_trips',    category: "Texas Hold'em", title: "Three's Company", description: "Win with Three of a Kind in Traditional Hold'em",              target: 1,  rarity: 'rare',   chipReward: 16000,  xpReward: 90,  icon: 'triangle-outline',      iconColor: '#00d4ff', check: e => e.game === 'texas_holdem' && e.action === 'win' && hContains(e.handDesc, 'Three of a Kind') },
  { id: 'txh_win_straight', category: "Texas Hold'em", title: 'Straight Shooter',description: "Win with a Straight in Traditional Hold'em",                   target: 1,  rarity: 'rare',   chipReward: 18000,  xpReward: 95,  icon: 'trending-up-outline',   iconColor: '#00d4ff', check: e => e.game === 'texas_holdem' && e.action === 'win' && hContains(e.handDesc, 'Straight') && !e.handDesc?.includes('Straight Flush') },
  { id: 'txh_win_flush',    category: "Texas Hold'em", title: 'Flush Master',    description: "Win with a Flush in Traditional Hold'em",                      target: 1,  rarity: 'rare',   chipReward: 22000,  xpReward: 110, icon: 'water-outline',         iconColor: '#00d4ff', check: e => e.game === 'texas_holdem' && e.action === 'win' && hContains(e.handDesc, 'Flush') && !e.handDesc?.includes('Straight Flush') && e.handDesc !== 'Royal Flush' },
  { id: 'txh_win_full',     category: "Texas Hold'em", title: 'Full House',      description: "Win with a Full House in Traditional Hold'em",                 target: 1,  rarity: 'rare',   chipReward: 35000,  xpReward: 140, icon: 'home-outline',          iconColor: '#bf5fff', check: e => e.game === 'texas_holdem' && e.action === 'win' && hContains(e.handDesc, 'Full House') },
  { id: 'txh_allin',        category: "Texas Hold'em", title: 'All-In Hero',     description: "Win a hand after going All-In in Traditional Hold'em",         target: 1,  rarity: 'rare',   chipReward: 22000,  xpReward: 110, icon: 'flash-outline',         iconColor: '#ff0090', check: e => e.game === 'texas_holdem' && e.action === 'win' && !!e.wasAllIn },
  { id: 'txh_aces',         category: "Texas Hold'em", title: 'Pocket Rockets',  description: "Win with Pocket Aces in Traditional Hold'em",                  target: 1,  rarity: 'rare',   chipReward: 30000,  xpReward: 120, icon: 'diamond-outline',       iconColor: '#ff0090', check: e => e.game === 'texas_holdem' && e.action === 'win' && hasPocketPair(e.holeCards, 14) },
  { id: 'txh_kings',        category: "Texas Hold'em", title: 'Cowboys',         description: "Win with Pocket Kings in Traditional Hold'em",                 target: 1,  rarity: 'rare',   chipReward: 26000,  xpReward: 110, icon: 'shield-outline',        iconColor: '#ff0090', check: e => e.game === 'texas_holdem' && e.action === 'win' && hasPocketPair(e.holeCards, 13) },
  { id: 'txh_suited',       category: "Texas Hold'em", title: 'Suited Up',       description: "Win with suited connectors in Traditional Hold'em",            target: 1,  rarity: 'rare',   chipReward: 24000,  xpReward: 105, icon: 'link-outline',          iconColor: '#00d4ff', check: e => e.game === 'texas_holdem' && e.action === 'win' && isSuitedConnectors(e.holeCards) },
  // ACHIEVEMENT-ONLY — excluded from daily pool:
  { id: 'txh_win_quads',    category: "Texas Hold'em", title: 'Quads!',          description: "Win with Four of a Kind in Traditional Hold'em",               target: 1,  rarity: 'epic',      chipReward: 120000, xpReward: 200, icon: 'grid-outline',          iconColor: '#bf5fff', check: e => e.game === 'texas_holdem' && e.action === 'win' && hContains(e.handDesc, 'Four of a Kind') },
  { id: 'txh_win_sf',       category: "Texas Hold'em", title: 'Straight Flush',  description: "Win with a Straight Flush in Traditional Hold'em",             target: 1,  rarity: 'legendary', chipReward: 250000, xpReward: 300, icon: 'sparkles-outline',      iconColor: '#ffd700', check: e => e.game === 'texas_holdem' && e.action === 'win' && !!e.handDesc?.includes('Straight Flush') && !e.handDesc?.startsWith('Royal') },
  { id: 'txh_win_royal',    category: "Texas Hold'em", title: 'Royal Flush',     description: "Win with a Royal Flush in Traditional Hold'em",                target: 1,  rarity: 'legendary', chipReward: 250000, xpReward: 300, icon: 'trophy-outline',        iconColor: '#ffd700', check: e => e.game === 'texas_holdem' && e.action === 'win' && e.handDesc === 'Royal Flush' },

  // ── SHORT DECK ─────────────────────────────────────────────────────────────
  { id: 'sd_win_1',    category: 'Short Deck', title: 'Short Win',        description: "Win 1 hand of Short Deck Hold'em",                     target: 1,  rarity: 'common', chipReward: 5000,  xpReward: 35,  icon: 'albums-outline',      iconColor: '#ff0090', check: e => e.game === 'short_deck_holdem' && e.action === 'win' },
  { id: 'sd_win_3',    category: 'Short Deck', title: 'Short Stack',      description: "Win 3 hands of Short Deck Hold'em",                     target: 3,  rarity: 'common', chipReward: 8000,  xpReward: 50,  icon: 'albums-outline',      iconColor: '#ff0090', check: e => e.game === 'short_deck_holdem' && e.action === 'win' },
  { id: 'sd_play_5',   category: 'Short Deck', title: 'Short Session',    description: "Play 5 hands of Short Deck Hold'em",                    target: 5,  rarity: 'common', chipReward: 4500,  xpReward: 35,  icon: 'repeat-outline',      iconColor: '#ff0090', check: e => e.game === 'short_deck_holdem' && (e.action === 'win' || e.action === 'play') },
  { id: 'sd_trips',    category: 'Short Deck', title: 'Short Trips',      description: 'Win with Three of a Kind in Short Deck',                target: 1,  rarity: 'rare',   chipReward: 18000, xpReward: 95,  icon: 'triangle-outline',    iconColor: '#ff0090', check: e => e.game === 'short_deck_holdem' && e.action === 'win' && hContains(e.handDesc, 'Three of a Kind') },
  { id: 'sd_flush',    category: 'Short Deck', title: 'Short Flush',      description: 'Win with a Flush in Short Deck',                        target: 1,  rarity: 'rare',   chipReward: 20000, xpReward: 100, icon: 'water-outline',       iconColor: '#ff0090', check: e => e.game === 'short_deck_holdem' && e.action === 'win' && hContains(e.handDesc, 'Flush') },
  { id: 'sd_full',     category: 'Short Deck', title: 'Short Full House', description: 'Win with a Full House in Short Deck',                   target: 1,  rarity: 'rare',   chipReward: 32000, xpReward: 135, icon: 'home-outline',        iconColor: '#ff0090', check: e => e.game === 'short_deck_holdem' && e.action === 'win' && hContains(e.handDesc, 'Full House') },
  { id: 'sd_allin',    category: 'Short Deck', title: 'Short All-In',     description: 'Win after going All-In in Short Deck',                  target: 1,  rarity: 'rare',   chipReward: 22000, xpReward: 105, icon: 'flash-outline',       iconColor: '#ff0090', check: e => e.game === 'short_deck_holdem' && e.action === 'win' && !!e.wasAllIn },

  // ── OMAHA ──────────────────────────────────────────────────────────────────
  { id: 'omaha_win_1',   category: 'Omaha', title: 'Omaha Debut',      description: "Win 1 hand of Omaha Hold'em",                    target: 1,  rarity: 'common', chipReward: 5000,  xpReward: 35,  icon: 'grid-outline',        iconColor: '#00ff88', check: e => e.game === 'omaha_holdem' && e.action === 'win' },
  { id: 'omaha_win_3',   category: 'Omaha', title: 'Omaha Opener',     description: "Win 3 hands of Omaha Hold'em",                   target: 3,  rarity: 'common', chipReward: 8000,  xpReward: 50,  icon: 'grid-outline',        iconColor: '#00ff88', check: e => e.game === 'omaha_holdem' && e.action === 'win' },
  { id: 'omaha_play_5',  category: 'Omaha', title: 'Omaha Session',    description: "Play 5 hands of Omaha Hold'em",                  target: 5,  rarity: 'common', chipReward: 4500,  xpReward: 35,  icon: 'repeat-outline',      iconColor: '#00ff88', check: e => e.game === 'omaha_holdem' && (e.action === 'win' || e.action === 'play') },
  { id: 'omaha_straight',category: 'Omaha', title: 'Omaha Straight',   description: 'Win with a Straight in Omaha',                   target: 1,  rarity: 'rare',   chipReward: 18000, xpReward: 95,  icon: 'trending-up-outline', iconColor: '#00ff88', check: e => e.game === 'omaha_holdem' && e.action === 'win' && hContains(e.handDesc, 'Straight') && !e.handDesc?.includes('Straight Flush') },
  { id: 'omaha_flush',   category: 'Omaha', title: 'Omaha Flush',      description: 'Win with a Flush in Omaha',                      target: 1,  rarity: 'rare',   chipReward: 20000, xpReward: 100, icon: 'water-outline',       iconColor: '#00ff88', check: e => e.game === 'omaha_holdem' && e.action === 'win' && hContains(e.handDesc, 'Flush') },
  { id: 'omaha_full',    category: 'Omaha', title: 'Omaha Full House', description: 'Win with a Full House in Omaha',                 target: 1,  rarity: 'rare',   chipReward: 32000, xpReward: 135, icon: 'home-outline',        iconColor: '#00ff88', check: e => e.game === 'omaha_holdem' && e.action === 'win' && hContains(e.handDesc, 'Full House') },
  { id: 'omaha_allin',   category: 'Omaha', title: 'Omaha All-In',    description: 'Win after going All-In in Omaha',                target: 1,  rarity: 'rare',   chipReward: 24000, xpReward: 110, icon: 'flash-outline',       iconColor: '#00ff88', check: e => e.game === 'omaha_holdem' && e.action === 'win' && !!e.wasAllIn },

  // ── JOKER HOLD'EM ──────────────────────────────────────────────────────────
  { id: 'joker_win_1',  category: "Joker Hold'em", title: 'Wild Start',      description: "Win 1 hand of Joker Hold'em",                    target: 1,  rarity: 'common', chipReward: 5000,   xpReward: 35,  icon: 'sparkles-outline',  iconColor: '#ffd700', check: e => e.game === 'joker_holdem' && e.action === 'win' },
  { id: 'joker_win_3',  category: "Joker Hold'em", title: 'Wild Card',       description: "Win 3 hands of Joker Hold'em",                   target: 3,  rarity: 'common', chipReward: 8000,   xpReward: 50,  icon: 'sparkles-outline',  iconColor: '#ffd700', check: e => e.game === 'joker_holdem' && e.action === 'win' },
  { id: 'joker_play_5', category: "Joker Hold'em", title: 'Joker Session',   description: "Play 5 hands of Joker Hold'em",                  target: 5,  rarity: 'common', chipReward: 4500,   xpReward: 35,  icon: 'repeat-outline',    iconColor: '#ffd700', check: e => e.game === 'joker_holdem' && (e.action === 'win' || e.action === 'play') },
  { id: 'joker_flush',  category: "Joker Hold'em", title: 'Joker Flush',     description: "Win with a Flush in Joker Hold'em",              target: 1,  rarity: 'rare',   chipReward: 20000,  xpReward: 100, icon: 'water-outline',     iconColor: '#ffd700', check: e => e.game === 'joker_holdem' && e.action === 'win' && hContains(e.handDesc, 'Flush') },
  { id: 'joker_full',   category: "Joker Hold'em", title: 'Joker Full House',description: "Win with a Full House in Joker Hold'em",          target: 1,  rarity: 'rare',   chipReward: 32000,  xpReward: 135, icon: 'home-outline',      iconColor: '#ffd700', check: e => e.game === 'joker_holdem' && e.action === 'win' && hContains(e.handDesc, 'Full House') },
  { id: 'joker_allin',  category: "Joker Hold'em", title: 'Joker All-In',    description: "Win after going All-In in Joker Hold'em",        target: 1,  rarity: 'rare',   chipReward: 22000,  xpReward: 105, icon: 'flash-outline',     iconColor: '#ffd700', check: e => e.game === 'joker_holdem' && e.action === 'win' && !!e.wasAllIn },
  // ACHIEVEMENT-ONLY — excluded from daily pool:
  { id: 'joker_five',   category: "Joker Hold'em", title: 'Five of a Kind!', description: "Win with Five of a Kind in Joker Hold'em",        target: 1,  rarity: 'legendary', chipReward: 250000, xpReward: 300, icon: 'star-outline',      iconColor: '#ffd700', check: e => e.game === 'joker_holdem' && e.action === 'win' && hContains(e.handDesc, 'Five of a Kind') },
  { id: 'joker_royal',  category: "Joker Hold'em", title: 'Joker Royal',     description: "Win with a Royal Flush in Joker Hold'em",         target: 1,  rarity: 'legendary', chipReward: 250000, xpReward: 300, icon: 'trophy-outline',    iconColor: '#ffd700', check: e => e.game === 'joker_holdem' && e.action === 'win' && e.handDesc === 'Royal Flush' },

  // ── BLACKJACK ──────────────────────────────────────────────────────────────
  { id: 'bj_win_2',     category: 'Blackjack', title: 'Warm Up',         description: 'Win 2 Blackjack hands',                       target: 2,  rarity: 'common', chipReward: 5000,  xpReward: 35,  icon: 'calculator-outline',    iconColor: '#00e887', check: e => e.game === 'blackjack' && e.action === 'win' },
  { id: 'bj_win_3',     category: 'Blackjack', title: 'On a Streak',     description: 'Win 3 Blackjack hands',                       target: 3,  rarity: 'common', chipReward: 7000,  xpReward: 45,  icon: 'calculator-outline',    iconColor: '#00e887', check: e => e.game === 'blackjack' && e.action === 'win' },
  { id: 'bj_win_5',     category: 'Blackjack', title: 'Beat the House',  description: 'Win 5 Blackjack hands',                       target: 5,  rarity: 'common', chipReward: 9000,  xpReward: 55,  icon: 'calculator-outline',    iconColor: '#00e887', check: e => e.game === 'blackjack' && e.action === 'win' },
  { id: 'bj_bust',      category: 'Blackjack', title: 'Dealer Busted',   description: 'Win 2 hands when the Dealer Busts',           target: 2,  rarity: 'common', chipReward: 8000,  xpReward: 50,  icon: 'alert-circle-outline',  iconColor: '#00e887', check: e => e.game === 'blackjack' && e.action === 'win' && !!e.dealerBusted },
  { id: 'bj_win_10',    category: 'Blackjack', title: 'Card Counter',    description: 'Win 10 Blackjack hands',                      target: 10, rarity: 'rare',   chipReward: 20000, xpReward: 100, icon: 'calculator-outline',    iconColor: '#00e887', check: e => e.game === 'blackjack' && e.action === 'win' },
  { id: 'bj_natural',   category: 'Blackjack', title: 'Blackjack!',      description: 'Hit a natural Blackjack',                     target: 1,  rarity: 'rare',   chipReward: 22000, xpReward: 110, icon: 'star-outline',          iconColor: '#00e887', check: e => e.game === 'blackjack' && e.action === 'win' && !!e.isNaturalBlackjack },
  { id: 'bj_double',    category: 'Blackjack', title: 'Double Trouble',  description: 'Win a hand after a Double Down in Blackjack',  target: 1,  rarity: 'rare',   chipReward: 20000, xpReward: 100, icon: 'add-circle-outline',    iconColor: '#00e887', check: e => e.game === 'blackjack' && e.action === 'win' && !!e.wasDoubleDown },
  { id: 'bj_split',     category: 'Blackjack', title: 'Split Decision',  description: 'Win after a Split in Blackjack',              target: 1,  rarity: 'rare',   chipReward: 18000, xpReward: 95,  icon: 'git-branch-outline',    iconColor: '#00e887', check: e => e.game === 'blackjack' && e.action === 'win' && !!e.wasSplit },
  { id: 'bj_21',        category: 'Blackjack', title: 'Twenty-One',      description: 'Win Blackjack with exactly 21',               target: 1,  rarity: 'rare',   chipReward: 18000, xpReward: 95,  icon: 'ribbon-outline',        iconColor: '#00e887', check: e => e.game === 'blackjack' && e.action === 'win' && e.playerTotal === 21 && !e.isNaturalBlackjack },

  // ── SOCIAL ─────────────────────────────────────────────────────────────────
  { id: 'social_post',    category: 'Social', title: 'Share the Action', description: 'Create 1 post in the Social Feed',      target: 1, rarity: 'common', chipReward: 5000,  xpReward: 40, icon: 'create-outline',     iconColor: '#bf5fff', check: e => e.game === 'social' && e.action === 'post' },
  { id: 'social_like_5',  category: 'Social', title: 'Fan Club',         description: 'Like 5 posts in the Social Feed',        target: 5, rarity: 'common', chipReward: 4000,  xpReward: 35, icon: 'heart-outline',      iconColor: '#ff0090', check: e => e.game === 'social' && e.action === 'like' },
  { id: 'social_comment', category: 'Social', title: 'Commentator',      description: 'Comment on 2 posts in the Social Feed',  target: 2, rarity: 'common', chipReward: 5000,  xpReward: 40, icon: 'chatbubble-outline', iconColor: '#bf5fff', check: e => e.game === 'social' && e.action === 'comment' },

  // ── GENERAL ────────────────────────────────────────────────────────────────
  { id: 'gen_spin',     category: 'General', title: 'Spin to Win',      description: 'Claim your Daily Spin reward',                        target: 1,  rarity: 'common', chipReward: 5000,  xpReward: 40,  icon: 'reload-circle-outline',   iconColor: '#9955ee', check: e => e.game === 'general' && e.action === 'daily_spin' },
  { id: 'any_play_15',  category: 'General', title: 'Showing Up',       description: 'Play 15 hands across any game mode',                  target: 15, rarity: 'common', chipReward: 6000,  xpReward: 40,  icon: 'game-controller-outline', iconColor: '#00d4ff', check: e => ['win', 'play'].includes(e.action) && ['texas_holdem', 'short_deck_holdem', 'omaha_holdem', 'joker_holdem', 'blackjack'].includes(e.game) },
  { id: 'any_play_20',  category: 'General', title: 'Dedicated Player', description: 'Play 20 hands across any game mode',                  target: 20, rarity: 'rare',   chipReward: 8000,  xpReward: 50,  icon: 'game-controller-outline', iconColor: '#00d4ff', check: e => ['win', 'play'].includes(e.action) && ['texas_holdem', 'short_deck_holdem', 'omaha_holdem', 'joker_holdem', 'blackjack'].includes(e.game) },
  { id: 'any_allin_3',  category: 'General', title: 'All-In Survivor',  description: 'Win 3 hands after going All-In in any game',          target: 3,  rarity: 'rare',   chipReward: 25000, xpReward: 120, icon: 'flash-outline',           iconColor: '#ff0090', check: e => e.action === 'win' && !!e.wasAllIn },
  { id: 'any_aces_2',   category: 'General', title: 'Aces High',        description: "Win 2 hands with Pocket Aces in any Hold'em variant", target: 2,  rarity: 'rare',   chipReward: 38000, xpReward: 150, icon: 'diamond-outline',         iconColor: '#ffd700', check: e => ['texas_holdem', 'short_deck_holdem', 'omaha_holdem', 'joker_holdem'].includes(e.game) && e.action === 'win' && hasPocketPair(e.holeCards, 14) },
  { id: 'gen_earn_250', category: 'General', title: 'Quarter Million',  description: 'Earn 250,000+ chips in a single pot win',             target: 1,  rarity: 'rare',   chipReward: 50000, xpReward: 160, icon: 'cash-outline',            iconColor: '#ffd700', check: e => e.action === 'chip_earn' && (e.chipsEarned ?? 0) >= 250000 },
  // ACHIEVEMENT-ONLY — excluded from daily pool:
  { id: 'any_royal',    category: 'General', title: 'Royal Treatment',  description: 'Win with a Royal Flush in any game mode',             target: 1,  rarity: 'legendary', chipReward: 250000, xpReward: 300, icon: 'trophy',                  iconColor: '#ffd700', check: e => e.action === 'win' && e.handDesc === 'Royal Flush' },
  { id: 'any_quads',    category: 'General', title: 'Quads Anywhere',   description: 'Win with Four of a Kind in any poker variant',        target: 1,  rarity: 'legendary', chipReward: 150000, xpReward: 250, icon: 'grid',                    iconColor: '#bf5fff', check: e => e.action === 'win' && hContains(e.handDesc, 'Four of a Kind') },
  { id: 'gen_earn_500', category: 'General', title: 'Half a Mil',       description: 'Earn 500,000+ chips in a single pot win',             target: 1,  rarity: 'legendary', chipReward: 150000, xpReward: 300, icon: 'cash',                    iconColor: '#ffd700', check: e => e.action === 'chip_earn' && (e.chipsEarned ?? 0) >= 500000 },
];

// ── Seeded daily selection ─────────────────────────────────────────────────────

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = (seed >>> 0) || 1;
  for (let i = result.length - 1; i > 0; i--) {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function dateToSeed(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// ── Daily-eligible mission pools ───────────────────────────────────────────────
// Achievement-only IDs are EXCLUDED from both pools:
//   txh_win_quads, txh_win_sf, txh_win_royal, joker_five, joker_royal

// Generic / achievable missions (play-count, win-count, all-in, social)
const GENERIC_IDS = new Set([
  'txh_win_1', 'txh_win_3', 'txh_play_5', 'txh_play_10', 'txh_play_25', 'txh_allin',
  'sd_win_1', 'sd_win_3', 'sd_play_5', 'sd_allin',
  'omaha_win_1', 'omaha_win_3', 'omaha_play_5', 'omaha_allin',
  'joker_win_1', 'joker_win_3', 'joker_play_5', 'joker_allin',
  'bj_win_2', 'bj_win_3', 'bj_win_5', 'bj_win_10', 'bj_bust',
  'social_post', 'social_like_5', 'social_comment',
  'gen_spin', 'any_play_15', 'any_play_20', 'any_allin_3', 'any_aces_2',
]);

// Hand-rank specific missions (require a specific hand — guaranteed slot each day)
const HAND_RANK_IDS = new Set([
  'txh_win_pair', 'txh_win_two_pair', 'txh_win_trips', 'txh_win_straight',
  'txh_win_flush', 'txh_win_full', 'txh_aces', 'txh_kings', 'txh_suited',
  'sd_trips', 'sd_flush', 'sd_full',
  'omaha_straight', 'omaha_flush', 'omaha_full',
  'joker_flush', 'joker_full',
  'bj_natural', 'bj_double', 'bj_split', 'bj_21', 'gen_earn_250',
]);

// Hard-tier hand-rank missions (tougher to achieve)
const HARD_HAND_IDS = new Set([
  'txh_win_flush', 'txh_win_full',
  'sd_flush', 'sd_full',
  'omaha_flush', 'omaha_full',
  'joker_flush', 'joker_full',
  'any_aces_2', 'gen_earn_250',
]);

function pickBestMission(
  candidates: MissionDef[],
  usedIds: Set<string>,
  categoryCounts: Map<string, number>,
  maxPerCat: number,
): MissionDef | null {
  const available = candidates.filter(m => !usedIds.has(m.id));
  return (
    available.find(m => (categoryCounts.get(m.category) ?? 0) < maxPerCat) ??
    available[0] ??
    null
  );
}

function selectDailyMissions(): MissionDef[] {
  const seed         = dateToSeed(getTodayKey());
  const usedIds      = new Set<string>();
  const catCounts    = new Map<string, number>();
  const selected: MissionDef[] = [];

  const addMission = (m: MissionDef) => {
    selected.push(m);
    usedIds.add(m.id);
    catCounts.set(m.category, (catCounts.get(m.category) ?? 0) + 1);
  };

  // Slot 1 + 2 — generic/achievable missions; prefer different categories
  const generic1 = seededShuffle(MISSION_POOL.filter(m => GENERIC_IDS.has(m.id)), seed);
  const g1 = pickBestMission(generic1, usedIds, catCounts, 1);
  if (g1) addMission(g1);

  const generic2 = seededShuffle(MISSION_POOL.filter(m => GENERIC_IDS.has(m.id)), seed + 1);
  const g2 = pickBestMission(generic2, usedIds, catCounts, 1);
  if (g2) addMission(g2);

  // Slot 3 — guaranteed hand-rank specific mission (always present)
  const handRank = seededShuffle(MISSION_POOL.filter(m => HAND_RANK_IDS.has(m.id) && !HARD_HAND_IDS.has(m.id)), seed + 2);
  const h3 = pickBestMission(handRank, usedIds, catCounts, 2);
  if (h3) addMission(h3);

  // Slot 4 — any medium mission (generic or hand-rank, prefer new category)
  const anyMed = seededShuffle(MISSION_POOL.filter(m => GENERIC_IDS.has(m.id) || HAND_RANK_IDS.has(m.id)), seed + 3);
  const m4 = pickBestMission(anyMed, usedIds, catCounts, 2);
  if (m4) addMission(m4);

  // Slot 5 — hard hand-rank mission (flush / full house / big earn)
  const hard = seededShuffle(MISSION_POOL.filter(m => HARD_HAND_IDS.has(m.id)), seed + 4);
  const h5 = pickBestMission(hard, usedIds, catCounts, 3);
  if (h5) addMission(h5);

  // Safety top-up
  if (selected.length < 5) {
    const allEligible = seededShuffle(
      MISSION_POOL.filter(m => (GENERIC_IDS.has(m.id) || HAND_RANK_IDS.has(m.id)) && !usedIds.has(m.id)),
      seed + 99,
    );
    for (const m of allEligible) {
      if (selected.length >= 5) break;
      selected.push(m);
    }
  }

  return selected;
}

// ── Storage ────────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = '@missions_v2_';

type StoredState = {
  progress: Record<string, number>;
  claimed: string[];
  grandRewardClaimed?: boolean;
};

async function loadState(dateKey: string): Promise<StoredState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_PREFIX + dateKey);
    if (raw) return JSON.parse(raw) as StoredState;
  } catch {}
  return { progress: {}, claimed: [], grandRewardClaimed: false };
}

async function saveState(dateKey: string, state: StoredState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_PREFIX + dateKey, JSON.stringify(state));
  } catch {}
}

// ── Context ────────────────────────────────────────────────────────────────────

type MissionsContextType = {
  dailyMissions: ActiveMission[];
  completedCount: number;
  claimMission: (id: string) => Promise<void>;
  reportGameEvent: (event: MissionEvent) => void;
  pendingCompletions: string[];
  clearPendingCompletion: (id: string) => void;
  // Grand Reward
  grandRewardAvailable: boolean;
  grandRewardClaimed: boolean;
  pendingGrandReward: boolean;
  claimGrandReward: () => Promise<void>;
  clearPendingGrandReward: () => void;
  // Dev testing only
  debugFillAllComplete: () => void;
};

const MissionsContext = createContext<MissionsContextType>({
  dailyMissions: [],
  completedCount: 0,
  claimMission: async () => {},
  reportGameEvent: () => {},
  pendingCompletions: [],
  clearPendingCompletion: () => {},
  grandRewardAvailable: false,
  grandRewardClaimed: false,
  pendingGrandReward: false,
  claimGrandReward: async () => {},
  clearPendingGrandReward: () => {},
  debugFillAllComplete: () => {},
});

export function MissionsProvider({ children }: { children: React.ReactNode }) {
  const { addChips, addXP, addFortuneCookies } = useUser();
  const { addNotification } = useNotifications();
  const [dateKey] = useState(getTodayKey);
  const [missions] = useState<MissionDef[]>(selectDailyMissions);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [claimed, setClaimed] = useState<string[]>([]);
  const [pendingCompletions, setPendingCompletions] = useState<string[]>([]);
  const [grandRewardClaimed, setGrandRewardClaimed] = useState(false);
  const [pendingGrandReward, setPendingGrandReward] = useState(false);

  const loadedRef = useRef(false);
  const claimedRef = useRef<string[]>([]);
  const progressRef = useRef<Record<string, number>>({});
  const grandRewardClaimedRef = useRef(false);
  // Prevent re-showing the grand reward banner after dismissal in the same session
  const grandRewardBannerShownRef = useRef(false);

  claimedRef.current = claimed;
  progressRef.current = progress;
  grandRewardClaimedRef.current = grandRewardClaimed;

  // ── Load persisted state ───────────────────────────────────────────────────

  useEffect(() => {
    loadState(dateKey).then(state => {
      setProgress(state.progress);
      setClaimed(state.claimed);
      setGrandRewardClaimed(state.grandRewardClaimed ?? false);
      loadedRef.current = true;
    });
  }, [dateKey]);

  // ── Persist on every change ────────────────────────────────────────────────

  useEffect(() => {
    if (!loadedRef.current) return;
    void saveState(dateKey, { progress, claimed, grandRewardClaimed });
  }, [progress, claimed, grandRewardClaimed, dateKey]);

  // ── Detect grand reward unlock ─────────────────────────────────────────────
  // Fires whenever the claimed array grows — if all 5 are now claimed and the
  // grand reward hasn't been claimed yet, queue the banner (once per session).

  useEffect(() => {
    if (!loadedRef.current) return;
    if (missions.length === 0) return;
    if (grandRewardBannerShownRef.current) return;
    const allClaimed = missions.every(m => claimed.includes(m.id));
    if (allClaimed && !grandRewardClaimedRef.current) {
      grandRewardBannerShownRef.current = true;
      setPendingGrandReward(true);
    }
  }, [claimed, missions]);

  // ── Event handler ──────────────────────────────────────────────────────────

  const reportGameEvent = useCallback((event: MissionEvent) => {
    setProgress(prev => {
      const next = { ...prev };
      const newlyCompleted: string[] = [];
      for (const m of missions) {
        if (claimedRef.current.includes(m.id)) continue;
        if (!m.check(event)) continue;
        const current = prev[m.id] ?? 0;
        if (current >= m.target) continue;
        const updated = current + 1;
        next[m.id] = updated;
        if (updated >= m.target) newlyCompleted.push(m.id);
      }
      if (newlyCompleted.length > 0) {
        setPendingCompletions(p => [...new Set([...p, ...newlyCompleted])]);
      }
      return next;
    });
  }, [missions]);

  // ── Claim individual mission ───────────────────────────────────────────────

  const claimMission = useCallback(async (id: string) => {
    const m = missions.find(def => def.id === id);
    if (!m) return;
    if ((progressRef.current[id] ?? 0) < m.target) return;
    if (claimedRef.current.includes(id)) return;
    setClaimed(prev => [...prev, id]);
    setPendingCompletions(prev => prev.filter(x => x !== id));
    await addChips(m.chipReward);
    await addXP(m.xpReward);
    addNotification({
      category: 'reward',
      priority: 'medium',
      title: `Mission Complete: ${m.title}`,
      message: `+${m.chipReward.toLocaleString()} chips · +${m.xpReward.toLocaleString()} XP`,
      icon: m.icon,
      iconColor: m.iconColor,
      actionRoute: '/(tabs)/',
      actionLabel: 'VIEW',
    });
  }, [missions, addChips, addXP, addNotification]);

  // ── Grand Reward ───────────────────────────────────────────────────────────

  const claimGrandReward = useCallback(async () => {
    if (grandRewardClaimedRef.current) return;
    setGrandRewardClaimed(true);
    setPendingGrandReward(false);
    // Exactly 1 Legendary Fortune Cookie — hard-coded, bypasses all rarity rolls
    await addFortuneCookies(0, 0, 0, 1, 0, 'daily_missions_grand_reward');
    addNotification({
      category: 'reward',
      priority: 'high',
      title: 'Grand Reward Claimed!',
      message: 'All 5 daily missions complete — you earned a Legendary Fortune Cookie.',
      icon: 'trophy',
      iconColor: '#ffd700',
      actionRoute: '/rewards/cookie',
      actionLabel: 'OPEN COOKIE',
    });
  }, [addFortuneCookies, addNotification]);

  const clearPendingGrandReward = useCallback(() => {
    setPendingGrandReward(false);
  }, []);

  const clearPendingCompletion = useCallback((id: string) => {
    setPendingCompletions(prev => prev.filter(x => x !== id));
  }, []);

  // ── Dev testing: reset today's missions so all are complete but unclaimed ──
  const debugFillAllComplete = useCallback(() => {
    const filled: Record<string, number> = {};
    for (const m of missions) filled[m.id] = m.target;
    setProgress(filled);
    setClaimed([]);
    setGrandRewardClaimed(false);
    setPendingGrandReward(false);
    setPendingCompletions([]);
    grandRewardClaimedRef.current = false;
    progressRef.current = filled;
    claimedRef.current = [];
    void saveState(dateKey, { progress: filled, claimed: [], grandRewardClaimed: false });
  }, [missions, dateKey]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const dailyMissions: ActiveMission[] = missions.map(m => ({
    id: m.id, category: m.category, title: m.title, description: m.description,
    target: m.target, rarity: m.rarity, chipReward: m.chipReward, xpReward: m.xpReward,
    icon: m.icon, iconColor: m.iconColor,
    progress: progress[m.id] ?? 0,
    claimed: claimed.includes(m.id),
  }));

  const completedCount = dailyMissions.filter(m => m.progress >= m.target).length;

  // Grand reward is available when ALL 5 missions are claimed AND not yet granted
  const grandRewardAvailable =
    missions.length > 0 &&
    missions.every(m => claimed.includes(m.id)) &&
    !grandRewardClaimed;

  return (
    <MissionsContext.Provider value={{
      dailyMissions,
      completedCount,
      claimMission,
      reportGameEvent,
      pendingCompletions,
      clearPendingCompletion,
      grandRewardAvailable,
      grandRewardClaimed,
      pendingGrandReward,
      claimGrandReward,
      clearPendingGrandReward,
      debugFillAllComplete,
    }}>
      {children}
    </MissionsContext.Provider>
  );
}

export function useMissions(): MissionsContextType {
  return useContext(MissionsContext);
}
