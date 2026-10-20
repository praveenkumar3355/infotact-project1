
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:3001', {
  autoConnect: false,
  reconnection: true,
  timeout: 5000,
});

function App() {
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [myId, setMyId] = useState('');
  const [position, setPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (!joined) return;

    socket.connect();

    function onConnect() {
      setMyId(socket.id);
    }

    function onPlayersUpdate(list) {
      setPlayers(list);
    }

    function onPlayerJoined(player) {
      setPlayers((current) => {
        if (current.some((p) => p.id === player.id)) return current;
        return [...current, player];
      });
    }

    function onPlayerMoved(player) {
      setPlayers((current) =>
        current.map((p) => p.id === player.id ? player : p)
      );
    }

    function onPlayerLeft(id) {
      setPlayers((current) => current.filter((p) => p.id !== id));
    }

    socket.on('connect', onConnect);
    socket.on('players-update', onPlayersUpdate);
    socket.on('player-joined', onPlayerJoined);
    socket.on('player-moved', onPlayerMoved);
    socket.on('player-left', onPlayerLeft);

    return () => {
      socket.off('connect', onConnect);
      socket.off('players-update', onPlayersUpdate);
      socket.off('player-joined', onPlayerJoined);
      socket.off('player-moved', onPlayerMoved);
      socket.off('player-left', onPlayerLeft);
      socket.disconnect();
    };
  }, [joined]);

  function moveAvatar(event) {
    if (!joined) return;

    const movement = {
      ArrowUp: [0, -5],
      ArrowDown: [0, 5],
      ArrowLeft: [-5, 0],
      ArrowRight: [5, 0],
    }[event.key];

    if (!movement) return;

    event.preventDefault();

    setPosition((current) => {
      const next = {
        x: Math.max(5, Math.min(90, current.x + movement[0])),
        y: Math.max(5, Math.min(90, current.y + movement[1])),
      };

      socket.emit('move', next);
      return next;
    });
  }

  function enterWorkspace() {
    setPosition({ x: 50, y: 50 });
    setJoined(true);
  }

  function leaveWorkspace() {
    socket.disconnect();
    setJoined(false);
    setPlayers([]);
    setMyId('');
  }

  if (!joined) {
    return (
      <div className="app">
        <nav className="navbar">
          <h2 className="logo">ProxiSpeak<span>.</span></h2>
          <span className="online">Virtual office</span>
        </nav>

        <main className="hero">
          <p className="tag">WORK TOGETHER, FROM ANYWHERE</p>
          <h1>Work together.<br /><span>Feel closer.</span></h1>
          <p className="description">
            Join a shared virtual office and connect with
            your teammates in real time.
          </p>
          <button className="join-button" onClick={enterWorkspace}>
            Enter Workspace →
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="office-page">
      <nav className="navbar">
        <h2 className="logo">ProxiSpeak<span>.</span></h2>
        <button className="sign-in" onClick={leaveWorkspace}>
          Leave workspace
        </button>
      </nav>

      <section className="office-header">
        <div>
          <h1>Creative Workspace</h1>
          <p>Use your arrow keys to move around.</p>
        </div>
        <span className="room-status">
          ● {players.length} {players.length === 1 ? 'person' : 'people'} in room
        </span>
      </section>

      <section
        className="office"
        tabIndex={0}
        onKeyDown={moveAvatar}
        aria-label="Virtual office. Use arrow keys to move."
      >
        <div className="desk desk-one">🖥️ <span>Team Desk</span></div>
        <div className="desk desk-two">💻 <span>Focus Zone</span></div>
        <div className="plant plant-one">🪴</div>
        <div className="plant plant-two">🌿</div>

        {players.map((player) => (
          <div
            key={player.id}
            className="player"
            style={{ left: `${player.x}%`, top: `${player.y}%` }}
          >
            <div className="player-avatar">
              {player.id === myId ? '🧑🏻‍💻' : '👩🏻‍💻'}
            </div>
            <span>{player.id === myId ? 'You' : player.name}</span>
          </div>
        ))}

        <div className="office-label">MAIN OFFICE</div>
      </section>

      <div className="office-controls">
        <p><strong>Move around your workspace</strong></p>
        <p>Click inside the office, then use the arrow keys.</p>
        <p>Open another browser tab to test a second participant.</p>
      </div>
    </div>
  );
}

export default App;
