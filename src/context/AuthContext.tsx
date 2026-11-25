import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  limit,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { io, Socket } from 'socket.io-client';
import {
  auth,
  db,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
  tsMillis,
} from '../lib/firebase';
import {
  UserPublicProfile,
  UserPrivateProfile,
  UserRole,
  NotificationRecord,
} from '../types/hirepath';

const ADMIN_EMAIL = 'sadhana.s2025cse@sece.ac.in';

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  publicProfile: UserPublicProfile | null;
  privateProfile: UserPrivateProfile | null;
  notifications: NotificationRecord[];
  unreadCount: number;
  socket: Socket | null;
  signInWithGoogle: (preferredRole?: 'student' | 'recruiter') => Promise<void>;
  signOut: () => Promise<void>;
  updateProfiles: (
    pubUpdates: Partial<UserPublicProfile>,
    privUpdates?: Partial<UserPrivateProfile>
  ) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  pushNotification: (
    targetUid: string,
    payload: Omit<NotificationRecord, 'id' | 'uid' | 'read' | 'createdAt'>
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [publicProfile, setPublicProfile] = useState<UserPublicProfile | null>(null);
  const [privateProfile, setPrivateProfile] = useState<UserPrivateProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  const ensureUserProfiles = useCallback(
    async (firebaseUser: User, preferredRole?: 'student' | 'recruiter') => {
      const uid = firebaseUser.uid;
      const isAdminEmail =
        firebaseUser.email?.toLowerCase() === ADMIN_EMAIL && firebaseUser.emailVerified;

      const pubRef = doc(db, 'users_public', uid);
      const privRef = doc(db, 'users_private', uid);

      try {
        const pubSnap = await getDoc(pubRef);
        if (!pubSnap.exists()) {
          const initialRole: UserRole = isAdminEmail
            ? 'admin'
            : preferredRole || 'student';
          await setDoc(pubRef, {
            uid,
            displayName: firebaseUser.displayName || 'HirePath Learner',
            role: initialRole,
            headline:
              initialRole === 'recruiter'
                ? 'Technical Recruiter & Talent Partner'
                : 'Aspiring Software & Career Builder',
            bio: '',
            targetCareerId: 'fullstack-dev',
            avatarUrl: firebaseUser.photoURL || '',
            skillNames: ['JavaScript', 'Git'],
            skillLevels: { JavaScript: 45, Git: 50 },
            readinessScore: 32,
            learningHours: 0,
            updatedAt: serverTimestamp(),
          });
        } else if (preferredRole && !isAdminEmail && pubSnap.data().role !== preferredRole) {
          await updateDoc(pubRef, {
            role: preferredRole,
            updatedAt: serverTimestamp(),
          });
        }

        const privSnap = await getDoc(privRef);
        if (!privSnap.exists()) {
          await setDoc(privRef, {
            uid,
            email: firebaseUser.email || '',
            phone: '',
            location: '',
            collegeOrOrg: '',
            experienceLevel: 'beginner',
            weeklyHoursAvailable: 10,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users_public/${uid}`);
      }
    },
    []
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await ensureUserProfiles(firebaseUser);
      } else {
        setPublicProfile(null);
        setPrivateProfile(null);
        setNotifications([]);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, [ensureUserProfiles]);

  // Real-time listeners for profile & notifications once authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    const pubUnsub = onSnapshot(
      doc(db, 'users_public', user.uid),
      (snap) => {
        if (snap.exists()) {
          setPublicProfile(snap.data() as UserPublicProfile);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users_public/${user.uid}`)
    );

    const privUnsub = onSnapshot(
      doc(db, 'users_private', user.uid),
      (snap) => {
        if (snap.exists()) {
          setPrivateProfile(snap.data() as UserPrivateProfile);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users_private/${user.uid}`)
    );

    const notifQuery = query(
      collection(db, 'notifications'),
      where('uid', '==', user.uid),
      limit(30)
    );

    const notifUnsub = onSnapshot(
      notifQuery,
      (snap) => {
        const items: NotificationRecord[] = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<NotificationRecord, 'id'>),
          }))
          .sort((a, b) => tsMillis(b.createdAt) - tsMillis(a.createdAt));
        setNotifications(items);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
    );

    let activeSocket: Socket | null = null;
    user.getIdToken().then((token) => {
      activeSocket = io({
        auth: { token },
        transports: ['websocket', 'polling'],
      });
      setSocket(activeSocket);
    });

    return () => {
      pubUnsub();
      privUnsub();
      notifUnsub();
      if (activeSocket) {
        activeSocket.disconnect();
        setSocket(null);
      }
    };
  }, [authReady, user]);

  const signInWithGoogle = async (preferredRole?: 'student' | 'recruiter') => {
    const cred = await signInWithPopup(auth, googleAuthProvider);
    if (cred.user) {
      await ensureUserProfiles(cred.user, preferredRole);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const updateProfiles = async (
    pubUpdates: Partial<UserPublicProfile>,
    privUpdates?: Partial<UserPrivateProfile>
  ) => {
    if (!user) throw new Error('Not signed in');
    try {
      if (Object.keys(pubUpdates).length > 0) {
        await updateDoc(doc(db, 'users_public', user.uid), {
          ...pubUpdates,
          updatedAt: serverTimestamp(),
        });
      }
      if (privUpdates && Object.keys(privUpdates).length > 0) {
        await updateDoc(doc(db, 'users_private', user.uid), {
          ...privUpdates,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users_public/${user.uid}`);
    }
  };

  const markNotificationRead = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user) return;
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(db);
      unread.forEach((item) => {
        batch.update(doc(db, 'notifications', item.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'notifications');
    }
  };

  const pushNotification = async (
    targetUid: string,
    payload: Omit<NotificationRecord, 'id' | 'uid' | 'read' | 'createdAt'>
  ) => {
    if (!user) return;
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      await setDoc(doc(db, 'notifications', notifId), {
        uid: targetUid,
        type: payload.type,
        title: payload.title.slice(0, 140),
        message: payload.message.slice(0, 400),
        link: payload.link || '/dashboard',
        read: false,
        createdAt: serverTimestamp(),
      });
      socket?.emit('notification:dispatch', {
        targetUid,
        title: payload.title,
        message: payload.message,
        type: payload.type,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `notifications/${notifId}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        publicProfile,
        privateProfile,
        notifications,
        unreadCount,
        socket,
        signInWithGoogle,
        signOut,
        updateProfiles,
        markAllNotificationsRead,
        markNotificationRead,
        pushNotification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
