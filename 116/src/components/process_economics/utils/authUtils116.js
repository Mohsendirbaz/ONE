# authUtils.js

**Purpose**: Config

**Description**: * Authentication and user profile management utilities for Firebase.
 * Provides...

**Functions**: getCurrentUserId, ensureAuthenticated, ensureUserProfile, getUserProfile, updateUserPreferences

## File Info

- **Size**: 4.5 KB
- **Lines**: 156
- **Complexity**: 6

## Additional Details

### Content Samples

Beginning:
```
/**
 * Authentication and user profile management utilities for Firebase.
 * Provides methods to han
```

Middle:
```
files', userId);
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {

```

End:
```
 {
    getCurrentUserId,
    ensureAuthenticated,
    getUserProfile,
    updateUserPreferences
  };
```

