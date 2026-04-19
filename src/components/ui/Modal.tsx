'use client'

import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const closedByHistory = useRef(false)

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Botón de retroceso del celular
  useEffect(() => {
    if (!open) return

    history.pushState({ modal: true }, '')

    const handlePopState = () => {
      closedByHistory.current = true
      onClose()
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      // Si se cerró por X o backdrop (no por back), limpiar el estado del historial
      if (!closedByHistory.current && history.state?.modal) {
        history.back()
      }
      closedByHistory.current = false
    }
  }, [open, onClose])

  if (!open) return null
  if (typeof window === 'undefined') return null

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* flex col para que el header sea sticky y el contenido scrollee */}
      <div
        className={`relative bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]} flex flex-col max-h-[90vh]`}
      >
        {/* Header siempre visible */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 pr-4 truncate">{title}</h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Contenido scrolleable */}
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )

  return ReactDOM.createPortal(content, document.body)
}

export default Modal
