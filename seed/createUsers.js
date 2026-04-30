// @ts-nocheck
// seed/createUsers.js
// ─────────────────────────────────────────────────────────────
// Run this ONCE to create one demo user per RBAC role.
//
// Usage:
//   cd HRMS-backend
//   node seed/createUsers.js
// ─────────────────────────────────────────────────────────────

const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DEMO_USERS = [
    {
        name: "Super Admin",
        email: "superadmin@hr.com",
        password: "super123",
        role: "super_admin",
    },
    {
        name: "HR Admin",
        email: "hradmin@hr.com",
        password: "hr1234",
        role: "hr_admin",
    },
    {
        name: "Manager",
        email: "manager@hr.com",
        password: "manager123",
        role: "manager",
    },
    {
        name: "Finance Admin",
        email: "finance@hr.com",
        password: "finance123",
        role: "finance_admin",
    },
    {
        name: "Employee",
        email: "employee@hr.com",
        password: "employee123",
        role: "employee",
    },
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB\n");

        // Upsert — update if email exists, otherwise create (safe to re-run)
        for (const userData of DEMO_USERS) {
            const existing = await User.findOne({ email: userData.email });
            if (existing) {
                console.log(`⏭️  Skipped (already exists): ${userData.email}`);
            } else {
                const user = await User.create(userData);
                console.log(`✅ Created: ${user.name} (${user.role}) — ${user.email}`);
            }
        }

        console.log("\n🎉 Seed complete! Use these credentials to log in:");
        console.log("─────────────────────────────────────────────────────────");
        console.log("ROLE           EMAIL                    PASSWORD");
        console.log("─────────────────────────────────────────────────────────");
        DEMO_USERS.forEach((u) => {
            const role = u.role.toUpperCase().padEnd(14);
            const email = u.email.padEnd(25);
            console.log(`${role} ${email} ${u.password}`);
        });
        console.log("─────────────────────────────────────────────────────────");
        console.log("\n📌 All admin roles log in via the 'Admin' button on the login page.");
        console.log("📌 Employee role logs in via the 'Employee' button.");

        process.exit(0);
    } catch (error) {
        console.error("❌ Seed failed:", error.message);
        process.exit(1);
    }
};

seed();