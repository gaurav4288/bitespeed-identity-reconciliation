const { pool } = require("../config/database");

const schemaSql = `
  CREATE TABLE IF NOT EXISTS contacts (
    id BIGSERIAL PRIMARY KEY,
    phone_number VARCHAR(30),
    email VARCHAR(255),
    linked_id BIGINT REFERENCES contacts(id),
    link_precedence VARCHAR(20) NOT NULL CHECK (link_precedence IN ('primary', 'secondary')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  );

  CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (email);
  CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts (phone_number);
  CREATE INDEX IF NOT EXISTS idx_contacts_linked_id ON contacts (linked_id);
`;

async function initDatabase() {
  await pool.query(schemaSql);
}

module.exports = {
  initDatabase
};
