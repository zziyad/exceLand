async (data) => {
  console.log('Creating event:', data);
  // Map and validate minimal fields
  const name = String(data?.name || '').trim();
  const description = String(data?.description || '');
  const expectedGuests = Number(data?.expected_guests || 0);
  const timezone = String(data?.timezone || 'UTC');
  const startAt = new Date(data?.start_at);
  const endAt = new Date(data?.end_at);
  const organizer = String(data?.organizer_name || '');
  const status = String(data?.status || 'planning');
  const maxVapp = Number(data?.max_vapp ?? 0);
  const maxFleet = Number(data?.max_fleet ?? 0);
  const country = data?.country_code ? String(data.country_code) : null;
  const city = data?.city ? String(data.city) : null;
  const settings = data?.settings ?? {};

  // Extract hotel and venue details
  const hotels = data?.hotels || [];
  const venues = data?.venues || [];
  const hotelDetails = data?.hotelDetails || [];
  const venueDetails = data?.venueDetails || [];

  console.log('Extracted data:', {
    hotels: hotels,
    venues: venues,
    hotelDetails: hotelDetails,
    venueDetails: venueDetails,
  });

  // Validate required fields
  if (
    !name ||
    !description ||
    !organizer ||
    !data?.start_at ||
    !data?.end_at ||
    !expectedGuests
  ) {
    return { error: 'INVALID_INPUT' };
  }

  // Validate that if hotels/venues are provided, they have valid names
  if (hotels.length > 0 && hotels.some((hotel) => !hotel?.trim())) {
    return { error: 'INVALID_HOTEL_NAMES' };
  }

  if (venues.length > 0 && venues.some((venue) => !venue?.trim())) {
    return { error: 'INVALID_VENUE_NAMES' };
  }

  // Validate that details arrays match the main arrays (only if details are provided)
  if (hotelDetails.length > 0 && hotels.length !== hotelDetails.length) {
    return { error: 'MISMATCHED_HOTEL_DETAILS' };
  }

  if (venueDetails.length > 0 && venues.length !== venueDetails.length) {
    return { error: 'MISMATCHED_VENUE_DETAILS' };
  }

  // Start transaction
  try {
    await db.pg.query('BEGIN');

    // Insert event
    const eventSql = `
      INSERT INTO "Event" (
        name, description, expected_guests, timezone,
        start_at, end_at, organizer_name, status,
        max_vapp, max_fleet, country_code, city, settings
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id
    `;
    const eventParams = [
      name,
      description,
      expectedGuests,
      timezone,
      startAt,
      endAt,
      organizer,
      status,
      maxVapp,
      maxFleet,
      country,
      city,
      settings,
    ];

    const { rows } = await db.pg.query(eventSql, eventParams);
    const eventId = rows[0].id;

    // Insert hotels
    console.log('Inserting hotels:', hotels.length, 'hotels');
    if (hotels.length > 0) {
      for (let i = 0; i < hotels.length; i++) {
        const hotelName = hotels[i]?.trim();
        console.log('Processing hotel:', i, hotelName);
        if (hotelName) {
          const hotelDetail = hotelDetails[i] || {};

          const hotelSql = `
            INSERT INTO "EventHotel" (
              event_id, name, address, city, latitude, longitude, 
              pickup_note, is_primary, order_idx
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `;
          const hotelParams = [
            eventId,
            hotelName,
            hotelDetail.address || null,
            hotelDetail.city || null,
            hotelDetail.latitude || null,
            hotelDetail.longitude || null,
            hotelDetail.pickupNote || null,
            hotelDetail.isPrimary || false,
            hotelDetail.orderIdx || i,
          ];

          console.log('Inserting hotel with params:', hotelParams);
          await db.pg.query(hotelSql, hotelParams);
          console.log('Hotel inserted successfully');
        }
      }
    }

    // Insert venues
    console.log('Inserting venues:', venues.length, 'venues');
    if (venues.length > 0) {
      for (let i = 0; i < venues.length; i++) {
        const venueName = venues[i]?.trim();
        console.log('Processing venue:', i, venueName);
        if (venueName) {
          const venueDetail = venueDetails[i] || {};

          const venueSql = `
            INSERT INTO "EventVenue" (
              event_id, name, address, city, latitude, longitude, 
              is_primary, order_idx, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `;
          const venueParams = [
            eventId,
            venueName,
            venueDetail.address || null,
            venueDetail.city || null,
            venueDetail.latitude || null,
            venueDetail.longitude || null,
            venueDetail.isPrimary || false,
            venueDetail.orderIdx || i,
            venueDetail.notes || null,
          ];

          console.log('Inserting venue with params:', venueParams);
          await db.pg.query(venueSql, venueParams);
          console.log('Venue inserted successfully');
        }
      }
    }

    await db.pg.query('COMMIT');
    console.log('Event created successfully with ID:', eventId);
    console.log('Hotels inserted:', hotels.length);
    console.log('Venues inserted:', venues.length);
    return { id: eventId };
  } catch (error) {
    await db.pg.query('ROLLBACK');
    console.error('Error creating event:', error);
    return { error: 'CREATE_FAILED' };
  }
};
