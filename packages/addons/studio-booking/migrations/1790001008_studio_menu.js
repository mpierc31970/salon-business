// Studio Booking: the salon's own service menu (the owner's master list). A studio_services
// row with no seat is a menu item; stylists copy menu items onto their own seat.
migrate(
  (app) => {
    const services = app.findCollectionByNameOrId("studio_services");
    services.fields.getByName("seat").required = false;
    app.save(services);
  },
  (app) => {
    const services = app.findCollectionByNameOrId("studio_services");
    for (const r of app.findRecordsByFilter(
      "studio_services",
      "seat = ''",
      "",
      0,
      0,
    )) {
      app.delete(r);
    }
    services.fields.getByName("seat").required = true;
    app.save(services);
  },
);
