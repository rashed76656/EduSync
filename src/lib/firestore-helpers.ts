import { auth } from "./firebase";

/**
 * Injects the current teacher's UID into a data object.
 * Used for all teacher-scoped collection writes to ensure data isolation.
 * @param data The document data to be saved
 * @throws Error if no user is authenticated
 */
export function withTeacherId<T extends object>(data: T): T & { teacherId: string } {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error("No authenticated user found for scoped operation.");
  }
  return { ...data, teacherId: uid };
}
