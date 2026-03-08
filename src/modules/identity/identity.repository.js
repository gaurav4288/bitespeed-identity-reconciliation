function mapRowToContact(row) {
  return {
    id: Number(row.id),
    email: row.email,
    phoneNumber: row.phone_number,
    linkedId: row.linked_id === null ? null : Number(row.linked_id),
    linkPrecedence: row.link_precedence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

function buildMatchWhereClause({ email, phoneNumber }) {
  const conditions = [];
  const values = [];

  if (email) {
    values.push(email);
    conditions.push(`email = $${values.length}`);
  }

  if (phoneNumber) {
    values.push(phoneNumber);
    conditions.push(`phone_number = $${values.length}`);
  }

  if (!conditions.length) {
    return { clause: "", values: [] };
  }

  return {
    clause: conditions.join(" OR "),
    values
  };
}

async function findMatchingContacts(client, filter) {
  const where = buildMatchWhereClause(filter);

  if (!where.clause) {
    return [];
  }

  const result = await client.query(
    `
      SELECT id, email, phone_number, linked_id, link_precedence, created_at, updated_at, deleted_at
      FROM contacts
      WHERE deleted_at IS NULL
        AND (${where.clause})
      ORDER BY created_at ASC, id ASC
      FOR UPDATE
    `,
    where.values
  );

  return result.rows.map(mapRowToContact);
}

async function findContactsByPrimaryIds(client, primaryIds) {
  if (!primaryIds.length) {
    return [];
  }

  const result = await client.query(
    `
      SELECT id, email, phone_number, linked_id, link_precedence, created_at, updated_at, deleted_at
      FROM contacts
      WHERE deleted_at IS NULL
        AND (id = ANY($1::bigint[]) OR linked_id = ANY($1::bigint[]))
      ORDER BY created_at ASC, id ASC
      FOR UPDATE
    `,
    [primaryIds]
  );

  return result.rows.map(mapRowToContact);
}

async function findClusterByPrimaryId(client, primaryId) {
  const result = await client.query(
    `
      SELECT id, email, phone_number, linked_id, link_precedence, created_at, updated_at, deleted_at
      FROM contacts
      WHERE deleted_at IS NULL
        AND (id = $1 OR linked_id = $1)
      ORDER BY created_at ASC, id ASC
      FOR UPDATE
    `,
    [primaryId]
  );

  return result.rows.map(mapRowToContact);
}

async function demotePrimaryToSecondary(client, demotedPrimaryId, canonicalPrimaryId) {
  await client.query(
    `
      UPDATE contacts
      SET link_precedence = 'secondary',
          linked_id = $1,
          updated_at = NOW()
      WHERE id = $2
    `,
    [canonicalPrimaryId, demotedPrimaryId]
  );

  await client.query(
    `
      UPDATE contacts
      SET linked_id = $1,
          updated_at = NOW()
      WHERE linked_id = $2
    `,
    [canonicalPrimaryId, demotedPrimaryId]
  );
}

async function createPrimaryContact(client, payload) {
  const result = await client.query(
    `
      INSERT INTO contacts (email, phone_number, linked_id, link_precedence, created_at, updated_at, deleted_at)
      VALUES ($1, $2, NULL, 'primary', NOW(), NOW(), NULL)
      RETURNING id, email, phone_number, linked_id, link_precedence, created_at, updated_at, deleted_at
    `,
    [payload.email, payload.phoneNumber]
  );

  return mapRowToContact(result.rows[0]);
}

async function createSecondaryContact(client, payload) {
  const result = await client.query(
    `
      INSERT INTO contacts (email, phone_number, linked_id, link_precedence, created_at, updated_at, deleted_at)
      VALUES ($1, $2, $3, 'secondary', NOW(), NOW(), NULL)
      RETURNING id, email, phone_number, linked_id, link_precedence, created_at, updated_at, deleted_at
    `,
    [payload.email, payload.phoneNumber, payload.primaryId]
  );

  return mapRowToContact(result.rows[0]);
}

module.exports = {
  createPrimaryContact,
  createSecondaryContact,
  demotePrimaryToSecondary,
  findClusterByPrimaryId,
  findContactsByPrimaryIds,
  findMatchingContacts
};
