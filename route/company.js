import express from 'express';
import db from '../db/db.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

/*--------------------------------
  GET ALL COMPANIES
--------------------------------*/
router.get('/', async (req, res) => {
  try {
    const companies = await db('company').select('*');

    const result = companies.map(company => ({
      ...company,
      logo_url: company.logo
        ? `${req.protocol}://${req.get('host')}/uploads/logo/${company.logo}`
        : null,
      gpay_qr_url: company.gpay_qr
        ? `${req.protocol}://${req.get('host')}/uploads/qr_code/${company.gpay_qr}`
        : null
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("GET /company error:", err);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

/*--------------------------------
  MULTER STORAGE (FULL FIX)
--------------------------------*/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "logo") {
      cb(null, "uploads/logo");
    } else if (file.fieldname === "gpay_qr") {
      cb(null, "uploads/qr_code");
    } else {
      cb(new Error("Invalid upload field"), null);
    }
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    if (file.fieldname === "logo") {
      cb(null, "LOGO_" + Date.now() + ext);
    } else if (file.fieldname === "gpay_qr") {
      cb(null, "QR_" + Date.now() + ext);
    }
  }
});

const uploads = multer({ storage }).fields([
  { name: "logo", maxCount: 1 },
  { name: "gpay_qr", maxCount: 1 }
]);

/*--------------------------------
  POST ROUTE
--------------------------------*/
router.post('/', uploads, async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const {
      name, phone1, phone2, city, state, address,
      gst_number, description, gpay_number, gpay_upi, gmail, country
    } = req.body;

    const logo = req.files?.logo ? req.files.logo[0].filename : null;
    const gpay_qr = req.files?.gpay_qr ? req.files.gpay_qr[0].filename : null;

    if (!name || !phone1 || !city || !state || !address) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const [id] = await db('company').insert({
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
      country,
      logo,
      gpay_qr
    });

    res.status(201).json({ message: 'Company created successfully', company_id: id });

  } catch (err) {
    console.error('POST /company error:', err);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

/*--------------------------------
  PUT ROUTE
--------------------------------*/
router.put('/:id', uploads, async (req, res) => {
  try {
    const { id } = req.params;

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const {
      name, phone1, phone2, city, state, address,
      gst_number, description, gpay_number, gpay_upi, gmail, country
    } = req.body;

    let updateData = {
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

    if (req.files?.logo) updateData.logo = req.files.logo[0].filename;
    if (req.files?.gpay_qr) updateData.gpay_qr = req.files.gpay_qr[0].filename;

    const exists = await db('company').where({ id }).first();
    if (!exists) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await db('company').where({ id }).update(updateData);

    res.status(200).json({ message: 'Company updated successfully' });

  } catch (err) {
    console.error('PUT /company error:', err);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

export default router;
