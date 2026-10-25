import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../StoreContext';

export default function Cart() {
  const { cart, totalItems, totalPrice, notice, updateQuantity, removeFromCart, clearCart } = useStore();
  const navigate = useNavigate();

  return (
    <section id="cart" className="cart-section section-container">
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR SELECTION</span>
          <h2>Your shopping cart</h2>
          <p className="section-description">Review your products before checkout.</p>
        </div>
        <span className="product-count">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </span>
      </div>

      {notice && (
        <p className="cart-notice" role="status">
          {notice}
        </p>
      )}

      {cart.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon" aria-hidden="true">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Your chosen products will appear here when you add them.</p>
          <Link to="/products" className="primary-button">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="cart-container">
          <div className="cart-items">
            {cart.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p>₹{item.price} / {item.unit}</p>
                  <span className="cart-line-subtotal">
                    Subtotal: ₹{item.price * item.quantity}
                  </span>
                </div>

                <div className="quantity-controls">
                  <button
                    type="button"
                    className="quantity-button"
                    aria-label={`Decrease ${item.name} quantity`}
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    −
                  </button>
                  <span className="quantity-number">{item.quantity}</span>
                  <button
                    type="button"
                    className="quantity-button"
                    aria-label={`Increase ${item.name} quantity`}
                    disabled={item.quantity >= item.stock}
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="remove-button"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </button>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h3>Order summary</h3>
            <div className="summary-row">
              <span>Total items</span>
              <strong>{totalItems}</strong>
            </div>
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>₹{totalPrice}</strong>
            </div>
            <div className="summary-row grand-total">
              <span>Estimated total</span>
              <strong>₹{totalPrice}</strong>
            </div>

            <button
              type="button"
              className="clear-cart-button"
              onClick={clearCart}
            >
              Clear Cart
            </button>

            <button
              type="button"
              className="primary-button"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}