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
  // True while register() is running — tells onAuthStateChanged to stand by
  // so the two don't race each other.
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
      setIsLoading(true)

      try {
        const { user: newUser } = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        )

        const profileRef = doc(db, 'profiles', newUser.uid)

        // Check if this is the very first user in the system.
        // The query may fail if Firestore rules don't allow listing profiles —
        // if denied, other profiles must exist, so default to not-first-user.
        let isFirstUser = false
        try {
          const firstUserQuery = query(collection(db, 'profiles'), limit(1))
          const firstUserSnapshot = await getDocs(firstUserQuery)
          isFirstUser = firstUserSnapshot.empty
        } catch {
          isFirstUser = false
        }

        const role: UserRole = isFirstUser ? 'admin' : 'pending'
        const approved = isFirstUser
        const newProfile = buildProfile(newUser, role, approved, {
          fullname,
          position,
          organization: org,
        })

        await setDoc(profileRef, newProfile)

        setUser(newUser)
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
        // While register() is running it manages all state itself — skip here
        // to avoid racing it.
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
          const snap = await getDoc(profileRef)

          if (snap.exists()) {
            setProfile(snap.data() as Profile)
          } else {
            // Profile missing (e.g. created before this fix, or edge-case
            // where register() failed after creating the auth user).
            // Create a basic pending profile so the user at least shows up in
            // the admin approval queue.
            const fallback = buildProfile(authUser, 'pending', false)
            await setDoc(profileRef, fallback)
            setProfile(fallback)
          }
        } catch (error) {
          console.error('Failed to load/create profile:', error)
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
