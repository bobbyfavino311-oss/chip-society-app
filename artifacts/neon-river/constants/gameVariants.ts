export type GameVariant = 'texas_holdem' | 'short_deck_holdem' | 'joker_holdem';

export interface VariantConfig {
  variant: GameVariant;
  label: string;
  shortLabel: string;
  deckLabel: string;
  description: string;
  rankingNote: string;
  rulesPoints: string[];
  color: string;
  accentColor: string;
  dimColor: string;
}

export const VARIANT_CONFIGS: Record<GameVariant, VariantConfig> = {
  texas_holdem: {
    variant: 'texas_holdem',
    label: "No Limit Hold'em",
    shortLabel: 'NL Hold\'em',
    deckLabel: '52-card deck · Standard rankings',
    description: "Classic Texas Hold'em with a full 52-card deck and standard hand rankings.",
    rankingNote: 'Full House beats Flush',
    rulesPoints: [
      'Full 52-card deck — 2 through Ace',
      'Each player gets 2 hole cards',
      'Five community cards shared by all',
      'Best 5-card hand wins',
      'Standard ranking: Full House beats Flush',
      'No Limit betting structure',
    ],
    color: '#00d4ff',
    accentColor: '#0044cc',
    dimColor: '#00d4ff22',
  },
  short_deck_holdem: {
    variant: 'short_deck_holdem',
    label: 'Short Deck Hold\'em',
    shortLabel: 'Short Deck',
    deckLabel: '36-card deck · 6 through Ace',
    description: 'Six-Plus Hold\'em — 36-card deck, no 2–5. Flush beats Full House.',
    rankingNote: 'Flush beats Full House',
    rulesPoints: [
      'Deck contains only 6 through Ace — 36 cards',
      'No 2s, 3s, 4s, or 5s in the deck',
      'Each player gets 2 hole cards',
      'Five community cards shared by all',
      'FLUSH BEATS FULL HOUSE — key ranking change',
      'No wheel straight (A-2-3-4-5 impossible)',
      'Lowest straight: 6-7-8-9-10',
    ],
    color: '#ff0090',
    accentColor: '#bf5fff',
    dimColor: '#ff009022',
  },
  joker_holdem: {
    variant: 'joker_holdem',
    label: "Joker Hold'em",
    shortLabel: "Joker Hold'em",
    deckLabel: '54-card deck · Two Wild Jokers',
    description: "Texas Hold'em with two wild Jokers added. Jokers take any value — Five of a Kind is possible.",
    rankingNote: 'Five of a Kind beats Royal Flush',
    rulesPoints: [
      'Full 52-card deck PLUS two wild Jokers — 54 cards',
      'Jokers are always wild — automatically take best value',
      'Five of a Kind is the highest possible hand',
      'Hand ranking: Five of a Kind > Royal Flush > Straight Flush …',
      'Each player gets 2 hole cards (may include Joker)',
      'Five community cards shared by all (may include Joker)',
      'Standard No Limit betting structure',
    ],
    color: '#ffd700',
    accentColor: '#bf5fff',
    dimColor: '#ffd70022',
  },
};
