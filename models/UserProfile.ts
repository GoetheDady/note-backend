import { Schema, model, Document } from 'mongoose';

export interface IUserProfile extends Document {
  fullName?: string;
  bio?: string;
  avatar?: string;
  // 根据需要添加其他字段
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    fullName: { type: String },
    bio: { type: String },
    avatar: { type: String },
  },
  { timestamps: true }
);

export default model<IUserProfile>('UserProfile', UserProfileSchema);