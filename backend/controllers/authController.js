const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { getPool } = require('../config/db');

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_industry_level_marketplace_jwt_key_2026';

// Setup Mock/Real Transporter for Emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER || null,
    pass: process.env.SMTP_PASS || null
  }
});

// Helper: Send email safely
async function sendMailHelper(to, subject, text) {
  console.log(`[EMAIL SEND] To: ${to} | Subject: ${subject}`);
  console.log(`[EMAIL CONTENT]\n${text}\n=====================`);
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await transporter.sendMail({
        from: '"HunarConnect Team" <noreply@hunarconnect.com>',
        to,
        subject,
        text
      });
    } catch (e) {
      console.error('Mail transport error:', e.message);
    }
  }
}

// Register User
async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Please provide all required fields (name, email, password, role).' });
    }

    if (role !== 'client' && role !== 'freelancer') {
      return res.status(400).json({ error: "Role must be either 'client' or 'freelancer'." });
    }

    const pool = await getPool();

    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, is_verified) VALUES (?, ?, ?, ?, FALSE)',
      [name, email, passwordHash, role]
    );

    const userId = result.insertId;

    // Create JWT Token
    const token = jwt.sign({ id: userId, email, name, role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: { id: userId, name, email, role, is_verified: true }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Database error during registration.' });
  }
}

// Login User
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    const pool = await getPool();

    // Find user
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];

    if (user.is_blocked) {
      return res.status(403).json({ error: 'Your account has been suspended by the administrator.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Create Token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        bio: user.bio,
        hourly_rate: user.hourly_rate,
        is_verified: user.is_verified,
        two_factor_enabled: user.two_factor_enabled
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Database error during login.' });
  }
}

// Verify Email/OTP
async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Please provide email and OTP code.' });
    }

    const pool = await getPool();
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found.' });

    const user = users[0];
    if (user.otp_code !== otp || new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: 'Invalid or expired OTP code.' });
    }

    // Mark as verified
    await pool.query('UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE id = ?', [user.id]);

    res.json({ message: 'Account successfully verified.' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Database error verifying OTP.' });
  }
}

// Verify 2FA
async function verify2FA(req, res) {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) {
      return res.status(400).json({ error: 'Please provide user ID and verification code.' });
    }

    const pool = await getPool();
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found.' });

    const user = users[0];
    if (user.otp_code !== code || new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: 'Invalid or expired 2FA code.' });
    }

    // Clear OTP
    await pool.query('UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?', [userId]);

    // Create Token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '2FA authentication successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        bio: user.bio,
        hourly_rate: user.hourly_rate,
        is_verified: user.is_verified,
        two_factor_enabled: user.two_factor_enabled
      }
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: 'Server error verifying 2FA.' });
  }
}

// Google Login Simulation
async function googleLogin(req, res) {
  try {
    const { email, name, role } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name from Google are required.' });
    }

    const pool = await getPool();
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    let user;
    if (users.length === 0) {
      // Register new user via Google
      const targetRole = role || 'freelancer';
      const passwordHash = await bcrypt.hash(Math.random().toString(36), 10); // Random password for google sign-in

      const [result] = await pool.query(
        'INSERT INTO users (name, email, password_hash, role, is_verified) VALUES (?, ?, ?, ?, TRUE)',
        [name, email, passwordHash, targetRole]
      );
      
      const [newUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newUsers[0];
    } else {
      user = users[0];
      if (user.is_blocked) {
        return res.status(403).json({ error: 'Your account has been suspended by the administrator.' });
      }
    }

    // Create Token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        bio: user.bio,
        hourly_rate: user.hourly_rate,
        is_verified: user.is_verified,
        two_factor_enabled: user.two_factor_enabled
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Database error during Google Login.' });
  }
}

// Toggle Two-Factor Authentication
async function toggle2FA(req, res) {
  try {
    const { enable } = req.body;
    const pool = await getPool();

    const secret = enable ? 'secret_secret_google_2fa_key_' + Math.random().toString(36).substring(7) : null;
    await pool.query('UPDATE users SET two_factor_enabled = ?, two_factor_secret = ? WHERE id = ?', [enable, secret, req.user.id]);

    res.json({
      message: `2FA ${enable ? 'enabled' : 'disabled'} successfully.`,
      two_factor_enabled: enable
    });
  } catch (error) {
    console.error('Toggle 2FA error:', error);
    res.status(500).json({ error: 'Database error changing 2FA configuration.' });
  }
}

// Get Logged In User Profile
async function getProfile(req, res) {
  try {
    const pool = await getPool();
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userProfile = { ...users[0] };
    delete userProfile.password_hash;
    delete userProfile.two_factor_secret;

    res.json(userProfile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Database error fetching profile.' });
  }
}

// Update Profile
async function updateProfile(req, res) {
  try {
    const { 
      name, skills, bio, hourly_rate, location, contact_info, social_links, title, 
      experience, education, certifications, company_name, company_logo, website, industry,
      availability_status, languages
    } = req.body;
    const pool = await getPool();

    let profile_photo = req.body.profile_photo || null;
    let resume_url = req.body.resume_url || null;

    if (req.files) {
      if (req.files.profile_photo) {
        profile_photo = '/uploads/' + req.files.profile_photo[0].filename;
      }
      if (req.files.resume) {
        resume_url = '/uploads/' + req.files.resume[0].filename;
      }
    }

    // Update table columns based on what's supplied
    await pool.query(`
      UPDATE users SET 
        name = COALESCE(?, name), skills = COALESCE(?, skills), bio = COALESCE(?, bio), hourly_rate = COALESCE(?, hourly_rate),
        profile_photo = COALESCE(?, profile_photo), location = COALESCE(?, location), contact_info = COALESCE(?, contact_info),
        social_links = COALESCE(?, social_links), title = COALESCE(?, title), experience = COALESCE(?, experience),
        education = COALESCE(?, education), certifications = COALESCE(?, certifications), resume_url = COALESCE(?, resume_url),
        company_name = COALESCE(?, company_name), company_logo = COALESCE(?, company_logo), website = COALESCE(?, website),
        industry = COALESCE(?, industry), availability_status = COALESCE(?, availability_status), languages = COALESCE(?, languages)
      WHERE id = ?`,
      [
        name, skills, bio, hourly_rate, profile_photo, location, contact_info, social_links, title, 
        experience, education, certifications, resume_url, company_name, company_logo, website, industry,
        availability_status, languages, req.user.id
      ]
    );

    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );

    const userProfile = { ...users[0] };
    delete userProfile.password_hash;

    res.json({
      message: 'Profile updated successfully',
      user: userProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Database error updating profile.' });
  }
}

// Get Freelancers list for clients to search
async function getFreelancers(req, res) {
  try {
    const pool = await getPool();
    const [freelancers] = await pool.query(`
      SELECT u.id, u.name, u.email, u.skills, u.bio, u.hourly_rate, u.created_at,
             u.location, u.availability_status,
             IFNULL(AVG(r.rating), 0) as avg_rating, COUNT(r.id) as review_count
      FROM users u
      LEFT JOIN reviews r ON u.id = r.reviewee_id
      WHERE u.role = 'freelancer' AND u.is_blocked = FALSE
      GROUP BY u.id
    `);

    res.json(freelancers);
  } catch (error) {
    console.error('Fetch freelancers error:', error);
    res.status(500).json({ error: 'Database error fetching freelancers.' });
  }
}

// Get single freelancer with details and reviews
async function getFreelancerById(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const [users] = await pool.query(
      'SELECT id, name, email, skills, bio, hourly_rate, title, location, experience, education, certifications, availability_status, languages, profile_photo, created_at FROM users WHERE id = ? AND role = "freelancer"',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Freelancer not found.' });
    }

    const [reviews] = await pool.query(`
      SELECT r.id, r.rating, r.comment, r.created_at, r.project_id,
             u.name as client_name, p.title as project_title
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      JOIN projects p ON r.project_id = p.id
      WHERE r.reviewee_id = ?
    `, [id]);

    const [portfolio] = await pool.query('SELECT * FROM portfolio_projects WHERE freelancer_id = ?', [id]);

    res.json({
      profile: users[0],
      reviews,
      portfolio
    });
  } catch (error) {
    console.error('Fetch freelancer details error:', error);
    res.status(500).json({ error: 'Database error fetching freelancer profile.' });
  }
}

// Seed default admin
async function seedAdmin() {
  try {
    const pool = await getPool();
    const [existing] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (existing.length === 0) {
      console.log('No admin found. Seeding default admin...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      await pool.query(
        "INSERT INTO users (name, email, password_hash, role, is_verified) VALUES (?, ?, ?, ?, TRUE)",
        ['System Admin', 'admin@hunarconnect.com', passwordHash, 'admin']
      );
      console.log('Default admin seeded successfully. Email: admin@hunarconnect.com, Password: admin123');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
}

// Forgot Password OTP Trigger
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Please provide an email.' });

    const pool = await getPool();
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length === 0) {
      return res.json({ message: 'If an account exists, a password reset email has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await pool.query('UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE email = ?', [otp, expires, email]);
    await sendMailHelper(email, 'Reset Your Password', `Your HunarConnect password reset code is: ${otp}. It is valid for 10 minutes.`);

    res.json({ message: 'If an account exists, a password reset email has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error processing request.' });
  }
}

// Reset Password with OTP
async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Please provide email, OTP code, and new password.' });
    }

    const pool = await getPool();
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found.' });

    const user = users[0];
    if (user.otp_code !== otp || new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password_hash = ?, otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
      [passwordHash, user.id]
    );

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Database error resetting password.' });
  }
}

// Change Password
async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Please provide old and new password.' });
    }

    const pool = await getPool();
    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const isMatch = await bcrypt.compare(oldPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect old password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.user.id]);
    
    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Database error changing password.' });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getFreelancers,
  getFreelancerById,
  seedAdmin,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyOTP,
  verify2FA,
  toggle2FA,
  googleLogin
};
