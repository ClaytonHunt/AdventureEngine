import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    // If this throws, the component has an unhandled render error
  })

  it('displays the product name heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AdventureEngine')
  })

  it('has the expected landmark regions', () => {
    render(<App />)
    expect(screen.getByRole('banner')).toBeInTheDocument()      // <header>
    expect(screen.getByRole('main')).toBeInTheDocument()        // <main>
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // <footer>
  })
})
