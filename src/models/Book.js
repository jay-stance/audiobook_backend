import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    default: 'Unknown'
  },
  fileName: {
    type: String,
    required: true
  },
  pages: [{
    pageNumber: Number,
    text: String
  }],
  totalPages: {
    type: Number,
    default: 0
  },
  rawText: {
    type: String,
    default: ''
  },
  cleanedText: {
    type: String,
    default: ''
  },
  fileSize: {
    type: Number,
    default: 0
  },
  wordCount: {
    type: Number,
    default: 0
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 0
  },
  coverColor: {
    type: String,
    default: '#6366f1' // random color for cover placeholder
  },
  s3Key: {
    type: String,
    default: null
  },
  s3Url: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Auto-calculate word count and estimated duration before save
bookSchema.pre('save', function(next) {
  if (this.cleanedText) {
    this.wordCount = this.cleanedText.split(/\s+/).filter(w => w.length > 0).length;
    // Average speaking rate: ~150 words per minute
    this.estimatedDuration = Math.ceil(this.wordCount / 150);
  }
  next();
});

const Book = mongoose.model('Book', bookSchema);
export default Book;
