import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
  page: Number,
  position: Number, // character position in text
  note: { type: String, default: '' },
  snippet: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const progressSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  currentPage: {
    type: Number,
    default: 0
  },
  currentPosition: {
    type: Number, // character position in text
    default: 0
  },
  playbackSpeed: {
    type: Number,
    default: 1.0
  },
  selectedVoice: {
    type: String,
    default: ''
  },
  bookmarks: [bookmarkSchema],
  totalListeningTime: {
    type: Number, // in seconds
    default: 0
  },
  completionPercentage: {
    type: Number,
    default: 0
  },
  lastReadAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to quickly find progress by book
progressSchema.index({ bookId: 1 }, { unique: true });

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;
