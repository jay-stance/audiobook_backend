import express from 'express';
import Progress from '../models/Progress.js';

const router = express.Router();

// POST /api/progress — Save or update reading progress
router.post('/', async (req, res) => {
  try {
    const {
      bookId,
      currentPage,
      currentPosition,
      playbackSpeed,
      selectedVoice,
      bookmarks,
      totalListeningTime,
      completionPercentage
    } = req.body;

    const deviceId = req.headers['x-device-id'];
    if (!bookId || !deviceId) {
      return res.status(400).json({ error: 'bookId and deviceId are required' });
    }

    const progress = await Progress.findOneAndUpdate(
      { bookId, deviceId },
      {
        deviceId, // Ensure it's set on insert
        currentPage: currentPage || 0,
        currentPosition: currentPosition || 0,
        playbackSpeed: playbackSpeed || 1.0,
        selectedVoice: selectedVoice || '',
        bookmarks: bookmarks || [],
        totalListeningTime: totalListeningTime || 0,
        completionPercentage: completionPercentage || 0,
        lastReadAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/progress/:bookId — Get reading progress for a book
router.get('/:bookId', async (req, res) => {
  try {
    const deviceId = req.headers['x-device-id'];
    if (!deviceId) return res.json({ success: true, progress: null });

    const progress = await Progress.findOne({ bookId: req.params.bookId, deviceId });
    res.json({ success: true, progress: progress || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/progress — Get all reading progress (for stats)
router.get('/', async (req, res) => {
  try {
    const deviceId = req.headers['x-device-id'];
    const query = deviceId ? { deviceId } : { _id: null };
    
    const allProgress = await Progress.find(query).sort({ lastReadAt: -1 });
    res.json({ success: true, progress: allProgress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/progress/:bookId/bookmark — Add a bookmark
router.post('/:bookId/bookmark', async (req, res) => {
  try {
    const { page, position, note, snippet } = req.body;

    const progress = await Progress.findOneAndUpdate(
      { bookId: req.params.bookId },
      {
        $push: {
          bookmarks: { page, position, note, snippet, createdAt: new Date() }
        },
        lastReadAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/progress/:bookId/bookmark/:bookmarkId — Remove a bookmark
router.delete('/:bookId/bookmark/:bookmarkId', async (req, res) => {
  try {
    const progress = await Progress.findOneAndUpdate(
      { bookId: req.params.bookId },
      { $pull: { bookmarks: { _id: req.params.bookmarkId } } },
      { new: true }
    );

    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
