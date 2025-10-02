export type PropertyImage = {
  url: string
  alt: string
  width?: number
  height?: number
}

export interface PropertyLocation {
  address: string
  neighborhood?: string
  city: string
  state?: string
  country: string
  lat?: number
  lng?: number
}

export interface Property {
  id: string
  title: string
  subtitle?: string
  description: string
  price: string
  type: 'Sale' | 'Rent'
  bedrooms: number
  bathrooms: number
  area: string
  yearBuilt?: number
  features?: string[]
  amenities: string[]
  location: PropertyLocation
  images: PropertyImage[]
  coverImage?: string
}
