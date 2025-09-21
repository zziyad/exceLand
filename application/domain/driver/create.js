async (payload) => {
  const {
    eventId,
    fullName,
    nationalId,
    nationality,
    phoneNumber,
    photoBase64,
    status = 'active',
  } = payload;

  // Validate required fields
  if (!eventId || !fullName || !nationalId || !nationality || !phoneNumber) {
    throw new Error(
      'Missing required fields: eventId, fullName, nationalId, nationality, phoneNumber',
    );
  }

  // Validate national_id minimum length
  if (nationalId.length < 6) {
    throw new Error('National ID must be at least 6 characters long');
  }

  // Validate photo size if provided (5MB = 5 * 1024 * 1024 bytes)
  if (photoBase64) {
    const base64Size = (photoBase64.length * 3) / 4; // Approximate size in bytes
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (base64Size > maxSize) {
      throw new Error('Photo size exceeds 5MB limit');
    }
  }

  // Validate status
  const validStatuses = ['active', 'inactive', 'suspended'];
  if (!validStatuses.includes(status)) {
    throw new Error(
      'Invalid status. Must be one of: active, inactive, suspended',
    );
  }

  try {
    const query = `
      INSERT INTO "Driver" (event_id, full_name, national_id, nationality, phone_number, photo_base64, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      eventId,
      fullName,
      nationalId,
      nationality,
      phoneNumber,
      photoBase64,
      status,
    ];
    const result = await db.pg.query(query, values);

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      throw new Error('National ID already exists');
    }
    if (error.code === '23503') {
      // Foreign key constraint violation
      throw new Error('Invalid event ID');
    }
    throw error;
  }
};
