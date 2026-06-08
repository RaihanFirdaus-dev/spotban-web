import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

/**
 * Mengelola state autentikasi Supabase.
 * - session: objek sesi aktif (null = belum login)
 * - user: data user dari sesi
 * - loading: true saat pertama kali cek sesi
 */
export function useAuth() {
  const [session, setSession] = useState(undefined) // undefined = belum dicek
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Ambil sesi yang sudah ada (misal setelah refresh halaman)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Dengarkan perubahan sesi (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async ({ email, password, name }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: 'USER', // role otomatis USER saat register
        },
      },
    })
    return { data, error }
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    session,
    user: session?.user ?? null,
    role: session?.user?.user_metadata?.role ?? null,
    loading,
    signUp,
    signIn,
    signOut,
  }
}