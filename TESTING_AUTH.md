# Testing Guide: Story 18.0 Authentication

## Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

Server should start at `http://localhost:5173`

### 2. Navigate to Auth Test Page

Open your browser and go to:

```
http://localhost:5173/auth-test
```

You'll see a comprehensive test page with:
- ✅ Real-time authentication status
- ✅ Test buttons for all auth flows
- ✅ RequireAuth component demo
- ✅ Step-by-step testing instructions

---

## Test Scenarios

### ✅ Test 1: Sign Up Flow (Email/Password)

1. On the test page, click **"Open Auth Modal"**
2. Switch to **"Email/Password"** tab
3. Click **"Sign Up"** (bottom sub-tab)
4. Enter:
   - Email: `your-email@example.com`
   - Password: `TestPass123!`
   - Username: `TestUser` (optional)
5. Click **"Create Account"**
6. **Check your email** for Supabase confirmation link
7. Click the confirmation link in email
8. Return to test page → See authenticated state

**Expected Result:**
- Auth status card shows "✅ Authenticated"
- Email, username, and user ID displayed
- "Sign Out" button appears

---

### ✅ Test 2: Magic Link Flow (PRIMARY METHOD)

1. Sign out (click "Sign Out" button or open in incognito mode)
2. Click **"Open Auth Modal"**
3. **Default tab should be "Magic Link"** (this is primary method)
4. Enter your email: `your-email@example.com`
5. Click **"Send Magic Link"**
6. See success message: "Check your email!"
7. **Check your email** for magic link
8. Click magic link in email
9. Automatically redirected and signed in

**Expected Result:**
- No password needed (passwordless auth)
- Automatic sign-in after clicking email link
- Auth status shows authenticated

---

### ✅ Test 3: Sign In Flow (Returning User)

1. Sign out (reload page in incognito mode)
2. Click **"Open Auth Modal"**
3. Switch to **"Email/Password"** tab
4. Click **"Sign In"** (bottom sub-tab)
5. Enter email and password from Test 1
6. Click **"Sign In"**

**Expected Result:**
- Signed in successfully
- Auth status shows authenticated
- Profile data loaded from database

---

### ✅ Test 4: RequireAuth Blurred Preview Pattern

1. Sign out (reload in incognito mode)
2. Scroll to **"RequireAuth Component Demo"** section
3. Observe:
   - ✅ Protected content is **blurred** (preview visible)
   - ✅ Overlay with "Create Free Account" button
   - ✅ Value proposition text visible
4. Click **"Create Free Account"**
5. AuthModal opens
6. Sign in or sign up
7. Observe:
   - ✅ Gate disappears
   - ✅ Protected content now fully accessible
   - ✅ Your user data displayed in JSON

**Expected Result:**
- Anonymous users see blurred preview + gate
- Authenticated users see full content
- Smooth transition when auth succeeds

---

### ✅ Test 5: Username Migration (localStorage → Database)

1. Sign out completely
2. Clear browser storage:
   - Press **F12** (DevTools)
   - Go to **Console** tab
   - Type: `localStorage.clear()`
   - Press Enter
3. Navigate to jam session: `http://localhost:5173/jam`
4. Enter username in modal: `AnonymousUser123`
5. Click "Continue"
6. Verify saved to localStorage:
   - In Console: `localStorage.getItem('jam-username')`
   - Should return: `"AnonymousUser123"`
7. Return to auth test: `http://localhost:5173/auth-test`
8. Click **"Open Auth Modal"**
9. Sign up with new account
10. After sign up, check database (see Database Verification below)

**Expected Result:**
- Username `AnonymousUser123` migrated from localStorage to database
- New user profile has username from localStorage
- Identity preserved when upgrading from anonymous to authenticated

---

### ✅ Test 6: Session Persistence

1. Sign in via auth test page
2. Verify authenticated state shows
3. **Reload page** (F5)
4. Verify still signed in (session persisted)
5. **Open new tab** → Navigate to `http://localhost:5173/auth-test`
6. Verify authenticated in new tab

**Expected Result:**
- Session persists across page reloads
- Session persists across browser tabs
- No need to sign in again

---

### ✅ Test 7: Error Handling

**Email Already Exists:**
1. Try to sign up with email from Test 1
2. See error message: "User already registered"
3. Form doesn't submit

**Invalid Credentials:**
1. Try to sign in with wrong password
2. See error message: "Invalid login credentials"
3. Form doesn't submit

**Network Error:**
1. Disconnect network (airplane mode or disable WiFi)
2. Try to sign in
3. See user-friendly error message
4. No crashes

---

## Database Verification (Supabase Dashboard)

### View User Profiles Table

1. Open Supabase Dashboard: `https://supabase.com/dashboard`
2. Navigate to your project
3. Go to **Table Editor** → Select **`user_profiles`** table
4. See your profile row with:
   - `id` (UUID matching auth.users.id)
   - `username` (from sign up or migrated from localStorage)
   - `created_at`
   - `updated_at`

### Test RLS Policies (SQL Editor)

Go to **SQL Editor** → New Query:

```sql
-- View your own profile (should succeed)
SELECT * FROM user_profiles WHERE id = auth.uid();

-- Try to view all profiles (should only return your own due to RLS)
SELECT * FROM user_profiles;
```

**Expected Results:**
- First query returns your profile
- Second query returns ONLY your profile (not other users)
- RLS policies working correctly

---

## Browser DevTools Verification

### Check Auth State in Console

1. Press **F12** to open DevTools
2. Go to **Console** tab
3. On auth test page, click **"Log Auth State to Console"**
4. See output:
   ```
   === AUTH STATE DEBUG ===
   User: {id: "...", email: "...", ...}
   Profile: {id: "...", username: "...", created_at: "...", ...}
   Is Authenticated: true
   Loading: false
   =========================
   ```

### Check Network Requests

1. Press **F12** → **Network** tab
2. Reload page
3. Look for Supabase auth requests:
   - `getSession` request (<100ms expected)
   - Should be fast and cached

---

## Performance Testing

### Auth Check Latency

1. Press **F12** → **Console** tab
2. Reload page
3. Measure auth check time:
   ```javascript
   console.time('auth-check');
   // Auth check happens automatically on page load
   console.timeEnd('auth-check');
   ```

**Expected:** <100ms (requirement from Story 18.0)

---

## Common Issues & Troubleshooting

### Issue: "Email not confirmed"

**Solution:**
1. Check your email inbox (including spam folder)
2. Click confirmation link in email
3. Try signing in again

### Issue: "Magic link not working"

**Solution:**
1. Check Supabase Dashboard → Authentication → Email Templates
2. Verify redirect URL is set to `http://localhost:5173/auth/callback`
3. Ensure email provider allows emails from Supabase

### Issue: "Session not persisting"

**Solution:**
1. Check browser localStorage is enabled
2. Verify no browser extensions blocking storage
3. Check Supabase session expiry settings (default: 1 hour)

### Issue: "Port 5173 already in use"

**Solution:**
- Server is already running (good!)
- Just navigate to `http://localhost:5173/auth-test`
- If needed, kill existing server:
  - Windows: `netstat -ano | findstr :5173` then `taskkill /PID <PID> /F`
  - Mac/Linux: `lsof -ti:5173 | xargs kill`

---

## What to Look For (Quality Checklist)

✅ **Magic Link is PRIMARY** (default tab, first option)
✅ **Email/Password is SECONDARY** (second tab)
✅ **Auth UI matches UsernameModal pattern** (backdrop, card, inputs, buttons)
✅ **Blurred preview shows value before friction** (RequireAuth pattern)
✅ **Anonymous mode works** (basic features accessible without account)
✅ **Username migration works** (localStorage → database)
✅ **Session persists** (across reloads and tabs)
✅ **RLS policies enforce security** (users can't access other users' data)
✅ **Error messages are user-friendly** (not technical jargon)
✅ **No TypeScript errors** (strict mode compliance)

---

## Next Steps After Testing

Once testing is complete:

1. **Approve Story 18.0** if all tests pass
2. **Provide feedback** if any issues found
3. **Proceed to Story 18.1** (WLED Device Registry) - now unblocked

---

**Need Help?**
- Check the Dev Agent Record in Story 18.0 file
- Review integration notes in `docs/stories/18.0-user-accounts-mvp.md`
- Check Supabase logs for errors
