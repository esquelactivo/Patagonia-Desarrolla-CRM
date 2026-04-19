export type PropertyType = 'CASA' | 'DEPARTAMENTO' | 'OFICINA' | 'LOCAL' | 'TERRENO' | 'COCHERA'
export type PropertyOperation = 'VENTA' | 'ALQUILER' | 'ALQUILER_TEMP'
export type PropertyStatus = 'DISPONIBLE' | 'RESERVADA' | 'VENDIDA' | 'ALQUILADA' | 'INACTIVA'

export type ContactType = 'COMPRADOR' | 'VENDEDOR' | 'INQUILINO' | 'PROPIETARIO'

export type InquiryStatus = 'NUEVA' | 'CONTACTADA' | 'CALIFICADA' | 'DESCARTADA'

export type DealStage = 'VISITA' | 'OFERTA' | 'RESERVA' | 'CIERRE'
export type DealStatus = 'ACTIVA' | 'GANADA' | 'PERDIDA'

export type ActivityType = 'VISITA' | 'LLAMADA' | 'REUNION' | 'SEGUIMIENTO'

export type CampaignType = 'NEWSLETTER' | 'FLYER'
export type CampaignStatus = 'BORRADOR' | 'ENVIADA' | 'PROGRAMADA'

export interface Property {
  id: string
  title: string
  description?: string | null
  type: string
  operation: string
  status: string
  price: number
  currency: string
  address: string
  city: string
  neighborhood?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  area?: number | null
  images: string[]
  features: string[]
  userId: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Contact {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  type: string
  notes?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Inquiry {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  message?: string | null
  source?: string | null
  channel?: string | null
  adName?: string | null
  formId?: string | null
  city?: string | null
  province?: string | null
  propertyId?: string | null
  contactId?: string | null
  status: string
  createdAt: Date | string
  updatedAt: Date | string
  property?: Property | null
  contact?: Contact | null
}

export interface Deal {
  id: string
  title: string
  contactId: string
  propertyId?: string | null
  stage: string
  status: string
  value?: number | null
  notes?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  contact?: Contact | null
  property?: Property | null
}

export interface Activity {
  id: string
  title: string
  type: string
  date: Date | string
  done: boolean
  notes?: string | null
  contactId?: string | null
  propertyId?: string | null
  dealId?: string | null
  userId: string
  createdAt: Date | string
  contact?: Contact | null
  property?: Property | null
}

export interface Campaign {
  id: string
  title: string
  type: string
  subject?: string | null
  content?: string | null
  status: string
  sentAt?: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
  recipients?: CampaignRecipient[]
}

export interface CampaignRecipient {
  id: string
  campaignId: string
  contactId: string
  sentAt?: Date | string | null
  opened: boolean
  clicked: boolean
  contact?: Contact
}
