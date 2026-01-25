import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";

const logsCollection = collection(db, "activity_logs");

export async function logActivity({
  action,
  entity,
  entity_id,
  description,
  performed_by,
  metadata = {},
}: {
  action: "CREATE" | "UPDATE" | "DELETE";
  entity: "CASHBOOK" | "ACCOUNT" | "INVOICE" | "PURCHASE";
  entity_id: string;
  description: string;
  performed_by: string;
  metadata?: any;
}) {
  try {
    await addDoc(logsCollection, {
      action,
      entity,
      entity_id,
      description,
      performed_by,
      metadata,
      created_at: Timestamp.now(),
    });
  } catch (err) {
    // Logs should NEVER break main flow
    console.error("Failed to log activity:", err);
  }
}
