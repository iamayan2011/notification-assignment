# Lightweight Social App (LinkedIn-like)  

**Submitted By:** Ayan Raza ([LinkedIn](https://www.linkedin.com/in/ayan-raza/))

---

## Overview  
This system is a lightweight LinkedIn-like social application built with Firebase (Auth, Firestore, Functions) and a Vite + React frontend. It supports core social features including user authentication (implemented for smooth flow), post creation, notifications (including unread count), and profile browsing.

---

## Components Involved

### 1. Frontend (Vite + React + TypeScript)  
- **Pages:** Home, Notifications, Profile, SignIn, Search  
- **Components:** Navbar, CreatePost  
- **Routing:** React Router DOM  
- **Styling:** Tailwind CSS  
- **State Management:** React Context (for authentication)  

### 2. Firebase Services  
- **Authentication:** Firebase Auth (email/password)  
- **Database:** Firestore (posts, user profiles, notifications)  
  - **Structure:**  
    - `users`: uid, displayName, email, followers[], following[], photoURL  
    - `notifications` (sub-collection): notification_id, type, title, desc, read, imageURL, actionURL, timestamp  
    - `posts`: post_id, author_id, content, imageURL, likedBy[], timestamp  
- **Cloud Functions:** Server-side triggers for notifications  
  - `followUser`: Updates follower/following lists and notifications  
  - `toggleLike`: Like/unlike a post and update notifications  
  - `createPost`: Creates a post and updates notifications  

### 3. Hosting  
- **Frontend:** Hosted on Vercel  
- **Backend (Functions):** Hosted using Firebase Functions  

---

## Flow of Execution

1. **User Authentication**  
   - Users sign in with email/password via Firebase Auth.  
   - `AuthContext` provides current user info across components.  
   - Redirect to `/signin` if unauthenticated.

2. **Post Creation**  
   - Authenticated users create posts at `/create`.  
   - Posts saved to Firestore `posts` collection.  
   - Cloud Function triggers notifications to followers.

3. **Notifications**  
   - Stored as subcollections under each user.  
   - Metadata includes type, fromUser, read status, timestamp.  
   - Unread notification count fetched on Navbar load and updated on read.

4. **Profile & Search**  
   - Navbar links to `/profile/:uid` for current user.  
   - Search bar queries users via URL query parameters.

---

## Scale Considerations

- **Frontend:**  
  - Vite + React enables fast dev and optimized production builds.  
  - Vercel provides auto-scaling hosting.

- **Backend (Firebase):**  
  - Firebase Auth scales automatically.  
  - Firestore supports horizontal scaling and real-time listeners.  
  - Cloud Functions scale automatically, but cold starts can affect latency.

- **Notifications:**  
  - Stored per user to avoid read bottlenecks.  
  - No real-time listeners implemented for notifications currently.

---

## Performance

### Pros  
- Firebase real-time sync improves responsiveness.  
- Vite + React provide smooth frontend experience.  
- Cloud Functions enable backend logic without dedicated servers.

### Bottlenecks  
- Cold starts in Cloud Functions.  
- Firestore limits on document reads/writes and size.

---

## Limitations

- No real-time notification listeners; no push notifications yet (Firebase Cloud Messaging can be integrated).  
- Limited role and permission management using Firebase Auth alone.  
- Cold start latency in Cloud Functions.  
- Basic user search that relies on exact matches; no typo tolerance or email search.  
- Firestore rules currently open (test mode).  
- UI design is minimal and functional but not polished.

---

## Future Improvements

- Implement stricter Firestore security rules.  
- Integrate Algolia or other full-text search for better user search.  
- Use batch writes for notification updates to improve performance.  
- Add Firebase Cloud Messaging for real-time push notifications.  
- Enhance UI design and user experience.

---

## Conclusion

This Firebase-based social app is well-suited for prototypes or early-stage products with moderate user bases. It is cost-effective, easy to deploy, and simple to scale for the first few thousand users. For long-term scalability and production readiness, architectural refinements and additional features are recommended.

---

