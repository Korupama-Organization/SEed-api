import dotenv from "dotenv";
import mongoose from "mongoose";
import { Job } from "../models/Job";
import { Counter } from "../models/Counter";

const formatJobSlug = (sequence: number): string => `JOB-${sequence.toString().padStart(3, "0")}`;

dotenv.config();

const JOB_SLUG_COUNTER_KEY = "jobSlug";

const extractSlugSequence = (slug: string): number | null => {
  const match = /^JOB-(\d+)$/.exec(slug);
  if (!match) {
    return null;
  }

  return Number.parseInt(match[1], 10);
};

const run = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  await mongoose.connect(uri);

  const existingSlugs = await Job.find({ slug: { $exists: true, $type: "string" } })
    .select("slug")
    .lean();

  let maxSequence = 0;
  for (const item of existingSlugs) {
    const sequence = extractSlugSequence(item.slug || "");
    if (sequence && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  await Counter.findOneAndUpdate(
    { key: JOB_SLUG_COUNTER_KEY },
    { $set: { seq: maxSequence } },
    { upsert: true, new: true }
  );

  const jobsWithoutSlug = await Job.find({
    $or: [
      { slug: { $exists: false } },
      { slug: null },
      { slug: "" },
    ],
  })
    .select("_id")
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  let updatedCount = 0;

  for (const job of jobsWithoutSlug) {
    const counter = await Counter.findOneAndUpdate(
      { key: JOB_SLUG_COUNTER_KEY },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    ).lean();

    const slug = formatJobSlug(counter.seq);

    await Job.updateOne(
      { _id: job._id, slug: { $exists: false } },
      { $set: { slug } }
    );

    updatedCount += 1;
  }

  console.log(`Backfill completed. Updated ${updatedCount} jobs without slug.`);
};

run()
  .catch((error) => {
    console.error("Backfill job slugs failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
