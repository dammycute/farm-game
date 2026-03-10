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
    <LinearGradient colors={['rgba(15,23,42,0.8)', 'transparent']} style={tw`absolute top-0 left-0 right-0 z-20 px-4 pt-10 pb-8 pointer-events-box-none`}>
      <View style={tw`flex-row justify-between items-center z-30 mb-3`}>
        {/* Eggs Pillar */}
        <View style={tw`flex-row items-center gap-2 bg-white/90 rounded-full px-3 py-1.5 border-2 border-primary shadow-sm`}>
          <MaterialIcons name="egg" size={20} color="#ec5b13" />
          <View style={tw`-mt-1`}>
            <Text style={tw`text-[10px] font-interBold text-slate-500 uppercase tracking-tighter`}>Eggs</Text>
            <Text style={tw`text-xs font-interBlack text-slate-900`}>{invEgg}/{capEgg}</Text>
          </View>
        </View>

        {/* Cash Pillar */}
        <View style={tw`flex-row items-center gap-2 bg-white/90 rounded-full px-3 py-1.5 border-2 border-green-500 shadow-sm`}>
          <MaterialIcons name="payments" size={20} color="#16a34a" />
          <View style={tw`items-end -mt-1`}>
            <Text style={tw`text-[10px] font-interBold text-slate-500 uppercase tracking-tighter`}>Cash</Text>
            <Text style={tw`text-xs font-interBlack text-slate-900`}>${(gameState.cash || 0).toLocaleString()}</Text>
          </View>
        </View>

        {/* Finance Btn */}
        <TouchableOpacity
          style={tw`w-8 h-8 rounded-full bg-white/90 border border-slate-200 items-center justify-center shadow-sm`}
          onPress={() => setTab('finance')}
        >
          <MaterialIcons name="analytics" size={16} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* Farm Title + Stars */}
      <View style={tw`flex-row justify-between items-center px-1 mb-3`}>
        <Text style={tw`text-[10px] font-interBlack text-white bg-black/30 px-2 py-0.5 rounded-full`}>
          {gameState.farmTitle || '🌱 Rookie Farmer'}
        </Text>
        <View style={tw`flex-row items-center gap-1.5`}>
          <Text style={tw`text-[10px] font-black text-amber-400`}>
            {gameState.farmStars || 0}⭐
          </Text>
          {gameState.festivalActive > 0 && (
            <Text style={tw`text-[10px] font-black text-white bg-primary/80 px-2 py-0.5 rounded-full`}>
              🎪 Festival!
            </Text>
          )}
        </View>
      </View>

      {/* Level Progress */}
      {gameState.levelReqs && gameState.levelReqs.length > 0 && (
        <View style={tw`flex flex-col gap-1 z-30 px-1`}>
          <View style={tw`flex-row justify-between items-end`}>
            <Text style={tw`text-[10px] font-interBlack text-white bg-black/40 px-1.5 rounded`}>LVL {lvl}</Text>
            <Text style={tw`text-[9px] font-interBold text-white bg-black/40 px-1.5 rounded flex-1 text-center mx-1`}>{desc}</Text>
            <Text style={tw`text-[9px] font-interBold text-white`}>{progress}%</Text>
          </View>
          <View style={tw`h-2 w-full bg-slate-200/30 rounded-full overflow-hidden border border-white/20 shadow-sm`}>
            <View style={[tw`h-full bg-primary rounded-full`, { width: `${progress}%`, shadowColor: '#ec5b13', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 4 }]} />
          </View>
        </View>
      )}
    </LinearGradient>
  );
}
