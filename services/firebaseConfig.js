import { initializeApp, getApps } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  initializeAuth,
  getReactNativePersistence,
  onAuthStateChanged,
  updateProfile,
  getAuth
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  arrayUnion,
  arrayRemove,
  getDoc,
  setDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: `${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase only if no apps exist
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth with proper error handling
let auth;
try {
  auth = getAuth(app);
} catch (error) {
  // If getAuth fails, try initializeAuth
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Initialize Firestore
const db = getFirestore(app);

// Your existing functions remain the same...
export const createUserAndProfile = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: userData.name
    });

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: userData.name,
      email: email,
      phone: userData.phone || '',
      bio: '',
      profileImage: '',
      followers: [],
      following: [],
      postsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return user;
  } catch (error) {
    throw error;
  }
};

export const createPost = async (postData) => {
  try {
    const docRef = await addDoc(collection(db, 'posts'), {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: [],
      likesCount: 0,
      comments: []
    });

    const userRef = doc(db, 'users', postData.userId);
    await updateDoc(userRef, {
      postsCount: increment(1)
    });

    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const toggleLikePost = async (postId, userId) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (postDoc.exists()) {
      const postData = postDoc.data();
      const likes = postData.likes || [];
      const isLiked = likes.includes(userId);

      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(userId),
          likesCount: increment(-1)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(userId),
          likesCount: increment(1)
        });
      }
    }
  } catch (error) {
    throw error;
  }
};

export const deletePost = async (postId, userId) => {
  try {
    await deleteDoc(doc(db, 'posts', postId));
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      postsCount: increment(-1)
    });
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (userId, updateData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });

    if (updateData.name && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: updateData.name
      });
    }
  } catch (error) {
    throw error;
  }
};

export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const toggleFollowUser = async (currentUserId, targetUserId) => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    
    const currentUserDoc = await getDoc(currentUserRef);
    const following = currentUserDoc.data()?.following || [];
    const isFollowing = following.includes(targetUserId);

    if (isFollowing) {
      await updateDoc(currentUserRef, {
        following: arrayRemove(targetUserId)
      });
      await updateDoc(targetUserRef, {
        followers: arrayRemove(currentUserId)
      });
    } else {
      await updateDoc(currentUserRef, {
        following: arrayUnion(targetUserId)
      });
      await updateDoc(targetUserRef, {
        followers: arrayUnion(currentUserId)
      });
    }
  } catch (error) {
    throw error;
  }
};

export {
  auth,
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  db,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  arrayUnion,
  arrayRemove,
  getDoc,
  setDoc,
  serverTimestamp,
  increment
};