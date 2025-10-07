import React from 'react';

interface LobbyProps {
  onSitDown: (tableId: string, seat: number) => void;
}

const tables = [
  { id: '1', name: 'Neon Holdem', stakes: '1k/2k', players: 4, maxPlayers: 6, penetration: 75 },
  { id: '2', name: 'River of Dreams', stakes: '5k/10k', players: 2, maxPlayers: 6, penetration: 40 },
  { id: '3', name: 'All-in Arena', stakes: '10k/20k', players: 6, maxPlayers: 6, penetration: 90 },
  { id: '4', name: 'Diamond VIP', stakes: '50k/100k', players: 3, maxPlayers: 6, penetration: 60 },
  { id: '5', name: 'Midnight Express', stakes: '2k/4k', players: 5, maxPlayers: 6, penetration: 85 },
  { id: '6', name: 'High Roller', stakes: '100k/200k', players: 1, maxPlayers: 6, penetration: 20 },
];

const Lobby: React.FC<LobbyProps> = ({ onSitDown }) => {
  const handleJoinTable = (e: React.MouseEvent, tableId: string) => {
    e.preventDefault();
    console.log('handleJoinTable called for table:', tableId);
    onSitDown(tableId, 0);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-auto" style={{ background: '#000000' }}>
      
      {/* ⬡🔥 EPIC HEXAGONAL BLOCKCHAIN BACKGROUND 🔥⬡ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        
        {/* Base hexagon grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexGrid" width="150" height="130" patternUnits="userSpaceOnUse">
              <path 
                d="M75,0 L112.5,21.65 L112.5,64.95 L75,86.6 L37.5,64.95 L37.5,21.65 Z" 
                stroke="rgba(6, 182, 212, 0.15)" 
                strokeWidth="1.5" 
                fill="none"
              />
            </pattern>
            <filter id="hexGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexGrid)" />
        </svg>

        {/* Animated pulsing hexagons - Layer 1 (Cyan) */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`cyan-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: '150px',
              height: '130px',
              animation: `hexPulse ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: 0,
            }}
          >
            <svg viewBox="0 0 150 130" className="w-full h-full">
              <path 
                d="M75,0 L112.5,21.65 L112.5,64.95 L75,86.6 L37.5,64.95 L37.5,21.65 Z" 
                stroke="rgba(6, 182, 212, 0.8)" 
                strokeWidth="2.5" 
                fill="rgba(6, 182, 212, 0.05)"
                filter="url(#hexGlow)"
              />
            </svg>
          </div>
        ))}

        {/* Animated pulsing hexagons - Layer 2 (Purple) */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`purple-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: '150px',
              height: '130px',
              animation: `hexPulse ${4 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
              opacity: 0,
            }}
          >
            <svg viewBox="0 0 150 130" className="w-full h-full">
              <path 
                d="M75,0 L112.5,21.65 L112.5,64.95 L75,86.6 L37.5,64.95 L37.5,21.65 Z" 
                stroke="rgba(168, 85, 247, 0.7)" 
                strokeWidth="2.5" 
                fill="rgba(168, 85, 247, 0.04)"
                filter="url(#hexGlow)"
              />
            </svg>
          </div>
        ))}

        {/* ♠️♥️♦️♣️ FLOATING CARD SUITS ♠️♥️♦️♣️ */}
        {[
          { suit: '♠', color: 'rgba(6, 182, 212, 0.3)', delay: 0, duration: 15 },
          { suit: '♥', color: 'rgba(236, 72, 153, 0.3)', delay: 2, duration: 18 },
          { suit: '♦', color: 'rgba(168, 85, 247, 0.3)', delay: 4, duration: 20 },
          { suit: '♣', color: 'rgba(6, 182, 212, 0.25)', delay: 6, duration: 17 },
          { suit: '♠', color: 'rgba(168, 85, 247, 0.25)', delay: 8, duration: 19 },
          { suit: '♥', color: 'rgba(236, 72, 153, 0.25)', delay: 10, duration: 16 },
          { suit: '♦', color: 'rgba(6, 182, 212, 0.2)', delay: 12, duration: 21 },
          { suit: '♣', color: 'rgba(168, 85, 247, 0.2)', delay: 14, duration: 18 },
        ].map((item, i) => (
          <div
            key={`suit-${i}`}
            className="absolute text-6xl sm:text-7xl lg:text-8xl font-bold"
            style={{
              left: `${(i * 12.5) % 100}%`,
              top: `${((i * 23) % 80) + 10}%`,
              color: item.color,
              textShadow: `0 0 30px ${item.color}, 0 0 60px ${item.color}`,
              animation: `cardSuitFloat ${item.duration}s ease-in-out infinite`,
              animationDelay: `${item.delay}s`,
              opacity: 0,
              transform: 'rotate(0deg)',
            }}
          >
            {item.suit}
          </div>
        ))}

        {/* 🎴 FLOATING CARD BACK PATTERNS 🎴 */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`card-${i}`}
            className="absolute w-16 h-24 sm:w-20 sm:h-28 lg:w-24 lg:h-36 rounded-lg border-2"
            style={{
              left: `${(i * 16 + 5) % 90}%`,
              top: `${((i * 27) % 70) + 15}%`,
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(168, 85, 247, 0.1))',
              borderColor: i % 2 === 0 ? 'rgba(6, 182, 212, 0.3)' : 'rgba(168, 85, 247, 0.3)',
              boxShadow: `0 0 20px ${i % 2 === 0 ? 'rgba(6, 182, 212, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`,
              backdropFilter: 'blur(10px)',
              animation: `cardBackFloat ${18 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 3}s`,
              opacity: 0,
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <img 
                src="/shido-logo.png" 
                alt="" 
                className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain opacity-30"
              />
            </div>
          </div>
        ))}

        {/* Large background hexagons with depth */}
        <div className="absolute top-1/4 left-1/4 w-[300px] sm:w-[350px] lg:w-[400px] h-[260px] sm:h-[300px] lg:h-[350px] opacity-10" 
             style={{ animation: 'hexFloat 20s ease-in-out infinite' }}>
          <svg viewBox="0 0 150 130" className="w-full h-full">
            <path 
              d="M75,0 L112.5,21.65 L112.5,64.95 L75,86.6 L37.5,64.95 L37.5,21.65 Z" 
              stroke="rgba(6, 182, 212, 0.3)" 
              strokeWidth="3" 
              fill="none"
              style={{ filter: 'drop-shadow(0 0 30px rgba(6, 182, 212, 0.4))' }}
            />
          </svg>
        </div>
        <div className="absolute top-2/3 right-1/4 w-[280px] sm:w-[320px] lg:w-[350px] h-[240px] sm:h-[275px] lg:h-[300px] opacity-10" 
             style={{ animation: 'hexFloat 25s ease-in-out infinite', animationDelay: '5s' }}>
          <svg viewBox="0 0 150 130" className="w-full h-full">
            <path 
              d="M75,0 L112.5,21.65 L112.5,64.95 L75,86.6 L37.5,64.95 L37.5,21.65 Z" 
              stroke="rgba(168, 85, 247, 0.3)" 
              strokeWidth="3" 
              fill="none"
              style={{ filter: 'drop-shadow(0 0 30px rgba(168, 85, 247, 0.4))' }}
            />
          </svg>
        </div>

        {/* Blockchain connection lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          {[...Array(8)].map((_, i) => {
            const x1 = Math.random() * 100;
            const y1 = Math.random() * 100;
            const x2 = Math.random() * 100;
            const y2 = Math.random() * 100;
            return (
              <line
                key={`line-${i}`}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke={i % 2 === 0 ? 'rgba(6, 182, 212, 0.2)' : 'rgba(168, 85, 247, 0.2)'}
                strokeWidth="1"
                strokeDasharray="5,10"
                style={{
                  animation: `dashFlow ${8 + Math.random() * 4}s linear infinite`,
                }}
              />
            );
          })}
        </svg>

        {/* Radial glow overlays */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] sm:w-[1000px] lg:w-[1200px] h-[500px] sm:h-[650px] lg:h-[800px] bg-cyan-500/5 rounded-full blur-[100px] sm:blur-[130px] lg:blur-[150px] animate-pulse pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[750px] lg:w-[900px] h-[400px] sm:h-[500px] lg:h-[600px] bg-purple-500/5 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px] animate-pulse pointer-events-none" 
             style={{ animationDelay: '2s' }}></div>
      </div>

      {/* MAIN CONTENT */}
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pt-24 sm:pt-28 lg:pt-32 relative" style={{ zIndex: 1 }}>
        {/* 💎 NEON HEADER 💎 */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 relative">
          {/* Background glow effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] lg:w-[800px] h-[150px] sm:h-[225px] lg:h-[300px] bg-cyan-500/20 blur-[80px] sm:blur-[100px] lg:blur-[120px] animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[450px] lg:w-[600px] h-[100px] sm:h-[150px] lg:h-[200px] bg-purple-500/20 blur-[60px] sm:blur-[80px] lg:blur-[100px] animate-pulse" 
               style={{ animationDelay: '1s' }}></div>
          
          {/* Shido Logo - 50% SMALLER PADDING - RESPONSIVE */}
          <div className="flex justify-center mb-4 sm:mb-6 lg:mb-8">
            <img src="/shido-logo.png" alt="Shido" className="w-[108px] h-[108px] sm:w-[162px] sm:h-[162px] lg:w-[216px] lg:h-[216px] object-contain drop-shadow-[0_0_40px_rgba(6,182,212,1)] sm:drop-shadow-[0_0_50px_rgba(6,182,212,1)] lg:drop-shadow-[0_0_60px_rgba(6,182,212,1)] animate-pulse" />
          </div>
          
          {/* POKER Title - RESPONSIVE */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <h2 className="text-4xl sm:text-6xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 relative inline-block tracking-wider" 
                style={{ 
                  textShadow: '0 0 40px rgba(6, 182, 212, 1), 0 0 80px rgba(168, 85, 247, 0.8)',
                  WebkitTextStroke: '1px rgba(6, 182, 212, 0.4)',
                  filter: 'drop-shadow(0 0 15px rgba(6, 182, 212, 0.8))'
                }}>
              POKER
            </h2>
          </div>
          
          {/* SELECT YOUR TABLE - RESPONSIVE */}
          <div className="relative inline-block mt-2 sm:mt-3 lg:mt-4">
            <div className="absolute inset-0 bg-cyan-500/20 blur-xl sm:blur-2xl"></div>
            <p className="text-sm sm:text-xl lg:text-2xl font-bold uppercase tracking-[0.25em] sm:tracking-[0.3em] lg:tracking-[0.35em] relative px-6 sm:px-9 lg:px-12 py-2 sm:py-3 lg:py-4 border-t-2 border-b-2 border-cyan-500/60"
               style={{ 
                 textShadow: '0 0 20px rgba(6, 182, 212, 1)',
                 background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.15), transparent)'
               }}>
              <span className="text-cyan-400">SELECT YOUR TABLE</span>
            </p>
            {/* Corner accents - RESPONSIVE */}
            <div className="absolute top-0 left-0 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 border-t-2 border-r-2 border-cyan-400"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 border-b-2 border-l-2 border-cyan-400"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 border-b-2 border-r-2 border-cyan-400"></div>
          </div>
        </div>
        {/* 🎴 TABLE GRID - CYBERPUNK GLASS CARDS - RESPONSIVE 🎴 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {tables.map(table => (
            <div 
              key={table.id} 
              className="group relative p-4 sm:p-5 lg:p-6 flex flex-col justify-between transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 sm:hover:-translate-y-3 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(6, 182, 212, 0.05) 50%, rgba(0, 0, 0, 0.95) 100%)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(6, 182, 212, 0.3)',
                boxShadow: '0 0 30px rgba(6, 182, 212, 0.2), inset 0 0 30px rgba(6, 182, 212, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = '2px solid rgba(6, 182, 212, 0.8)';
                e.currentTarget.style.boxShadow = '0 0 50px rgba(6, 182, 212, 0.6), 0 0 100px rgba(168, 85, 247, 0.3), inset 0 0 50px rgba(6, 182, 212, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '2px solid rgba(6, 182, 212, 0.3)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(6, 182, 212, 0.2), inset 0 0 30px rgba(6, 182, 212, 0.05)';
              }}
            >
              {/* Corner accents - RESPONSIVE */}
              <div className="absolute top-0 left-0 w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 border-t-2 border-l-2 border-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-0 right-0 w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 border-t-2 border-r-2 border-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 border-b-2 border-l-2 border-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 border-b-2 border-r-2 border-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Animated scan line */}
              <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan"></div>
              </div>
              
              {/* Table Name - RESPONSIVE */}
              <h3 className="font-black text-xl sm:text-2xl lg:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400 group-hover:from-cyan-200 group-hover:to-pink-400 mb-3 sm:mb-4 transition-all duration-300" 
                  style={{ textShadow: '0 0 15px rgba(6, 182, 212, 0.8)' }}>
                {table.name}
              </h3>
              
              {/* Stats Grid - RESPONSIVE */}
              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                {/* Stakes */}
                <div className="flex justify-between items-center py-2 sm:py-3 border-b-2 border-cyan-500/30 group-hover:border-cyan-500/60 transition-all duration-300">
                  <span className="text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] text-cyan-400/60 font-bold">STAKES</span>
                  <span className="font-black text-base sm:text-lg text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] sm:drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">{table.stakes}</span>
                </div>
                
                {/* Players */}
                <div className="flex justify-between items-center py-2 sm:py-3 border-b-2 border-purple-500/30 group-hover:border-purple-500/60 transition-all duration-300">
                  <span className="text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] text-purple-400/60 font-bold">PLAYERS</span>
                  <span className="font-black text-base sm:text-lg text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] sm:drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">{table.players}/{table.maxPlayers}</span>
                </div>
                
                {/* Activity Bar - RESPONSIVE */}
                <div className="py-2 sm:py-3">
                  <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                    <span className="text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] text-pink-400/60 font-bold">ACTIVITY</span>
                    <span className="text-[10px] sm:text-xs font-bold text-pink-400">{table.penetration}%</span>
                  </div>
                  <div className="w-full bg-black border-2 border-cyan-500/40 rounded-sm h-2.5 sm:h-3 overflow-hidden relative group-hover:border-cyan-500/70 transition-all duration-300">
                    <div 
                      className="h-full relative"
                      style={{ 
                        width: `${table.penetration}%`,
                        background: 'linear-gradient(90deg, #06b6d4, #a855f7, #ec4899, #06b6d4)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s linear infinite',
                        boxShadow: '0 0 15px rgba(6, 182, 212, 0.6)'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* JACK IN Button - RESPONSIVE */}
              <button
                onClick={(e) => handleJoinTable(e, table.id)}
                className="relative w-full py-3 sm:py-4 px-4 sm:px-6 font-black text-sm sm:text-base lg:text-lg uppercase tracking-[0.2em] sm:tracking-[0.25em] lg:tracking-[0.3em] transition-all duration-300 overflow-hidden group-hover:tracking-[0.25em] sm:group-hover:tracking-[0.3em] lg:group-hover:tracking-[0.35em]"
                style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(168, 85, 247, 0.2))',
                  border: '2px solid rgba(6, 182, 212, 0.6)',
                  boxShadow: '0 0 15px rgba(6, 182, 212, 0.4), inset 0 0 15px rgba(6, 182, 212, 0.1)',
                  color: '#06b6d4',
                  textShadow: '0 0 8px rgba(6, 182, 212, 0.8)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(168, 85, 247, 0.3))';
                  e.currentTarget.style.border = '2px solid rgba(6, 182, 212, 1)';
                  e.currentTarget.style.boxShadow = '0 0 40px rgba(6, 182, 212, 0.8), inset 0 0 30px rgba(6, 182, 212, 0.2)';
                  e.currentTarget.style.color = '#22d3ee';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(168, 85, 247, 0.2))';
                  e.currentTarget.style.border = '2px solid rgba(6, 182, 212, 0.6)';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.4), inset 0 0 15px rgba(6, 182, 212, 0.1)';
                  e.currentTarget.style.color = '#06b6d4';
                }}
              >
                {/* Corner accents on button - RESPONSIVE */}
                <div className="absolute top-0 left-0 w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 border-t-2 border-l-2 border-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 border-t-2 border-r-2 border-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 border-b-2 border-l-2 border-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 border-b-2 border-r-2 border-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">// JACK IN //</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
