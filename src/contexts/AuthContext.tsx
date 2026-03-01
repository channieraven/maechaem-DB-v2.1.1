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
  // Holds the registration payload so onAuthStateChanged can pick it up once,
  // preventing the race condition between register() and onAuthStateChanged().
  const pendingPayloadRef = useRef<Partial<RegisterPayload> | null>(null)

  const ensureProfile = useCallback(
    async (authUser: User, payload?: Partial<RegisterPayload>): Promise<Profile> => {
      const profileRef = doc(db, 'profiles', authUser.uid)
      const profileSnapshot = await getDoc(profileRef)

      if (profileSnapshot.exists()) {
        return profileSnapshot.data() as Profile
      }

      const firstUserQuery = query(collection(db, 'profiles'), limit(1))
      const firstUserSnapshot = await getDocs(firstUserQuery)
      const isFirstUser = firstUserSnapshot.empty

      const role: UserRole = isFirstUser ? 'admin' : 'pending'
      const approved = isFirstUser
      const newProfile = buildProfile(authUser, role, approved, payload)

      await setDoc(profileRef, newProfile)

      return newProfile
    },
    []
  )

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
      // Store payload before creating the user so that onAuthStateChanged
      // can consume it and create the profile exactly once, eliminating the
      // race condition where both register() and onAuthStateChanged() would
      // call ensureProfile() concurrently and potentially assign 'pending' role
      // to the first user.
      pendingPayloadRef.current = { fullname, position, organization: org }
      await createUserWithEmailAndPassword(auth, email, password)
      // Profile creation is handled by the onAuthStateChanged callback below.
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
        setIsLoading(true)

        try {
          if (!authUser) {
            setUser(null)
            setProfile(null)
            return
          }

          // Consume the registration payload exactly once. Any subsequent fires
          // of onAuthStateChanged (e.g. token refresh) will pass undefined,
          // causing ensureProfile to simply return the already-created profile.
          const payload = pendingPayloadRef.current ?? undefined
          pendingPayloadRef.current = null

          setUser(authUser)
          const userProfile = await ensureProfile(authUser, payload)
          setProfile(userProfile)
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
  }, [ensureProfile])

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
