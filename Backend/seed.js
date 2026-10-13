// seed.js
// Populates the database with sample users and skills so the app has data to demo.
// Run with: npm run seed

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");

const User = require("./models/User");
const Skill = require("./models/Skill");
const SwapRequest = require("./models/SwapRequest");
const Booking = require("./models/Booking");
const Review = require("./models/Review");
const Notification = require("./models/Notification");

// Sample users — note several share "Parul University" so the same-college
// restriction has real matches to demo, alongside students from other colleges.
const sampleUsers = [
  { firstName: "Ananya", lastName: "Iyer", email: "ananya@parul.edu", college: "Parul University", year: "3rd Year" },
  { firstName: "Rahul", lastName: "Kumar", email: "rahul@parul.edu", college: "Parul University", year: "2nd Year" },
  { firstName: "Dax", lastName: "Vasani", email: "dax@parul.edu", college: "Parul University", year: "3rd Year" },
  { firstName: "Dev", lastName: "Patel", email: "dev@nitsurat.edu", college: "NIT Surat", year: "2nd Year" },
  { firstName: "Kavya", lastName: "Reddy", email: "kavya@bits.edu", college: "BITS Hyderabad", year: "Final Year" },
  { firstName: "Rohan", lastName: "Gupta", email: "rohan@dtu.edu", college: "DTU Delhi", year: "3rd Year" },
  { firstName: "Shreya", lastName: "Mishra", email: "shreya@iitk.edu", college: "IIT Kanpur", year: "3rd Year" },
];

const samplePassword = "password123";

const skillsToCreate = [
  { owner: "ananya@parul.edu", skill: "React & Next.js", description: "Full-stack React dev, can teach component architecture, hooks, Next.js routing and deployment.", category: "Tech", tags: ["React", "Next.js"] },
  { owner: "rahul@parul.edu", skill: "Classical Guitar", description: "7 years of guitar. Teach chords, scales, fingerstyle and music theory for beginners.", category: "Music", tags: ["Guitar", "Music Theory"] },
  { owner: "dax@parul.edu", skill: "UI/UX Design", description: "Figma pro. Can teach design systems, wireframing, prototyping and user research basics.", category: "Design", tags: ["Figma", "Design"] },
  { owner: "dev@nitsurat.edu", skill: "Photography", description: "DSLR and mirrorless. Teach composition, lighting, editing in Lightroom and Photoshop.", category: "Design", tags: ["Photography", "Lightroom"] },
  { owner: "kavya@bits.edu", skill: "Video Editing", description: "Premiere Pro and DaVinci Resolve expert. Teach cuts, colour grading and motion titles.", category: "Design", tags: ["Premiere Pro", "DaVinci"] },
  { owner: "rohan@dtu.edu", skill: "Machine Learning", description: "Can teach scikit-learn, regression, classification and intro to deep learning with PyTorch.", category: "Tech", tags: ["Python", "ML", "AI"] },
  { owner: "shreya@iitk.edu", skill: "Data Structures & Algo", description: "Competitive coder. Teach DSA for placements — arrays, trees, graphs, DP.", category: "Academics", tags: ["DSA", "C++", "Placements"] },
];

async function seed() {
  await connectDB();

  console.log("🧹 Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Skill.deleteMany({}),
    SwapRequest.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
    Notification.deleteMany({})
  ]);

  console.log("👤 Creating users...");
  const hashedPassword = await bcrypt.hash(samplePassword, 10);
  const createdUsers = await User.insertMany(
    sampleUsers.map((u) => ({ ...u, password: hashedPassword }))
  );

  const userByEmail = {};
  createdUsers.forEach((u) => (userByEmail[u.email] = u));

  console.log("🧩 Creating skills...");
  await Skill.insertMany(
    skillsToCreate.map((s) => {
      const owner = userByEmail[s.owner];
      return {
        userId: owner._id,
        skill: s.skill,
        description: s.description,
        category: s.category,
        tags: s.tags,
        college: owner.college,
        year: owner.year
      };
    })
  );

  console.log("✅ Seed complete!");
  console.log(`   ${createdUsers.length} users created`);
  console.log(`   ${skillsToCreate.length} skills created`);
  console.log(`   All sample users share the password: "${samplePassword}"`);
  console.log("   e.g. login with ananya@parul.edu / password123");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
