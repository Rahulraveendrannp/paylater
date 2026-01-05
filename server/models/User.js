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
      }
    }
  },
  // User's redemption QR code (generated after first scan)
  redemptionQRCode: {
    type: String,
    unique: true,
    sparse: true,
    default: null
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

// Pre-save middleware to update updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
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
    let result = 'PAYLATER_REDEEM_';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
    
    // Fallback with timestamp
    const fallbackCode = `PAYLATER_REDEEM_TEMP_${Date.now().toString().slice(-10)}`;
    console.log('⚠️ Using fallback redemption QR code:', fallbackCode);
    return fallbackCode;
    
  } catch (error) {
    console.error('❌ Error in generateUniqueRedemptionQRCode:', error);
    const fallbackCode = `PAYLATER_REDEEM_ERROR_${Date.now().toString().slice(-10)}`;
    console.log('🆘 Using error fallback redemption QR code:', fallbackCode);
    return fallbackCode;
  }
};

module.exports = mongoose.model('User', userSchema);

