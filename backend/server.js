const express = require('express');
const cors = require('cors');
const { sql, poolPromise } = require('./db');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '100kb' }));

// Homepage
app.get('/', (req, res) => {
    res.send('Welcome to General Store Backend!');
});

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Backend is running successfully.',
    });
});

// Get all products from SQL Server
app.get('/api/products', async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT
                ProductID AS id,
                ProductName AS name,
                Price AS price,
                Unit AS unit,
                ImagePath AS image,
                Category AS category,
                Stock AS stock
            FROM dbo.Products
            ORDER BY ProductID;
        `);

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Products API error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Unable to fetch products from the database.',
        });
    }
});

// Place an order
app.post('/api/orders', async (req, res) => {
    const { customerName, customerPhone, items } = req.body;

    // Validate customer details
    if (
        typeof customerName !== 'string' ||
        !customerName.trim() ||
        customerName.trim().length > 100
    ) {
        return res.status(400).json({
            success: false,
            message: 'Please enter a valid customer name.',
        });
    }

    if (
        typeof customerPhone !== 'string' ||
        !customerPhone.trim() ||
        customerPhone.trim().length > 20
    ) {
        return res.status(400).json({
            success: false,
            message: 'Please enter a valid phone number.',
        });
    }

    // Validate cart items
    if (
        !Array.isArray(items) ||
        items.length === 0 ||
        items.length > 100
    ) {
        return res.status(400).json({
            success: false,
            message: 'Your cart is empty or contains too many items.',
        });
    }

    const productIds = new Set();

    for (const item of items) {
        if (
            !item ||
            !Number.isSafeInteger(item.productId) ||
            item.productId <= 0 ||
            !Number.isSafeInteger(item.quantity) ||
            item.quantity <= 0 ||
            item.quantity > 100000
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product or quantity in your cart.',
            });
        }

        if (productIds.has(item.productId)) {
            return res.status(400).json({
                success: false,
                message: 'Each product must appear only once in the cart.',
            });
        }

        productIds.add(item.productId);
    }

    let transaction;
    let transactionStarted = false;
    let transactionFinished = false;

    try {
        const pool = await poolPromise;

        // Start a transaction so the order, order items, and stock
        // updates succeed or fail together.
        transaction = new sql.Transaction(pool);

        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        transactionStarted = true;

        // Use SQL parameters rather than inserting user input into SQL.
        const productRequest = new sql.Request(transaction);

        const parameterNames = items.map((item, index) => {
            const parameterName = `productId${index}`;
            productRequest.input(parameterName, sql.Int, item.productId);
            return `@${parameterName}`;
        });

        // Lock the selected product rows while checking stock.
        const productResult = await productRequest.query(`
            SELECT
                ProductID,
                ProductName,
                Price,
                Stock
            FROM dbo.Products WITH (UPDLOCK, HOLDLOCK)
            WHERE ProductID IN (${parameterNames.join(', ')});
        `);

        const productsById = new Map(
            productResult.recordset.map(product => [
                product.ProductID,
                product,
            ])
        );

        // Check that all products exist and enough stock is available.
        for (const item of items) {
            const product = productsById.get(item.productId);

            if (!product) {
                throw new Error(
                    `Product with ID ${item.productId} was not found.`
                );
            }

            if (product.Stock < item.quantity) {
                throw new Error(
                    `Not enough stock for ${product.ProductName}. ` +
                    `Available stock: ${product.Stock}.`
                );
            }

            if (
                !Number.isFinite(Number(product.Price)) ||
                Number(product.Price) < 0
            ) {
                throw new Error(
                    `Invalid price for ${product.ProductName}.`
                );
            }
        }

        // Calculate the total using database prices.
        // Work in paise/cents to avoid floating-point rounding errors.
        let totalPaise = 0;

        for (const item of items) {
            const product = productsById.get(item.productId);
            const pricePaise = Math.round(Number(product.Price) * 100);

            totalPaise += pricePaise * item.quantity;
        }

        if (
            !Number.isSafeInteger(totalPaise) ||
            totalPaise < 0 ||
            totalPaise > 999999999999
        ) {
            throw new Error('The order total is outside the supported range.');
        }

        const totalAmount = totalPaise / 100;

        // Save the main order.
        const orderRequest = new sql.Request(transaction);

        orderRequest.input(
            'customerName',
            sql.NVarChar(100),
            customerName.trim()
        );

        orderRequest.input(
            'customerPhone',
            sql.NVarChar(20),
            customerPhone.trim()
        );

        orderRequest.input(
            'totalAmount',
            sql.Decimal(10, 2),
            totalAmount
        );

        const orderResult = await orderRequest.query(`
            INSERT INTO dbo.Orders
                (CustomerName, CustomerPhone, TotalAmount)
            OUTPUT INSERTED.OrderID
            VALUES
                (@customerName, @customerPhone, @totalAmount);
        `);

        const orderId = orderResult.recordset[0].OrderID;

        // Save each order item and reduce product stock.
        for (const item of items) {
            const product = productsById.get(item.productId);

            const itemRequest = new sql.Request(transaction);

            itemRequest.input('orderId', sql.Int, orderId);
            itemRequest.input('productId', sql.Int, item.productId);
            itemRequest.input('quantity', sql.Int, item.quantity);
            itemRequest.input(
                'priceAtPurchase',
                sql.Decimal(10, 2),
                Number(product.Price)
            );

            await itemRequest.query(`
                INSERT INTO dbo.OrderItems
                    (OrderID, ProductID, Quantity, PriceAtPurchase)
                VALUES
                    (@orderId, @productId, @quantity, @priceAtPurchase);
            `);

            const stockRequest = new sql.Request(transaction);

            stockRequest.input('productId', sql.Int, item.productId);
            stockRequest.input('quantity', sql.Int, item.quantity);

            const stockResult = await stockRequest.query(`
                UPDATE dbo.Products
                SET Stock = Stock - @quantity
                WHERE ProductID = @productId
                  AND Stock >= @quantity;
            `);

            if (stockResult.rowsAffected[0] !== 1) {
                throw new Error(
                    `Stock changed while processing ${product.ProductName}.`
                );
            }
        }

        // Commit only after every database operation succeeds.
        await transaction.commit();
        transactionFinished = true;

        console.log(`Order #${orderId} placed successfully.`);

        return res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            orderId,
            totalAmount,
        });
    } catch (error) {
        // Undo all order changes if any operation fails.
        if (transactionStarted && !transactionFinished) {
            try {
                await transaction.rollback();
                transactionFinished = true;
            } catch (rollbackError) {
                console.error(
                    'Transaction rollback error:',
                    rollbackError.message
                );
            }
        }

        console.error('Place order API error:', error.message);

        const isExpectedError =
            error.message.startsWith('Product with ID ') ||
            error.message.startsWith('Not enough stock for ') ||
            error.message.startsWith('Invalid price for ') ||
            error.message.startsWith('Stock changed while processing ');

        if (isExpectedError) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Unable to place your order. Please try again.',
        });
    }
});

// Handle unknown API routes
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API route not found.',
    });
});

// Handle unexpected errors
app.use((err, req, res, next) => {
    console.error('Server error:', err.message);

    if (res.headersSent) {
        return next(err);
    }

    res.status(500).json({
        success: false,
        message: 'An unexpected server error occurred.',
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});