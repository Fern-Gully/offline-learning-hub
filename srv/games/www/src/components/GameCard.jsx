import PropTypes from 'prop-types';

export function GameCard({ game, revealDelay }) {
  return (
    <a
      className="game-card"
      href={game.slug}
      target="_self"
      style={{ animationDelay: `${revealDelay}ms` }}
    >
      <div className="game-card__media" aria-hidden="true">
        <div className="spark"></div>
        <span className="emoji" role="img" aria-label="">
          {game.emoji}
        </span>
        <span className="badge">{game.badge}</span>
        {!game.mobileFriendly && <span className="device-flag">Desktop</span>}
      </div>
      <div className="game-card__body">
        <div className="game-card__title">{game.name}</div>
        <p className="game-card__description">{game.description}</p>
        <span className="game-card__path" aria-label={`Path ${game.slug}`}>
          {game.slug}
        </span>
      </div>
    </a>
  );
}

GameCard.propTypes = {
  game: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    badge: PropTypes.string.isRequired,
    emoji: PropTypes.string,
    category: PropTypes.string,
    description: PropTypes.string,
    mobileFriendly: PropTypes.bool,
  }).isRequired,
  revealDelay: PropTypes.number.isRequired,
};
