import { Schema, model, Document } from 'mongoose';
import { IUserAuth } from './UserAuth';

export interface INote extends Document {
  title: string;
  content?: string;
  user: IUserAuth['_id'];
}

const NoteSchema = new Schema<INote>(
  {
    title:   { type: String, required: true },
    content: { type: String },
    // 关联到用户账号集合中的 _id
    user:    { type: Schema.Types.ObjectId, ref: 'UserAuth', required: true },
  },
  { timestamps: true }
);

export default model<INote>('Note', NoteSchema);