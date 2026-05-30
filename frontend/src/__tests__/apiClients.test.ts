import { describe, it, expect } from 'vitest'
import apiClients from '@/lib/apiClients'

describe('apiClients fallbacks', () => {
  it('fetchProducts fallback returns array', async () => {
    const products = await apiClients.fetchProducts()
    expect(Array.isArray(products)).toBe(true)
  })
})
