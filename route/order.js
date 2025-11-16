import express from 'express';
const router = express.Router();
import db from '../db/db.js'; // Your knex or DB connection

// Generate sequential order number
async function generateOrderNumber() {
  const lastOrder = await db('orders').orderBy('id', 'desc').first();
  let lastNumber = 0;
  if (lastOrder && lastOrder.order_number) {
    lastNumber = parseInt(lastOrder.order_number.split('-')[1], 10);
  }
  const newNumber = (lastNumber + 1).toString().padStart(6, '0');
  return `ORD-${newNumber}`;
}

// GET all orders with optional filters
router.get('/', async (req, res) => {
  try {
    const { customer_name, status, phone_number, order_number } = req.query;
    let query = db('orders');

    if (customer_name) {
      query = query.where('customer_name', 'like', `%${customer_name}%`);
    }
    if (status) {
      query = query.where('status', status);
    }
    if (phone_number) {
      query = query.where('phone_number', 'like', `%${phone_number}%`);
    }
    if (order_number) {
      query = query.where('order_number', order_number); // exact match
    }

    const orders = await query.select('*');
    res.status(200).json({ orders });
  } catch (err) {
    console.error('GET /orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET single order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await db('orders').where({ id }).first();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({ order });
  } catch (err) {
    console.error(`GET /orders/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});


// POST create a new order
router.post('/', async (req, res) => {
  try {
    const { customer_name, email, phone_number, address, status = 'pending', items } = req.body;

    if (!customer_name || !email || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Required fields missing or items empty' });
    }

    // Calculate total amount
    const total_amount = items.reduce((sum, item) => sum + item.qty * item.price, 0);

    // Generate order number
    const order_number = await generateOrderNumber();

    // Start transaction to update stock and insert order
    await db.transaction(async trx => {
      for (const item of items) {
        const product = await trx('products').where('name', item.name).first();
        if (!product) throw new Error(`Product not found: ${item.name}`);

        const newStock = product.stock - item.qty;
        if (newStock < 0) throw new Error(`Insufficient stock for product: ${item.name}`);

        await trx('products')
          .where('id', product.id)
          .update({
            stock: newStock,
            status: newStock === 0 ? 'Not available' : product.status
          });
      }

      const [id] = await trx('orders').insert({
        order_number,
        customer_name,
        email,
        phone_number,
        address,
        status,
        items: JSON.stringify(items),
        total_amount
      });

      res.status(201).json({ message: 'Order created', order_id: id, order_number, total_amount });
    });
  } catch (err) {
    console.error('POST /orders error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT update order by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, email, phone_number, address, status, items, total_amount } = req.body;

    const order = await db('orders').where({ id }).first();
    if (!order) return res.status(404).json({ error: 'Order not found' });

   await db('orders')
  .where({ id })
  .update({
    customer_name: customer_name || order.customer_name,
    email: email || order.email,
    phone_number: phone_number || order.phone_number,
    address: address || order.address,
    status: status || order.status,
    items: items ? JSON.stringify(items) : order.items, // ✅ stringify
    total_amount: total_amount || order.total_amount
  });


    const updatedOrder = await db('orders').where({ id }).first();
    res.status(200).json({ message: 'Order updated', order: updatedOrder });
  } catch (err) {
    console.error('PUT /orders/:id error:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE order by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await db('orders').where({ id }).first();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    await db('orders').where({ id }).del();
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error('DELETE /orders/:id error:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;
