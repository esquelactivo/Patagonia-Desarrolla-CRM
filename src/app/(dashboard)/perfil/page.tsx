'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  avatar?: string | null
  createdAt?: string
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ name: '', email: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', password: '', confirmPassword: '' })
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data: UserProfile = await res.json()
        setProfile(data)
        setForm({ name: data.name, email: data.email })
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email }),
      })
      if (res.ok) {
        const updated = await res.json()
        setProfile(updated)
        showToast('success', 'Perfil actualizado correctamente')
      } else {
        showToast('error', 'Error al actualizar el perfil')
      }
    } catch {
      showToast('error', 'Error al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePassword = async () => {
    if (passwordForm.password !== passwordForm.confirmPassword) {
      showToast('error', 'Las contraseñas no coinciden')
      return
    }
    if (passwordForm.password.length < 6) {
      showToast('error', 'La contraseña debe tener al menos 6 caracteres')
      return
    }
    setSavingPassword(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          password: passwordForm.password,
        }),
      })
      if (res.ok) {
        setPasswordForm({ currentPassword: '', password: '', confirmPassword: '' })
        showToast('success', 'Contraseña actualizada correctamente')
      } else {
        const data = await res.json()
        showToast('error', data.error || 'Error al cambiar la contraseña')
      }
    } catch {
      showToast('error', 'Error al cambiar la contraseña')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 500 * 1024) {
      showToast('error', 'La imagen debe pesar menos de 500 KB')
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string
      try {
        const res = await fetch('/api/auth/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: base64 }),
        })
        if (res.ok) {
          const updated = await res.json()
          setProfile(updated)
          showToast('success', 'Foto actualizada')
        } else {
          showToast('error', 'Error al actualizar la foto')
        }
      } catch {
        showToast('error', 'Error al actualizar la foto')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: null }),
      })
      if (res.ok) {
        const updated = await res.json()
        setProfile(updated)
        showToast('success', 'Foto eliminada')
      }
    } catch { /* ignore */ }
  }

  const initial = profile?.name?.charAt(0).toUpperCase() || 'A'
  const roleLabel: Record<string, string> = { ADMIN: 'Administrador', AGENT: 'Agente' }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Cargando...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.msg}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900">Mi Perfil</h2>
        <p className="text-sm text-gray-500">Administrá tu cuenta y configuración</p>
      </div>

      {/* Avatar section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Foto de perfil</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center flex-shrink-0">
              {profile?.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-3xl font-semibold">{initial}</span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{profile?.name}</p>
            <p className="text-sm text-gray-500">{roleLabel[profile?.role || ''] || profile?.role}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Cambiar foto
              </button>
              {profile?.avatar && (
                <>
                  <span className="text-gray-300">·</span>
                  <button onClick={handleRemoveAvatar} className="text-xs text-red-500 hover:underline font-medium">
                    Eliminar
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG o WebP · Máx. 500 KB</p>
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Datos personales</h3>
        <div className="space-y-4">
          <Input
            label="Nombre completo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Tu nombre"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="tu@email.com"
          />
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} loading={saving}>
              Guardar cambios
            </Button>
          </div>
        </div>
      </div>

      {/* Password change */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Cambiar contraseña</h3>
        <div className="space-y-4">
          <Input
            label="Contraseña actual"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            placeholder="••••••••"
          />
          <Input
            label="Nueva contraseña"
            type="password"
            value={passwordForm.password}
            onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
            placeholder="••••••••"
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            placeholder="••••••••"
          />
          <div className="flex justify-end">
            <Button onClick={handleSavePassword} loading={savingPassword}>
              Cambiar contraseña
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
