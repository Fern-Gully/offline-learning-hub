import PropTypes from 'prop-types';

export function FilterBar({
  categories,
  activeCategory,
  onCategoryChange,
  search,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
}) {
  return (
    <div className="filter-panel">
      <div className="filter-stack">
        <label className="search-field">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label={searchAriaLabel}
          />
        </label>
        <div className="category-pills" role="tablist" aria-label="Filter by category">
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={isActive ? 'pill active' : 'pill'}
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

FilterBar.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeCategory: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  searchPlaceholder: PropTypes.string,
  searchAriaLabel: PropTypes.string,
};

FilterBar.defaultProps = {
  searchPlaceholder: 'Search games',
  searchAriaLabel: 'Search games',
};
