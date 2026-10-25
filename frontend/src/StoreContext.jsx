import { createContext, useContext, useEffect, useState } from 'react';

const CART_STORAGE_KEY = 'generalStoreCart';

const StoreContext = createContext(null);

function loadSavedCart() {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);

    if (!savedCart) {
      return [];
    }

    const parsedCart = JSON.parse(savedCart);

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    return parsedCart.filter(
      (item) =>
        item &&
        Number.isInteger(item.id) &&
        typeof item.name === 'string' &&
        Number.isFinite(item.price) &&
        item.price >= 0 &&
        typeof item.unit === 'string' &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    );
  } catch (error) {
    console.error('Could not load saved cart:', error);
    return [];
  }
}

export function StoreProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(loadSavedCart);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          'http://localhost:5000/api/products',
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error('Failed to load products.');
        }

        const data = await response.json();

        const validData =
          Array.isArray(data) &&
          data.every(
            (product) =>
              Number.isInteger(product.id) &&
              typeof product.name === 'string' &&
              Number.isFinite(product.price) &&
              product.price >= 0 &&
              typeof product.unit === 'string' &&
              typeof product.image === 'string' &&
              typeof product.category === 'string' &&
              Number.isInteger(product.stock) &&
              product.stock >= 0
          );

        if (!validData) {
          throw new Error('The product data is invalid.');
        }

        setProducts(data);

        setCart((currentCart) =>
          currentCart
            .map((item) => {
              const product = data.find(
                (entry) => entry.id === item.id
              );

              if (!product || product.stock === 0) {
                return null;
              }

              return {
                ...product,
                quantity: Math.min(item.quantity, product.stock),
              };
            })
            .filter((item) => item !== null && item.quantity > 0)
        );
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Product loading error:', err);

          setError(
            'Could not load products. Please check the backend and try again.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error('Could not save cart:', error);
    }
  }, [cart]);

  function addToCart(product) {
    setNotice('');

    if (product.stock <= 0) {
      setNotice(`${product.name} is currently out of stock.`);
      return;
    }

    const currentQuantity =
      cart.find((item) => item.id === product.id)?.quantity ?? 0;

    if (currentQuantity >= product.stock) {
      setNotice(
        `Only ${product.stock} units of ${product.name} are available.`
      );
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...product, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
  }

  function updateQuantity(productId, change) {
    setNotice('');

    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.id !== productId) {
            return item;
          }

          const product = products.find(
            (entry) => entry.id === productId
          );

          const stock = product?.stock ?? item.stock ?? 0;
          const quantity = item.quantity + change;

          if (quantity <= 0) {
            return null;
          }

          if (quantity > stock) {
            setNotice(`Only ${stock} units of ${item.name} are available.`);
            return item;
          }

          return { ...item, quantity };
        })
        .filter(Boolean)
    );
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  }

  function clearCart() {
    setCart([]);
    setNotice('');
  }

  const totalItems = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <StoreContext.Provider
      value={{
        products,
        cart,
        loading,
        error,
        notice,
        setNotice,
        totalItems,
        totalPrice,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error('useStore must be used inside StoreProvider.');
  }

  return context;
}