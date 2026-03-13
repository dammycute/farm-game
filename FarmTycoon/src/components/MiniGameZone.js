import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import tw from '../styles';
import gameStore from '../gameEngine';

// ─── Image puzzle config ───────────────────────────────────────────────────────
const PUZZLE_IMAGES = [
  { label: 'Sunny Farm', uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80' },
  { label: 'Chicken Coop', uri: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&q=80' },
  { label: 'Wheat Field', uri: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=80' },
  { label: 'Fresh Eggs', uri: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&q=80' },
];

const GRID_SIZES = [
  { label: '3×3 Easy', rows: 3, cols: 3 },
  { label: '4×4 Medium', rows: 4, cols: 4 },
  { label: '5×5 Hard', rows: 5, cols: 5 },
];

const PUZZLE_SIZE = Dimensions.get('window').width - 64;

// ─── Spin wheel prizes ─────────────────────────────────────────────────────────
const WHEEL_PRIZES = [
  { label: '💰 $200', color: '#22c55e' },
  { label: '⚡ 2x Prod', color: '#3b82f6' },
  { label: '💰 $500', color: '#f59e0b' },
  { label: '😢 Nothing', color: '#94a3b8' },
  { label: '🎪 Festival', color: '#a855f7' },
  { label: '💰 $1000', color: '#ef4444' },
  { label: '📦 50 Eggs', color: '#14b8a6' },
  { label: '⚡ 2x 120s', color: '#6366f1' },
];

// ─── Main component ────────────────────────────────────────────────────────────
export default function MiniGameZone({ gameState }) {
  const [screen, setScreen] = useState('hub');
  const back = useCallback(() => setScreen('hub'), []);

  return (
    <View style={tw`flex-1 bg-backgroundLight`}>
      {screen === 'hub' && <HubScreen gameState={gameState} setScreen={setScreen} />}
      {screen === 'puzzle' && <PuzzleGame onBack={back} />}
      {screen === 'fox' && <FoxGame onBack={back} />}
      {screen === 'tetris' && <TetrisGame onBack={back} />}
      {screen === 'spin' && <SpinWheelGame gameState={gameState} onBack={back} />}
    </View>
  );
}

// ─── Hub ───────────────────────────────────────────────────────────────────────
function HubScreen({ gameState, setScreen }) {
  const games = [
    { id: 'puzzle_image', screen: 'puzzle', icon: '🖼️', name: 'Photo Puzzle', desc: 'Reassemble a real farm photo by swapping tiles', color: '#f97316' },
    { id: 'spin_wheel', screen: 'spin', icon: '🎰', name: 'Lucky Wheel', desc: 'Free spin every 2 min — win cash or boosts!', color: '#a855f7' },
    { id: 'fox_hunter', screen: 'fox', icon: '🦊', name: 'Fox Hunter', desc: 'Tap foxes before they escape the farm', color: '#ef4444' },
    { id: 'tetris_tap', screen: 'tetris', icon: '🟦', name: 'Tetris Tap', desc: 'Drop blocks and clear rows for big rewards', color: '#3b82f6' },
  ];

  return (
    <ScrollView contentContainerStyle={tw`pb-36 px-4 pt-4`}>
      <Text style={tw`text-lg font-black text-slate-900 mb-1`}>Mini-Game Hub</Text>
      <Text style={tw`text-xs text-slate-500 mb-5`}>Play games to earn cash and farm stars.</Text>

      {gameState.spinWheelCooldown > 0 && (
        <View style={tw`bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 mb-4 flex-row items-center gap-2`}>
          <Text style={tw`text-sm`}>🎰</Text>
          <Text style={tw`text-xs font-bold text-purple-700`}>Lucky Wheel ready in {gameState.spinWheelCooldown}s</Text>
        </View>
      )}

      {games.map(g => {
        const mgData = gameState.miniGames?.find(x => x.id === g.id);
        const plays = gameState.miniGameProgress?.[g.id] || 0;
        const isSpinReady = g.id === 'spin_wheel' && gameState.spinWheelCooldown === 0;

        if (!mgData?.unlocked) {
          return (
            <View key={g.id} style={[tw`bg-slate-50 rounded-2xl p-4 border border-slate-300 mb-3 flex-row items-center gap-4`, { opacity: 0.6 }]}>
              <View style={tw`w-14 h-14 rounded-xl bg-slate-200 items-center justify-center`}>
                <Text style={tw`text-3xl`}>{g.icon}</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-sm font-black text-slate-600`}>{g.name}</Text>
                <Text style={tw`text-xs text-slate-400 mt-0.5`}>{g.desc}</Text>
              </View>
              <TouchableOpacity
                onPress={() => gameStore.unlockMiniGame(g.id)}
                style={tw`bg-amber-500 px-3 py-2 rounded-xl`}
              >
                <Text style={tw`text-xs font-black text-white`}>${mgData?.price?.toLocaleString()}</Text>
              </TouchableOpacity>
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={g.id}
            onPress={() => setScreen(g.screen)}
            style={tw`bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-3 flex-row items-center gap-4`}
          >
            <View style={[tw`w-14 h-14 rounded-xl items-center justify-center`, { backgroundColor: g.color + '22' }]}>
              <Text style={tw`text-3xl`}>{g.icon}</Text>
            </View>
            <View style={tw`flex-1`}>
              <View style={tw`flex-row items-center gap-2 mb-0.5`}>
                <Text style={tw`text-sm font-black text-slate-800`}>{g.name}</Text>
                {isSpinReady && (
                  <View style={tw`bg-green-100 px-2 py-0.5 rounded-full`}>
                    <Text style={tw`text-xs font-black text-green-700`}>READY</Text>
                  </View>
                )}
              </View>
              <Text style={tw`text-xs text-slate-500`}>{g.desc}</Text>
              <Text style={tw`text-xs font-bold text-slate-400 mt-1`}>Played {plays}×</Text>
            </View>
            <View style={[tw`w-8 h-8 rounded-full items-center justify-center`, { backgroundColor: g.color }]}>
              <Text style={tw`text-white font-black text-xs`}>▶</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={tw`mt-4 bg-white rounded-2xl p-4 border border-slate-200`}>
        <Text style={tw`text-xs font-black text-slate-800 mb-3`}>ACHIEVEMENTS</Text>
        {[
          { id: 'puzzle_image', label: 'Puzzle Master', icon: '🖼️' },
          { id: 'spin_wheel', label: 'Lucky Spinner', icon: '🎰' },
          { id: 'fox_hunter', label: 'Fox Hunter Pro', icon: '🦊' },
          { id: 'tetris_tap', label: 'Block Wizard', icon: '🟦' },
        ].map(a => (
          <View key={a.id} style={tw`flex-row justify-between items-center mb-2`}>
            <Text style={tw`text-xs text-slate-600`}>{a.icon} {a.label}</Text>
            <Text style={tw`text-xs font-black text-primary`}>×{gameState.miniGameAchievements?.[a.id] || 0}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Real Image Puzzle ─────────────────────────────────────────────────────────
function PuzzleGame({ onBack }) {
  const [phase, setPhase] = useState('config');
  const [imageIdx, setImageIdx] = useState(0);
  const [gridSize, setGridSize] = useState(GRID_SIZES[0]);
  const [tiles, setTiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const solvedRef = useRef(false); // track solved inside setTiles updater safely
  const elapsedRef = useRef(0);
  const movesRef = useRef(0);

  const totalTiles = gridSize.rows * gridSize.cols;
  const tileSize = PUZZLE_SIZE / gridSize.cols;

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startPuzzle = () => {
    solvedRef.current = false;
    elapsedRef.current = 0;
    movesRef.current = 0;
    const order = Array.from({ length: totalTiles }, (_, i) => i);
    let shuffled;
    do {
      shuffled = [...order];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    } while (shuffled.every((v, i) => v === i));

    setTiles(shuffled);
    setSelected(null);
    setMoves(0);
    setElapsed(0);
    setPhase('playing');
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      elapsedRef.current++;
      setElapsed(elapsedRef.current);
    }, 1000);
  };

  const tapTile = (idx) => {
    if (phase !== 'playing') return;
    if (selected === null) {
      setSelected(idx);
      return;
    }
    if (selected === idx) {
      setSelected(null);
      return;
    }

    const first = selected;
    setSelected(null);
    movesRef.current++;
    setMoves(movesRef.current);

    setTiles(prev => {
      const next = [...prev];
      [next[first], next[idx]] = [next[idx], next[first]];
      if (!solvedRef.current && next.every((v, i) => v === i)) {
        solvedRef.current = true;
        setTimeout(() => {
          if (timerRef.current) clearInterval(timerRef.current);
          const score = Math.max(0, 300 - elapsedRef.current - movesRef.current * 2);
          gameStore.awardMiniGame('puzzle_image', score);
          setPhase('solved');
        }, 0);
      }
      return next;
    });
  };

  const renderTile = (tileIdx, posIdx) => {
    const sourceRow = Math.floor(tileIdx / gridSize.cols);
    const sourceCol = tileIdx % gridSize.cols;
    const isSelected = selected === posIdx;

    return (
      <TouchableOpacity
        key={posIdx}
        onPress={() => tapTile(posIdx)}
        style={{
          width: tileSize - 2,
          height: tileSize - 2,
          margin: 1,
          overflow: 'hidden',
          borderRadius: 4,
          borderWidth: isSelected ? 3 : 1,
          borderColor: isSelected ? '#3b82f6' : 'rgba(255,255,255,0.3)',
        }}
      >
        <Image
          source={{ uri: PUZZLE_IMAGES[imageIdx].uri }}
          style={{
            width: PUZZLE_SIZE,
            height: PUZZLE_SIZE,
            position: 'absolute',
            top: -sourceRow * tileSize,
            left: -sourceCol * tileSize,
          }}
          resizeMode="cover"
        />
        {movesRef.current < 3 && (
          <View style={{ position: 'absolute', top: 2, left: 2, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 3, paddingHorizontal: 3 }}>
            <Text style={{ fontSize: 8, color: '#fff', fontWeight: '900' }}>{tileIdx + 1}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (phase === 'config') return (
    <ScrollView contentContainerStyle={tw`px-4 pt-4 pb-36`}>
      <View style={tw`flex-row items-center gap-3 mb-6`}>
        <TouchableOpacity onPress={onBack} style={tw`w-8 h-8 bg-slate-100 rounded-full items-center justify-center`}>
          <Text style={tw`text-slate-600 font-black`}>←</Text>
        </TouchableOpacity>
        <Text style={tw`text-lg font-black text-slate-900`}>Photo Puzzle</Text>
      </View>

      <Text style={tw`text-xs font-black text-slate-500 mb-3`}>CHOOSE IMAGE</Text>
      <View style={tw`flex-row flex-wrap gap-2 mb-6`}>
        {PUZZLE_IMAGES.map((img, i) => (
          <TouchableOpacity key={i} onPress={() => setImageIdx(i)}>
            <Image source={{ uri: img.uri }} style={{ width: 80, height: 60, borderRadius: 10, borderWidth: imageIdx === i ? 3 : 0, borderColor: '#ec5b13' }} resizeMode="cover" />
            <Text style={tw`text-center text-xs font-bold text-slate-500 mt-1`}>{img.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={tw`text-xs font-black text-slate-500 mb-3`}>GRID SIZE</Text>
      <View style={tw`flex-col gap-2 mb-8`}>
        {GRID_SIZES.map((g, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setGridSize(g)}
            style={[
              tw`flex-row items-center justify-between bg-white rounded-xl px-4 py-3`,
              { borderWidth: 2, borderColor: gridSize === g ? '#ec5b13' : '#e2e8f0' },
            ]}
          >
            <Text style={[tw`text-sm font-black`, { color: gridSize === g ? '#ec5b13' : '#334155' }]}>{g.label}</Text>
            <Text style={tw`text-xs font-bold text-slate-400`}>{g.rows * g.cols} tiles</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={startPuzzle} style={tw`bg-primary py-4 rounded-2xl items-center`}>
        <Text style={tw`text-white font-black text-base`}>Start Puzzle 🧩</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (phase === 'solved') return (
    <View style={tw`flex-1 items-center justify-center px-6`}>
      <Text style={tw`text-6xl mb-4`}>🎉</Text>
      <Text style={tw`text-2xl font-black text-slate-800 mb-2`}>Puzzle Solved!</Text>
      <Text style={tw`text-sm text-slate-500 mb-6 text-center`}>{moves} moves · {elapsed}s · {PUZZLE_IMAGES[imageIdx].label}</Text>
      <Image source={{ uri: PUZZLE_IMAGES[imageIdx].uri }} style={{ width: PUZZLE_SIZE, height: PUZZLE_SIZE, borderRadius: 16, marginBottom: 24 }} resizeMode="cover" />
      <TouchableOpacity onPress={() => setPhase('config')} style={tw`w-full bg-primary py-4 rounded-2xl items-center mb-3`}>
        <Text style={tw`text-white font-black`}>Play Again</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onBack} style={tw`w-full bg-slate-100 py-3 rounded-2xl items-center`}>
        <Text style={tw`text-slate-600 font-bold`}>Back to Hub</Text>
      </TouchableOpacity>
    </View>
  );

  // Playing
  return (
    <View style={tw`flex-1 px-4 pt-4`}>
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <TouchableOpacity onPress={onBack} style={tw`w-8 h-8 bg-slate-100 rounded-full items-center justify-center`}>
          <Text style={tw`text-slate-600 font-black`}>←</Text>
        </TouchableOpacity>
        <Text style={tw`text-sm font-black text-slate-700`}>{PUZZLE_IMAGES[imageIdx].label}</Text>
        <View style={tw`flex-row gap-3`}>
          <Text style={tw`text-xs font-bold text-slate-500`}>⏱ {elapsed}s</Text>
          <Text style={tw`text-xs font-bold text-slate-500`}>🔀 {moves}</Text>
        </View>
      </View>

      <View style={tw`flex-row items-center gap-3 mb-4 bg-white border border-slate-200 rounded-xl p-2`}>
        <Image source={{ uri: PUZZLE_IMAGES[imageIdx].uri }} style={{ width: 48, height: 48, borderRadius: 8 }} resizeMode="cover" />
        <Text style={tw`text-xs text-slate-500 flex-1`}>Tap one tile, then tap another to swap. Match the reference image ↑</Text>
      </View>

      <View style={{ alignSelf: 'center', width: PUZZLE_SIZE, flexDirection: 'row', flexWrap: 'wrap' }}>
        {tiles.map((tileIdx, posIdx) => renderTile(tileIdx, posIdx))}
      </View>
    </View>
  );
}

// ─── Fox Hunter ────────────────────────────────────────────────────────────────
function FoxGame({ onBack }) {
  const DURATION = 30;
  const [phase, setPhase] = useState('ready');
  const [foxPos, setFoxPos] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timer, setTimer] = useState(DURATION);
  // Refs so interval callbacks always read current values
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Award once when phase becomes 'done' — NOT inside the interval
  useEffect(() => {
    if (phase === 'done') {
      const score = hitsRef.current * 20 - missesRef.current * 5;
      gameStore.awardMiniGame('fox_hunter', Math.max(0, score));
    }
  }, [phase]);

  const start = () => {
    hitsRef.current = 0;
    missesRef.current = 0;
    setHits(0);
    setMisses(0);
    setTimer(DURATION);
    setFoxPos(Math.floor(Math.random() * 9));
    setPhase('playing');

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setFoxPos(Math.floor(Math.random() * 9));
      setTimer(t => {
        const next = t - 1;
        if (next <= 0) {
          clearInterval(intervalRef.current);
          // setTimeout keeps phase change outside the render cycle
          setTimeout(() => setPhase('done'), 0);
          return 0;
        }
        return next;
      });
    }, 1200);
  };

  const tapCell = (idx) => {
    if (phase !== 'playing') return;
    if (idx === foxPos) {
      hitsRef.current++;
      setHits(hitsRef.current);
    } else {
      missesRef.current++;
      setMisses(missesRef.current);
    }
  };

  if (phase === 'done') return (
    <View style={tw`flex-1 items-center justify-center px-6`}>
      <Text style={tw`text-6xl mb-4`}>🦊</Text>
      <Text style={tw`text-2xl font-black text-slate-800 mb-1`}>Time's Up!</Text>
      <Text style={tw`text-slate-500 mb-6`}>Caught {hits} foxes · {misses} missed</Text>
      <TouchableOpacity onPress={start} style={tw`w-full bg-primary py-4 rounded-2xl items-center mb-3`}>
        <Text style={tw`text-white font-black`}>Play Again</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onBack} style={tw`w-full bg-slate-100 py-3 rounded-2xl items-center`}>
        <Text style={tw`text-slate-600 font-bold`}>Back to Hub</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={tw`flex-1 px-4 pt-4`}>
      <View style={tw`flex-row items-center justify-between mb-5`}>
        <TouchableOpacity onPress={onBack} style={tw`w-8 h-8 bg-slate-100 rounded-full items-center justify-center`}>
          <Text style={tw`font-black text-slate-600`}>←</Text>
        </TouchableOpacity>
        <Text style={tw`text-sm font-black text-slate-700`}>Fox Hunter</Text>
        {phase === 'playing'
          ? <Text style={tw`text-sm font-black text-red-500`}>{timer}s</Text>
          : <View style={tw`w-8`} />
        }
      </View>

      {phase === 'ready' ? (
        <View style={tw`flex-1 items-center justify-center gap-4`}>
          <Text style={tw`text-5xl`}>🦊</Text>
          <Text style={tw`text-base font-black text-slate-700 text-center`}>Tap the fox before it moves!</Text>
          <Text style={tw`text-xs text-slate-500 text-center`}>+20pts per hit · −5pts per miss · 30 seconds</Text>
          <TouchableOpacity onPress={start} style={tw`bg-red-500 px-10 py-4 rounded-2xl`}>
            <Text style={tw`text-white font-black text-base`}>Start!</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={tw`flex-row justify-between mb-4 bg-white rounded-xl border border-slate-200 px-4 py-3`}>
            <Text style={tw`font-black text-green-600`}>✅ {hits} caught</Text>
            <Text style={tw`font-black text-red-400`}>❌ {misses} missed</Text>
          </View>
          <View style={tw`flex-row flex-wrap justify-between gap-y-2`}>
            {Array.from({ length: 9 }).map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => tapCell(idx)}
                style={tw`w-[31%] h-24 bg-green-100 border border-green-200 rounded-2xl items-center justify-center`}
              >
                <Text style={tw`text-4xl`}>{idx === foxPos ? '🦊' : '🌿'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ─── Tetris Tap ────────────────────────────────────────────────────────────────
const COLS = 8;
const ROWS = 10;
const emptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

const TETROMINOES = [
  {
    id: 'I', color: '#06b6d4',
    rotations: [
      [[0,1],[1,1],[2,1],[3,1]],
      [[2,0],[2,1],[2,2],[2,3]],
      [[0,2],[1,2],[2,2],[3,2]],
      [[1,0],[1,1],[1,2],[1,3]],
    ],
  },
  {
    id: 'O', color: '#f59e0b',
    rotations: [
      [[1,0],[2,0],[1,1],[2,1]],
      [[1,0],[2,0],[1,1],[2,1]],
      [[1,0],[2,0],[1,1],[2,1]],
      [[1,0],[2,0],[1,1],[2,1]],
    ],
  },
  {
    id: 'T', color: '#8b5cf6',
    rotations: [
      [[1,0],[0,1],[1,1],[2,1]],
      [[1,0],[1,1],[2,1],[1,2]],
      [[0,1],[1,1],[2,1],[1,2]],
      [[1,0],[0,1],[1,1],[1,2]],
    ],
  },
  {
    id: 'L', color: '#ef4444',
    rotations: [
      [[1,0],[1,1],[1,2],[2,2]],
      [[0,1],[1,1],[2,1],[0,2]],
      [[0,0],[1,0],[1,1],[1,2]],
      [[2,0],[0,1],[1,1],[2,1]],
    ],
  },
  {
    id: 'J', color: '#22c55e',
    rotations: [
      [[1,0],[1,1],[1,2],[0,2]],
      [[0,0],[0,1],[1,1],[2,1]],
      [[2,0],[1,0],[1,1],[1,2]],
      [[0,1],[1,1],[2,1],[2,2]],
    ],
  },
  {
    id: 'S', color: '#f43f5e',
    rotations: [
      [[1,0],[2,0],[0,1],[1,1]],
      [[1,0],[1,1],[2,1],[2,2]],
      [[1,1],[2,1],[0,2],[1,2]],
      [[0,0],[0,1],[1,1],[1,2]],
    ],
  },
  {
    id: 'Z', color: '#0ea5e9',
    rotations: [
      [[0,0],[1,0],[1,1],[2,1]],
      [[2,0],[1,1],[2,1],[1,2]],
      [[0,1],[1,1],[1,2],[2,2]],
      [[1,0],[0,1],[1,1],[0,2]],
    ],
  },
];

function TetrisGame({ onBack }) {
  const DURATION = 40;
  const [phase, setPhase] = useState('ready');
  const [grid, setGrid] = useState(emptyGrid());
  const [cleared, setCleared] = useState(0);
  const [timer, setTimer] = useState(DURATION);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(() => TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)]);
  const [pieceX, setPieceX] = useState(2);
  const [pieceY, setPieceY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const clearedRef = useRef(0);
  const gravityRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (gravityRef.current) clearInterval(gravityRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;

    if (gravityRef.current) clearInterval(gravityRef.current);
    gravityRef.current = setInterval(() => {
      handleDown();
    }, 700);

    return () => {
      if (gravityRef.current) clearInterval(gravityRef.current);
    };
  }, [phase]);

  // Award once when done
  useEffect(() => {
    if (phase === 'done') {
      gameStore.awardMiniGame('tetris_tap', clearedRef.current * 40);
    }
  }, [phase]);

  const randomPiece = () => TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];

  const canPlace = (piece, x, y, rot, board) => {
    if (!piece) return false;
    const cells = piece.rotations[rot];
    return cells.every(([cx, cy]) => {
      const px = x + cx;
      const py = y + cy;
      if (px < 0 || px >= COLS || py < 0 || py >= ROWS) return false;
      return board[py][px] === 0;
    });
  };

  const mergePiece = (piece, x, y, rot, board) => {
    const next = board.map(row => [...row]);
    piece.rotations[rot].forEach(([cx, cy]) => {
      const px = x + cx;
      const py = y + cy;
      if (py >= 0 && py < ROWS && px >= 0 && px < COLS) next[py][px] = 1;
    });
    return next;
  };

  const clearRows = board => {
    const remaining = board.filter(row => !row.every(cell => cell === 1));
    const rowsCleared = ROWS - remaining.length;
    if (rowsCleared === 0) return { board, rowsCleared: 0 };
    const newBoard = [...Array.from({ length: rowsCleared }, () => Array(COLS).fill(0)), ...remaining];
    return { board: newBoard, rowsCleared };
  };

  const spawnPiece = () => {
    const next = nextPiece || randomPiece();
    const startX = Math.floor(COLS / 2) - 2;
    if (!canPlace(next, startX, 0, 0, grid)) {
      setPhase('done');
      return;
    }

    setCurrentPiece(next);
    setNextPiece(randomPiece());
    setPieceX(startX);
    setPieceY(0);
    setRotation(0);
  };

  const lockPiece = () => {
    if (!currentPiece) return;

    setGrid(prev => {
      const withPiece = mergePiece(currentPiece, pieceX, pieceY, rotation, prev);
      const { board: clearedGrid, rowsCleared } = clearRows(withPiece);
      if (rowsCleared > 0) {
        clearedRef.current += rowsCleared;
        setCleared(clearedRef.current);
      }
      return clearedGrid;
    });

    setCurrentPiece(null);
    setTimeout(spawnPiece, 0);
  };

  const handleDown = () => {
    if (phase !== 'playing' || !currentPiece) return;
    if (canPlace(currentPiece, pieceX, pieceY + 1, rotation, grid)) {
      setPieceY(prev => prev + 1);
    } else {
      lockPiece();
    }
  };

  const movePiece = dx => {
    if (phase !== 'playing' || !currentPiece) return;
    const nx = pieceX + dx;
    if (canPlace(currentPiece, nx, pieceY, rotation, grid)) setPieceX(nx);
  };

  const rotatePiece = () => {
    if (phase !== 'playing' || !currentPiece) return;
    const nextRot = (rotation + 1) % 4;
    if (canPlace(currentPiece, pieceX, pieceY, nextRot, grid)) setRotation(nextRot);
  };

  const hardDrop = () => {
    if (phase !== 'playing' || !currentPiece) return;
    let y = pieceY;
    while (canPlace(currentPiece, pieceX, y + 1, rotation, grid)) y++;
    setPieceY(y);
    setTimeout(lockPiece, 10);
  };

  const start = () => {
    clearedRef.current = 0;
    setGrid(emptyGrid());
    setCleared(0);
    setTimer(DURATION);
    setPhase('playing');
    setCurrentPiece(null);
    setNextPiece(randomPiece());

    if (gravityRef.current) clearInterval(gravityRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setTimeout(() => spawnPiece(), 0);

    timerRef.current = setInterval(() => {
      setTimer(t => {
        const next = t - 1;
        if (next <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (gravityRef.current) clearInterval(gravityRef.current);
          setTimeout(() => setPhase('done'), 0);
          return 0;
        }
        return next;
      });
    }, 1000);
  };

  if (phase === 'done') return (
    <View style={tw`flex-1 items-center justify-center px-6`}>
      <Text style={tw`text-6xl mb-4`}>🟦</Text>
      <Text style={tw`text-2xl font-black text-slate-800 mb-1`}>Time's Up!</Text>
      <Text style={tw`text-slate-500 mb-6`}>You cleared {cleared} rows</Text>
      <TouchableOpacity onPress={start} style={tw`w-full bg-primary py-4 rounded-2xl items-center mb-3`}>
        <Text style={tw`text-white font-black`}>Play Again</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onBack} style={tw`w-full bg-slate-100 py-3 rounded-2xl items-center`}>
        <Text style={tw`text-slate-600 font-bold`}>Back to Hub</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={tw`flex-1 px-4 pt-4`}>
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <TouchableOpacity onPress={onBack} style={tw`w-8 h-8 bg-slate-100 rounded-full items-center justify-center`}>
          <Text style={tw`font-black text-slate-600`}>←</Text>
        </TouchableOpacity>
        <Text style={tw`text-sm font-black text-slate-700`}>Tetris Tap</Text>
        {phase === 'playing'
          ? <Text style={tw`text-sm font-black text-red-500`}>{timer}s</Text>
          : <View style={tw`w-8`} />
        }
      </View>

      {phase === 'ready' ? (
        <View style={tw`flex-1 items-center justify-center gap-4`}>
          <Text style={tw`text-5xl`}>🟦</Text>
          <Text style={tw`text-base font-black text-slate-700 text-center`}>Real Tetris mode: move, rotate, and lock pieces.</Text>
          <Text style={tw`text-xs text-slate-500 text-center px-4`}>Use controls to guide falling tetrominoes. Clear rows for points.</Text>
          <TouchableOpacity onPress={start} style={tw`bg-blue-500 px-10 py-4 rounded-2xl`}>
            <Text style={tw`text-white font-black text-base`}>Start!</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={tw`flex-1 items-center`}>
          <View style={tw`flex-row justify-between w-full mb-3 bg-white border border-slate-200 rounded-xl px-4 py-2`}>
            <Text style={tw`font-black text-blue-600`}>Rows: {cleared}</Text>
            <Text style={tw`font-black text-slate-500`}>{timer}s left</Text>
          </View>

          <View style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
            {grid.map((row, r) => (
              <View key={r} style={{ flexDirection: 'row' }}>
                {row.map((cell, c) => {
                  let active = cell;
                  if (currentPiece) {
                    currentPiece.rotations[rotation].forEach(([cx, cy]) => {
                      if (pieceY + cy === r && pieceX + cx === c) active = 2;
                    });
                  }
                  const colors = [ '#f1f5f9', '#0ea5e9', '#22c55e' ];
                  return (
                    <View
                      key={c}
                      style={{
                        width: 30,
                        height: 18,
                        margin: 1,
                        borderRadius: 2,
                        backgroundColor: active === 0 ? '#f1f5f9' : active === 1 ? '#ec5b13' : '#3b82f6',
                      }}
                    />
                  );
                })}
              </View>
            ))}
          </View>

          <View style={tw`w-full flex-row justify-between items-center mb-3 px-2`}>
            <View style={tw`bg-white border border-slate-200 rounded-xl p-2`}> 
              <Text style={tw`text-xs text-slate-500 mb-1`}>Next</Text>
              <View style={{ width: 80, height: 80, backgroundColor: '#f8fafc', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                {nextPiece && nextPiece.rotations[0].map(([cx, cy], idx) => (
                  <View key={idx} style={{ position: 'absolute', left: 8 + cx * 16, top: 8 + cy * 16, width: 14, height: 14, borderRadius: 2, backgroundColor: nextPiece.color }} />
                ))}
              </View>
            </View>
            <View style={tw`flex-row gap-2`}>
              <TouchableOpacity onPress={() => movePiece(-1)} style={tw`bg-slate-200 px-4 py-3 rounded-xl`}><Text>◀</Text></TouchableOpacity>
              <TouchableOpacity onPress={rotatePiece} style={tw`bg-slate-200 px-4 py-3 rounded-xl`}><Text>⟳</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => movePiece(1)} style={tw`bg-slate-200 px-4 py-3 rounded-xl`}><Text>▶</Text></TouchableOpacity>
              <TouchableOpacity onPress={hardDrop} style={tw`bg-blue-500 px-4 py-3 rounded-xl`}><Text style={tw`text-white`}>▼</Text></TouchableOpacity>
            </View>
          </View>

          <Text style={tw`text-xs text-slate-400`}>Piece falls automatically. Clear full rows to score more.</Text>
        </View>
      )}
    </View>
  );
}

// ─── Spin Wheel ────────────────────────────────────────────────────────────────
function SpinWheelGame({ onBack, gameState }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [highlightIdx, setHighlightIdx] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const spin = () => {
    if (spinning || (gameState.spinWheelCooldown || 0) > 0) return;
    setResult(null);
    setSpinning(true);

    let ticks = 0;
    const totalTicks = 20 + Math.floor(Math.random() * 8);
    let idx = 0;
    let speed = 80;

    const tick = () => {
      idx = (idx + 1) % WHEEL_PRIZES.length;
      setHighlightIdx(idx);
      ticks++;
      if (ticks < totalTicks) {
        if (ticks > totalTicks - 5) speed += 70;
        timeoutRef.current = setTimeout(tick, speed);
      } else {
        const prize = gameStore.spinWheel();
        setHighlightIdx(null);
        if (prize) setResult(prize);
        setSpinning(false);
      }
    };
    timeoutRef.current = setTimeout(tick, speed);
  };

  const cooldown = gameState.spinWheelCooldown || 0;

  return (
    <View style={tw`flex-1 px-4 pt-4`}>
      <View style={tw`flex-row items-center justify-between mb-6`}>
        <TouchableOpacity onPress={onBack} style={tw`w-8 h-8 bg-slate-100 rounded-full items-center justify-center`}>
          <Text style={tw`font-black text-slate-600`}>←</Text>
        </TouchableOpacity>
        <Text style={tw`text-sm font-black text-slate-700`}>Lucky Wheel</Text>
        <View style={tw`w-8`} />
      </View>

      {/* Prize grid */}
      <View style={tw`bg-white border border-slate-200 rounded-2xl p-4 mb-6`}>
        <View style={tw`flex-row flex-wrap justify-between gap-2`}>
          {WHEEL_PRIZES.map((p, i) => {
            const isLit = highlightIdx === i;
            return (
              <View
                key={i}
                style={[
                  tw`rounded-xl py-3 items-center`,
                  {
                    width: '48%',
                    backgroundColor: isLit ? p.color : p.color + '22',
                    borderWidth: 2,
                    borderColor: isLit ? p.color : 'transparent',
                  }
                ]}
              >
                <Text style={[tw`text-sm font-black`, { color: isLit ? '#fff' : '#334155' }]}>{p.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {result && (
        <View style={tw`bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 items-center`}>
          <Text style={tw`text-2xl mb-1`}>🎉</Text>
          <Text style={tw`text-base font-black text-amber-800`}>{result.label}</Text>
          <Text style={tw`text-xs text-amber-600 mt-1`}>Reward applied to your farm!</Text>
        </View>
      )}

      <TouchableOpacity
        onPress={spin}
        disabled={spinning || cooldown > 0}
        style={[
          tw`w-full py-5 rounded-2xl items-center`,
          { backgroundColor: spinning || cooldown > 0 ? '#e2e8f0' : '#ec5b13' },
        ]}
      >
        {cooldown > 0
          ? <Text style={tw`font-black text-slate-500`}>⏳ Next spin in {cooldown}s</Text>
          : spinning
            ? <Text style={tw`font-black text-white text-lg`}>🎰 Spinning...</Text>
            : <Text style={tw`font-black text-white text-lg`}>🎰 SPIN!</Text>
        }
      </TouchableOpacity>

      <Text style={tw`text-center text-xs text-slate-400 mt-3`}>Free spin every 2 minutes</Text>
    </View>
  );
}