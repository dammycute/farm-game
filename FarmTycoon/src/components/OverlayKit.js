import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import tw from '../styles';
import gameStore from '../gameEngine';

export function FloatRenderer({ floaters }) {
    if (!floaters || floaters.length === 0) return null;

    return (
        <>
            {floaters.map(f => (
                <View
                    key={f.id}
                    style={[tw`absolute z-[150]`, {left: f.x, top: f.y }]}
            pointerEvents="none"
        >
            <Text style={tw`text-amber-400 font-black text-sm drop-shadow-md`}>
            {f.text}
        </Text >
        </View >
      ))
}
    </>
  );
}

export function ToastRenderer({ toasts }) {
    if (!toasts || toasts.length === 0) return null;

    // Render only the top toast
    const t = toasts[toasts.length - 1];

    return (
        <View style={tw`absolute top-24 left-0 right-0 z-[200] items-center pointer-events-none`}>
       <View style={tw`bg-slate-900 px-6 py-3 rounded-full shadow-2xl`}>
           <Text style={tw`text-white font-bold text-sm tracking-wide`}>{t.msg}</Text>
       </View>
    </View>
  );
}

export function LevelCompleteModal({ visible }) {
  const pGain = 0.5;
  const currMult = gameStore.G.prestigeMult || 1;
  const newMult = (currMult + pGain).toFixed(1);
  const lvl = gameStore.G.level || 1;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={tw`flex-1 justify-center items-center bg-black/70 p-4`}>
        <View style={tw`w-full max-w-sm bg-white rounded-3xl p-6 items-center shadow-2xl`}>
           <Text style={tw`text-6xl mb-4`}>🌟</Text>
           <Text style={tw`text-xl font-black mb-2 text-primary`}>Egg-ceptional Tycoon!</Text>
           
           <Text style={tw`text-sm font-bold text-slate-500 mb-6 text-center`}>
              Moving to the next level will <Text style={tw`text-red-500`}>reset your cash, inventory, and plot levels</Text> to start fresh.{"\n\n"}
              However, you will <Text style={tw`text-green-500 font-black`}>KEEP</Text> all Unlocked Plots, Farm Upgrades, Trucks, and Staff!
           </Text>

           <View style={tw`bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 w-full items-center`}>
              <Text style={tw`text-[10px] font-black text-amber-600 uppercase tracking-wider mb-2`}>Permanent Prestige Multiplier</Text>
              <View style={tw`flex-row items-center justify-center gap-3`}>
                 <Text style={tw`text-3xl font-black text-amber-500 opacity-50`}>{currMult.toFixed(1)}x</Text>
                 <Text style={tw`text-3xl font-black text-amber-500`}>➡️</Text>
                 <Text style={tw`text-3xl font-black text-amber-500`}>{newMult}x</Text>
              </View>
              <Text style={tw`text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mt-2`}>Applies to all sale prices permanently!</Text>
           </View>

           <TouchableOpacity 
             style={tw`w-full py-3 bg-primary rounded-xl flex-row items-center justify-center gap-2 shadow-lg`}
             onPress={() => gameStore.advanceLevel()}
           >
              <Text style={tw`text-white font-black text-sm`}>Advance to Level {lvl + 1} ➡️</Text>
           </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
