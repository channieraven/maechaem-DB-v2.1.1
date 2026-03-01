import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { Profile, UserRole } from '../lib/database.types'

type RegisterPayload = {
  fullname: string
  position: string
  organization: string
}

type AuthContextValue = {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isApproved: boolean
  role: UserRole | null
  canWrite: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    email: string,
    password: string,
    fullname: string,
    position: string,
    org: string
  ) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const WRITER_ROLES: UserRole[] = ['staff', 'researcher', 'admin']

function getDefaultFullname(user: User): string {
  if (user.displayName && user.displayName.trim().length > 0) {
    return user.displayName
  }

  if (user.email) {
    return user.email.split('@')[0]
  }

  return 'Unknown User'
}

function buildProfile(
  user: User,
  role: UserRole,
  approved: boolean,
  payload?: Partial<RegisterPayload>
): Profile {
  return {
    id: user.uid,
    email: user.email ?? '',
    fullname: payload?.fullname?.trim() || getDefaultFullname(user),
    position: payload?.position?.trim() || '-',
    organization: payload?.organization?.trim() || '-',
    role,
    approved,
    created_at: new Date().toISOString(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // True while register() is running. Prevents onAuthStateChanged from
  // racing to create the profile at the same time.
  const registeringRef = useRef(false)

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const register = useCallback(
    async (
      email: string,
      password: string,
      fullname: string,
      position: string,
      org: string
    ) => {
      registeringRef.current = true
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        const authUser = credential.user

        // Check if this is the very first user. The query may be denied by
        // Firestore rules — if so, other profiles already exist, so default false.
        let isFirstUser = false
        try {
          const snap = await getDocs(query(collection(db, 'profiles'), limit(1)))
          isFirstUser = snap.empty
        } catch {
          isFirstUser = false
        }

        const role: UserRole = isFirstUser ? 'admin' : 'pending'
        const newProfile = buildProfile(authUser, role, isFirstUser, {
          fullname,
          position,
          organization: org,
        })

        // Any setDoc failure will propagate as an error visible in RegisterForm.
        await setDoc(doc(db, 'profiles', authUser.uid), newProfile)

        setUser(authUser)
        setProfile(newProfile)
      } finally {
        registeringRef.current = false
        setIsLoading(false)
      }
    },
    []
  )

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (authUser) => {
        // register() handles its own state updates — skip to avoid a race where
        // onAuthStateChanged fires before setDoc completes and creates a profile
        // with wrong data (or fails trying).
        if (registeringRef.current) return

        setIsLoading(true)

        try {
          if (!authUser) {
            setUser(null)
            setProfile(null)
            return
          }

          setUser(authUser)

          const profileRef = doc(db, 'profiles', authUser.uid)
          const snapshot = await getDoc(profileRef)

          if (snapshot.exists()) {
            setProfile(snapshot.data() as Profile)
          } else {
            // Fallback for users who exist in Firebase Auth but have no Firestore
            // profile (e.g. registered before this logic was added). A simple
            // setDoc is enough — no transaction needed since onAuthStateChanged
            // only fires for the current authenticated user.
            const fallback = buildProfile(authUser, 'pending', false)
            await setDoc(profileRef, fallback)
            setProfile(fallback)
          }
        } catch (error) {
          console.error('Failed to load/create profile:', error)
          // Keep user set so they stay authenticated. Profile remains null
          // which triggers the pending-approval redirect. A page reload retries.
        } finally {
          setIsLoading(false)
        }
      },
      (error) => {
        // Firebase SDK calls this when the persisted token is invalid or expired
        // (e.g. accounts:lookup returns 400). Sign out to clear the bad token
        // from local storage so the SDK stops retrying it.
        console.error('Auth state error:', error)
        signOut(auth).catch(() => {})
        setUser(null)
        setProfile(null)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const role = profile?.role ?? null
  const isApproved = Boolean(profile?.approved)
  const isAdmin = role === 'admin'
  const canWrite = isApproved && role !== null && WRITER_ROLES.includes(role)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isLoading,
      isApproved,
      role,
      canWrite,
      isAdmin,
      login,
      register,
      logout,
      resetPassword,
    }),
    [
      user,
      profile,
      isLoading,
      isApproved,
      role,
      canWrite,
      isAdmin,
      login,
      register,
      logout,
      resetPassword,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
