// functions/src/index.ts

import * as admin from 'firebase-admin';
import { onCall, CallableRequest } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

// Initialize Admin SDK
admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

type NotificationType = 'follow' | 'like' | 'post';

/**
 * Follow / Unfollow a user and notify on new follow
 */
export const followUser = onCall(
  async (request: CallableRequest<{ targetUid: string }>) => {
    const { targetUid } = request.data;
    const uid = request.auth?.uid;
    if (!uid || !targetUid || uid === targetUid) {
      throw new Error('Invalid user IDs');
    }

    const meRef = db.collection('users').doc(uid);
    const themRef = db.collection('users').doc(targetUid);
    const meSnap = await meRef.get();
    const me = meSnap.data()!;

    const isFollowing = (me.following as string[])?.includes(targetUid) || false;
    const batch = db.batch();

    // update arrays
    batch.update(meRef, {
      following: isFollowing
        ? FieldValue.arrayRemove(targetUid)
        : FieldValue.arrayUnion(targetUid),
    });
    batch.update(themRef, {
      followers: isFollowing
        ? FieldValue.arrayRemove(uid)
        : FieldValue.arrayUnion(uid),
    });

    // notify on new follow
    if (!isFollowing) {
      const notif = {
        type: 'follow' as NotificationType,
        title: 'New Follower',
        desc: `${me.displayName || 'Someone'} started following you.`,
        imageURL: me.photoURL || '',
        actionURL: `/profile/${uid}`,
        read: false,
        timestamp: FieldValue.serverTimestamp(),
      };
      batch.set(themRef.collection('notifications').doc(), notif);
    }

    await batch.commit();
    return { following: !isFollowing };
  }
);

/**
 * Like / Unlike a post and notify on new like
 */
export const toggleLike = onCall(
  async (request: CallableRequest<{ postId: string }>) => {
    const { postId } = request.data;
    const uid = request.auth?.uid;
    if (!uid || !postId) {
      throw new Error('Missing parameters');
    }

    const postRef = db.collection('posts').doc(postId);
    const postSnap = await postRef.get();
    if (!postSnap.exists) {
      throw new Error('Post not found');
    }

    const post = postSnap.data()!;
    const likedBy = (post.likedBy as string[]) || [];
    const hasLiked = likedBy.includes(uid);
    const op = hasLiked ? FieldValue.arrayRemove(uid) : FieldValue.arrayUnion(uid);

    await postRef.update({ likedBy: op });

    // notify on new like
    if (!hasLiked && (post.authorId as string) !== uid) {
      const meSnap = await db.collection('users').doc(uid).get();
      const me = meSnap.data()!;
      const notif = {
        type: 'like' as NotificationType,
        title: 'New Like',
        desc: `${me.displayName || 'Someone'} liked your post.`,
        imageURL: me.photoURL || '',
        actionURL: `/post/${postId}`,
        read: false,
        timestamp: FieldValue.serverTimestamp(),
        postId,
      };
      await db
        .collection('users')
        .doc(post.authorId as string)
        .collection('notifications')
        .doc()
        .set(notif);
    }

    return { liked: !hasLiked };
  }
);

/**
 * Create Post (callable) and notify followers
 */
export const createPost = onCall(
  async (
    request: CallableRequest<{ content: string; imageURL?: string }>
  ) => {
    const { content, imageURL = '' } = request.data;
    const uid = request.auth?.uid;
    if (!uid || !content) {
      throw new Error('Missing parameters');
    }

    // Create the post
    const postRef = db.collection('posts').doc();
    await postRef.set({
      authorId: uid,
      content,
      imageURL,
      timestamp: FieldValue.serverTimestamp(),
      likedBy: [] as string[],
    });

    // Notify followers
    const userSnap = await db.collection('users').doc(uid).get();
    const user = userSnap.data()!;
    const followers = (user.followers as string[]) || [];

    if (followers.length > 0) {
      const notif = {
        type: 'post' as NotificationType,
        title: 'New Post',
        desc: `${user.displayName || 'Someone'} published a new post.`,
        imageURL: user.photoURL || '',
        actionURL: `/post/${postRef.id}`,
        read: false,
        timestamp: FieldValue.serverTimestamp(),
        postId: postRef.id,
      };

      let batch = db.batch();
      let count = 0;
      const batches: FirebaseFirestore.WriteBatch[] = [];
      for (const followerId of followers) {
        batch.set(
          db.collection('users').doc(followerId).collection('notifications').doc(),
          notif
        );
        count++;
        if (count === 500) {
          batches.push(batch);
          batch = db.batch();
          count = 0;
        }
      }
      batches.push(batch);
      await Promise.all(batches.map((b) => b.commit()));
    }

    return { postId: postRef.id };
  }
);

/**
 * Optional Firestore trigger: in case posts are created outside callable
 */
export const notifyOnPost = onDocumentCreated(
  'posts/{postId}',
  async (event) => {
    const postSnap = event.data;
    if (!postSnap) return;
    const post = postSnap.data();
    if (!post) return;

    const authorId = post.authorId as string;
    const postId = event.params.postId;

    const userSnap = await db.collection('users').doc(authorId).get();
    if (!userSnap.exists) return;
    const user = userSnap.data()!;
    const followers = (user.followers as string[]) || [];

    if (followers.length === 0) return;

    const notif = {
      type: 'post' as NotificationType,
      title: 'New Post',
      desc: `${user.displayName || 'Someone'} published a new post.`,
      imageURL: user.photoURL || '',
      actionURL: `/post/${postId}`,
      read: false,
      timestamp: FieldValue.serverTimestamp(),
      postId,
    };

    let batch = db.batch();
    let count = 0;
    const batches: FirebaseFirestore.WriteBatch[] = [];
    for (const followerId of followers) {
      batch.set(
        db.collection('users').doc(followerId).collection('notifications').doc(),
        notif
      );
      count++;
      if (count === 500) {
        batches.push(batch);
        batch = db.batch();
        count = 0;
      }
    }
    batches.push(batch);
    await Promise.all(batches.map((b) => b.commit()));
  }
);
