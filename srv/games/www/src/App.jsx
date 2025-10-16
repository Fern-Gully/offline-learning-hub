import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Header } from './components/Header.jsx';
import { FilterBar } from './components/FilterBar.jsx';
import { Section } from './components/Section.jsx';
import './App.css';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const listener = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [breakpoint]);

  return isMobile;
}

const gameShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
  badge: PropTypes.string.isRequired,
  emoji: PropTypes.string,
  category: PropTypes.string,
  description: PropTypes.string,
  mobileFriendly: PropTypes.bool,
});

const sectionShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  blurb: PropTypes.string,
  games: PropTypes.arrayOf(gameShape).isRequired,
});

const navLinkShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['scroll', 'link']).isRequired,
  label: PropTypes.string.isRequired,
  href: PropTypes.string,
  variant: PropTypes.string,
  external: PropTypes.bool,
  target: PropTypes.string,
  rel: PropTypes.string,
  active: PropTypes.bool,
});

const actionShape = PropTypes.shape({
  type: PropTypes.oneOf(['scroll', 'link']),
  label: PropTypes.string.isRequired,
  href: PropTypes.string,
  variant: PropTypes.string,
  external: PropTypes.bool,
  target: PropTypes.string,
  rel: PropTypes.string,
});

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

export default function App({ pageConfig }) {
  const {
    documentTitle,
    brand: brandConfig,
    navLinks: navLinksConfig = [],
    hero,
    sections: sectionsConfig,
    categories: categoriesConfig,
    filter,
    mobileNote,
    emptyState,
    theme = 'arcade',
    footerCopy,
  } = pageConfig;

  const brand = {
    glyph: '🎮',
    title: 'LAN Arcade',
    sub: 'Local-first fun hub',
    ...(brandConfig ?? {}),
  };

  const sections = sectionsConfig ?? [];
  const categories = categoriesConfig && categoriesConfig.length > 0 ? categoriesConfig : ['All'];
  const mobileNoteConfig = { ...defaultMobileNote, ...(mobileNote ?? {}) };
  const mobileNoteId = mobileNoteConfig.anchorId ?? 'mobile-note';
  const defaultHero = {
    eyebrow: 'Welcome back',
    title: 'Pick-up-and-play games, tuned for local networks',
    lead: 'Browse curated arcade, puzzle, and retro experiences. Launch instantly, no account required.',
    primaryAction: { type: 'scroll', label: 'Start exploring', variant: 'pill primary' },
    secondaryAction: {
      type: 'link',
      label: 'Mobile optimisations',
      href: `#${mobileNoteId}`,
      variant: 'ghost',
    },
  };
  const heroConfig = {
    ...defaultHero,
    ...(hero ?? {}),
    primaryAction: {
      ...defaultHero.primaryAction,
      ...(hero?.primaryAction ?? {}),
    },
    secondaryAction: {
      ...defaultHero.secondaryAction,
      ...(hero?.secondaryAction ?? {}),
    },
  };
  const emptyStateConfig = { ...defaultEmptyState, ...(emptyState ?? {}) };

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(() => categories[0] ?? 'All');
  const heroRef = useRef(null);
  const mainRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (documentTitle) {
      document.title = documentTitle;
    }
  }, [documentTitle]);

  useEffect(() => {
    document.body.dataset.theme = theme;
    return () => {
      if (document.body.dataset.theme === theme) {
        delete document.body.dataset.theme;
      }
    };
  }, [theme]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory(categories[0] ?? 'All');
    }
  }, [categories, activeCategory]);

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sections
      .map((section) => {
        const games = section.games.filter((game) => {
          if (isMobile && game.mobileFriendly === false) {
            return false;
          }
          const matchesCategory = activeCategory === 'All' || game.category === activeCategory;
          if (!matchesCategory) {
            return false;
          }
          if (!query) {
            return true;
          }
          const haystack = [game.name, game.badge, game.description, game.category]
            .filter(Boolean)
            .map((value) => value.toLowerCase());
          return haystack.some((value) => value.includes(query));
        });
        return { ...section, games };
      })
      .filter((section) => section.games.length > 0);
  }, [activeCategory, isMobile, search, sections]);

  const hiddenDesktopOnlyCount = useMemo(() => {
    if (!isMobile) {
      return 0;
    }
    return sections.reduce(
      (count, section) =>
        count + section.games.filter((game) => game.mobileFriendly === false).length,
      0,
    );
  }, [isMobile, sections]);

  const handleScrollToContent = () => {
    const target = mainRef.current ?? heroRef.current;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const searchPlaceholder = filter?.searchPlaceholder ?? 'Search experiences';
  const searchAriaLabel = filter?.searchAriaLabel ?? searchPlaceholder;

  const formatMobileHeading = () => {
    if (hiddenDesktopOnlyCount === 0) {
      return '';
    }
    const { heading } = mobileNoteConfig;
    if (typeof heading === 'function') {
      return heading(hiddenDesktopOnlyCount);
    }
    if (typeof heading === 'string') {
      return heading.replace(/{{count}}/gi, String(hiddenDesktopOnlyCount));
    }
    return `${hiddenDesktopOnlyCount} desktop experiences hidden.`;
  };

  const renderAction = (action, fallbackVariant) => {
    if (!action || !action.label) {
      return null;
    }
    const variant = action.variant ?? fallbackVariant;

    if (action.type === 'scroll') {
      return (
        <button type="button" className={variant} onClick={handleScrollToContent}>
          {action.label}
        </button>
      );
    }

    if (action.type === 'link') {
      const target = action.external ? '_blank' : action.target ?? '_self';
      const rel = action.external ? 'noopener noreferrer' : action.rel;
      return (
        <a className={variant} href={action.href ?? '#'} target={target} rel={rel}>
          {action.label}
        </a>
      );
    }

    if (typeof action.onClick === 'function') {
      return (
        <button type="button" className={variant ?? 'ghost'} onClick={action.onClick}>
          {action.label}
        </button>
      );
    }

    return null;
  };

  const footerSegments = [brand.title, brand.sub].filter(Boolean);
  const footerText = footerCopy ?? footerSegments.join(' · ');

  return (
    <div className="app-shell" data-theme={theme}>
      <Header brand={brand} navLinks={navLinksConfig} onScrollToContent={handleScrollToContent} />
      <main className="content" ref={mainRef}>
        <section className="hero" ref={heroRef}>
          <div className="hero-glow" aria-hidden="true"></div>
          <div className="hero-copy">
            {heroConfig.eyebrow && <p className="eyebrow">{heroConfig.eyebrow}</p>}
            <h1>{heroConfig.title}</h1>
            {heroConfig.lead && <p className="lead">{heroConfig.lead}</p>}
            <div className="hero-actions">
              {renderAction(heroConfig.primaryAction, 'pill primary')}
              {renderAction(heroConfig.secondaryAction, 'ghost')}
            </div>
          </div>
        </section>

        <FilterBar
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={searchPlaceholder}
          searchAriaLabel={searchAriaLabel}
        />

        {isMobile && hiddenDesktopOnlyCount > 0 && (
          <div id={mobileNoteId} className="mobile-note" role="status">
            <span aria-hidden="true">{mobileNoteConfig.icon ?? '📱'}</span>
            <div>
              <strong>{formatMobileHeading()}</strong>
              {mobileNoteConfig.body && <p>{mobileNoteConfig.body}</p>}
            </div>
          </div>
        )}

        {filteredSections.length === 0 ? (
          <div className="empty-state" role="status">
            <span aria-hidden="true">{emptyStateConfig.icon}</span>
            <p>{emptyStateConfig.message}</p>
          </div>
        ) : (
          filteredSections.map((section, index) => (
            <Section key={section.id} section={section} index={index} />
          ))
        )}
      </main>
      <footer className="site-footer">
        <div className="footer-glow" aria-hidden="true"></div>
        <p>
          {footerText} • <span className="muted">/srv/games/www</span>
        </p>
      </footer>
    </div>
  );
}

App.propTypes = {
  pageConfig: PropTypes.shape({
    id: PropTypes.string.isRequired,
    documentTitle: PropTypes.string,
    theme: PropTypes.string,
    brand: PropTypes.shape({
      glyph: PropTypes.string,
      title: PropTypes.string.isRequired,
      sub: PropTypes.string,
    }),
    navLinks: PropTypes.arrayOf(navLinkShape),
    hero: PropTypes.shape({
      eyebrow: PropTypes.string,
      title: PropTypes.string.isRequired,
      lead: PropTypes.string,
      primaryAction: actionShape,
      secondaryAction: actionShape,
    }),
    sections: PropTypes.arrayOf(sectionShape).isRequired,
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    filter: PropTypes.shape({
      searchPlaceholder: PropTypes.string,
      searchAriaLabel: PropTypes.string,
    }),
    mobileNote: PropTypes.shape({
      icon: PropTypes.string,
      heading: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
      body: PropTypes.string,
      anchorId: PropTypes.string,
    }),
    emptyState: PropTypes.shape({
      icon: PropTypes.string,
      message: PropTypes.string,
    }),
    footerCopy: PropTypes.string,
  }).isRequired,
};
