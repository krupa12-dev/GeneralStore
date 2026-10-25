import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section
      id="home"
      className="hero"
      style={{
        position: 'relative',
        minHeight: '420px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
        padding: '40px 24px',
      }}
    >
      {/* Grocery shop background image */}
      <img
        src="/Images/grocery-store.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: 0,
        }}
      />

      {/* Dark overlay to make the text readable */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.48)',
          zIndex: 1,
        }}
      />

      {/* Hero content */}
      <div
        className="hero-content"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '850px',
          color: '',
          textAlign: 'center',
        }}
      >
        <span
          className="hero-label"
          style={{ color: '#ffffff' }}
        >
          YOUR NEIGHBOURHOOD STORE
        </span>

        <h1 style={{ color: '#ffffff' }}>
          Everyday shopping,
          <br />
          made simple.
        </h1>

        <p style={{ color: '#ffffff' }}>
          Discover groceries and daily essentials in one convenient place.
        </p>

        <Link to="/products" className="primary-button hero-button">
          Explore Products <span aria-hidden="true">→</span>
        </Link>


        <div className="hero-benefits">
          <span>✓ Everyday essentials</span>
          <span>✓ Clear pricing</span>
          <span>✓ Easy shopping</span>
        </div>

      </div>
    </section>
  );
}