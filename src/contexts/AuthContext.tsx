import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import {
  doc,
  getDoc,
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
  signInWithGoogle: () => Promise<void>
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
const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({
  prompt: 'select_account',
})

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

  const mergeProfilePayload = useCallback(
    async (authUser: User, payload?: Partial<RegisterPayload>) => {
      if (!payload) {
        return
      }

      const profileRef = doc(db, 'profiles', authUser.uid)
      await setDoc(
        profileRef,
        {
          email: authUser.email ?? '',
          fullname: payload.fullname?.trim() || getDefaultFullname(authUser),
          position: payload.position?.trim() || '-',
          organization: payload.organization?.trim() || '-',
        },
        { merge: true }
      )
    },
    []
  )

  const waitForProfileDocument = useCallback(async (userId: string, attempts = 12, delayMs = 500) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const profileRef = doc(db, 'profiles', userId)
      const profileSnapshot = await getDoc(profileRef)

      if (profileSnapshot.exists()) {
        return profileSnapshot.data() as Profile
      }

      await new Promise<void>((resolve) => {
        setTimeout(resolve, delayMs)
      })
    }

    return null
  }, [])

  const ensureProfile = useCallback(
    async (authUser: User, payload?: Partial<RegisterPayload>): Promise<Profile> => {
      const profileRef = doc(db, 'profiles', authUser.uid)
      const profileSnapshot = await getDoc(profileRef)

      if (profileSnapshot.exists()) {
        await mergeProfilePayload(authUser, payload)
        const updatedProfileSnapshot = await getDoc(profileRef)
        return updatedProfileSnapshot.data() as Profile
      }

      const syncedProfile = await waitForProfileDocument(authUser.uid)
      if (syncedProfile) {
        await mergeProfilePayload(authUser, payload)
        const updatedProfileSnapshot = await getDoc(profileRef)
        return updatedProfileSnapshot.data() as Profile
      }

      const fallbackProfile = buildProfile(authUser, 'pending', false, payload)
      await setDoc(profileRef, fallbackProfile)

      return fallbackProfile
    },
    [mergeProfilePayload, waitForProfileDocument]
  )

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider)
  }, [])

  const register = useCallback(
    async (
      email: string,
      password: string,
      fullname: string,
      position: string,
      org: string
    ) => {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      const authUser = credential.user

      const createdProfile = await ensureProfile(authUser, {
        fullname,
        position,
        organization: org,
      })

      setProfile(createdProfile)
      setUser(authUser)
    },
    [ensureProfile]
  )

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setIsLoading(true)

      try {
        if (!authUser) {
          setUser(null)
          setProfile(null)
          return
        }

        setUser(authUser)
        const userProfile = await ensureProfile(authUser)
        setProfile(userProfile)
      } finally {
        setIsLoading(false)
      }
    })

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
      signInWithGoogle,
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
      signInWithGoogle,
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
