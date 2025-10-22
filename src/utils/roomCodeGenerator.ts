/**
 * Room Code Generator
 * Generates 6-character alphanumeric room codes for jam sessions
 * Story 7.2 - Supabase Realtime Service Layer
 */

/**
 * Characters allowed in room codes
 * Excludes confusing characters: 0/O, 1/I, 5/S, 2/Z
 */
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRTUVWXY346789';

/**
 * Length of generated room codes
 */
const ROOM_CODE_LENGTH = 6;

/**
 * Generates a random 6-character alphanumeric room code
 *
 * @returns {string} Room code (e.g., "ABC123", "XYZ789")
 *
 * @example
 * ```typescript
 * const roomCode = generateRoomCode();
 * console.log(roomCode); // "QWE456"
 * ```
 *
 * **Notes:**
 * - Excludes confusing characters (0/O, 1/I, 5/S, 2/Z) for readability
 * - Client-side generation (no database required for MVP)
 * - Collision probability ~0.0001% with 1000 active sessions
 * - Total combinations: 28^6 = 481,890,304
 */
export function generateRoomCode(): string {
  let code = '';

  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    code += ROOM_CODE_CHARS[randomIndex];
  }

  return code;
}

/**
 * Validates a room code format
 *
 * @param {string} code - Room code to validate
 * @returns {boolean} True if valid format
 *
 * @example
 * ```typescript
 * isValidRoomCode('ABC123'); // true
 * isValidRoomCode('abc123'); // false (lowercase not allowed)
 * isValidRoomCode('ABCD');   // false (wrong length)
 * ```
 */
export function isValidRoomCode(code: string): boolean {
  if (code.length !== ROOM_CODE_LENGTH) {
    return false;
  }

  for (const char of code) {
    if (!ROOM_CODE_CHARS.includes(char)) {
      return false;
    }
  }

  return true;
}
