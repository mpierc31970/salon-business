// Studio Booking (Salon): how many hours before a booking an unanswered request is flagged to the
// owner (business_profile.flag_hours; 0/blank = the 24-hour default). The owner sets it on Bookings.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("business_profile");
    col.fields.add(new NumberField({ name: "flag_hours", onlyInt: true }));
    app.save(col);
  },
  (app) => {
    const col = app.findCollectionByNameOrId("business_profile");
    col.fields.removeByName("flag_hours");
    app.save(col);
  },
);
