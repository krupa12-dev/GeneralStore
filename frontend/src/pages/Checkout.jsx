import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../StoreContext';

export default function Checkout() {
  const { cart, totalPrice, clearCart } = useStore();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    setCheckoutError('');

    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();

    if (!trimmedName || trimmedName.length > 100) {
      setCheckoutError('Please enter your name (maximum 100 characters).');
      return;
    }

    if (!trimmedPhone || trimmedPhone.length > 20) {
      setCheckoutError('Please enter a valid phone number (maximum 20 characters).');
      return;
    }

    if (cart.length === 0) {
      setCheckoutError('Your cart is empty.');
      return;
    }

    setPlacingOrder(true);

    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: trimmedName,
          customerPhone: trimmedPhone,
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to place your order.');
      }

      clearCart();
      navigate('/order-success', {
        state: { orderId: data.orderId, totalAmount: data.totalAmount },
      });
    } catch (err) {
      setCheckoutError(err.message || 'Unable to place your order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="section-container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Your cart is empty</h2>
        <p>Add some products before checking out.</p>
        <button className="primary-button" onClick={() => navigate('/products')}>
          Shop Products
        </button>
      </div>
    );
  }

  return (
    <section className="section-container" style={{ maxWidth: '600px', margin: '40px auto' }}>
      <h2>Checkout</h2>
      <p>Enter your details to finalize your order (Total: ₹{totalPrice}).</p>

      <form onSubmit={handlePlaceOrder} style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span>Customer Name</span>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            maxLength={100}
            required
            disabled={placingOrder}
            placeholder="Full Name"
            style={{ padding: '11px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          />
        </label>

        <label style={{ display: 'grid', gap: '6px' }}>
          <span>Phone Number</span>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            maxLength={20}
            required
            disabled={placingOrder}
            placeholder="Phone Number"
            style={{ padding: '11px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          />
        </label>

        {checkoutError && <p style={{ color: '#b42318', margin: 0 }}>{checkoutError}</p>}

        <button type="submit" className="primary-button" disabled={placingOrder}>
          {placingOrder ? 'Placing order...' : 'Place Order'}
        </button>
      </form>
    </section>
  );
}