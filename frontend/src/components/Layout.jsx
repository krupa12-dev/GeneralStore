import { Outlet, Link } from 'react-router-dom';
import { useStore } from '../StoreContext';

export default function Layout() {
  const { totalItems } = useStore();

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <Link className="brand" to="/">
            <span className="brand-icon" aria-hidden="true">G</span>
            <span >
              <strong style={{paddingLeft:20}}> APLA GRAHAK BAAZAR</strong>
              <small>Everyday essentials, made easy</small>
            </span>
          </Link>

          <Link className="header-cart" to="/cart">
            🛒 Cart <span>{totalItems}</span>
          </Link>
        </div>
      </header>

      <nav className="navbar" aria-label="Main navigation">
        <div className="nav-content">
          <Link to="/">Home</Link>
          <Link to="/products">Shop Products</Link>
          <Link to="/cart">Shopping Cart</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <p>© 2026 AAPLA GRAHAK BAAZAR. All rights reserved.</p>
      </footer>
    </div>
  );
}