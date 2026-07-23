// Servicio sencillo para Realtime Database (Firebase v9 modular)
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onChildAdded, onValue, push, set, off } from "firebase/database";
import firebaseConfig from "./firebaseConfig";

let app = null;
let db = null;

const init = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("Firebase inicializado");
  }
};

// listeners: devuelven la referencia para poder apagarla con stopListening
const listenInbox = (userId, onNewItem) => {
  if (!db || !userId) return null;
  const r = ref(db, `user_inbox/${userId}`);
  // new messages / inbox items
  const offFn = onChildAdded(r, (snap) => {
    onNewItem(snap.val(), snap.key);
  });
  return r;
};

const listenNotifications = (userId, onNewNotif) => {
  if (!db || !userId) return null;
  const r = ref(db, `user_notifications/${userId}`);
  const offFn = onChildAdded(r, (snap) => {
    onNewNotif(snap.val(), snap.key);
  });
  return r;
};

const listenThread = (threadId, onNewMessage) => {
  if (!db || !threadId) return null;
  const r = ref(db, `user_threads/${threadId}`);
  const offFn = onChildAdded(r, (snap) => {
    onNewMessage(snap.val(), snap.key);
  });
  return r;
};

// push message summary to recipient inbox and message to thread
const pushMessageRealtime = async ({ recipientId, threadId, messageObj, inboxSummary }) => {
  if (!db) throw new Error("Firebase no inicializado");
  // push a thread
  const threadRef = ref(db, `user_threads/${threadId}`);
  const newMsgRef = await push(threadRef);
  await set(newMsgRef, { ...messageObj, timestamp: Date.now() });

  // push inbox summary for recipient
  const inboxRef = ref(db, `user_inbox/${recipientId}`);
  const inboxItemRef = await push(inboxRef);
  await set(inboxItemRef, { ...inboxSummary, timestamp: Date.now(), read: false, threadId, messageKey: newMsgRef.key });
  return { threadKey: newMsgRef.key, inboxKey: inboxItemRef.key };
};

const pushNotificationRealtime = async (recipientId, notifObj) => {
  if (!db) throw new Error("Firebase no inicializado");
  const refNot = ref(db, `user_notifications/${recipientId}`);
  const newNotif = await push(refNot);
  await set(newNotif, { ...notifObj, timestamp: Date.now(), seen: false });
  return newNotif.key;
};

const stopListening = (dbRef) => {
  if (!dbRef) return;
  off(dbRef);
};

export default {
  init,
  listenInbox,
  listenNotifications,
  listenThread,
  pushMessageRealtime,
  pushNotificationRealtime,
  stopListening
};
