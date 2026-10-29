import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICounterDocument extends Document {
  name: string;
  seq: number;
}

interface ICounterModel extends Model<ICounterDocument> {
  nextSeq(name: string): Promise<number>;
}

const CounterSchema = new Schema<ICounterDocument>({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

CounterSchema.statics.nextSeq = async function (name: string): Promise<number> {
  const result = await this.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return result.seq;
};

const Counter = mongoose.model<ICounterDocument, ICounterModel>('Counter', CounterSchema);
export default Counter;
