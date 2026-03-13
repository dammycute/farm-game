import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import tw from '../styles';
import gameStore from '../gameEngine';

const gameDetails = {
  puzzle_match: { name: 'Image Sort', desc: 'Divide an image into pieces and fit them back together.', goal: 'Solve the tile assembly by swapping pieces.', },
  fox_hunter: { name: 'Fox Hunter', desc: 'Tap the fox as it moves on screen before time runs out.', goal: 'Catch as many as possible.', },
  tetris_tap: { name: 'Tetris Tap', desc: 'Drop blocks and clear rows in a mini tetris board.', goal: 'Clear 3+ rows in 30s.', },
};

const pieceOptions = [9, 21, 35, 50];

const imageTemplates = [
  { label: 'Farm Scene', icon: '🌾', color: '#f8c267' },
  { label: 'Cake Display', icon: '🎂', color: '#eab308' },
  { label: 'Market Row', icon: '🏪', color: '#14b8a6' },
  { label: 'Chicken Coop', icon: '🐔', color: '#f97316' },
];

const getGridShape = (pieces) => {
  if (pieces === 9) return { rows: 3, cols: 3 };
  if (pieces === 21) return { rows: 3, cols: 7 };
  if (pieces === 35) return { rows: 5, cols: 7 };
  if (pieces === 50) return { rows: 5, cols: 10 };
  return { rows: 3, cols: 3 };
};

function boardFactory() {
  return Array.from({ length: 9 }, () => Math.floor(Math.random() * 5) + 1);
}

export default function MiniGameZone({ gameState }) {
  const [mode, setMode] = useState(null);
  const [board, setBoard] = useState(boardFactory());
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [hits, setHits] = useState(0);
  const [timer, setTimer] = useState(10);
  const [tapCount, setTapCount] = useState(0);
  const [currentFox, setCurrentFox] = useState(null);
  const [puzzleTheme, setPuzzleTheme] = useState(imageTemplates[0]);
  const [puzzlePieceCount, setPuzzlePieceCount] = useState(null);
  const [puzzleBoard, setPuzzleBoard] = useState([]);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [tetrisGrid, setTetrisGrid] = useState(Array(10).fill(0).map(() => Array(8).fill(0)));
  const [tetrisLines, setTetrisLines] = useState(0);

  // Timer runner for fox and tetris
  useEffect(() => {
    let interval;
    if (timer > 0 && (mode === 'fox_hunter' || mode === 'tetris_tap' || mode === 'puzzle_match')) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
        if (mode === 'fox_hunter') {
          setCurrentFox(Math.floor(Math.random() * 9));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, timer]);

  useEffect(() => {
    if (mode && timer === 0) {
      if (mode === 'puzzle_match') {
        gameStore.playMiniGame('puzzle_match', puzzleScore * 15);
      }
      if (mode === 'fox_hunter') {
        gameStore.playMiniGame('fox_hunter', hits * 20);
      }
      if (mode === 'tetris_tap') {
        gameStore.playMiniGame('tetris_tap', tetrisLines * 40);
      }
      setTimeout(() => {
        setMode(null);
        setTimer(10);
        setHits(0);
        setTapCount(0);
        setCurrentFox(null);
        setBoard(boardFactory());
        setSelectedIdx(null);
        setPuzzleQuestion(null);
        setPuzzleScore(0);
        setTetrisGrid(Array(10).fill(0).map(() => Array(8).fill(0)));
        setTetrisLines(0);
      }, 500);
    }
  }, [timer, mode, hits, tapCount, puzzleScore, tetrisLines]);

  const initializePuzzle = (pieceCount) => {
    const { rows, cols } = getGridShape(pieceCount);
    const size = rows * cols;
    const numbers = Array.from({ length: size }, (_, i) => i + 1);
    const shuffled = [...numbers].sort(() => Math.random() - 0.5);

    setPuzzlePieceCount(pieceCount);
    setPuzzleBoard(shuffled);
    setPuzzleSolved(false);
    setSelectedIdx(null);
    setHits(0);
    setPuzzleTheme(imageTemplates[Math.floor(Math.random() * imageTemplates.length)]);
  };

  const runPuzzle = (idx) => {
    if (puzzleSolved || puzzlePieceCount === null) return;
    if (selectedIdx === null) {
      setSelectedIdx(idx);
      return;
    }

    const updated = [...puzzleBoard];
    [updated[selectedIdx], updated[idx]] = [updated[idx], updated[selectedIdx]];
    setPuzzleBoard(updated);
    setSelectedIdx(null);

    const shape = getGridShape(puzzlePieceCount);
    const solvedArray = Array.from({ length: shape.rows * shape.cols }, (_, i) => i + 1);
    if (updated.every((v, i) => v === solvedArray[i])) {
      setPuzzleSolved(true);
      gameStore.playMiniGame('puzzle_match', puzzlePieceCount * 10);
      gameStore.showToast('🎉 Puzzle solved! Great job.');
    }
  };

  const startMiniGame = (id) => {
    if (!gameState.miniGames.find((g) => g.id === id)?.unlocked) return;
    setMode(id);
    setTimer(30);
    setHits(0);
    setTapCount(0);
    setCurrentFox(null);
    setBoard(boardFactory());
    setSelectedIdx(null);
    setTetrisGrid(Array(10).fill(0).map(() => Array(8).fill(0)));
    setTetrisLines(0);
    setPuzzleSolved(false);
    setPuzzlePieceCount(null);
    setPuzzleTheme(imageTemplates[Math.floor(Math.random() * imageTemplates.length)]);

    if (id === 'tetris_tap') {
      // early fill for clear row testing, empty otherwise
      setTetrisGrid(Array(10).fill(0).map(() => Array(8).fill(0)));
    }
  };

  return (
    <ScrollView contentContainerStyle={tw`pb-36 px-4 bg-backgroundLight`}>
      <View style={tw`mb-5`}> 
        <Text style={tw`text-lg font-black text-slate-900`}>Mini-Game Hub</Text>
        <Text style={tw`text-[10px] text-slate-500 mt-1`}>Unlock and play mini-games for rewards and farm stars.</Text>
      </View>

      {mode ? (
        <View style={tw`bg-white rounded-2xl p-4 border border-slate-200 shadow-sm`}> 
          <Text style={tw`text-sm font-black text-slate-800 mb-2`}>Playing: {gameDetails[mode]?.name}</Text>
          <Text style={tw`text-[9px] text-slate-500 mb-3`}>{gameDetails[mode]?.desc}</Text>
          <Text style={tw`text-xs font-bold text-red-500 mb-2`}>Time left: {timer}s</Text>
          {mode === 'puzzle_match' && (
            <View style={tw`flex-col gap-3`}> 
              {!puzzlePieceCount ? (
                <>
                  <Text style={tw`text-sm font-black text-slate-800`}>Select piece total:</Text>
                  <View style={tw`flex-row flex-wrap gap-2`}> 
                    {pieceOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={tw`px-3 py-2 rounded-lg bg-slate-200`}
                        onPress={() => initializePuzzle(option)}
                      >
                        <Text style={tw`font-black`}>{option} pieces</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <View style={tw`bg-slate-100 rounded-lg p-3`}> 
                    <Text style={tw`text-sm font-black text-slate-800`}>{puzzleTheme.icon} {puzzleTheme.label}</Text>
                    <Text style={tw`text-[10px] text-slate-500 mt-1`}>Solve the puzzle by swapping tiles into their correct order.</Text>
                    <Text style={tw`text-[10px] mt-1`}>Goal: assemble {puzzlePieceCount} pieces (shape {getGridShape(puzzlePieceCount).rows}x{getGridShape(puzzlePieceCount).cols})</Text>
                  </View>
                  <View style={tw`my-3`}> 
                    *Tap one cell, then another to swap.*
                  </View>
                  <View style={tw`flex-row flex-wrap justify-center gap-1`}>
                    {puzzleBoard.map((value, index) => {
                      const shape = getGridShape(puzzlePieceCount);
                      const tileWidth = `${Math.floor(92 / shape.cols)}%`;
                      const isSelected = selectedIdx === index;
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            tw`h-10 justify-center items-center rounded-sm`,
                            { width: tileWidth, backgroundColor: puzzleTheme.color, borderWidth: isSelected ? 2 : 1, borderColor: isSelected ? '#0ea5e9' : '#cbd5e1' },
                          ]}
                          onPress={() => runPuzzle(index)}
                        >
                          <Text style={tw`text-xs font-black text-white`}>{value}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={tw`text-xs mt-2 font-bold ${puzzleSolved ? 'text-green-600' : 'text-slate-600'}`}>
                    {puzzleSolved ? 'Puzzle solved! Awarding reward...' : 'Keep swapping to solve.'}
                  </Text>
                </>
              )}
            </View>
          )}
          {mode === 'fox_hunter' && (
            <View style={tw`flex-row flex-wrap justify-between mt-2`}> 
              {Array.from({ length: 9 }).map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={tw`w-[30%] h-16 bg-slate-100 rounded-lg m-1 items-center justify-center`}
                  onPress={() => {
                    if (idx === currentFox) {
                      setHits((h) => h + 1);
                    }
                  }}
                >
                  <Text style={tw`text-xl`}>{idx === currentFox ? '🦊' : '🌾'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {mode === 'tetris_tap' && (
            <View style={tw`bg-slate-100 rounded-lg py-4 px-2`}> 
              <Text style={tw`text-xs text-slate-500 mb-2`}>Tap 'Drop' to place blocks and clear rows.</Text>
              <View style={tw`flex-row flex-wrap`}>{tetrisGrid.map((col, x) => (
                <View key={x} style={tw`w-[8%] mr-0.5`}>
                  {col.map((cell, y) => (
                    <View key={`${x}-${y}`} style={tw`w-full h-4 mb-0.5 ${cell ? 'bg-primary' : 'bg-slate-300'} rounded-sm`} />
                  ))}
                </View>
              ))}</View>
              <TouchableOpacity
                style={tw`bg-primary px-6 py-3 rounded-xl mt-3 items-center`}
                onPress={() => {
                  setTapCount((t) => t + 1);
                  const col = Math.floor(Math.random() * 10);
                  const copy = tetrisGrid.map((c) => [...c]);
                  const column = copy[col];
                  let placed = false;
                  for (let i = 0; i < column.length; i++) {
                    if (column[i] === 0) {
                      column[i] = 1;
                      placed = true;
                      break;
                    }
                  }
                  if (!placed) {
                    // overflow: kill top row in this column
                    column.pop();
                    column.unshift(1);
                  }
                  // Clear full rows
                  let cleared = 0;
                  for (let y = 0; y < 8; y++) {
                    const full = copy.every((colArr) => colArr[y] === 1);
                    if (full) {
                      cleared++;
                      copy.forEach((colArr) => {
                        colArr.splice(y, 1);
                        colArr.push(0);
                      });
                    }
                  }
                  if (cleared > 0) {
                    setTetrisLines((l) => l + cleared);
                    gameStore.showToast(`🎉 Cleared ${cleared} row${cleared > 1 ? 's' : ''}!`);
                  }
                  setTetrisGrid(copy);
                }}
              >
                <Text style={tw`text-sm font-black text-white`}>Drop</Text>
              </TouchableOpacity>
              <Text style={tw`text-sm font-black text-slate-800 mt-2`}>Rows cleared: {tetrisLines}</Text>
            </View>
          )}
          <Text style={tw`text-xs text-slate-500 mt-3`}>Current hits: {hits}, taps: {tapCount}</Text>
        </View>
      ) : (
        <View style={tw`bg-white rounded-2xl p-4 border border-slate-200 shadow-sm`}> 
          {gameState.miniGames.map((g) => (
            <View key={g.id} style={tw`flex-row items-center justify-between mb-2`}> 
              <View>
                <Text style={tw`text-sm font-black text-slate-800`}>{g.name}</Text>
                <Text style={tw`text-[9px] text-slate-500`}>{g.desc}</Text>
                <Text style={tw`text-[8px] text-slate-400`}>Played: {gameState.miniGameProgress?.[g.id] || 0}</Text>
              </View>
              <View style={tw`flex-row gap-1`}>
                {!g.unlocked ? (
                  <TouchableOpacity onPress={() => gameStore.unlockMiniGame(g.id)} style={tw`px-2 py-1 bg-amber-500 rounded-lg`}>
                    <Text style={tw`text-[9px] font-black text-white`}>Unlock ${g.price}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => startMiniGame(g.id)} style={tw`px-2 py-1 bg-primary rounded-lg`}>
                    <Text style={tw`text-[9px] font-black text-white`}>Play</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={tw`mt-5 bg-white rounded-2xl p-3 border border-slate-200`}> 
        <Text style={tw`text-xs font-black text-slate-800 mb-1`}>Mini-Game Achievements</Text>
        <Text style={tw`text-[9px] text-slate-600`}>Puzzle Master: {gameState.miniGameAchievements?.puzzle_match || 0}</Text>
        <Text style={tw`text-[9px] text-slate-600`}>Fox Hunter: {gameState.miniGameAchievements?.fox_hunter || 0}</Text>
        <Text style={tw`text-[9px] text-slate-600`}>Tetris Champ: {gameState.miniGameAchievements?.tetris_tap || 0}</Text>
      </View>
    </ScrollView>
  );
}
