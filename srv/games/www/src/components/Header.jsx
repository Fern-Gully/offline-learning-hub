import PropTypes from 'prop-types';

export function Header({ brand, navLinks, onScrollToContent }) {
  const safeBrand = {
    glyph: '🎮',
    title: 'LAN Arcade',
    sub: 'Local-first fun hub',
    ...(brand ?? {}),
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand">
          {safeBrand.glyph && (
            <span className="brand-glyph" aria-hidden="true">
              {safeBrand.glyph}
            </span>
          )}
          <div className="brand-copy">
            <span className="brand-title">{safeBrand.title}</span>
            {safeBrand.sub && <span className="brand-sub">{safeBrand.sub}</span>}
          </div>
        </div>
        {navLinks.length > 0 && (
          <nav className="header-actions">
            {navLinks.map((link) => {
              if (link.type === 'scroll') {
                return (
                  <button
                    key={link.id}
                    type="button"
                    className={link.variant ?? 'ghost'}
                    onClick={onScrollToContent}
                  >
                    {link.label}
                  </button>
                );
              }

              const className = [link.variant ?? 'ghost', link.active ? 'active' : null]
                .filter(Boolean)
                .join(' ');
              const target = link.external ? '_blank' : link.target ?? '_self';
              const rel = link.external ? 'noopener noreferrer' : link.rel;

              return (
                <a
                  key={link.id}
                  className={className}
                  href={link.href}
                  target={target}
                  rel={rel}
                  aria-current={link.active ? 'page' : undefined}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}

Header.propTypes = {
  brand: PropTypes.shape({
    glyph: PropTypes.string,
    title: PropTypes.string.isRequired,
    sub: PropTypes.string,
  }),
  navLinks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['scroll', 'link']).isRequired,
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
      variant: PropTypes.string,
      external: PropTypes.bool,
      target: PropTypes.string,
      rel: PropTypes.string,
      active: PropTypes.bool,
    }),
  ),
  onScrollToContent: PropTypes.func,
};

Header.defaultProps = {
  brand: {
    glyph: '🎮',
    title: 'LAN Arcade',
    sub: 'Local-first fun hub',
  },
  navLinks: [],
  onScrollToContent: () => {},
};
