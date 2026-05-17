export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Rental System API",
    version: "1.0.0",
    description: "REST API for a property rental and booking platform.",
  },
  servers: [{ url: "http://localhost:3000", description: "Local" }],
  tags: [
    { name: "Health" },
    { name: "Users" },
    { name: "Listings" },
    { name: "Bookings" },
    { name: "Payments" },
  ],

  // ─── Reusable building blocks ────────────────────────────────────────────────
  components: {
    schemas: {
      // Response shapes (snake_case — returned directly from PostgreSQL)
      User: {
        type: "object",
        properties: {
          id:         { type: "string", format: "uuid" },
          email:      { type: "string", format: "email", example: "alice@example.com" },
          username:   { type: "string", example: "alice" },
          role:       { type: "string", enum: ["guest", "host"] },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },

      Listing: {
        type: "object",
        properties: {
          id:              { type: "string", format: "uuid" },
          host_id:         { type: "string", format: "uuid" },
          title:           { type: "string", example: "Cozy beach house" },
          description:     { type: "string", example: "Steps from the ocean." },
          price_per_night: { type: "number", example: 120 },
          location:        { type: "string", example: "Miami, FL" },
          images:          { type: "string", example: "https://..." },
          accommodation:   { type: "integer", example: 4 },
          offerings:       { type: "string", example: "WiFi, Pool" },
          created_at:      { type: "string", format: "date-time" },
          updated_at:      { type: "string", format: "date-time" },
        },
      },

      Booking: {
        type: "object",
        properties: {
          id:             { type: "string", format: "uuid" },
          listing_id:     { type: "string", format: "uuid" },
          guest_id:       { type: "string", format: "uuid" },
          check_in:       { type: "string", format: "date", example: "2024-12-20" },
          check_out:      { type: "string", format: "date", example: "2024-12-25" },
          total_price:    { type: "number", example: 600 },
          booking_status: { type: "string", enum: ["pending", "confirmed", "cancelled", "completed"] },
          payment_status: { type: "string", enum: ["pending", "completed", "failed", "refunded"] },
          created_at:     { type: "string", format: "date-time" },
          updated_at:     { type: "string", format: "date-time" },
        },
      },

      Payment: {
        type: "object",
        properties: {
          id:               { type: "string", format: "uuid" },
          booking_id:       { type: "string", format: "uuid" },
          amount:           { type: "number", example: 600 },
          currency:         { type: "string", example: "USD" },
          status:           { type: "string", enum: ["pending", "completed", "failed", "refunded"] },
          stripe_charge_id: { type: "string", example: "ch_3abc123" },
          idempotency_key:  { type: "string", example: "booking-abc-attempt-1" },
          created_at:       { type: "string", format: "date-time" },
          updated_at:       { type: "string", format: "date-time" },
        },
      },

      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Resource not found" },
        },
      },
    },

    // Reusable path parameters
    parameters: {
      id: {
        name: "id", in: "path", required: true,
        schema: { type: "string", format: "uuid" },
      },
      limit: {
        name: "limit", in: "query",
        description: "Max results to return",
        schema: { type: "integer", default: 20 },
      },
      offset: {
        name: "offset", in: "query",
        description: "Results to skip (for pagination)",
        schema: { type: "integer", default: 0 },
      },
    },

    // Reusable responses
    responses: {
      NotFound:   { description: "Not found",   content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      BadRequest: { description: "Bad request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      Conflict:   { description: "Conflict",    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      NoContent:  { description: "Deleted successfully — no body returned" },
    },
  },

  // ─── Endpoints ────────────────────────────────────────────────────────────────
  paths: {

    // ── Health ──────────────────────────────────────────────────────────────────
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: {
            description: "Server is up",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status:    { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Users ───────────────────────────────────────────────────────────────────
    "/api/v1/users": {
      post: {
        tags: ["Users"],
        summary: "Create a user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "username", "role"],
                properties: {
                  email:    { type: "string", format: "email", example: "alice@example.com" },
                  username: { type: "string", example: "alice" },
                  password: { type: "string", example: "secret123" },
                  role:     { type: "string", enum: ["guest", "host"] },
                },
              },
            },
          },
        },
        responses: {
          201:        { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          400:        { $ref: "#/components/responses/BadRequest" },
        },
      },
      get: {
        tags: ["Users"],
        summary: "List all users",
        parameters: [
          { $ref: "#/components/parameters/limit" },
          { $ref: "#/components/parameters/offset" },
        ],
        responses: {
          200: {
            description: "OK",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } } },
          },
        },
      },
    },

    "/api/v1/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get a user by ID",
        parameters: [{ $ref: "#/components/parameters/id" }],
        responses: {
          200: { description: "OK",        content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update a user",
        parameters: [{ $ref: "#/components/parameters/id" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email:    { type: "string", format: "email" },
                  username: { type: "string" },
                  password: { type: "string" },
                  role:     { type: "string", enum: ["guest", "host"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Updated", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete a user",
        parameters: [{ $ref: "#/components/parameters/id" }],
        responses: {
          204: { $ref: "#/components/responses/NoContent" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ── Listings ─────────────────────────────────────────────────────────────────
    "/api/v1/listings": {
      post: {
        tags: ["Listings"],
        summary: "Create a listing (hosts only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["hostId", "title", "pricePerNight", "location"],
                properties: {
                  hostId:        { type: "string", format: "uuid" },
                  title:         { type: "string", example: "Cozy beach house" },
                  description:   { type: "string", example: "Steps from the ocean." },
                  pricePerNight: { type: "number", example: 120 },
                  location:      { type: "string", example: "Miami, FL" },
                  images:        { type: "string", example: "https://..." },
                  accommodation: { type: "integer", example: 4 },
                  offerings:     { type: "string", example: "WiFi, Pool" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Listing" } } } },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
      get: {
        tags: ["Listings"],
        summary: "List all listings",
        parameters: [
          { $ref: "#/components/parameters/limit" },
          { $ref: "#/components/parameters/offset" },
        ],
        responses: {
          200: {
            description: "OK",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Listing" } } } },
          },
        },
      },
    },

    "/api/v1/listings/host/{hostId}": {
      get: {
        tags: ["Listings"],
        summary: "Get listings by host",
        parameters: [
          { name: "hostId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { $ref: "#/components/parameters/limit" },
          { $ref: "#/components/parameters/offset" },
        ],
        responses: {
          200: {
            description: "OK",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Listing" } } } },
          },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    "/api/v1/listings/{id}": {
      get: {
        tags: ["Listings"],
        summary: "Get a listing by ID",
        parameters: [{ $ref: "#/components/parameters/id" }],
        responses: {
          200: { description: "OK",       content: { "application/json": { schema: { $ref: "#/components/schemas/Listing" } } } },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Listings"],
        summary: "Update a listing",
        parameters: [{ $ref: "#/components/parameters/id" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title:         { type: "string" },
                  description:   { type: "string" },
                  pricePerNight: { type: "number" },
                  location:      { type: "string" },
                  images:        { type: "string" },
                  accommodation: { type: "integer" },
                  offerings:     { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Listing" } } } },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Listings"],
        summary: "Delete a listing",
        parameters: [{ $ref: "#/components/parameters/id" }],
        responses: {
          204: { $ref: "#/components/responses/NoContent" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ── Bookings ─────────────────────────────────────────────────────────────────
    "/api/v1/bookings": {
      post: {
        tags: ["Bookings"],
        summary: "Create a booking (guests only)",
        description: "Uses a pessimistic lock to prevent double-booking. Returns 409 if the dates overlap an existing booking.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["listingId", "guestId", "checkIn", "checkOut", "totalPrice"],
                properties: {
                  listingId:  { type: "string", format: "uuid" },
                  guestId:    { type: "string", format: "uuid" },
                  checkIn:    { type: "string", format: "date", example: "2024-12-20" },
                  checkOut:   { type: "string", format: "date", example: "2024-12-25" },
                  totalPrice: { type: "number", example: 600 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Booking" } } } },
          400: { $ref: "#/components/responses/BadRequest" },
          409: { $ref: "#/components/responses/Conflict" },
        },
      },
    },

    "/api/v1/bookings/{id}": {
      get: {
        tags: ["Bookings"],
        summary: "Get a booking by ID",
        parameters: [{ $ref: "#/components/parameters/id" }],
        responses: {
          200: { description: "OK",   content: { "application/json": { schema: { $ref: "#/components/schemas/Booking" } } } },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Bookings"],
        summary: "Update a booking",
        parameters: [{ $ref: "#/components/parameters/id" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  booking_status: { type: "string", enum: ["pending", "confirmed", "cancelled", "completed"] },
                  payment_status: { type: "string", enum: ["pending", "completed", "failed", "refunded"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Booking" } } } },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Bookings"],
        summary: "Delete a booking",
        parameters: [{ $ref: "#/components/parameters/id" }],
        responses: {
          204: { $ref: "#/components/responses/NoContent" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    "/api/v1/bookings/listing/{listingId}": {
      get: {
        tags: ["Bookings"],
        summary: "Get bookings for a listing",
        parameters: [
          { name: "listingId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { $ref: "#/components/parameters/limit" },
          { $ref: "#/components/parameters/offset" },
        ],
        responses: {
          200: {
            description: "OK",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Booking" } } } },
          },
        },
      },
    },

    "/api/v1/bookings/guest/{guestId}": {
      get: {
        tags: ["Bookings"],
        summary: "Get bookings for a guest",
        parameters: [
          { name: "guestId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { $ref: "#/components/parameters/limit" },
          { $ref: "#/components/parameters/offset" },
        ],
        responses: {
          200: {
            description: "OK",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Booking" } } } },
          },
        },
      },
    },

    // ── Payments ─────────────────────────────────────────────────────────────────
    "/api/v1/payments": {
      post: {
        tags: ["Payments"],
        summary: "Create a payment",
        description: "Pass an `idempotencyKey` to make this call safe to retry — duplicate keys return the original payment instead of charging again.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["bookingId", "amount", "idempotencyKey"],
                properties: {
                  bookingId:       { type: "string", format: "uuid" },
                  amount:          { type: "number", example: 600 },
                  currency:        { type: "string", example: "USD", default: "USD" },
                  stripeChargeId:  { type: "string", example: "ch_3abc123" },
                  idempotencyKey:  { type: "string", example: "booking-abc-attempt-1" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Payment" } } } },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
    },

    "/api/v1/payments/{id}": {
      get: {
        tags: ["Payments"],
        summary: "Get a payment by ID",
        parameters: [{ $ref: "#/components/parameters/id" }],
        responses: {
          200: { description: "OK",   content: { "application/json": { schema: { $ref: "#/components/schemas/Payment" } } } },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Payments"],
        summary: "Update a payment",
        parameters: [{ $ref: "#/components/parameters/id" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status:          { type: "string", enum: ["pending", "completed", "failed", "refunded"] },
                  stripe_charge_id: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Payment" } } } },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Payments"],
        summary: "Delete a payment",
        parameters: [{ $ref: "#/components/parameters/id" }],
        responses: {
          204: { $ref: "#/components/responses/NoContent" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    "/api/v1/payments/idempotency/{idempotencyKey}": {
      get: {
        tags: ["Payments"],
        summary: "Get a payment by idempotency key",
        parameters: [
          { name: "idempotencyKey", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "OK",   content: { "application/json": { schema: { $ref: "#/components/schemas/Payment" } } } },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    "/api/v1/payments/booking/{bookingId}": {
      get: {
        tags: ["Payments"],
        summary: "Get payments for a booking",
        parameters: [
          { name: "bookingId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: {
            description: "OK",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Payment" } } } },
          },
        },
      },
    },
  },
};
