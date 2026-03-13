import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../styles';
import gameStore from '../gameEngine';
import { CONTRACT_POOL } from '../constants';

export default function MarketZone({ gameState }) {
    const mult = gameStore.getPriceMultiplier();

    const spotGoods = [
        { id: 'egg', icon: '🥚', name: 'Raw Eggs', price: 2.2 },
        { id: 'freeRange', icon: '🐓', name: 'Free Range', price: 5.5 },
        { id: 'organic', icon: '🌿', name: 'Organic', price: 7.8 },
        { id: 'powdered', icon: '🥛', name: 'Powdered', price: 6.0 },
        { id: 'mayo', icon: '🫙', name: 'Mayo Jar', price: 14 },
        { id: 'omelette', icon: '🍳', name: 'Omelette', price: 11.5 },
        { id: 'cake', icon: '🎂', name: 'Egg Cake', price: 37 },
        { id: 'custard', icon: '🍮', name: 'Custard', price: 18 },
        { id: 'vaccine', icon: '💉', name: 'Protein Serum', price: 200 },
    ];

    const activeContracts = gameState.contracts.filter(c => !c.accepted);

    return (
        <ScrollView contentContainerStyle={tw`pb-32 px-4 bg-slate-100`}>
      {/* Ticker */}
      <View style={tw`bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-700 p-3 mb-6`}>
          <View style={tw`flex-row justify-between items-center mb-2`}>
             <Text style={tw`text-[9px] font-interBlack text-slate-500 uppercase tracking-wider`}>Live Market Rates</Text>
             <View style={tw`flex-row items-center gap-2`}>
                <Text style={tw`text-[9px] font-black uppercase ${mult > 1 ? 'text-green-500' : 'text-red-500'}`}>Trend: {(mult * 100).toFixed(0)}%</Text>
                {gameState.frenzyActive > 0 && <Text style={tw`text-[9px] font-black bg-primary text-white px-1.5 rounded`}>FRENZY!</Text>}
             </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`flex-row items-center mt-2`}>
              {spotGoods.map((g, i) => {
                  const p = (g.price * mult).toFixed(2);
                  const up = Math.random() > 0.5;
                  return (
                      <View key={i} style={tw`flex-row items-center gap-1.5 mx-4`}>
                          <Text style={tw`text-xs font-bold text-slate-400`}>{g.name}</Text>
                          <Text style={tw`text-xs font-black ${up ? 'text-green-500' : 'text-red-500'}`}>{up ? '▲' : '▼'} ${p}</Text>
                      </View>
                  )
              })}
          </ScrollView>
      </View>

      {/* Contracts */}
      <View style={tw`mb-6`}>
        <View style={tw`flex-row justify-between items-center mb-3 px-1`}>
          <Text style={tw`text-xs font-interBlack text-slate-800 uppercase tracking-wider`}>Active Contracts</Text>
          <View style={tw`flex-row items-center gap-2`}>
            <TouchableOpacity onPress={() => gameStore.refreshContracts()} style={tw`px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg`}>
              <Text style={tw`text-[9px] font-black uppercase text-slate-600`}>🔁 Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => gameStore.startSupplyRush()} style={tw`px-2 py-1 bg-amber-100 border border-amber-300 rounded-lg`}>
              <Text style={tw`text-[9px] font-black uppercase text-amber-800`}>⚡ Rush</Text>
            </TouchableOpacity>
          </View>
        </View>
        {activeContracts.length === 0 ? (
          <View style={tw`bg-white rounded-2xl p-6 items-center shadow-sm border border-slate-200`}>
              <Text style={tw`text-xs font-bold text-slate-400`}>No active contracts.</Text>
          </View>
        ) : (
          <View style={tw`flex-col gap-3`}>
              {activeContracts.map(c => {
                  const have = Math.floor(gameState.inv[c.want] || 0);
                  const canFill = have >= c.qty;
                  const earn = Math.floor(c.qty * c.pricePerUnit * mult);
                  const timeLeft = Math.floor(c.ticksLeft / 60);

                  return (
                      <View key={c.id} style={tw`bg-white rounded-2xl p-4 shadow-sm border ${c.urgent ? 'border-amber-400' : 'border-slate-200'} flex-row items-start gap-4`}>
                          <View style={tw`w-12 h-12 rounded-full bg-slate-50 items-center justify-center border border-slate-100`}>
                            <MaterialIcons name="business" size={24} color="#94a3b8" />
                          </View>
                          <View style={tw`flex-1`}>
                             <Text style={tw`text-sm font-interBlack text-slate-800`}>{c.buyer.split(' ').slice(1).join(' ')}</Text>
                             <Text style={tw`text-[10px] text-slate-500 font-interBold uppercase tracking-wider mb-2`}>Needs: {c.qty} {c.want} · Have: {have}</Text>
                             <View style={tw`flex-row flex-wrap gap-2 mb-3`}>
                                <View style={tw`bg-green-50 px-2 py-0.5 rounded-full`}><Text style={tw`text-[9px] font-interBlack text-green-600 uppercase`}>Pay: ${earn}</Text></View>
                                <View style={tw`bg-slate-100 px-2 py-0.5 rounded-full`}><Text style={tw`text-[9px] font-black text-slate-500 uppercase`}>{timeLeft}m left</Text></View>
                                {c.urgent && <View style={tw`bg-amber-50 px-2 py-0.5 rounded-full`}><Text style={tw`text-[9px] font-black text-amber-600 uppercase`}>Urgent</Text></View>}
                             </View>
                             <TouchableOpacity disabled={!canFill} onPress={() => gameStore.acceptContract(c.id)} style={tw`w-full py-2.5 ${canFill ? 'bg-green-500 shadow-md' : 'bg-slate-100'} rounded-xl items-center active:scale-95 transition-all`}>
                                <Text style={tw`text-xs font-black uppercase ${canFill ? 'text-white' : 'text-slate-400'}`}>{canFill ? 'Fulfill Contract' : `Need ${c.qty - have} more`}</Text>
                             </TouchableOpacity>
                          </View>
                      </View>
                  )
              })}
          </View>
        )}
      </View>

      {/* Mini-Game Store */}
      <View style={tw`mb-6`}> 
        <Text style={tw`text-xs font-black text-slate-800 uppercase tracking-wider mb-3 px-1`}>Mini-Game Store</Text>
        <View style={tw`bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex-col gap-2`}> 
          {gameState.miniGames?.map((g) => (
            <View key={g.id} style={tw`flex-row justify-between items-center bg-slate-50 p-2 rounded-lg`}> 
              <View style={tw`flex-1`}>
                <Text style={tw`text-xs font-black text-slate-700`}>{g.name}</Text>
                <Text style={tw`text-[8px] text-slate-500`}>{g.desc}</Text>
              </View>
              {g.unlocked ? (
                <TouchableOpacity onPress={() => gameStore.playMiniGame(g.id)} style={tw`px-2 py-1 bg-primary rounded-md`}>
                  <Text style={tw`text-[9px] font-black text-white`}>Play</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => gameStore.unlockMiniGame(g.id)} style={tw`px-2 py-1 bg-amber-500 rounded-md`}>
                  <Text style={tw`text-[9px] font-black text-white`}>Unlock $${g.price}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Spot Market */}
      <View style={tw`mb-6`}>
         <Text style={tw`text-xs font-black text-slate-800 uppercase tracking-wider mb-3 px-1`}>Spot Market</Text>
         <View style={tw`flex-row flex-wrap gap-3 justify-between`}>
             {spotGoods.map(g => {
                 const avail = Math.floor(gameState.inv[g.id] || 0);
                 const price = (g.price * mult).toFixed(2);
                 const sellAll = avail > 0;

                 return (
                     <View key={g.id} style={tw`w-[48%] bg-white rounded-3xl p-4 shadow-sm border border-slate-200 items-center justify-between`}>
                         <View style={tw`relative w-14 h-14 rounded-2xl bg-slate-50 items-center justify-center mb-3 shadow-inner border border-slate-100`}>
                            <Text style={tw`text-3xl`}>{g.icon}</Text>
                            {avail > 0 && (
                              <View style={tw`absolute -top-1 -right-1 bg-primary px-1.5 py-0.5 rounded-full border border-white`}>
                                <Text style={tw`text-[8px] font-black text-white`}>{avail}</Text>
                              </View>
                            )}
                         </View>
                         <Text style={tw`text-xs font-black text-slate-800 text-center mb-1`}>{g.name}</Text>
                         <Text style={tw`text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-3`}>${price} / unit</Text>
                         
                         <View style={tw`flex-col gap-2 w-full mt-auto`}>
                            <TouchableOpacity disabled={avail < 10} style={tw`w-full py-1.5 items-center justify-center rounded-lg ${avail < 10 ? 'bg-slate-50' : 'bg-slate-100'}`} onPress={() => gameStore.sellSpot(g.id, 10)}>
                               <Text style={tw`font-black text-[9px] uppercase text-slate-500`}>Sell 10</Text>
                            </TouchableOpacity>
                            <TouchableOpacity disabled={!sellAll} style={tw`w-full py-2 items-center justify-center rounded-lg ${sellAll ? 'bg-primary/10 border border-primary/20' : 'bg-slate-50'}`} onPress={() => gameStore.sellSpot(g.id, avail)}>
                               <Text style={tw`font-black text-[10px] uppercase ${sellAll ? 'text-primary' : 'text-slate-400'}`}>Sell All</Text>
                            </TouchableOpacity>
                         </View>
                     </View>
                 );
             })}
         </View>
      </View>

      {/* Mini Games */}
      <View style={tw`mb-16`}> 
        <Text style={tw`text-xs font-black text-slate-800 uppercase tracking-wider mb-3 px-1`}>Market Mini-Game</Text>
        <View style={tw`bg-white rounded-2xl p-4 border border-dashed border-slate-300`}> 
          <Text style={tw`text-[10px] text-slate-600 mb-2`}>Activate short-term rush mode to boost trade sales and contract income by 50% (30s).</Text> 
          <TouchableOpacity onPress={() => gameStore.startSupplyRush()} style={tw`bg-amber-500 py-2 rounded-lg items-center`}> 
            <Text style={tw`text-xs font-black text-white`}>Start Supply Rush</Text> 
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  );
}
