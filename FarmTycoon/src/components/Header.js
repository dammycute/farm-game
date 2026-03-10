import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../styles';
import gameStore from '../gameEngine';

export default function Header({ gameState, setTab }) {
  const invEgg = Math.floor(gameState.inv?.egg || 0);
  const capEgg = gameState.invCap?.egg || 80;

  let progress = 0;
  let desc = 'Loading...';
  let pText = '0%';
  let lvl = gameState.level || 1;

  if (gameState.levelReqs && gameState.levelReqs.length > 0) {
    const req = gameState.levelReqs[0];
    let val = 0;
    if (req.type === 'revenue') val = gameState.totalRevenue;
    if (req.type === 'cash') val = gameState.cash;
    if (req.type === 'item') val = gameState.inv[req.target] || 0;
    progress = Math.min(100, Math.floor((val / req.amount) * 100));
    pText = `${val} / ${req.amount}`;
    desc = req.desc;
  }

  return (
    <LinearGradient colors={['rgba(15,23,42,0.6)', 'transparent']} style={tw`absolute top-0 left-0 right-0 z-20 px-4 pt-10 pb-8 pointer-events-box-none`}>
      <View style={tw`flex-row justify-between items-center z-30 mb-2`}>
        {/* Eggs Pillar */}
        <View style={tw`flex-row items-center gap-2 bg-white/90 rounded-full px-3 py-1.5 border-2 border-primary shadow-sm`}>
          <Text style={tw`text-xl`}>🥚</Text>
          <View>
            <Text style={tw`text-[10px] font-bold text-slate-500 uppercase`}>Eggs</Text>
            <Text style={tw`text-xs font-extrabold text-slate-900`}>{invEgg}/{capEgg}</Text>
          </View>
        </View>

        {/* Cash Pillar */}
        <View style={tw`flex-row items-center gap-2 bg-white/90 rounded-full px-3 py-1.5 border-2 border-green-500 shadow-sm`}>
          <Text style={tw`text-xl`}>💵</Text>
          <View style={tw`items-end`}>
            <Text style={tw`text-[10px] font-bold text-slate-500 uppercase`}>Cash</Text>
            <Text style={tw`text-xs font-extrabold text-slate-900`}>${(gameState.cash || 0).toLocaleString()}</Text>
          </View>
        </View>

        {/* Finance Btn */}
        <TouchableOpacity
          style={tw`w-8 h-8 rounded-full bg-white/90 border border-slate-200 items-center justify-center`}
          onPress={() => setTab('finance')}
        >
          <Text style={tw`text-sm`}>📊</Text>
        </TouchableOpacity>
      </View>

      {/* Level Progress */}
      {gameState.levelReqs && gameState.levelReqs.length > 0 && (
        <View style={tw`flex flex-col gap-1 z-30 px-1`}>
          <View style={tw`flex-row justify-between items-end`}>
            <Text style={tw`text-[10px] font-black text-white bg-black/40 px-1.5 rounded`}>LVL {lvl}</Text>
            <Text style={tw`text-[9px] font-bold text-white bg-black/40 px-1.5 rounded flex-1 text-center mx-1`}>{desc}</Text>
            <Text style={tw`text-[9px] font-bold text-white drop-shadow-md`}>{pText}</Text>
          </View>
          <View style={tw`h-2 w-full bg-slate-200/30 rounded-full overflow-hidden border border-white/20`}>
            <View style={[tw`h-full bg-primary rounded-full`, { width: `${progress}%` }]} />
          </View>
        </View>
      )}
    </LinearGradient>
  );
}
