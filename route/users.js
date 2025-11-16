import express from 'express';
import db from '../db/db.js'; // ✅ corrected path

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const users = await db('users').select('*');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
