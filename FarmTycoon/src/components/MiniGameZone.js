import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import tw from '../styles';
import gameStore from '../gameEngine';

// ─── Image puzzle config ───────────────────────────────────────────────────────
// Real farm-themed images from Unsplash (free, no auth required)
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

const PUZZLE_SIZE = Dimensions.get('window').width - 64; // fits in card with padding

// ─── Spin wheel config ─────────────────────────────────────────────────────────
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
  const [screen, setScreen] = useState('hub'); // hub | puzzle | fox | tetris | spin

  const back = () => setScreen('hub');

  return (
    <View style={tw`flex-1 bg-backgroundLight`}>
      {screen === 'hub' && <HubScreen gameState={gameState} setScreen={setScreen} />}
      {screen === 'puzzle' && <PuzzleGame gameState={gameState} onBack={back} />}
      {screen === 'fox' && <FoxGame gameState={gameState} onBack={back} />}
      {screen === 'tetris' && <TetrisGame gameState={gameState} onBack={back} />}
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
      <Text style={tw`text-[11px] text-slate-500 mb-5`}>Play games to earn cash and farm stars.</Text>

      {/* Spin wheel cooldown banner */}
      {gameState.spinWheelCooldown > 0 && (
        <View style={tw`bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 mb-4 flex-row items-center gap-2`}>
          <Text style={tw`text-sm`}>🎰</Text>
          <Text style={tw`text-[11px] font-bold text-purple-700`}>Lucky Wheel ready in {gameState.spinWheelCooldown}s</Text>
        </View>
      )}

      {games.map(g => {
        const mgData = gameState.miniGames?.find(x => x.id === g.id);
        const plays = gameState.miniGameProgress?.[g.id] || 0;
        const isReady = g.id === 'spin_wheel' ? gameState.spinWheelCooldown === 0 : true;

        if (!mgData?.unlocked) {
          return (
            <View key={g.id} style={tw`bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-300 mb-3 flex-row items-center gap-4 opacity-60`}>
              <View style={tw`w-14 h-14 rounded-xl bg-slate-200 items-center justify-center`}>
                <Text style={tw`text-3xl`}>{g.icon}</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-sm font-black text-slate-600`}>{g.name}</Text>
                <Text style={tw`text-[10px] text-slate-400 mt-0.5`}>{g.desc}</Text>
              </View>
              <TouchableOpacity
                onPress={() => gameStore.unlockMiniGame(g.id)}
                style={tw`bg-amber-500 px-3 py-2 rounded-xl`}
              >
                <Text style={tw`text-[10px] font-black text-white`}>${mgData?.price?.toLocaleString()}</Text>
              </TouchableOpacity>
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={g.id}
            onPress={() => setScreen(g.screen)}
            style={tw`bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-3 flex-row items-center gap-4 active:scale-[0.98]`}
          >
            <View style={[tw`w-14 h-14 rounded-xl items-center justify-center`, { backgroundColor: g.color + '18' }]}>
              <Text style={tw`text-3xl`}>{g.icon}</Text>
            </View>
            <View style={tw`flex-1`}>
              <View style={tw`flex-row items-center gap-2 mb-0.5`}>
                <Text style={tw`text-sm font-black text-slate-800`}>{g.name}</Text>
                {isReady && g.id === 'spin_wheel' && (
                  <View style={tw`bg-green-100 px-2 py-0.5 rounded-full`}>
                    <Text style={tw`text-[9px] font-black text-green-700`}>READY</Text>
                  </View>
                )}
              </View>
              <Text style={tw`text-[10px] text-slate-500`}>{g.desc}</Text>
              <Text style={tw`text-[9px] font-bold text-slate-400 mt-1 uppercase`}>Played {plays}×</Text>
            </View>
            <View style={[tw`w-8 h-8 rounded-full items-center justify-center`, { backgroundColor: g.color }]}>
              <Text style={tw`text-white font-black text-xs`}>▶</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Achievements */}
      <View style={tw`mt-4 bg-white rounded-2xl p-4 border border-slate-200`}>
        <Text style={tw`text-xs font-black text-slate-800 mb-3 uppercase tracking-wider`}>Achievements</Text>
        {[
          { id: 'puzzle_image', label: 'Puzzle Master', icon: '🖼️' },
          { id: 'spin_wheel', label: 'Lucky Spinner', icon: '🎰' },
          { id: 'fox_hunter', label: 'Fox Hunter Pro', icon: '🦊' },
          { id: 'tetris_tap', label: 'Block Wizard', icon: '🟦' },
        ].map(a => (
          <View key={a.id} style={tw`flex-row justify-between items-center mb-2`}>
            <Text style={tw`text-[11px] text-slate-600`}>{a.icon} {a.label}</Text>
            <Text style={tw`text-[11px] font-black text-primary`}>×{gameState.miniGameAchievements?.[a.id] || 0}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Real Image Puzzle ─────────────────────────────────────────────────────────
function PuzzleGame({ onBack }) {
  const [phase, setPhase] = useState('config'); // config | playing | solved
  const [imageIdx, setImageIdx] = useState(0);
  const [gridSize, setGridSize] = useState(GRID_SIZES[0]);
  const [tiles, setTiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  const tileSize = PUZZLE_SIZE / gridSize.cols;
  const totalTiles = gridSize.rows * gridSize.cols;

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startPuzzle = () => {
    // Create solved order, then shuffle
    const order = Array.from({ length: totalTiles }, (_, i) => i);
    // Fisher-Yates shuffle, ensure not already solved
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
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  const tapTile = (idx) => {
    if (phase !== 'playing') return;
    if (selected === null) { setSelected(idx); return; }
    if (selected === idx) { setSelected(null); return; }

    const newTiles = [...tiles];
    [newTiles[selected], newTiles[idx]] = [newTiles[idx], newTiles[selected]];
    setTiles(newTiles);
    setSelected(null);
    setMoves(m => m + 1);

    // Check solved
    if (newTiles.every((v, i) => v === i)) {
      clearInterval(timerRef.current);
      setPhase('solved');
      // Score: faster + fewer moves = higher score
      const score = Math.max(0, 300 - elapsed - moves * 2);
      gameStore.awardMiniGame('puzzle_image', score);
    }
  };

  // Render a single tile — shows a cropped region of the full image
  const renderTile = (tileIdx, positionInGrid) => {
    const sourceRow = Math.floor(tileIdx / gridSize.cols);
    const sourceCol = tileIdx % gridSize.cols;
    const isSelected = selected === positionInGrid;
    const isCorrect = tiles[positionInGrid] === positionInGrid;

    return (
      <TouchableOpacity
        key={positionInGrid}
        onPress={() => tapTile(positionInGrid)}
        style={[
          {
            width: tileSize - 2,
            height: tileSize - 2,
            margin: 1,
            overflow: 'hidden',
            borderRadius: 4,
            borderWidth: isSelected ? 3 : (phase === 'solved' && isCorrect ? 2 : 1),
            borderColor: isSelected ? '#3b82f6' : (phase === 'solved' ? '#22c55e' : '#ffffff30'),
          }
        ]}
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
        {/* Tile number hint (small, fades out after a few moves) */}
        {moves < 3 && (
          <View style={tw`absolute top-0.5 left-0.5 bg-black/40 rounded px-1`}>
            <Text style={tw`text-[8px] font-black text-white`}>{tileIdx + 1}</Text>
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

      <Text style={tw`text-xs font-black text-slate-500 uppercase tracking-wider mb-3`}>Choose Image</Text>
      <View style={tw`flex-row flex-wrap gap-2 mb-6`}>
        {PUZZLE_IMAGES.map((img, i) => (
          <TouchableOpacity key={i} onPress={() => setImageIdx(i)} style={tw`relative`}>
            <Image source={{ uri: img.uri }} style={[tw`rounded-xl`, { width: 80, height: 60 }]} resizeMode="cover" />
            <View style={[tw`absolute inset-0 rounded-xl border-4`, { borderColor: imageIdx === i ? '#ec5b13' : 'transparent' }]} />
            <Text style={tw`text-center text-[9px] font-bold text-slate-500 mt-1`}>{img.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={tw`text-xs font-black text-slate-500 uppercase tracking-wider mb-3`}>Grid Size</Text>
      <View style={tw`flex-col gap-2 mb-8`}>
        {GRID_SIZES.map((g, i) => (
          <TouchableOpacity key={i} onPress={() => setGridSize(g)} style={tw`flex-row items-center justify-between bg-white border-2 ${gridSize === g ? 'border-primary' : 'border-slate-200'} rounded-xl px-4 py-3`}>
            <Text style={tw`text-sm font-black ${gridSize === g ? 'text-primary' : 'text-slate-700'}`}>{g.label}</Text>
            <Text style={tw`text-[10px] font-bold text-slate-400`}>{g.rows * g.cols} tiles</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={startPuzzle} style={tw`bg-primary py-4 rounded-2xl items-center shadow-lg`}>
        <Text style={tw`text-white font-black text-base`}>Start Puzzle 🧩</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (phase === 'solved') return (
    <View style={tw`flex-1 items-center justify-center px-6`}>
      <Text style={tw`text-6xl mb-4`}>🎉</Text>
      <Text style={tw`text-2xl font-black text-slate-800 mb-2`}>Puzzle Solved!</Text>
      <Text style={tw`text-[13px] text-slate-500 mb-6 text-center`}>
        {moves} moves · {elapsed}s · {PUZZLE_IMAGES[imageIdx].label}
      </Text>
      {/* Show completed image */}
      <Image source={{ uri: PUZZLE_IMAGES[imageIdx].uri }} style={[tw`rounded-2xl mb-6`, { width: PUZZLE_SIZE, height: PUZZLE_SIZE }]} resizeMode="cover" />
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
      {/* Header */}
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <TouchableOpacity onPress={onBack} style={tw`w-8 h-8 bg-slate-100 rounded-full items-center justify-center`}>
          <Text style={tw`text-slate-600 font-black`}>←</Text>
        </TouchableOpacity>
        <Text style={tw`text-sm font-black text-slate-700`}>{PUZZLE_IMAGES[imageIdx].label}</Text>
        <View style={tw`flex-row gap-3`}>
          <Text style={tw`text-[11px] font-bold text-slate-500`}>⏱ {elapsed}s</Text>
          <Text style={tw`text-[11px] font-bold text-slate-500`}>🔀 {moves}</Text>
        </View>
      </View>

      {/* Hint: reference image (small) */}
      <View style={tw`flex-row items-center gap-3 mb-4 bg-white border border-slate-200 rounded-xl p-2`}>
        <Image source={{ uri: PUZZLE_IMAGES[imageIdx].uri }} style={{ width: 48, height: 48, borderRadius: 8 }} resizeMode="cover" />
        <Text style={tw`text-[11px] text-slate-500 flex-1`}>Tap one tile, then another to swap them. Match the reference image ↑</Text>
      </View>

      {/* Puzzle grid */}
      <View style={[tw`self-center`, { width: PUZZLE_SIZE, flexDirection: 'row', flexWrap: 'wrap' }]}>
        {tiles.map((tileIdx, positionInGrid) => renderTile(tileIdx, positionInGrid))}
      </View>
    </View>
  );
}

// ─── Fox Hunter ────────────────────────────────────────────────────────────────
function FoxGame({ onBack }) {
  const DURATION = 30;
  const [phase, setPhase] = useState('ready'); // ready | playing | done
  const [foxPos, setFoxPos] = useState(null);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timer, setTimer] = useState(DURATION);
  const intervalRef = useRef(null);

  const start = () => {
    setHits(0); setMisses(0); setTimer(DURATION);
    setFoxPos(Math.floor(Math.random() * 9));
    setPhase('playing');
    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(intervalRef.current); setPhase('done'); return 0; }
        return t - 1;
      });
      setFoxPos(Math.floor(Math.random() * 9));
    }, 1200);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const tapCell = (idx) => {
    if (phase !== 'playing') return;
    if (idx === foxPos) setHits(h => h + 1);
    else setMisses(m => m + 1);
  };

  if (phase === 'done') {
    const score = hits * 20 - misses * 5;
    gameStore.awardMiniGame('fox_hunter', Math.max(0, score));
    return (
      <View style={tw`flex-1 items-center justify-center px-6`}>
        <Text style={tw`text-6xl mb-4`}>🦊</Text>
        <Text style={tw`text-2xl font-black text-slate-800 mb-1`}>Time's Up!</Text>
        <Text style={tw`text-slate-500 mb-6`}>Caught {hits} foxes · {misses} misses</Text>
        <TouchableOpacity onPress={start} style={tw`w-full bg-primary py-4 rounded-2xl items-center mb-3`}>
          <Text style={tw`text-white font-black`}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} style={tw`w-full bg-slate-100 py-3 rounded-2xl items-center`}>
          <Text style={tw`text-slate-600 font-bold`}>Back to Hub</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 px-4 pt-4`}>
      <View style={tw`flex-row items-center justify-between mb-5`}>
        <TouchableOpacity onPress={onBack} style={tw`w-8 h-8 bg-slate-100 rounded-full items-center justify-center`}>
          <Text style={tw`font-black text-slate-600`}>←</Text>
        </TouchableOpacity>
        <Text style={tw`text-sm font-black text-slate-700`}>Fox Hunter</Text>
        {phase === 'playing'
          ? <Text style={tw`text-sm font-black text-red-500`}>{timer}s</Text>
          : <View />
        }
      </View>

      {phase === 'ready' ? (
        <View style={tw`flex-1 items-center justify-center gap-4`}>
          <Text style={tw`text-5xl`}>🦊</Text>
          <Text style={tw`text-base font-black text-slate-700 text-center`}>Tap the fox before it moves!</Text>
          <Text style={tw`text-[11px] text-slate-500 text-center`}>+20pts per hit · -5pts per miss · 30 seconds</Text>
          <TouchableOpacity onPress={start} style={tw`bg-red-500 px-10 py-4 rounded-2xl shadow-lg`}>
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
                style={tw`w-[31%] h-24 bg-green-100 border border-green-200 rounded-2xl items-center justify-center active:scale-90`}
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

function TetrisGame({ onBack }) {
  const DURATION = 40;
  const [phase, setPhase] = useState('ready');
  const [grid, setGrid] = useState(emptyGrid());
  const [cleared, setCleared] = useState(0);
  const [timer, setTimer] = useState(DURATION);
  const intervalRef = useRef(null);

  const start = () => {
    setGrid(emptyGrid()); setCleared(0); setTimer(DURATION); setPhase('playing');
    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(intervalRef.current); setPhase('done'); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const dropBlock = () => {
    if (phase !== 'playing') return;
    const col = Math.floor(Math.random() * COLS);
    setGrid(prev => {
      const g = prev.map(r => [...r]);
      // find lowest empty cell in column
      let placed = false;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (g[r][col] === 0) { g[r][col] = 1; placed = true; break; }
      }
      if (!placed) { g[0][col] = 1; } // overflow

      // Clear full rows
      let newCleared = 0;
      const remaining = g.filter(row => !row.every(c => c === 1));
      const fullCount = ROWS - remaining.length;
      newCleared = fullCount;
      if (fullCount > 0) {
        const newGrid = [...Array.from({ length: fullCount }, () => Array(COLS).fill(0)), ...remaining];
        setCleared(c => { const next = c + fullCount; return next; });
        return newGrid;
      }
      return g;
    });
  };

  if (phase === 'done') {
    gameStore.awardMiniGame('tetris_tap', cleared * 40);
    return (
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
  }

  return (
    <View style={tw`flex-1 px-4 pt-4`}>
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <TouchableOpacity onPress={onBack} style={tw`w-8 h-8 bg-slate-100 rounded-full items-center justify-center`}>
          <Text style={tw`font-black text-slate-600`}>←</Text>
        </TouchableOpacity>
        <Text style={tw`text-sm font-black text-slate-700`}>Tetris Tap</Text>
        {phase === 'playing'
          ? <Text style={tw`text-sm font-black text-red-500`}>{timer}s</Text>
          : <View />
        }
      </View>

      {phase === 'ready' ? (
        <View style={tw`flex-1 items-center justify-center gap-4`}>
          <Text style={tw`text-5xl`}>🟦</Text>
          <Text style={tw`text-base font-black text-slate-700 text-center`}>Drop blocks and clear rows!</Text>
          <Text style={tw`text-[11px] text-slate-500 text-center`}>Tap "DROP" to add a block in a random column. Full rows clear automatically.</Text>
          <TouchableOpacity onPress={start} style={tw`bg-blue-500 px-10 py-4 rounded-2xl shadow-lg`}>
            <Text style={tw`text-white font-black text-base`}>Start!</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={tw`flex-1 items-center`}>
          <View style={tw`flex-row justify-between w-full mb-3 bg-white border border-slate-200 rounded-xl px-4 py-2`}>
            <Text style={tw`font-black text-blue-600`}>Rows: {cleared}</Text>
            <Text style={tw`font-black text-slate-500`}>{timer}s left</Text>
          </View>

          {/* Grid */}
          <View style={tw`border border-slate-300 rounded-lg overflow-hidden mb-4`}>
            {grid.map((row, r) => (
              <View key={r} style={tw`flex-row`}>
                {row.map((cell, c) => (
                  <View
                    key={c}
                    style={[
                      { width: 32, height: 20, margin: 1, borderRadius: 2 },
                      cell ? tw`bg-primary` : tw`bg-slate-100`,
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={dropBlock}
            style={tw`bg-blue-500 px-12 py-4 rounded-2xl shadow-lg active:scale-95`}
          >
            <Text style={tw`text-white font-black text-lg`}>DROP ⬇️</Text>
          </TouchableOpacity>
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
  const intervalRef = useRef(null);

  const spin = () => {
    if (spinning || gameState.spinWheelCooldown > 0) return;
    setResult(null);
    setSpinning(true);

    // Animate highlight cycling through segments
    let ticks = 0;
    const totalTicks = 20 + Math.floor(Math.random() * 10);
    let speed = 80;
    let idx = 0;

    const tick = () => {
      idx = (idx + 1) % WHEEL_PRIZES.length;
      setHighlightIdx(idx);
      ticks++;
      speed = ticks > totalTicks - 5 ? speed + 80 : speed; // slow down at end
      if (ticks < totalTicks) {
        setTimeout(tick, speed);
      } else {
        // Commit to engine and get result
        const prize = gameStore.spinWheel();
        if (prize) {
          setResult(prize);
          setHighlightIdx(null);
        }
        setSpinning(false);
      }
    };
    setTimeout(tick, speed);
  };

  const cooldown = gameState.spinWheelCooldown || 0;

  return (
    <View style={tw`flex-1 px-4 pt-4`}>
      <View style={tw`flex-row items-center justify-between mb-6`}>
        <TouchableOpacity onPress={onBack} style={tw`w-8 h-8 bg-slate-100 rounded-full items-center justify-center`}>
          <Text style={tw`font-black text-slate-600`}>←</Text>
        </TouchableOpacity>
        <Text style={tw`text-sm font-black text-slate-700`}>Lucky Wheel</Text>
        <View />
      </View>

      {/* Wheel display as a grid of prize segments */}
      <View style={tw`bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm`}>
        <View style={tw`flex-row flex-wrap justify-between gap-2`}>
          {WHEEL_PRIZES.map((p, i) => (
            <View
              key={i}
              style={[
                tw`w-[48%] rounded-xl py-3 items-center border-2`,
                {
                  backgroundColor: highlightIdx === i ? p.color : p.color + '18',
                  borderColor: highlightIdx === i ? p.color : 'transparent',
                }
              ]}
            >
              <Text style={tw`text-[13px] font-black ${highlightIdx === i ? 'text-white' : 'text-slate-700'}`}>{p.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Result banner */}
      {result && (
        <View style={tw`bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 items-center`}>
          <Text style={tw`text-2xl mb-1`}>🎉</Text>
          <Text style={tw`text-base font-black text-amber-800`}>{result.label}</Text>
          <Text style={tw`text-[10px] text-amber-600 mt-1`}>Reward applied to your farm!</Text>
        </View>
      )}

      {/* Spin button */}
      <TouchableOpacity
        onPress={spin}
        disabled={spinning || cooldown > 0}
        style={tw`w-full py-5 rounded-2xl items-center shadow-lg ${spinning || cooldown > 0 ? 'bg-slate-200' : 'bg-primary'}`}
      >
        {cooldown > 0
          ? <Text style={tw`font-black text-slate-500`}>⏳ Next spin in {cooldown}s</Text>
          : spinning
            ? <Text style={tw`font-black text-white text-lg`}>🎰 Spinning...</Text>
            : <Text style={tw`font-black text-white text-lg`}>🎰 SPIN!</Text>
        }
      </TouchableOpacity>

      <Text style={tw`text-center text-[10px] text-slate-400 mt-3`}>Free spin every 2 minutes</Text>
    </View>
  );
}