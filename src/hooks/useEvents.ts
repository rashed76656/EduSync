import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where,
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import type { InstituteEvent } from '../types';
import toast from 'react-hot-toast';

export function useEvents() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<InstituteEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'events'), 
      where('teacherId', '==', user.uid),
      orderBy('date', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventData: InstituteEvent[] = [];
      snapshot.forEach((docSnap) => {
        eventData.push({ id: docSnap.id, ...docSnap.data() } as InstituteEvent);
      });
      setEvents(eventData);
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      toast.error('Failed to sync events');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addEvent = async (data: Omit<InstituteEvent, 'id' | 'createdAt' | 'teacherId'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'events'), {
        ...data,
        teacherId: user.uid,
        createdAt: serverTimestamp()
      });
      toast.success('Event added successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add event');
      throw err;
    }
  };

  const updateEvent = async (id: string, updates: Partial<InstituteEvent>) => {
    try {
      const docRef = doc(db, 'events', id);
      await updateDoc(docRef, updates);
      toast.success('Event updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update event');
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', id));
      toast.success('Event deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete event');
      throw err;
    }
  };

  return { events, isLoading, addEvent, updateEvent, deleteEvent };
}
