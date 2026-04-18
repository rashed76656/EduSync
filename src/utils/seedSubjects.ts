import { collection, getDocs, query, where, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { BTEB_SUBJECTS } from "./btebSubjectData";

async function deleteCollection(collectionRef: any) {
  const snapshot = await getDocs(collectionRef);
  const batch = writeBatch(db);
  snapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

export async function clearAndSeedSubjects() {
  const subjectsRef = collection(db, "subjects");
  console.log("Cleaning existing subjects...");
  await deleteCollection(subjectsRef);
  console.log("Cleaned. Starting fresh seed...");
  return await seedSubjectsToFirestore(true);
}

export async function seedSubjectsToFirestore(force = false) {
  const subjectsRef = collection(db, "subjects");
  
  if (!force) {
    // Check if already seeded
    const q = query(subjectsRef, where("regulation", "==", "2022"));
    const existing = await getDocs(q);
    
    if (!existing.empty) {
      console.log("Subjects already seeded.");
      return { success: false, message: "Subjects already seeded." };
    }
  }

  let count = 0;
  const batchLimit = 400; // Safer limit
  let batch = writeBatch(db);

  try {
    for (const [deptName, deptData] of Object.entries(BTEB_SUBJECTS)) {
      for (const [semester, subjects] of Object.entries(deptData.semesters)) {
        for (const subject of subjects) {
          const newDocRef = doc(subjectsRef);
          
          // Debugging log for missing names
          if (!subject.name) {
             console.warn(`Subject ${subject.code} in ${deptName} ${semester} is missing a name!`);
          }

          batch.set(newDocRef, {
            id: newDocRef.id,
            code: subject.code,
            name: subject.name || "Unknown Subject",
            department: deptName,
            departmentCode: deptData.code,
            departmentShort: deptData.shortName,
            semester: semester,
            regulation: "2022",
            isActive: true,
            createdAt: serverTimestamp()
          });
          
          count++;
          
          if (count % batchLimit === 0) {
            await batch.commit();
            batch = writeBatch(db);
          }
        }
      }
    }

    if (count % batchLimit !== 0) {
      await batch.commit();
    }

    console.log(`✅ Seeded ${count} subjects successfully.`);
    return { success: true, count };
  } catch (error) {
    console.error("Error seeding subjects:", error);
    throw error;
  }
}
