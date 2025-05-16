/**
 * @typedef {object} HotelEntry
 * @property {string} id - Unique identifier for the hotel entry (e.g., UUID).
 * @property {string} userId - Identifier for the user who owns this entry.
 * @property {string} hotelName - Name of the hotel.
 * @property {string} checkInDate - Date of check-in (ISO 8601 format, e.g., "2025-12-31").
 * @property {number} [customCD] - Custom cooldown period in days for this specific hotel. Optional.
 * @property {number} defaultCD - Default cooldown period in days (e.g., 30).
 * @property {string} createdAt - Timestamp of when the entry was created (ISO 8601 format).
 * @property {string} updatedAt - Timestamp of when the entry was last updated (ISO 8601 format).
 */

/**
 * @typedef {object} User
 * @property {string} id - Unique identifier for the user.
 * @property {string} [email] - User's email (if using email/password auth).
 * @property {string} [username] - User's username.
 * @property {string} [hashedPassword] - Hashed password (if using email/password auth).
 * @property {string} createdAt - Timestamp of when the user was created.
 * @property {string} updatedAt - Timestamp of when the user was last updated.
 */

// This file can be expanded with more type definitions as the application grows.
export {}; // Ensures this file is treated as a module.

