import BottomNav from '../components/BottomNav';

export default function CheckIn() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <div style={{ flex: 1, padding: '40px 24px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <span style={{ fontSize: '48px' }}>🌿</span>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-text-primary)' }}>Daily Check-In</h1>
        <p style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)', textAlign: 'center', maxWidth: '300px' }}>
          Gentle daily reflection. Coming soon.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
