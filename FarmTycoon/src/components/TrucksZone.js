import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../styles';
import gameStore from '../gameEngine';
import { TRUCK_TYPES, ROUTES } from '../constants';

export default function TrucksZone({ gameState }) {
  const busyCount = gameState.trucks.filter(t => t.status === 'dispatched').length;
  const totalCap = gameState.trucks.reduce((acc, t) => acc + t.cap, 0);
  const activeCap = gameState.trucks.filter(t => t.status === 'dispatched').reduce((acc, t) => acc + t.load, 0);

  return (
    <ScrollView contentContainerStyle={tw`pb-36 pt-24 px-4 bg-backgroundLight`}>
      {/* Hero Stats */}
      <View style={tw`bg-slate-900 rounded-[1.5rem] p-5 shadow-xl relative overflow-hidden mb-6`}>
        <View style={tw`flex-row justify-between items-start mb-4 relative z-10`}>
          <View>
            <Text style={tw`text-white font-black text-lg`}>Truck Depot</Text>
            <Text style={tw`text-slate-400 text-xs font-bold uppercase tracking-wider mt-1`}>Manage Deliveries</Text>
          </View>
          <MaterialIcons name="local-shipping" size={100} color="rgba(255,255,255,0.05)" style={tw`absolute -right-6 -bottom-16`} pointerEvents="none" />
        </View>

        <View style={tw`flex-row gap-3 relative z-10`}>
          <View style={tw`flex-1 bg-white/10 rounded-2xl p-3 border border-white/10`}>
            <Text style={tw`text-xs text-slate-300 font-bold uppercase tracking-wider mb-1`}>🛣️ Routes Active</Text>
            <Text style={tw`text-xl font-black text-white`}>{busyCount} <Text style={tw`text-xs text-slate-400`}>/ {gameState.trucks.length}</Text></Text>
          </View>
          <View style={tw`flex-1 bg-white/10 rounded-2xl p-3 border border-white/10`}>
            <Text style={tw`text-xs text-slate-300 font-bold uppercase tracking-wider mb-1`}>📦 Vol en route</Text>
            <Text style={tw`text-xl font-black text-white`}>{activeCap} <Text style={tw`text-xs text-slate-400`}>/ {totalCap} max</Text></Text>
          </View>
        </View>
      </View>

      {/* Fleet */}
      <View style={tw`mb-6`}>
        <View style={tw`flex-row justify-between items-center mb-3 px-1`}>
          <Text style={tw`text-xs font-black text-slate-800 uppercase tracking-wider`}>Your Fleet</Text>
          <Text style={tw`text-[10px] font-bold text-slate-500 uppercase`}>{gameState.trucks.length}/{gameState.maxTrucks} Trucks</Text>
        </View>
        {gameState.trucks.length === 0 ? (
          <View style={tw`items-center py-8 bg-white rounded-2xl border border-dashed border-slate-300`}>
            <Text style={tw`text-sm font-bold text-slate-400`}>No trucks in fleet.</Text>
          </View>
        ) : (
          <View style={tw`flex-col gap-3`}>
            {gameState.trucks.map(t => {
              const tDef = TRUCK_TYPES.find(x => x.id === t.type);
              const iconStr = tDef?.icon || '🚚';

              if (t.status === 'dispatched') {
                const pct = Math.min(100, (t.tripProgress || 0) * 100);
                const route = ROUTES.find(r => r.id === t.currentRoute);
                return (
                  <View key={t.id} style={tw`bg-white rounded-2xl p-4 border border-blue-200 shadow-sm relative overflow-hidden`}>
                    <View style={tw`flex-row items-center gap-4 mb-3 relative z-10`}>
                      <View style={tw`w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center`}>
                        <Text style={tw`text-2xl`}>{iconStr}</Text>
                      </View>
                      <View style={tw`flex-1`}>
                        <View style={tw`flex-row justify-between items-start mb-1`}>
                          <Text style={tw`text-sm font-bold text-slate-800 capitalize`}>{t.name}</Text>
                          <Text style={tw`text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase`}>En Route</Text>
                        </View>
                        <Text style={tw`text-[10px] text-slate-500 font-bold uppercase tracking-wider`}>Delivering {t.load}x goods → {route?.name}</Text>
                      </View>
                    </View>
                    <View style={tw`relative z-10`}>
                      <View style={tw`flex-row justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase`}>
                        <Text style={tw`text-slate-500`}>FarmHQ</Text>
                        <Text style={tw`text-blue-600`}>{Math.floor((1 - t.tripProgress) * t.tripTime)}s left</Text>
                      </View>
                      <View style={tw`h-2 w-full bg-slate-100 rounded-full overflow-hidden`}>
                        <View style={[tw`h-full bg-blue-500 rounded-full relative`, { width: `${pct}%` }]} />
                      </View>
                    </View>
                  </View>
                );
              } else {
                const availRoutes = ROUTES.filter(r => tDef?.routes?.includes(r.id));
                return (
                  <View key={t.id} style={tw`bg-white rounded-2xl p-4 border border-slate-200 shadow-sm`}>
                    <View style={tw`flex-row items-center gap-4 mb-3`}>
                      <View style={tw`w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center`}>
                        <Text style={tw`text-2xl grayscale`}>{iconStr}</Text>
                      </View>
                      <View style={tw`flex-1`}>
                        <View style={tw`flex-row justify-between items-start mb-1`}>
                          <Text style={tw`text-sm font-bold text-slate-800 capitalize`}>{t.name}</Text>
                          <Text style={tw`text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md uppercase`}>Ready</Text>
                        </View>
                        <Text style={tw`text-[10px] text-slate-500 font-bold uppercase tracking-wider`}>Cap: {t.cap} units</Text>
                      </View>
                    </View>

                    <View style={tw`pt-2 border-t border-slate-100`}>
                      <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2`}>Dispatch Route:</Text>
                      <View style={tw`flex-row flex-wrap gap-2`}>
                        {availRoutes.map(r => (
                          <TouchableOpacity key={r.id} style={tw`flex-row items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg`} onPress={() => gameStore.dispatchTruck(t.id, r.id)}>
                            <Text style={tw`text-sm`}>{r.icon} {r.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                );
              }
            })}
          </View>
        )}
      </View>

      {/* Available to Buy */}
      <View style={tw`mb-6`}>
        <Text style={tw`text-xs font-black text-slate-800 uppercase tracking-wider mb-3 px-1`}>Dealership</Text>
        <View style={tw`flex-col gap-3`}>
          {TRUCK_TYPES.map(t => {
            const owned = gameState.trucks.some(x => x.type === t.id);
            const canAfford = gameState.cash >= t.cost;
            const full = gameState.trucks.length >= gameState.maxTrucks;

            if (owned) return null; // Only show unowned

            return (
              <View key={t.id} style={tw`bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-sm flex-row items-start gap-4`}>
                <View style={tw`w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Text style={tw`text-3xl`}>{t.icon}</Text>
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-sm font-bold text-slate-800 capitalize mb-1`}>{t.name}</Text>
                  <Text style={tw`text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1`}>Cap: {t.cap} units</Text>
                  <Text style={tw`text-[9px] text-slate-400 capitalize mb-3`}>Routes: {t.routes.map(r => ROUTES.find(x => x.id === r)?.name || r).join(', ')}</Text>

                  <TouchableOpacity
                    disabled={!canAfford || full}
                    onPress={() => gameStore.buyTruck(t.id)}
                    style={tw`w-full py-1.5 ${canAfford && !full ? 'bg-slate-900 shadow-md' : 'bg-slate-100'} rounded-lg items-center`}
                  >
                    <Text style={tw`text-xs font-bold ${canAfford && !full ? 'text-white' : 'text-slate-400'}`}>
                      {full ? 'Fleet is Full' : `Buy for $${t.cost.toLocaleString()}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Routes Info */}
      <View style={tw`pb-8`}>
        <Text style={tw`text-xs font-black text-slate-800 uppercase tracking-wider mb-3 px-1`}>Available Routes Info</Text>
        <View style={tw`flex-row flex-wrap justify-between gap-y-3`}>
          {ROUTES.map(r => (
            <View key={r.id} style={tw`w-[48%] bg-white rounded-xl p-3 border border-slate-200 shadow-sm items-center`}>
              <View style={tw`w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-2`}>
                <Text style={tw`text-xl`}>{r.icon}</Text>
              </View>
              <Text style={tw`text-xs font-bold text-slate-800`}>{r.name}</Text>
              <Text style={tw`text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-2`}>Dist: {r.dist}x · Vol: {r.vol}</Text>
              <Text style={tw`text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded`}>~{r.bonus} base px</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
