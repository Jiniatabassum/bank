const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'account_frozen',
      'account_unfrozen',
      'account_closed',
      'loan_approved',
      'loan_rejected',
      'transaction_reversed',
      'user_role_changed',
      'user_deactivated',
      'user_activated',
      'admin_action'
    ]
  },
  targetType: {
    type: String,
    enum: ['user', 'account', 'transaction', 'loan'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  reason: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  // Previous state before action (for rollback reference)
  previousState: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  // New state after action
  newState: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

// Index for querying audit logs by date
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

// Static method to create audit log
auditLogSchema.statics.log = async function(data) {
  try {
    const auditLog = new this(data);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to prevent disrupting main operation
  }
};

// Method to get formatted log entry
auditLogSchema.methods.getFormatted = function() {
  return {
    id: this._id,
    user: this.userId,
    action: this.action,
    target: `${this.targetType}:${this.targetId}`,
    reason: this.reason,
    timestamp: this.createdAt,
    details: this.details
  };
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
