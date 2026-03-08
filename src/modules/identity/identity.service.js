const AppError = require("../../utils/AppError");
const { withTransaction } = require("../../db/transaction");
const { normalizeIdentifyPayload } = require("./identity.validation");
const {
  createPrimaryContact,
  createSecondaryContact,
  demotePrimaryToSecondary,
  findClusterByPrimaryId,
  findContactsByPrimaryIds,
  findMatchingContacts
} = require("./identity.repository");

function getRootPrimaryId(contact) {
  return contact.linkPrecedence === "primary" ? contact.id : contact.linkedId;
}

function chooseCanonicalPrimary(contacts) {
  const primaries = contacts.filter((contact) => contact.linkPrecedence === "primary");

  primaries.sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.id - right.id;
  });

  return primaries[0] || null;
}

function addUnique(list, seen, value) {
  if (!value || seen.has(value)) {
    return;
  }

  seen.add(value);
  list.push(value);
}

function buildIdentifyResponse(clusterContacts, primaryContact) {
  const emails = [];
  const phoneNumbers = [];
  const secondaryContactIds = [];
  const seenEmails = new Set();
  const seenPhones = new Set();

  addUnique(emails, seenEmails, primaryContact.email);
  addUnique(phoneNumbers, seenPhones, primaryContact.phoneNumber);

  for (const contact of clusterContacts) {
    addUnique(emails, seenEmails, contact.email);
    addUnique(phoneNumbers, seenPhones, contact.phoneNumber);

    if (contact.id !== primaryContact.id) {
      secondaryContactIds.push(contact.id);
    }
  }

  return {
    contact: {
      primaryContatctId: primaryContact.id,
      emails,
      phoneNumbers,
      secondaryContactIds
    }
  };
}

async function identify(payload) {
  const normalized = normalizeIdentifyPayload(payload);

  return withTransaction(async (client) => {
    const directMatches = await findMatchingContacts(client, normalized);

    if (!directMatches.length) {
      const primary = await createPrimaryContact(client, normalized);
      return buildIdentifyResponse([primary], primary);
    }

    const rootPrimaryIds = [...new Set(directMatches.map(getRootPrimaryId).filter(Boolean))];
    let clusterContacts = await findContactsByPrimaryIds(client, rootPrimaryIds);

    let canonicalPrimary = chooseCanonicalPrimary(clusterContacts);
    if (!canonicalPrimary) {
      throw AppError.badRequest("Unable to resolve canonical primary contact.");
    }

    const primariesToDemote = clusterContacts.filter(
      (contact) => contact.linkPrecedence === "primary" && contact.id !== canonicalPrimary.id
    );

    for (const primaryContact of primariesToDemote) {
      await demotePrimaryToSecondary(client, primaryContact.id, canonicalPrimary.id);
    }

    if (primariesToDemote.length) {
      clusterContacts = await findClusterByPrimaryId(client, canonicalPrimary.id);
      canonicalPrimary =
        clusterContacts.find((contact) => contact.id === canonicalPrimary.id) || canonicalPrimary;
    }

    const knownEmails = new Set(
      clusterContacts.map((contact) => contact.email).filter(Boolean)
    );
    const knownPhones = new Set(
      clusterContacts.map((contact) => contact.phoneNumber).filter(Boolean)
    );

    const hasNewEmail = Boolean(normalized.email && !knownEmails.has(normalized.email));
    const hasNewPhone = Boolean(normalized.phoneNumber && !knownPhones.has(normalized.phoneNumber));

    if (hasNewEmail || hasNewPhone) {
      await createSecondaryContact(client, {
        email: normalized.email,
        phoneNumber: normalized.phoneNumber,
        primaryId: canonicalPrimary.id
      });

      clusterContacts = await findClusterByPrimaryId(client, canonicalPrimary.id);
    }

    return buildIdentifyResponse(clusterContacts, canonicalPrimary);
  });
}

module.exports = {
  identify
};
