import { useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase/firebaseConfig";

export const useFirebaseCounter = (path, callback) => {
  const callbackRef = useRef(callback);

  // Actualizamos la referencia del callback sin disparar efectos innecesarios
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!path || typeof callback !== "function") return;

    const dbRef = ref(db, path);

    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        callbackRef.current(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, [path]);   // ← Solo dependemos de path (evita duplicar listeners)
};