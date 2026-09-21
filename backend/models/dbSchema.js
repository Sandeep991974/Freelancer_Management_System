const { getPool } = require('../config/db');

async function createTables() {
  const pool = await getPool();
  
  const queries = [
    // 1. Users Table
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('client', 'freelancer', 'admin') NOT NULL,
      skills TEXT DEFAULT NULL,
      bio TEXT DEFAULT NULL,
      hourly_rate DECIMAL(10, 2) DEFAULT 0.00,
      profile_photo VARCHAR(255) DEFAULT NULL,
      location VARCHAR(255) DEFAULT NULL,
      contact_info VARCHAR(255) DEFAULT NULL,
      social_links TEXT DEFAULT NULL,
      title VARCHAR(255) DEFAULT NULL,
      experience TEXT DEFAULT NULL,
      education TEXT DEFAULT NULL,
      certifications TEXT DEFAULT NULL,
      resume_url VARCHAR(255) DEFAULT NULL,
      company_name VARCHAR(255) DEFAULT NULL,
      company_logo VARCHAR(255) DEFAULT NULL,
      website VARCHAR(255) DEFAULT NULL,
      industry VARCHAR(255) DEFAULT NULL,
      is_blocked BOOLEAN DEFAULT FALSE,
      is_verified BOOLEAN DEFAULT FALSE,
      otp_code VARCHAR(255) DEFAULT NULL,
      otp_expires_at DATETIME DEFAULT NULL,
      two_factor_enabled BOOLEAN DEFAULT FALSE,
      two_factor_secret VARCHAR(255) DEFAULT NULL,
      availability_status VARCHAR(255) DEFAULT 'available',
      languages TEXT DEFAULT NULL,
      wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`,

    // 2. Projects Table
    `CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      budget DECIMAL(10, 2) NOT NULL,
      skills_required TEXT DEFAULT NULL,
      category VARCHAR(255) DEFAULT NULL,
      experience_level ENUM('beginner', 'intermediate', 'expert') DEFAULT 'intermediate',
      deadline DATE DEFAULT NULL,
      status ENUM('open', 'in_progress', 'completed', 'paused', 'closed', 'cancelled') DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    // 3. Bids Table
    `CREATE TABLE IF NOT EXISTS bids (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      freelancer_id INT NOT NULL,
      bid_amount DECIMAL(10, 2) NOT NULL,
      proposal TEXT NOT NULL,
      delivery_days INT NOT NULL,
      file_url VARCHAR(255) DEFAULT NULL,
      status ENUM('pending', 'accepted', 'rejected', 'withdrawn') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    // 4. Messages Table
    `CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      message_text TEXT NOT NULL,
      file_url VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    // 5. Submissions Table
    `CREATE TABLE IF NOT EXISTS submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      freelancer_id INT NOT NULL,
      work_description TEXT NOT NULL,
      file_url VARCHAR(255) DEFAULT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    // 6. Payments Table
    `CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      client_id INT NOT NULL,
      freelancer_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      payment_status ENUM('pending', 'completed') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    // 7. Reviews Table
    `CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      reviewer_id INT NOT NULL,
      reviewee_id INT NOT NULL,
      rating INT CHECK (rating >= 1 AND rating <= 5),
      comment TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    // 8. Portfolio Projects Table
    `CREATE TABLE IF NOT EXISTS portfolio_projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      freelancer_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      image_url VARCHAR(255) DEFAULT NULL,
      project_link VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    // 9. Saved Jobs Table
    `CREATE TABLE IF NOT EXISTS saved_jobs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      freelancer_id INT NOT NULL,
      project_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE KEY unique_saved_job (freelancer_id, project_id)
    ) ENGINE=InnoDB;`,

    // 10. Reports Table
    `CREATE TABLE IF NOT EXISTS reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reporter_id INT NOT NULL,
      target_type ENUM('user', 'project') NOT NULL,
      target_id INT NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('pending', 'resolved') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    // 11. Milestones Table
    `CREATE TABLE IF NOT EXISTS milestones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      status ENUM('pending', 'funded', 'released') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    // 12. Withdrawals Table
    `CREATE TABLE IF NOT EXISTS withdrawals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      freelancer_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      bank_details TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    // 13. CMS Content Table
    `CREATE TABLE IF NOT EXISTS cms_content (
      content_key VARCHAR(255) PRIMARY KEY,
      content_value TEXT NOT NULL
    ) ENGINE=InnoDB;`,

    // 14. Notifications Table
    `CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      type VARCHAR(255) DEFAULT 'general',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`
  ];

  console.log('Starting schema tables creation...');
  for (const query of queries) {
    try {
      await pool.query(query);
    } catch (err) {
      console.error('Error running table initialization query:', query.substring(0, 100), err);
      throw err;
    }
  }

  // Alter users table to add new columns if it already existed
  try {
    console.log('Altering existing tables to ensure new columns exist...');
    await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('client', 'freelancer', 'admin') NOT NULL;");

    const ensureUserColumn = async (columnName, definition) => {
      const [existingColumns] = await pool.query(`SHOW COLUMNS FROM users LIKE ?`, [columnName]);
      if (existingColumns.length === 0) {
        await pool.query(`ALTER TABLE users ADD COLUMN ${columnName} ${definition}`);
      }
    };

    const userColumns = [
      { name: 'profile_photo', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'location', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'contact_info', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'social_links', definition: 'TEXT DEFAULT NULL' },
      { name: 'title', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'experience', definition: 'TEXT DEFAULT NULL' },
      { name: 'education', definition: 'TEXT DEFAULT NULL' },
      { name: 'certifications', definition: 'TEXT DEFAULT NULL' },
      { name: 'resume_url', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'company_name', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'company_logo', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'website', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'industry', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'is_blocked', definition: 'BOOLEAN DEFAULT FALSE' },
      { name: 'is_verified', definition: 'BOOLEAN DEFAULT FALSE' },
      { name: 'otp_code', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'otp_expires_at', definition: 'DATETIME DEFAULT NULL' },
      { name: 'two_factor_enabled', definition: 'BOOLEAN DEFAULT FALSE' },
      { name: 'two_factor_secret', definition: 'VARCHAR(255) DEFAULT NULL' },
      { name: 'availability_status', definition: "VARCHAR(255) DEFAULT 'available'" },
      { name: 'languages', definition: 'TEXT DEFAULT NULL' },
      { name: 'wallet_balance', definition: 'DECIMAL(10, 2) DEFAULT 0.00' }
    ];

    for (const col of userColumns) {
      try {
        await ensureUserColumn(col.name, col.definition);
      } catch (e) {
        console.error(`Failed to ensure column ${col.name}:`, e.message);
      }
    }

    const projectColumns = [
      "category VARCHAR(255) DEFAULT NULL",
      "experience_level ENUM('beginner', 'intermediate', 'expert') DEFAULT 'intermediate'",
      "deadline DATE DEFAULT NULL",
      "status ENUM('open', 'in_progress', 'completed', 'paused', 'closed', 'cancelled') DEFAULT 'open'"
    ];

    for (const col of projectColumns) {
      try {
        await pool.query(`ALTER TABLE projects ADD COLUMN ${col}`);
      } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') {
          console.error(`Failed to add column ${col}:`, e.message);
        }
      }
    }

    const bidColumns = [
      "file_url VARCHAR(255) DEFAULT NULL"
    ];

    for (const col of bidColumns) {
      try {
        await pool.query(`ALTER TABLE bids ADD COLUMN ${col}`);
      } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') {
          console.error(`Failed to add column ${col}:`, e.message);
        }
      }
    }

    // Alter projects/bids status ENUMs
    try {
      await pool.query("ALTER TABLE projects MODIFY COLUMN status ENUM('open', 'in_progress', 'completed', 'paused', 'closed', 'cancelled') DEFAULT 'open';");
    } catch(e) {
      console.error('Failed to modify projects status enum:', e.message);
    }
    
    try {
      await pool.query("ALTER TABLE bids MODIFY COLUMN status ENUM('pending', 'accepted', 'rejected', 'withdrawn', 'shortlisted') DEFAULT 'pending';");
    } catch(e) {
      console.error('Failed to modify bids status enum:', e.message);
    }
    
    console.log('Successfully updated existing tables.');
  } catch (err) {
    console.warn('Could not alter tables.', err.message);
  }

  console.log('Database tables successfully verified/created.');
}

module.exports = {
  createTables
};
