import React from 'react';

export default function App() {
  return (
    <div style={{
      background: '#0a0805',
      color: '#c9922a',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'serif'
    }}>
      <h1 style={{ fontSize: '3rem' }}>SCHLEIER & DUNKEL</h1>
      <p style={{ color: '#a89070', fontStyle: 'italic' }}>
        Zwei Armeen. Ein Knotennetz. Niemand sieht den Plan des anderen.
      </p>
      <p style={{ color: '#6b5540', marginTop: '2rem' }}>
        🚧 In Entwicklung 🚧
      </p>
    </div>
  );
}