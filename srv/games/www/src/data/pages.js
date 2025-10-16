import { categories as arcadeCategories, gamesBySlug, sections as arcadeSections } from './games.js';

const cloneGame = (slug, overrides = {}) => {
  const base = gamesBySlug[slug];
  if (!base) {
    return {
      name: overrides.name ?? slug,
      slug,
      badge: overrides.badge ?? 'Arcade',
      emoji: overrides.emoji ?? '🎮',
      category: overrides.category ?? 'All',
      description: overrides.description ?? '',
      mobileFriendly: overrides.mobileFriendly ?? true,
    };
  }

  return {
    ...base,
    ...overrides,
  };
};

const fireSections = [
  {
    id: 'rapid',
    title: 'Rapid response drills',
    blurb: 'Sharpen reflexes with quick-hit arcade challenges.',
    games: [
      cloneGame('/games/fluxgrid/', {
        category: 'Reaction',
        description: 'Weave through cascading waves to keep reflexes sharp between calls.',
      }),
      cloneGame('/games/chromashift/', {
        category: 'Reaction',
        description: 'Match shifting colours at speed to stay alert and responsive.',
      }),
      cloneGame('/games/hextris/', {
        category: 'Reaction',
        description: 'Rotate the arena quickly and maintain focus under pressure.',
      }),
      cloneGame('/games/minesweeper/', {
        category: 'Reaction',
        description: 'Clear the field carefully—missteps cost precious seconds.',
      }),
    ],
  },
  {
    id: 'strategy',
    title: 'Command & strategy',
    blurb: 'Stay cool under pressure with tactical tabletop staples.',
    games: [
      cloneGame('/games/chess/', {
        category: 'Strategy',
        description: 'Coordinate the crew several moves ahead in this timeless classic.',
      }),
      cloneGame('/games/reversi/', {
        category: 'Strategy',
        description: 'Adapt plans on the fly as the board state flips back and forth.',
      }),
      cloneGame('/games/checkers/', {
        category: 'Strategy',
        description: 'Quick tactical duels perfect for short breaks in the watch room.',
      }),
      cloneGame("/games/nine-mens-morris/malom.html", {
        category: 'Strategy',
        description: 'Work together to mill opponents and control each sector of the board.',
      }),
    ],
  },
  {
    id: 'recovery',
    title: 'Crew recovery',
    blurb: 'Wind down together with low-key puzzles and skill refreshers.',
    games: [
      cloneGame('/games/wordsearch-pro/', {
        category: 'Recovery',
        description: 'Reset with themed word hunts that suit the whole crew.',
      }),
      cloneGame('/games/sudoku/', {
        category: 'Recovery',
        description: 'Calm number grids to settle the mind between turnouts.',
      }),
      cloneGame('/games/typinggame/', {
        category: 'Recovery',
        description: 'Keep report writing sharp with short typing drills.',
      }),
    ],
  },
];

const defaultMobileNote = {
  icon: '📱',
  heading: (count) => `${count} desktop experiences hidden.`,
  body:
    'We prioritised games that run smoothly on phones and tablets. Visit on a laptop to see everything.',
  anchorId: 'mobile-note',
};

const defaultEmptyState = {
  icon: '🔎',
  message: 'No games found. Try a different search or filter.',
};

export const pageConfigs = {
  arcade: {
    id: 'arcade',
    documentTitle: 'LAN Arcade',
    theme: 'arcade',
    brand: {
      glyph: '🎮',
      title: 'LAN Arcade',
      sub: 'Local-first fun hub',
    },
    navLinks: [
      { id: 'explore', type: 'scroll', label: 'Explore games', variant: 'ghost' },
      { id: 'fire', type: 'link', label: '🔥 Fire portal', href: './fire/', variant: 'ghost' },
      {
        id: 'library',
        type: 'link',
        label: '📚 Library',
        href: 'http://library.local',
        variant: 'pill',
        external: true,
      },
    ],
    hero: {
      eyebrow: 'Welcome back',
      title: 'Pick-up-and-play games, tuned for local networks',
      lead: 'Browse curated arcade, puzzle, and retro experiences. Launch instantly, no account required.',
      primaryAction: { type: 'scroll', label: 'Start exploring', variant: 'pill primary' },
      secondaryAction: {
        type: 'link',
        label: 'Mobile optimisations',
        href: '#mobile-note',
        variant: 'ghost',
      },
    },
    sections: arcadeSections,
    categories: arcadeCategories,
    filter: {
      searchPlaceholder: 'Search games',
      searchAriaLabel: 'Search games',
    },
    mobileNote: defaultMobileNote,
    emptyState: defaultEmptyState,
  },
  fire: {
    id: 'fire',
    documentTitle: 'LAN Arcade · Fire Portal',
    theme: 'fire',
    brand: {
      glyph: '🔥',
      title: 'Fire Crew Hub',
      sub: 'Drills & downtime on standby',
    },
    navLinks: [
      { id: 'arcade', type: 'link', label: '← Arcade hub', href: '../', variant: 'ghost' },
      { id: 'drills', type: 'scroll', label: 'Browse drills', variant: 'ghost' },
      {
        id: 'library',
        type: 'link',
        label: '📚 Library',
        href: 'http://library.local',
        variant: 'pill',
        external: true,
      },
    ],
    hero: {
      eyebrow: 'Station ready',
      title: 'Crew drills and brain breaks for downtime',
      lead:
        'Rotate through quick reflex tests, tactical board games, and calm resets between call-outs.',
      primaryAction: { type: 'scroll', label: 'Launch drills', variant: 'pill primary' },
      secondaryAction: {
        type: 'link',
        label: 'Desktop guidance',
        href: '#mobile-note',
        variant: 'ghost',
      },
    },
    sections: fireSections,
    categories: ['All', 'Reaction', 'Strategy', 'Recovery'],
    filter: {
      searchPlaceholder: 'Search drills',
      searchAriaLabel: 'Search drills',
    },
    mobileNote: {
      icon: '💻',
      heading: (count) => `${count} desktop-grade drills hidden.`,
      body:
        'Heavier simulations run best on the watch-room PCs. Jump on a desktop to unlock every activity.',
      anchorId: 'mobile-note',
    },
    emptyState: {
      icon: '🚒',
      message: 'No drills match that filter. Try a different search or category.',
    },
  },
};

export const getPageConfig = (pageId) => pageConfigs[pageId] ?? pageConfigs.arcade;
