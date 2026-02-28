const nodemailer = require("nodemailer");

async function test() {
  const user = "support@gocv.live";
  // ⬇️ UPDATE THIS with your new/correct password, then run: node test-smtp.js
  const pass = "gocv201912136";

  console.log("User:", user);
  console.log("Pass length:", pass.length);
  console.log("Pass chars:", [...pass].map((c) => c.charCodeAt(0)).join(","));

  const transporter = nodemailer.createTransport({
    host: "smtpout.secureserver.net",
    port: 465,
    secure: true,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    debug: true,
    logger: true,
  });

  try {
    await transporter.verify();
    console.log("\n✅ SMTP AUTH SUCCESS!");
  } catch (e) {
    console.log("\n❌ SMTP AUTH FAILED:", e.message);
    console.log("Response:", e.response);
  }

  transporter.close();
}

test();
