import PropTypes from "prop-types";
import "../../styles/card.css";

export function Card({ children }) {
  return <div className="card-root">{children}</div>;
}

export function CardHeader({ title, description, action }) {
  return (
    <div className="card-header">
      <div>
        <p className="card-title">{title}</p>
        {description ? <p className="card-description">{description}</p> : null}
      </div>
      {action ? <div className="card-action">{action}</div> : null}
    </div>
  );
}

export function CardContent({ children }) {
  return <div className="card-content">{children}</div>;
}

Card.propTypes = {
  children: PropTypes.node.isRequired
};

CardHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node
};

CardContent.propTypes = {
  children: PropTypes.node.isRequired
};
