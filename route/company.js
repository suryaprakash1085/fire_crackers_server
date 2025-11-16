import express from 'express';
import db from '../db/db.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const companies = await db('company').select('*');
    res.status(200).json(companies);
  } catch (err) {
    console.error("GET /company error:", err);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});


// Multer config (save in uploads/logo)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/logo');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// POST Route (single file upload)
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const {
      name,
      phone1,
      phone2,
      city,
      state,
      address,
      gst_number,
      description,
      gpay_number,
      gpay_upi,
      gmail,
      country
    } = req.body;

    const logo = req.file ? req.file.filename : null;

    if (!name || !phone1 || !city || !state || !address) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const [id] = await db('company').insert({
      name,
      phone1,
      phone2,
      logo,
      city,
      state,
      address,
      gst_number,
      description,
      gpay_number,
      gpay_upi,
      gmail,
      country
    });

    res.status(201).json({ message: 'Company created', company_id: id });

  } catch (err) {
    console.error('POST /company error:', err);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// PUT Route (update company)
router.put('/:id', upload.single('logo'), async (req, res) => {
  try {
    const { id } = req.params;

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const {
      name,
      phone1,
      phone2,
      city,
      state,
      address,
      gst_number,
      description,
      gpay_number,
      gpay_upi,
      gmail,
      country
    } = req.body;

    // If user uploaded a new logo, use it; otherwise skip logo update
    const logo = req.file ? req.file.filename : undefined;

    // Build update object
    const updateData = {
      name,
      phone1,
      phone2,
      city,
      state,
      address,
      gst_number,
      description,
      gpay_number,
      gpay_upi,
      gmail,
      country
    };

    // Only include logo if new file uploaded
    if (logo) updateData.logo = logo;

    // Check if company exists
    const exists = await db('company').where({ id }).first();
    if (!exists) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Update
    await db('company').where({ id }).update(updateData);

    res.status(200).json({ message: 'Company updated successfully' });

  } catch (err) {
    console.error('PUT /company error:', err);
    res.status(500).json({ error: 'Failed to update company' });
  }
});


export default router;
