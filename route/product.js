import express from 'express';
import db from '../db/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Ensure 'uploads' folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await db('products').select('*');
    res.json(products);
  } catch (err) {
    console.error('GET /products error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create a new product with image upload
router.post('/', upload.any(), async (req, res) => {
  try {
    console.log('Files received:', req.files);
    console.log('Body received:', req.body);

    const {
      name,
      description,
      price,
      quantity,
      category,
      status,
      stock,
      discount,
      discount_price
    } = req.body;

    // Basic validation
    if (!name || !price || !quantity || !category || !status ) {
      return res.status(400).json({ error: 'Required fields missing' });
    }
console.log('req.body:', req.body);
console.log('req.files:', req.files);

    // pick first uploaded file (if any)
    const file = (req.files && req.files.length) ? req.files[0] : null;
    const imageUrl = file ? `/uploads/${file.filename}` : '';

    const newProduct = {
      name,
      description: description || '',
      price,
      quantity,
      category,
      status,
      images: imageUrl,
      stock: stock || quantity,
      discount: discount || '0',
      discount_price: discount_price || price
    };

    const [id] = await db('products').insert(newProduct);

    res.status(201).json({ message: 'Product created successfully', productId: id, imageUrl });
  } catch (err) {
    console.error('POST /products error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update product by ID
router.put('/:id', upload.any(), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      quantity,
      category,
      status,
      stock,
      discount,
      discount_price
    } = req.body;

    const existingProduct = await db('products').where({ id }).first();
    if (!existingProduct) return res.status(404).json({ error: 'Product not found' });

    const file = (req.files && req.files.length) ? req.files[0] : null;
    const imageUrl = file ? `/uploads/${file.filename}` : existingProduct.images;

    const updatedProduct = {
      name: name || existingProduct.name,
      description: description || existingProduct.description,
      price: price || existingProduct.price,
      quantity: quantity || existingProduct.quantity,
      category: category || existingProduct.category,
      status: status || existingProduct.status,
      stock: stock || existingProduct.stock,
      discount: discount || existingProduct.discount,
      discount_price: discount_price || existingProduct.discount_price,
      images: imageUrl
    };

    await db('products').where({ id }).update(updatedProduct);

    res.json({ message: 'Product updated successfully', productId: id, imageUrl });
  } catch (err) {
    console.error('PUT /products/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE product by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existingProduct = await db('products').where({ id }).first();
    if (!existingProduct) return res.status(404).json({ error: 'Product not found' });

    // Delete image file if exists
    if (existingProduct.images) {
      // remove leading slashes to form a relative path
      const storedPath = existingProduct.images.replace(/^\/+/, '');
      const filePath = path.join(__dirname, '..', storedPath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db('products').where({ id }).del();
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('DELETE /products/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
