import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import tw from '../styles';
import gameStore from '../gameEngine';
import { RECIPES } from '../constants';

export default function FactoryZone({ gameState }) {
    const allGoods = Object.entries(gameState.inv).filter(([k, v]) => v > 0.1 && !['feedWheat', 'feedCorn', 'water'].includes(k));
    const factLevel = gameState.factoryLevel || 1;

    return (
        <ScrollView contentContainerStyle={tw`pb-36 pt-24 px-4 bg-backgroundLight`}>
      {/* Inventory */}
      <View style={tw`mb-6`}>
        <Text style={tw`text-xs font-black text-slate-800 uppercase tracking-wider mb-2 px-1`}>Your Stock</Text>
        {allGoods.length === 0 ? (
          <View style={tw`bg-white rounded-2xl p-4 items-center shadow-sm border border-dashed border-slate-300`}>
              <Text style={tw`text-xs font-bold text-slate-400`}>No goods yet — start the coops!</Text>
          </View>
        ) : (
          <View style={tw`flex-row flex-wrap gap-2`}>
              {allGoods.map(([k, v]) => (
                  <View key={k} style={tw`bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-1.5 flex-row items-center gap-2`}>
                      <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>{k}</Text>
                      <Text style={tw`text-xs font-black text-primary`}>{v < 10 ? v.toFixed(1) : Math.floor(v)}</Text>
                  </View>
              ))}
          </View>
        )}
      </View>

      {/* Queue */}
      <View style={tw`mb-6`}>
        <Text style={tw`text-xs font-black text-slate-800 uppercase tracking-wider mb-2 px-1`}>
            Processing Queue ({gameState.factoryQueue.length}/{gameState.factorySlots} Slots)
        </Text>
        {gameState.factoryQueue.length === 0 ? (
            <View style={tw`bg-white rounded-2xl p-6 items-center shadow-sm border border-slate-200`}>
                <Text style={tw`text-xs font-bold text-slate-400`}>Queue empty — add recipes below</Text>
            </View>
        ) : (
            <View style={tw`flex-col gap-2`}>
                {gameState.factoryQueue.map((j, i) => {
                    const active = i < gameState.factorySlots;
                    const pct = Math.min(100, (j.progress || 0) * 100);
                    return (
                        <View key={j.id} style={tw`bg-white rounded-xl p-3 shadow-sm border ${active ? 'border-primary/50' : 'border-slate-200'} flex-row items-center gap-3`}>
                           <Text style={tw`text-2xl`}>{j.icon}</Text>
                           <View style={tw`flex-1`}>
                              <Text style={tw`text-[11px] font-bold text-slate-800 mb-1.5`}>{j.name}</Text>
                              <View style={tw`w-full h-1.5 bg-slate-100 rounded-full overflow-hidden`}>
                                 <View style={[tw`h-full bg-primary rounded-full`, { width: `${pct}%` }]} />
                              </View>
                           </View>
                           <Text style={tw`text-[10px] font-black w-8 text-right ${active ? 'text-primary' : 'text-slate-400'}`}>
                               {active ? `${Math.floor((1 - j.progress) * j.totalTime / gameStore._getFactorySpeed(gameState))}s` : '⏳'}
                           </Text>
                        </View>
                    );
                })}
            </View>
        )}
      </View>

      {/* Recipes */}
      <View style={tw`mb-6`}>
        <Text style={tw`text-xs font-black text-slate-800 uppercase tracking-wider mb-2 px-1`}>
            Available Recipes (Level {factLevel})
        </Text>
        <View style={tw`flex-col gap-3`}>
            {RECIPES.filter(r => r.unlockLevel <= factLevel).map(r => {
                const canMake = Object.entries(r.inputs).every(([k, v]) => (gameState.inv[k] || 0) >= v);

                return (
                    <View key={r.id} style={tw`bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex-col gap-3`}>
                        <View style={tw`flex-row items-start gap-4`}>
                            <View style={tw`w-12 h-12 rounded-xl bg-slate-50 items-center justify-center flex-shrink-0`}>
                                <Text style={tw`text-3xl`}>{r.icon}</Text>
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-sm font-bold text-slate-800 mb-0.5`}>{r.name}</Text>
                                <Text style={tw`text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1`}>Yields: {r.qty}x {r.output} · {r.time}s</Text>
                                <Text style={tw`text-[10px] text-green-600 font-black uppercase tracking-wider`}>
                                    Value: ~${(r.qty * r.sellPrice * gameStore.getPriceMultiplier()).toFixed(0)}
                                </Text>
                            </View>
                            <TouchableOpacity disabled={!canMake} onPress={() => gameStore.queueRecipe(r.id)} style={tw`px-4 py-2 ${canMake ? 'bg-primary' : 'bg-slate-100'} rounded-lg items-center`}>
                                <Text style={tw`text-[10px] font-black uppercase ${canMake ? 'text-white' : 'text-slate-400'}`}>Queue</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={tw`pt-2 border-t border-slate-100 flex-row flex-wrap gap-1.5`}>
                            {Object.entries(r.inputs).map(([k, v]) => {
                                const have = Math.floor(gameState.inv[k] || 0);
                                const ok = have >= v;
                                return (
                                    <View key={k} style={tw`px-2 py-0.5 rounded ${ok ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <Text style={tw`text-[9px] font-bold uppercase ${ok ? 'text-green-700' : 'text-red-600'}`}>{k} {have}/{v}</Text>
                                    </View>
                                )
                            })}
                        </View>
                    </View>
                );
            })}
        </View>
      </View>
    </ScrollView>
  );
}
