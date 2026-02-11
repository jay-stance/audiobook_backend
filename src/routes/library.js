import express from 'express';
import Book from '../models/Book.js';
import { deleteFromS3, isS3Configured } from '../config/s3.js';

const router = express.Router();

// GET /api/library — List all books
router.get('/', async (req, res) => {
  try {
    const books = await Book.find()
      .select('-rawText -cleanedText -pages')
      .sort({ createdAt: -1 });
    res.json({ success: true, books });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/library/:id — Get single book with full text
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ success: true, book });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/library/:id — Delete a book
router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Delete from S3 if configured and file exists
    if (isS3Configured() && book.s3Key) {
      try {
        await deleteFromS3(book.s3Key);
        console.log(`🗑️ Deleted from S3: ${book.s3Key}`);
      } catch (s3Err) {
        console.error('S3 delete failed (non-fatal):', s3Err.message);
      }
    }

    await Book.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Book deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
