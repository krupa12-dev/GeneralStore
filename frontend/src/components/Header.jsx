import { Link } from 'react-router-dom';
import { useStore } from '../StoreContext.jsx';

function Header() {
  const { totalItems } = useStore();

  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="store-logo">
          🛒 My General Store
        </Link>

        <nav className="navigation" aria-label="Main navigation">
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/cart">Cart ({totalItems})</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;