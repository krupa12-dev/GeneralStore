import { useState } from 'react';
import { useStore } from '../StoreContext';

const CATEGORIES = [
  'All Products',
  'Groceries',
  'Dairy',
  'Snacks',
  'Personal Care',
];

export default function Shop() {
  const { products, cart, loading, error, notice, addToCart } = useStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Products');
  const [sortBy, setSortBy] = useState('default');

  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(search.trim().toLowerCase())
    )
    .filter(
      (product) =>
        category === 'All Products' || product.category === category
    )
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.id - b.id;
    });

  return (
    <section id="products" className="products section-container">
      <div className="section-heading">
        <div>
          <span className="eyebrow">OUR COLLECTION</span>
          <h2>Shop our products</h2>
          <p className="section-description">
            Find the essentials you need for every day.
          </p>
        </div>

        {!loading && !error && (
          <span className="product-count">
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'product' : 'products'}
          </span>
        )}
      </div>

      {notice && (
        <p className="cart-notice" role="status">
          {notice}
        </p>
      )}

      <div className="catalogue-toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Search rice, milk, soap..."
          aria-label="Search products by name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <label className="sort-control">
          <span>Sort by</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="default">Default</option>
            <option value="name">Name: A–Z</option>
            <option value="price-low">Price: Low to high</option>
            <option value="price-high">Price: High to low</option>
          </select>
        </label>
      </div>

      <div className="category-filters" aria-label="Product categories">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            className={`category-button ${category === item ? 'active' : ''}`}
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {loading && (
        <div className="status-message" role="status">
          Loading products...
        </div>
      )}

      {error && (
        <div className="status-message error-message" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="primary-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="product-list">
          {filteredProducts.length === 0 ? (
            <div className="no-products">
              <h3>No products found</h3>
              <p>Try a different search or category.</p>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setSearch('');
                  setCategory('All Products');
                  setSortBy('default');
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const inCart =
                cart.find((item) => item.id === product.id)?.quantity ?? 0;
              const outOfStock = product.stock === 0;
              const lowStock = product.stock > 0 && product.stock <= 5;
              const limitReached = inCart >= product.stock;

              return (
                <article className="product-card" key={product.id}>
                  <div className="product-image-wrap">
                    <span className="product-category">{product.category}</span>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-image"
                      loading="lazy"
                    />
                    {inCart > 0 && (
                      <span className="in-cart-badge">In cart: {inCart}</span>
                    )}
                  </div>

                  <div className="product-card-body">
                    <h3>{product.name}</h3>
                    <p className="product-price">
                      ₹{product.price}
                      <span> / {product.unit}</span>
                    </p>
                    <p
                      className={`stock-status ${
                        outOfStock
                          ? 'out-of-stock'
                          : lowStock
                          ? 'low-stock'
                          : 'in-stock'
                      }`}
                    >
                      {outOfStock
                        ? 'Out of stock'
                        : lowStock
                        ? `Only ${product.stock} left`
                        : 'In stock'}
                    </p>
                    <button
                      type="button"
                      className="primary-button add-button"
                      disabled={outOfStock || limitReached}
                      onClick={() => addToCart(product)}
                    >
                      {outOfStock
                        ? 'Unavailable'
                        : limitReached
                        ? 'Stock Limit Reached'
                        : inCart > 0
                        ? 'Add Another'
                        : 'Add to Cart'}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}