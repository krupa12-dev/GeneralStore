import { useLocation, Link, useNavigate } from 'react-router-dom';

export default function OrderSucess() {
  const location = useLocation();
  const navigate = useNavigate();
  const confirmation = location.state;

  if (!confirmation) {
    return (
      <div className="section-container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>No recent order found</h2>
        <button className="primary-button" onClick={() => navigate('/products')}>
          Go to Shop
        </button>
      </div>
    );
  }

  return (
    <section className="section-container" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
      <div
        style={{
          padding: '24px',
          borderRadius: '12px',
          background: '#eaf8ef',
          border: '1px solid #b7e4c7',
          color: '#176534',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Order placed successfully!</h2>
        <p>
          Order number: <strong>#{confirmation.orderId}</strong>
        </p>
        <p>
          Total paid: <strong>₹{Number(confirmation.totalAmount).toFixed(2)}</strong>
        </p>
        <p style={{ marginBottom: '20px' }}>Thank you for shopping with us.</p>
        <Link to="/products" className="primary-button">
          Continue Shopping
        </Link>
      </div>
    </section>
  );
}