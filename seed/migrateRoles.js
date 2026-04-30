// @ts-nocheck
// seed/migrateRoles.js
// ─────────────────────────────────────────────────────────────
// One-time DB migration: upgrades legacy role values to new RBAC roles.
//   admin  → super_admin
//   hr     → hr_admin
//
// Run with: node seed/migrateRoles.js
// ─────────────────────────────────────────────────────────────

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

// Use a minimal inline schema to avoid circular issues
const UserSchema = new mongoose.Schema({ role: String }, { strict: false });
const User = mongoose.model("User", UserSchema);

async function migrate() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to DB. Starting RBAC role migration...\n");

    // admin → super_admin
    const adminResult = await User.updateMany(
        { role: "admin" },
        { $set: { role: "super_admin" } }
    );
    console.log(`🔄 Migrated ${adminResult.modifiedCount} user(s): admin → super_admin`);

    // hr → hr_admin
    const hrResult = await User.updateMany(
        { role: "hr" },
        { $set: { role: "hr_admin" } }
    );
    console.log(`🔄 Migrated ${hrResult.modifiedCount} user(s): hr → hr_admin`);

    console.log("\n✅ Migration complete. All roles are now using the new RBAC values.");
    await mongoose.disconnect();
}

migrate().catch((err) => {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
});
