async (payload) => {
  const {
    id,
    fullName,
    nationalId,
    nationality,
    phoneNumber,
    photoBase64,
    status,
  } = payload;

  if (!id) {
    throw new Error('Driver ID is required');
  }

  // Validate national_id minimum length if provided
  if (nationalId && nationalId.length < 6) {
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

  // Validate status if provided
  if (status) {
    const validStatuses = ['active', 'inactive', 'suspended'];
    if (!validStatuses.includes(status)) {
      throw new Error(
        'Invalid status. Must be one of: active, inactive, suspended',
      );
    }
  }

  // Build dynamic update query
  const updateFields = [];
  const values = [];
  let paramCount = 0;

  if (fullName !== undefined) {
    paramCount++;
    updateFields.push(`full_name = $${paramCount}`);
    values.push(fullName);
  }

  if (nationalId !== undefined) {
    paramCount++;
    updateFields.push(`national_id = $${paramCount}`);
    values.push(nationalId);
  }

  if (nationality !== undefined) {
    paramCount++;
    updateFields.push(`nationality = $${paramCount}`);
    values.push(nationality);
  }

  if (phoneNumber !== undefined) {
    paramCount++;
    updateFields.push(`phone_number = $${paramCount}`);
    values.push(phoneNumber);
  }

  if (photoBase64 !== undefined) {
    paramCount++;
    updateFields.push(`photo_base64 = $${paramCount}`);
    values.push(photoBase64);
  }

  if (status !== undefined) {
    paramCount++;
    updateFields.push(`status = $${paramCount}`);
    values.push(status);
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  // Add updated_at (no parameter needed for now())
  updateFields.push(`updated_at = now()`);
  
  // Add id parameter
  paramCount++;
  values.push(id);

  const query = `
    UPDATE "Driver" 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  try {
    const result = await db.pg.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Driver not found');
    }

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      throw new Error('National ID already exists');
    }
    throw error;
  }
};
