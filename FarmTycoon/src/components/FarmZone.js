import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../styles';
import gameStore from '../gameEngine';
import { PLOT_DEFS } from '../constants';

export default function FarmZone({ gameState }) {
   const w = gameStore.getCurrentWeather();
   const hasAutoCollect = gameState.upgrades.autoCollect || gameState.staff.some(s => s.skill === 'autoHarvest');

   return (
      <ScrollView contentContainerStyle={tw`pb-32 pt-24`}>
         {/* Farmhouse Hero */}
         <View style={tw`h-48 w-full overflow-hidden shrink-0 bg-blue-300 relative`}>
            {/* The Farmhouse */}
            <View style={tw`absolute bottom-0 left-1/2 -translate-x-[128px] w-64 h-32 bg-red-600 rounded-t-3xl border-l-[8px] border-r-[8px] border-t-[8px] border-red-900 shadow-2xl items-center justify-end pb-4`}>
               {/* Roof Detail */}
               <View style={tw`absolute -top-10 left-0 right-0 h-10 bg-red-900 rounded-t-full items-center justify-center`}>
                  <View style={tw`w-12 h-12 bg-white/10 rounded-full border border-white/20`} />
               </View>
               {/* Door */}
               <View style={tw`w-12 h-16 bg-red-950 rounded-t-lg border-t-4 border-amber-900/50 items-center pt-2`}>
                  <View style={tw`w-2 h-2 bg-amber-500 rounded-full ml-6`} />
               </View>
               <MaterialIcons name="home" size={60} color="rgba(255,255,255,0.2)" style={tw`absolute top-4`} />
            </View>

            {/* Weather Overlay */}
            <View style={tw`absolute right-4 top-4 z-10 bg-white/90 p-3 rounded-2xl shadow-xl flex-row items-center gap-3`}>
               <Text style={tw`text-3xl`}>{w.icon}</Text>
               <View>
                  <Text style={tw`text-[10px] font-black text-slate-500 uppercase`}>{w.label}</Text>
                  <Text style={tw`text-xs font-black text-primary`}>{gameState.weather.daysLeft}d left</Text>
               </View>
            </View>
         </View>

         <View style={tw`px-4 flex-col gap-5 mt-4`}>
            {gameState.plots.map((plot) => {
               const def = PLOT_DEFS[plot.type];
               if (!def) return null;

               if (!plot.unlocked) {
                  return (
                     <TouchableOpacity key={plot.id} style={tw`bg-slate-200 rounded-3xl p-6 border-2 border-dashed border-slate-300 flex-row items-center justify-between shadow-inner`} onPress={() => gameStore.unlockPlot(plot.id)}>
                        <View style={tw`flex-row items-center gap-4`}>
                           <View style={tw`w-14 h-14 rounded-2xl bg-slate-300 items-center justify-center grayscale`}>
                              <Text style={tw`text-2xl`}>{def.icon}</Text>
                           </View>
                           <View>
                              <Text style={tw`text-sm font-black text-slate-400 uppercase`}>Locked Expansion</Text>
                              <Text style={tw`text-[10px] font-bold text-slate-500 uppercase`}>Unlock {def.name}</Text>
                           </View>
                        </View>
                        <View style={tw`bg-amber-500 px-4 py-2 rounded-xl shadow-lg`}>
                           <Text style={tw`font-black text-xs text-black`}>$\{(def.unlockCost).toLocaleString()}</Text>
                        </View>
                     </TouchableOpacity>
                  );
               }

               const output = plot.stored || 0;
               const localCap = 100 * plot.level;
               const pct = Math.min(100, (output / localCap) * 100);
               const ratePerMin = (def.baseRate * plot.level * gameStore.getProductionMultiplier() * gameStore._getCoopSpeed(gameState) * gameStore._getCoopBonus(gameState)).toFixed(1);
               const isStarving = plot.starving;

               return (
                  <TouchableOpacity key={plot.id} style={tw`bg-amber-50 rounded-[2rem] p-5 shadow-sm border-2 ${isStarving ? 'border-red-400' : 'border-white'} overflow-hidden`} onPress={() => gameStore.harvestPlot(plot.id)}>
                     <View style={tw`flex-row items-start justify-between mb-4`}>
                        <View style={tw`flex-row items-center gap-4`}>
                           <View style={tw`w-16 h-16 rounded-2xl bg-white shadow-lg items-center justify-center border border-slate-100`}>
                              <Text style={tw`text-4xl`}>{def.icon}</Text>
                              {isStarving && <View style={tw`absolute -top-2 -right-2 bg-red-500 w-6 h-6 rounded-full items-center justify-center border-2 border-white`}>
                                 <Text style={tw`text-[10px] text-white font-black`}>!</Text>
                              </View>}
                           </View>
                           <View>
                              <View style={tw`flex-row items-center gap-2 mb-0.5`}>
                                 <Text style={tw`text-base font-black text-slate-800`}>{def.name}</Text>
                                 <Text style={tw`text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase`}>Lv {plot.level}</Text>
                              </View>
                              <Text style={tw`text-[11px] font-bold text-slate-500 uppercase`}>⬆️ {ratePerMin}/min</Text>
                           </View>
                        </View>
                        <View style={tw`items-end`}>
                           <Text style={tw`text-[10px] font-black text-slate-400 uppercase mb-1`}>Stockpile</Text>
                           <Text style={tw`text-xl font-black text-slate-800`}>{Math.floor(output)}</Text>
                        </View>
                     </View>

                     <View style={tw`h-6 w-full bg-black/5 rounded-2xl p-1 overflow-hidden border border-black/5 mb-4 relative`}>
                        <View style={[tw`h-full rounded-xl items-center justify-center overflow-hidden ${pct >= 100 ? 'bg-green-500' : 'bg-primary'}`, { width: `${pct}%` }]} />
                        <View style={tw`absolute inset-0 items-center justify-center`}>
                           <Text style={tw`text-[10px] font-black uppercase ${pct > 50 ? 'text-white' : 'text-slate-500'}`}>{Math.floor(pct)}% Full</Text>
                        </View>
                     </View>

                     <View style={tw`flex-row justify-between items-center bg-white/40 -mx-5 -mb-5 px-5 py-3 border-t border-black/5 mt-auto`}>
                        <View style={tw`flex-col`}>
                           <Text style={tw`text-[9px] font-black uppercase mb-1 ${isStarving ? 'text-red-500' : 'text-slate-500'}`}>
                              {isStarving ? '⚠️ Starving' : '✅ Operational'}
                           </Text>
                           {pct >= 20 ? <Text style={tw`text-[10px] font-black text-primary uppercase`}>TAP TO HARVEST</Text> : <Text style={tw`text-[9px] text-slate-400 font-bold uppercase`}>Producing...</Text>}
                        </View>

                        <TouchableOpacity style={tw`bg-slate-900 px-3 py-2 rounded-xl flex-row items-center gap-1 shadow-lg`} onPress={() => gameStore.upgradePlot(plot.id)}>
                           <Text style={tw`text-[10px] font-black uppercase text-white`}>⬆️ $\{Math.floor(80 * Math.pow(1.8, plot.level)).toLocaleString()}</Text>
                        </TouchableOpacity>
                     </View>
                  </TouchableOpacity>
               );
            })}
         </View>

         {!hasAutoCollect && (
            <TouchableOpacity style={tw`absolute bottom-0 self-center mb-6 shadow-xl z-30`} onPress={() => {
               gameState.plots.forEach(p => { if (p.unlocked && p.level > 0) gameStore.harvestPlot(p.id, false); });
            }}>
               <View style={tw`w-16 h-16 bg-primary rounded-full items-center justify-center border-4 border-white`}>
                  <Text style={tw`text-3xl color-white`}>👋</Text>
               </View>
            </TouchableOpacity>
         )}
         {hasAutoCollect && (
            <View style={tw`absolute bottom-0 self-center mb-6 items-center gap-3 bg-white/95 px-6 py-3 rounded-full shadow-2xl border border-primary/30`}>
               <Text style={tw`text-[10px] font-black uppercase text-primary`}>🤖 Auto Mode Active</Text>
            </View>
         )}

         {/* Fox Overlay Render */}
         {gameState.foxVisible && (
            <TouchableOpacity style={tw`absolute w-24 h-24 top-1/2 left-1/4 z-50 rounded-full items-center justify-center bg-orange-400 border-4 border-red-500 shadow-xl`} onPress={() => gameStore.catchFox()}>
               <Text style={tw`text-5xl`}>🦊</Text>
               <Text style={tw`text-[10px] font-black uppercase text-white mt-1 bg-black/50 px-2 rounded`}>CATCH ME!</Text>
            </TouchableOpacity>
         )}
      </ScrollView>
   );
}
