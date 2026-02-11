import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import Book from '../models/Book.js';
import { cleanPDFText, cleanPageText } from '../utils/pdfCleaner.js';
import { uploadToS3, isS3Configured } from '../config/s3.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// POST /api/upload — Upload and parse PDF
router.post('/', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    // Parse PDF from buffer
    const pdfData = await pdfParse(req.file.buffer);

    // Extract per-page text
    const pages = [];
    const numPages = pdfData.numpages;

    // pdf-parse gives us full text. We'll split by page using a re-parse approach
    // For per-page extraction, we use the render_page option
    let pageTexts = [];
    try {
      const perPageData = await pdfParse(req.file.buffer, {
        pagerender: function(pageData) {
          return pageData.getTextContent().then(function(textContent) {
            let pageText = '';
            let lastY = null;
            for (const item of textContent.items) {
              if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5) {
                pageText += '\n';
              }
              pageText += item.str;
              lastY = item.transform[5];
            }
            pageTexts.push(pageText);
            return pageText;
          });
        }
      });
    } catch (e) {
      // Fallback: split full text evenly across pages
      const fullText = pdfData.text;
      const chunkSize = Math.ceil(fullText.length / numPages);
      for (let i = 0; i < numPages; i++) {
        pageTexts.push(fullText.slice(i * chunkSize, (i + 1) * chunkSize));
      }
    }

    // Build pages array with cleaned text
    for (let i = 0; i < pageTexts.length; i++) {
      pages.push({
        pageNumber: i + 1,
        text: cleanPageText(pageTexts[i])
      });
    }

    // Clean full text
    const cleanedFullText = cleanPDFText(pdfData.text);

    // Generate a random cover color
    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
      '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
    ];
    const coverColor = colors[Math.floor(Math.random() * colors.length)];

    // Extract title from filename or PDF metadata
    const title = pdfData.info?.Title || req.file.originalname.replace('.pdf', '').replace(/[_-]/g, ' ');
    const author = pdfData.info?.Author || 'Unknown';

    // Save to MongoDB
    const book = new Book({
      title,
      author,
      fileName: req.file.originalname,
      pages,
      totalPages: numPages,
      rawText: pdfData.text,
      cleanedText: cleanedFullText,
      fileSize: req.file.size,
      coverColor
    });

    await book.save();

    // Upload original PDF to S3 (non-blocking, won't fail the request)
    if (isS3Configured()) {
      try {
        const s3Key = `pdfs/${book._id}_${req.file.originalname}`;
        const { url } = await uploadToS3(req.file.buffer, s3Key, 'application/pdf');
        book.s3Key = s3Key;
        book.s3Url = url;
        await book.save();
        console.log(`📦 PDF uploaded to S3: ${s3Key}`);
      } catch (s3Err) {
        console.error('S3 upload failed (non-fatal):', s3Err.message);
      }
    }

    res.status(201).json({
      success: true,
      book: {
        _id: book._id,
        title: book.title,
        author: book.author,
        totalPages: book.totalPages,
        wordCount: book.wordCount,
        estimatedDuration: book.estimatedDuration,
        coverColor: book.coverColor,
        pages: book.pages,
        cleanedText: book.cleanedText
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to process PDF' });
  }
});

export default router;
