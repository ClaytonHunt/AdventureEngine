import '@/styles/reset.css'
import '@/styles/tokens.css'

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-primary)',
            fontSize: '1.5rem',
            fontWeight: 700,
          }}
        >
          AdventureEngine
        </h1>
      </header>
      <main style={{ flex: 1, padding: 'var(--space-8)' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Sprint 2 scaffold — features coming in Sprint 3.
        </p>
      </main>
      <footer
        style={{
          padding: 'var(--space-4)',
          borderTop: '1px solid var(--color-border)',
          color: 'var(--color-text-secondary)',
          fontSize: '0.875rem',
        }}
      >
        AdventureEngine &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}

export default App
