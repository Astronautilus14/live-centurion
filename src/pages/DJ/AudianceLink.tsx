import { Link } from "react-router-dom";

function AudianceLink() {
  return (
    <button>
      <Link to="/audiance" target="new">
        📺
      </Link>
    </button>
  );
}

export default AudianceLink;
