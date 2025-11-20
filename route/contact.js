import express from 'express';
const router = express.Router();
import db from '../db/db.js'; // Your knex or DB connection


router.get('/', async (req, res) => {
  try {
    const { name, email } = req.query;

    let query = db('contacts');

    if (name) {
      query = query.where('name', 'like', `%${name}%`);
    }

    if (email) {
      query = query.where('email', 'like', `%${email}%`);
    }

    const contacts = await query.select('*');

    res.json({ contacts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch contacts' });
  }
});


// POST a new contact
router.post('/', async (req, res) => {
  try {
    const { name, phone_number, email, message } = req.body;

    // Basic validation
    if (!name || !phone_number || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const [newContactId] = await db('contacts').insert({
      name,
      phone_number,
      email,
      message,
    });

    const newContact = await db('contacts').where({ id: newContactId }).first();

    res.status(201).json({ contact: newContact });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create contact' });
  }
});

export default router;
