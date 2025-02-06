import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUserProfile } from './UserProfile';

export interface IUserAuth extends Document {
  username: string;
  password: string;
  profile: IUserProfile['_id'];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserAuthSchema = new Schema<IUserAuth>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // 关联到 UserProfile 集合中的文档 _id
    profile:  { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  },
  { timestamps: true }
);

// 保存前对密码进行加密
UserAuthSchema.pre<IUserAuth>('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// 定义比较密码的方法
UserAuthSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default model<IUserAuth>('UserAuth', UserAuthSchema);