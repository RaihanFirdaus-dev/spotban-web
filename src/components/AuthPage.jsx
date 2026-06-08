import { useState } from 'react'
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function AuthPage({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'error'|'success', msg }
  const [submitting, setSubmitting] = useState(false)

  const isLogin = mode === 'login'

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setStatus(null)
  }

  function switchMode(m) {
    setMode(m)
    setForm({ name: '', email: '', password: '' })
    setStatus(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)

    if (isLogin) {
      const { error } = await onLogin({ email: form.email, password: form.password })
      if (error) setStatus({ type: 'error', msg: friendlyError(error.message) })
      // sukses → App.jsx otomatis redirect via useAuth session
    } else {
      if (form.password.length < 6) {
        setStatus({ type: 'error', msg: 'Password minimal 6 karakter.' })
        setSubmitting(false)
        return
      }
      const { error } = await onRegister({ email: form.email, password: form.password, name: form.name })
      if (error) {
        setStatus({ type: 'error', msg: friendlyError(error.message) })
      } else {
        setStatus({ type: 'success', msg: 'Akun berhasil dibuat! Silakan login.' })
        switchMode('login')
      }
    }
    setSubmitting(false)
  }

  return (
    <div className="auth-shell">
      {/* Kiri: branding */}
      <div className="auth-brand">
        <div className="auth-brand__inner">
          <div className="auth-brand__logo">🔧</div>
          <h1 className="auth-brand__title">SpotBan</h1>
          <p className="auth-brand__tagline">Temukan tambal ban terdekat dari lokasi Anda, cepat dan mudah.</p>
          <div className="auth-brand__features">
            {['📍 Deteksi lokasi GPS otomatis', '🗺️ Peta interaktif real-time', '🛣️ Rute menuju bengkel', '💰 Bandingkan harga termurah'].map((f) => (
              <div key={f} className="auth-brand__feature">{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Kanan: form */}
      <div className="auth-form-side">
        <div className="auth-card">
          {/* Tab mode */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'auth-tab--active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Masuk
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'auth-tab--active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Daftar
            </button>
          </div>

          <h2 className="auth-card__title">
            {isLogin ? 'Selamat datang kembali' : 'Buat akun baru'}
          </h2>
          <p className="auth-card__sub">
            {isLogin
              ? 'Masuk untuk menemukan bengkel terdekat.'
              : 'Daftar gratis dan mulai temukan tambal ban.'}
          </p>

          {/* Status message */}
          {status && (
            <div className={`auth-alert auth-alert--${status.type}`}>
              {status.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
              <span>{status.msg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Nama — hanya register */}
            {!isLogin && (
              <div className="auth-field">
                <label className="auth-label">Nama Lengkap</label>
                <div className="auth-input-wrap">
                  <User size={15} className="auth-input-icon" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Budi Santoso"
                    required
                    className="auth-input"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <div className="auth-input-wrap">
                <Mail size={15} className="auth-input-icon" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="kamu@email.com"
                  required
                  className="auth-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <Lock size={15} className="auth-input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={isLogin ? '••••••••' : 'Min. 6 karakter'}
                  required
                  className="auth-input auth-input--pass"
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Role badge — hanya register */}
            {!isLogin && (
              <div className="auth-role-badge">
                <span>🛡️</span>
                <span>Akun akan otomatis terdaftar sebagai <strong>USER</strong></span>
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting
                ? <span className="route-spinner" style={{ borderTopColor: '#fff' }} />
                : isLogin ? 'Masuk' : 'Daftar Sekarang'}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <button onClick={() => switchMode(isLogin ? 'register' : 'login')} className="auth-switch__btn">
              {isLogin ? 'Daftar di sini' : 'Masuk'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function friendlyError(msg) {
  if (msg.includes('Invalid login')) return 'Email atau password salah.'
  if (msg.includes('already registered')) return 'Email ini sudah terdaftar.'
  if (msg.includes('Email not confirmed')) return 'Silakan konfirmasi email Anda terlebih dahulu.'
  return msg
}