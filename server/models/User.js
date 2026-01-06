const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^\+\d{1,4}\d{7,15}$/, 'Please enter a valid phone number with country code']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  // Game progress tracking
  gameProgress: {
    game: {
      gameStarted: {
        type: Boolean,
        default: false
      },
      completed: {
        type: Boolean,
        default: false
      },
      scannedQR: {
        type: String,
        default: null
      },
      scannedAt: {
        type: Date,
        default: null
      },
      tier: {
        type: Number,
        enum: [1, 2],
        default: null
      },
      scanCount: {
        type: Number,
        default: 0
      },
      gameStartCount: {
        type: Number,
        default: 0
      }
    },
    photo: {
      completed: {
        type: Boolean,
        default: false
      },
      scannedQR: {
        type: String,
        default: null
      },
      scannedAt: {
        type: Date,
        default: null
      },
      scanCount: {
        type: Number,
        default: 0
      }
    }
  },
  // User's redemption QR code (generated after first scan)
  // Note: unique and sparse are defined in the index below, not here
  redemptionQRCode: {
    type: String
    // No default - undefined is better for sparse unique indexes
  },
  // Whether user has redeemed their gift
  isRedeemed: {
    type: Boolean,
    default: false
  },
  redeemedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ phoneNumber: 1 });
userSchema.index({ createdAt: -1 });
// Explicit sparse unique index for redemptionQRCode (excludes null/undefined values)
userSchema.index({ redemptionQRCode: 1 }, { unique: true, sparse: true });

// Pre-save middleware to update updatedAt and ensure redemptionQRCode is undefined (not null) if not set
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  // Ensure redemptionQRCode is undefined (not null) for sparse index to work correctly
  if (this.redemptionQRCode === null) {
    this.redemptionQRCode = undefined;
  }
  next();
});

// Static method to find by phone number
userSchema.statics.findByPhoneNumber = function(phoneNumber) {
  return this.findOne({ phoneNumber });
};

// Static method to generate unique redemption QR code
userSchema.statics.generateUniqueRedemptionQRCode = async function() {
  const generateQRCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    // Include timestamp and random component for better uniqueness
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = Array.from({ length: 8 }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
    return `PAYLATER_REDEEM_${timestamp}_${randomPart}`;
  };

  try {
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      const qrCode = generateQRCode();
      
      // Check if this QR code already exists
      const existingUser = await this.findOne({ redemptionQRCode: qrCode });
      
      if (!existingUser) {
        console.log('✅ Generated unique redemption QR code:', qrCode);
        return qrCode;
      }
      
      attempts++;
      console.log(`🔄 Attempt ${attempts}: QR code ${qrCode} already exists, trying again...`);
    }
    
    // Fallback with timestamp and random
    const fallbackCode = `PAYLATER_REDEEM_TEMP_${Date.now()}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    console.log('⚠️ Using fallback redemption QR code:', fallbackCode);
    return fallbackCode;
    
  } catch (error) {
    console.error('❌ Error in generateUniqueRedemptionQRCode:', error);
    const fallbackCode = `PAYLATER_REDEEM_ERROR_${Date.now()}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    console.log('🆘 Using error fallback redemption QR code:', fallbackCode);
    return fallbackCode;
  }
};

module.exports = mongoose.model('User', userSchema);

