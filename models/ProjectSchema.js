import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({ 
  name: { 
    type: String, 
    required: true, 
    trim: true 
  }, 
  description: String, 
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }, 
  teamMembers: [{ 
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }, 
    role: { 
      type: String, 
      enum: ['manager', 'developer', 'designer', 'tester'], 
      default: 'developer' 
    } 
  }], 
  status: { 
    type: String, 
    enum: ['planning', 'active', 'on-hold', 'completed', 
'cancelled'], 
    default: 'planning' 
  }, 
  startDate: Date, 
  endDate: Date, 
  budget: Number, 
  client: String 
}, { 
  timestamps: true 
});

 const Project = mongoose.model('Project', projectSchema);
 export default Project;