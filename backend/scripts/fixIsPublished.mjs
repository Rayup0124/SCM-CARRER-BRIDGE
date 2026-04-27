/**
 * Fix internships that are published (isDraft=false) but isPublished=false
 * Run: node scripts/fixIsPublished.mjs
 */
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://konghj6335_db_user:konghj6335@cluster0.zsmammt.mongodb.net/scm-career-bridge?retryWrites=true&w=majority';

const internshipSchema = new mongoose.Schema({}, { strict: false });
const Internship = mongoose.model('Internship', internshipSchema);

async function fix() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const result = await Internship.updateMany(
    { isDraft: false, isPublished: false },
    { $set: { isPublished: true } },
  );

  console.log(`Updated ${result.modifiedCount} internship(s) where isDraft=false but isPublished=false`);
  await mongoose.disconnect();
  process.exit(0);
}

fix().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
