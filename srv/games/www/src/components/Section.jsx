import PropTypes from 'prop-types';
import { GameCard } from './GameCard.jsx';

export function Section({ section, index }) {
  return (
    <section className="game-section" aria-labelledby={`section-${section.id}`}>
      <div className="section-header">
        <div className="section-dot" aria-hidden="true"></div>
        <div className="section-copy">
          <h2 id={`section-${section.id}`}>{section.title}</h2>
          <p>{section.blurb}</p>
        </div>
      </div>
      <div className="game-grid">
        {section.games.map((game, idx) => (
          <GameCard key={game.slug} game={game} revealDelay={(index * 80) + idx * 50} />
        ))}
      </div>
    </section>
  );
}

Section.propTypes = {
  section: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    blurb: PropTypes.string,
    games: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
};
