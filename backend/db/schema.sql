CREATE TABLE IF NOT EXISTS issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  site TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('minor', 'major', 'critical')),
  status TEXT NOT NULL CHECK(status IN ('open', 'in_progress', 'resolved')),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

