import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, useDerivedValue } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
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

const WINDOW_WIDTH = Dimensions.get('window').width;
const WINDOW_HEIGHT = Dimensions.get('window').height;
const MAX_PUZZLE_SIZE = Platform.OS === 'web' ? 300 : 380;
const PUZZLE_SIZE = Math.min(WINDOW_WIDTH - 64, WINDOW_HEIGHT * 0.4, MAX_PUZZLE_SIZE);
const GRID_BG = '#0f172a'; // Darker Slate-950 for better contrast

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

// ─── Real Image Puzzle (DRAG MODE) ─────────────────────────────────────────────
function PuzzleGame({ onBack }) {
  const [phase, setPhase] = useState('config');
  const [imageIdx, setImageIdx] = useState(0);
  const [gridSize, setGridSize] = useState(GRID_SIZES[0]);
  const [tiles, setTiles] = useState([]);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const solvedRef = useRef(false);
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
    setMoves(0);
    setElapsed(0);
    setPhase('playing');
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      elapsedRef.current++;
      setElapsed(elapsedRef.current);
    }, 1000);
  };

  const swapTiles = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    movesRef.current++;
    setMoves(movesRef.current);

    setTiles(prev => {
      const next = [...prev];
      [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
      
      // Check if solved
      if (!solvedRef.current && next.every((v, i) => v === i)) {
        solvedRef.current = true;
        setTimeout(() => {
          if (timerRef.current) clearInterval(timerRef.current);
          const score = Math.max(0, 300 - elapsedRef.current - movesRef.current * 2);
          gameStore.awardMiniGame('puzzle_image', score);
          setPhase('solved');
        }, 300);
      }
      return next;
    });
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
        <Text style={tw`text-xs text-slate-500 flex-1`}>DRAG tiles to swap them. Put the farm photo back together!</Text>
      </View>

      <ScrollView 
        contentContainerStyle={tw`pb-20 pt-2`} 
        showsVerticalScrollIndicator={false}
      >
        <View style={[tw`self-center p-4 rounded-3xl`, { backgroundColor: GRID_BG }]}>
          <View style={{ width: PUZZLE_SIZE, height: PUZZLE_SIZE, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
            {tiles.map((tileIdx, posIdx) => (
              <PuzzleTile 
                key={tileIdx} 
                tileIdx={tileIdx} 
                initialIdx={tileIdx}
                currentPos={posIdx} 
                gridSize={gridSize} 
                tileSize={tileSize} 
                imageUri={PUZZLE_IMAGES[imageIdx].uri}
                onSwap={swapTiles}
                moves={moves}
              />
            ))}
          </View>
        </View>
        <Text style={tw`text-center text-[10px] text-slate-400 mt-4 uppercase font-black tracking-widest`}>
          Match the pattern to win rewards 🏆
        </Text>
      </ScrollView>
    </View>
  );
}

function PuzzleTile({ tileIdx, initialIdx, currentPos, gridSize, tileSize, imageUri, onSwap, moves }) {
  const x = useSharedValue((currentPos % gridSize.cols) * tileSize);
  const y = useSharedValue(Math.floor(currentPos / gridSize.cols) * tileSize);
  const isDragging = useSharedValue(false);

  useEffect(() => {
    if (!isDragging.value) {
      x.value = withSpring((currentPos % gridSize.cols) * tileSize, { damping: 20 });
      y.value = withSpring(Math.floor(currentPos / gridSize.cols) * tileSize, { damping: 20 });
    }
  }, [currentPos]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((event) => {
      x.value = (currentPos % gridSize.cols) * tileSize + event.translationX;
      y.value = Math.floor(currentPos / gridSize.cols) * tileSize + event.translationY;
    })
    .onEnd((event) => {
      const finalX = x.value + tileSize / 2;
      const finalY = y.value + tileSize / 2;
      const col = Math.floor(finalX / tileSize);
      const row = Math.floor(finalY / tileSize);
      const newPos = row * gridSize.cols + col;
      
      isDragging.value = false;

      if (newPos >= 0 && newPos < gridSize.rows * gridSize.cols && newPos !== currentPos) {
        runOnJS(onSwap)(currentPos, newPos);
      } else {
        x.value = withSpring((currentPos % gridSize.cols) * tileSize);
        y.value = withSpring(Math.floor(currentPos / gridSize.cols) * tileSize);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: withSpring(isDragging.value ? 1.08 : 1) }],
    // Higher zIndex when dragging, otherwise ordered to allow overlap
    zIndex: isDragging.value ? 1000 : (100 - currentPos),
  }));

  const sourceRow = Math.floor(initialIdx / gridSize.cols);
  const sourceCol = initialIdx % gridSize.cols;
  
  // Decide which sides have tabs (Deterministic based on original position)
  const hasRightTab = (initialIdx % gridSize.cols) < (gridSize.cols - 1);
  const hasBottomTab = Math.floor(initialIdx / gridSize.cols) < (gridSize.rows - 1);

  const tabSize = tileSize * 0.35;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ position: 'absolute', width: tileSize, height: tileSize, overflow: 'visible' }, animatedStyle]}>
        
        {/* The Piece Body - Perfectly aligned, no margin */}
        <View style={{
          width: tileSize,
          height: tileSize,
          overflow: 'hidden',
          backgroundColor: '#334155',
          borderWidth: 0.2,
          borderColor: 'rgba(255,255,255,0.2)',
        }}>
          <Image
            source={{ uri: imageUri }}
            style={{
              width: PUZZLE_SIZE,
              height: PUZZLE_SIZE,
              position: 'absolute',
              top: -sourceRow * tileSize,
              left: -sourceCol * tileSize,
            }}
            resizeMode="cover"
          />
        </View>

        {/* Right Tab (Overlap next piece) */}
        {hasRightTab && (
          <View style={{
            position: 'absolute',
            right: -tabSize / 1.5,
            top: (tileSize - tabSize) / 2,
            width: tabSize,
            height: tabSize,
            borderRadius: tabSize / 2,
            overflow: 'hidden',
            borderWidth: 0.5,
            borderColor: 'rgba(255,255,255,0.1)',
            shadowColor: '#000',
            shadowOffset: { width: 1, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 1,
            elevation: 2,
          }}>
            <Image
              source={{ uri: imageUri }}
              style={{
                width: PUZZLE_SIZE,
                height: PUZZLE_SIZE,
                position: 'absolute',
                top: -sourceRow * tileSize - (tileSize - tabSize) / 2,
                left: -sourceCol * tileSize - (tileSize - tabSize / 1.5),
              }}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Bottom Tab (Overlap piece below) */}
        {hasBottomTab && (
          <View style={{
            position: 'absolute',
            bottom: -tabSize / 1.5,
            left: (tileSize - tabSize) / 2,
            width: tabSize,
            height: tabSize,
            borderRadius: tabSize / 2,
            overflow: 'hidden',
            borderWidth: 0.5,
            borderColor: 'rgba(255,255,255,0.1)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1,
            elevation: 2,
          }}>
            <Image
              source={{ uri: imageUri }}
              style={{
                width: PUZZLE_SIZE,
                height: PUZZLE_SIZE,
                position: 'absolute',
                top: -sourceRow * tileSize - (tileSize - tabSize / 1.5),
                left: -sourceCol * tileSize - (tileSize - tabSize) / 2,
              }}
              resizeMode="cover"
            />
          </View>
        )}

        {moves < 1 && (
          <View style={{ position: 'absolute', top: tileSize/2-8, left: tileSize/2-8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, width: 16, height: 16, alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <Text style={{ fontSize: 8, color: '#fff', fontWeight: '900' }}>{initialIdx + 1}</Text>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
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


// ─── Tetris Tap (Improved: No timer, level-based speed) ─────────────────────────
const COLS = 8;
const ROWS = 10;
const emptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

const TETROMINOES = [
  { id: 'I', color: '#06b6d4', rotations: [[[0,1],[1,1],[2,1],[3,1]],[[2,0],[2,1],[2,2],[2,3]],[[0,2],[1,2],[2,2],[3,2]],[[1,0],[1,1],[1,2],[1,3]]] },
  { id: 'O', color: '#f59e0b', rotations: [[[1,0],[2,0],[1,1],[2,1]],[[1,0],[2,0],[1,1],[2,1]],[[1,0],[2,0],[1,1],[2,1]],[[1,0],[2,0],[1,1],[2,1]]] },
  { id: 'T', color: '#8b5cf6', rotations: [[[1,0],[0,1],[1,1],[2,1]],[[1,0],[1,1],[2,1],[1,2]],[[0,1],[1,1],[2,1],[1,2]],[[1,0],[0,1],[1,1],[1,2]]] },
  { id: 'L', color: '#ef4444', rotations: [[[1,0],[1,1],[1,2],[2,2]],[[0,1],[1,1],[2,1],[0,2]],[[0,0],[1,0],[1,1],[1,2]],[[2,0],[0,1],[1,1],[2,1]]] },
  { id: 'J', color: '#22c55e', rotations: [[[1,0],[1,1],[1,2],[0,2]],[[0,0],[0,1],[1,1],[2,1]],[[2,0],[1,0],[1,1],[1,2]],[[0,1],[1,1],[2,1],[2,2]]] },
  { id: 'S', color: '#f43f5e', rotations: [[[1,0],[2,0],[0,1],[1,1]],[[1,0],[1,1],[2,1],[2,2]],[[1,1],[2,1],[0,2],[1,2]],[[0,0],[0,1],[1,1],[1,2]]] },
  { id: 'Z', color: '#0ea5e9', rotations: [[[0,0],[1,0],[1,1],[2,1]],[[2,0],[1,1],[2,1],[1,2]],[[0,1],[1,1],[1,2],[2,2]],[[1,0],[0,1],[1,1],[0,2]]] },
];

function TetrisGame({ onBack }) {
  const [phase, setPhase] = useState('ready');
  const [grid, setGrid] = useState(emptyGrid());
  const [cleared, setCleared] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(() => TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)]);
  const [pieceX, setPieceX] = useState(2);
  const [pieceY, setPieceY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const clearedRef = useRef(0);
  const gravityRef = useRef(null);

  useEffect(() => {
    return () => { if (gravityRef.current) clearInterval(gravityRef.current); };
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    updateGravity();
    return () => { if (gravityRef.current) clearInterval(gravityRef.current); };
  }, [phase, level]);

  const updateGravity = () => {
    if (gravityRef.current) clearInterval(gravityRef.current);
    const speed = Math.max(100, 800 - (level - 1) * 100);
    gravityRef.current = setInterval(() => handleDown(), speed);
  };

  useEffect(() => {
    if (phase === 'done') {
      gameStore.awardMiniGame('tetris_tap', clearedRef.current * 50 + (level - 1) * 200);
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
        const newLevel = Math.floor(clearedRef.current / 5) + 1;
        if (newLevel !== level) setLevel(newLevel);
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
    setLevel(1);
    setPhase('playing');
    setCurrentPiece(null);
    setNextPiece(randomPiece());
    setTimeout(() => spawnPiece(), 0);
  };

  if (phase === 'done') return (
    <View style={tw`flex-1 items-center justify-center px-6`}>
      <Text style={tw`text-6xl mb-4`}>🟦</Text>
      <Text style={tw`text-2xl font-black text-slate-800 mb-1`}>Game Over!</Text>
      <Text style={tw`text-slate-500 mb-6 text-center`}>Rows cleared: {cleared} · Level {level}</Text>
      <TouchableOpacity onPress={start} style={tw`w-full bg-primary py-4 rounded-2xl items-center mb-3`}>
        <Text style={tw`text-white font-black`}>Try Again</Text>
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
        <Text style={tw`text-sm font-black text-slate-700`}>Tetris Extreme</Text>
        <View style={tw`bg-blue-100 px-3 py-1 rounded-full`}>
           <Text style={tw`text-[10px] font-black text-blue-700 uppercase`}>Level {level}</Text>
        </View>
      </View>

      {phase === 'ready' ? (
        <View style={tw`flex-1 items-center justify-center gap-4`}>
          <Text style={tw`text-5xl`}>🟦</Text>
          <Text style={tw`text-lg font-black text-slate-700 text-center`}>Endless Tetris</Text>
          <Text style={tw`text-xs text-slate-500 text-center px-4 mb-4`}>No timer. Speed increases every 5 rows. Don't let the blocks reach the top!</Text>
          <TouchableOpacity onPress={start} style={tw`bg-blue-500 px-10 py-4 rounded-2xl`}>
            <Text style={tw`text-white font-black text-base`}>Play Now!</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={tw`flex-1 items-center`}>
          <View style={tw`flex-row justify-between w-full mb-3 bg-white border border-slate-200 rounded-xl px-4 py-2 opacity-90 shadow-sm`}>
            <Text style={tw`font-black text-blue-600`}>Rows: {cleared}</Text>
            <Text style={tw`font-black text-slate-400 uppercase text-[10px]`}>Speed: Lv{level}</Text>
          </View>

          <View style={{ borderWidth: 2, borderColor: '#cbd5e1', borderRadius: 12, overflow: 'hidden', marginBottom: 12, backgroundColor: '#f1f5f9' }}>
            {grid.map((row, r) => (
              <View key={r} style={{ flexDirection: 'row' }}>
                {row.map((cell, c) => {
                  let active = cell;
                  let color = cell === 1 ? '#475569' : '#f8fafc';
                  if (currentPiece) {
                    currentPiece.rotations[rotation].forEach(([cx, cy]) => {
                      if (pieceY + cy === r && pieceX + cx === c) {
                        active = 2;
                        color = currentPiece.color;
                      }
                    });
                  }
                  return (
                    <View key={c} style={{ width: 34, height: 20, margin: 1, borderRadius: 2, backgroundColor: color, borderBottomWidth: active ? 2 : 0, borderBottomColor: 'rgba(0,0,0,0.1)' }} />
                  );
                })}
              </View>
            ))}
          </View>

          <View style={tw`w-full flex-row justify-between items-center mb-4 px-2`}>
            <View style={tw`bg-white border border-slate-200 rounded-xl p-2 items-center`}> 
              <Text style={tw`text-[9px] font-black text-slate-400 uppercase mb-1`}>Next</Text>
              <View style={{ width: 60, height: 60, backgroundColor: '#f8fafc', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                {nextPiece && nextPiece.rotations[0].map(([cx, cy], idx) => (
                  <View key={idx} style={{ position: 'absolute', left: 4 + cx * 12, top: 4 + cy * 12, width: 10, height: 10, borderRadius: 2, backgroundColor: nextPiece.color }} />
                ))}
              </View>
            </View>
            <View style={tw`flex-row gap-2`}>
              <TouchableOpacity onPress={() => movePiece(-1)} style={tw`bg-slate-200 w-12 h-12 rounded-xl items-center justify-center active:bg-slate-300`}><Text style={tw`text-lg`}>◀</Text></TouchableOpacity>
              <TouchableOpacity onPress={rotatePiece} style={tw`bg-slate-200 w-12 h-12 rounded-xl items-center justify-center active:bg-slate-300`}><Text style={tw`text-lg`}>⟳</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => movePiece(1)} style={tw`bg-slate-200 w-12 h-12 rounded-xl items-center justify-center active:bg-slate-300`}><Text style={tw`text-lg`}>▶</Text></TouchableOpacity>
              <TouchableOpacity onPress={hardDrop} style={tw`bg-blue-500 w-12 h-12 rounded-xl items-center justify-center active:scale-90`}><Text style={tw`text-white text-lg`}>▼</Text></TouchableOpacity>
            </View>
          </View>

          <Text style={tw`text-[10px] text-slate-400 font-bold uppercase tracking-tighter`}>Level up every 5 rows · Don't hit the top!</Text>
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