import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import tw from '../styles';
import gameStore from '../gameEngine';

export default function FinanceZone({ gameState }) {
    const profit = gameState.totalRevenue - gameState.totalExpenses;

    const ALL_MILESTONES = [
        { id: 'first_sale', icon: '🥚', label: 'First Sale' },
        { id: 'cash_500', icon: '💰', label: '$500 Cash' },
        { id: 'cash_2k', icon: '💵', label: '$2,000 Cash' },
        { id: 'factory_run', icon: '🏭', label: 'Factory Run' },
        { id: 'staff_3', icon: '👷', label: 'Full Team (3)' },
        { id: 'truck_fleet', icon: '🚚', label: '2 Trucks' },
        { id: 'contract_5', icon: '📋', label: '5 Contracts' },
        { id: 'revenue_10k', icon: '📈', label: '$10K Revenue' },
    ];

    return (
        <ScrollView contentContainerStyle={tw`pb-36 pt-24 px-4 bg-backgroundLight`}>
      <View style={tw`bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6`}>
          <Text style={tw`text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1`}>Net Profit</Text>
          <Text style={tw`text-4xl font-black ${profit >= 0 ? 'text-green-500' : 'text-red-500'} mb-1`}>
              ${Math.abs(Math.floor(profit)).toLocaleString()}
          </Text>
          <Text style={tw`text-xs font-bold text-slate-500`}>{profit >= 0 ? 'In the black ✅' : 'In the red ⚠️'}</Text>
          
          <View style={tw`mt-4 pt-4 border-t border-slate-100 flex-col gap-2`}>
              <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-slate-500 font-bold`}>Total Revenue</Text>
                  <Text style={tw`text-green-500 font-black`}>+${Math.floor(gameState.totalRevenue).toLocaleString()}</Text>
              </View>
              <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-slate-500 font-bold`}>Total Expenses</Text>
                  <Text style={tw`text-red-500 font-black`}>-${Math.floor(gameState.totalExpenses).toLocaleString()}</Text>
              </View>
              <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-slate-500 font-bold`}>Today Revenue</Text>
                  <Text style={tw`text-green-500 font-black`}>+${Math.floor(gameState.dailyRevenue).toLocaleString()}</Text>
              </View>
              <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-slate-500 font-bold`}>Payroll/Day</Text>
                  <Text style={tw`text-red-500 font-black`}>-${gameStore.getPayroll()}</Text>
              </View>
              <View style={tw`flex-row justify-between items-center mt-2 pt-2 border-t border-slate-100`}>
                  <Text style={tw`text-slate-800 font-black uppercase tracking-wider text-[10px]`}>Cash on Hand</Text>
                  <Text style={tw`text-amber-500 font-black`}>${Math.floor(gameState.cash).toLocaleString()}</Text>
              </View>
          </View>
      </View>

      <View style={tw`mb-6`}>
          <Text style={tw`text-xs font-black text-slate-800 uppercase tracking-wider mb-3 px-1`}>Milestones</Text>
          <View style={tw`flex-row flex-wrap gap-2`}>
              {ALL_MILESTONES.map(m => {
                 const unlocked = gameState.milestones[m.id];
                 return (
                     <View key={m.id} style={tw`flex-row items-center gap-2 px-3 py-1.5 rounded-full border ${unlocked ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                         <Text>{m.icon}</Text>
                         <Text style={tw`text-[10px] font-bold ${unlocked ? 'text-amber-800' : 'text-slate-500'} uppercase tracking-wider`}>{m.label}</Text>
                         {unlocked && <Text style={tw`text-[14px] text-amber-500 ml-1`}>✅</Text>}
                     </View>
                 );
              })}
          </View>
      </View>

      <View style={tw`pb-10`}>
          <Text style={tw`text-xs font-black text-slate-800 uppercase tracking-wider mb-3 px-1`}>Transaction History</Text>
          <View style={tw`flex-col gap-2`}>
              {gameState.ledger.length === 0 ? (
                  <View style={tw`items-center py-6 bg-white rounded-xl border border-dashed border-slate-300`}>
                     <Text style={tw`text-sm font-bold text-slate-400`}>No transactions yet.</Text>
                  </View>
              ) : (
                  gameState.ledger.map((e, index) => (
                      <View key={index} style={tw`bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex-row justify-between items-center`}>
                          <View>
                              <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>Day {e.day}</Text>
                              <Text style={tw`text-xs font-bold text-slate-700 leading-tight`}>{e.desc}</Text>
                          </View>
                          <Text style={tw`text-sm font-black ${e.amount > 0 ? 'text-green-500' : e.amount < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                              {e.amount > 0 ? '+' : ''}{e.amount !== 0 ? '$' + Math.abs(e.amount).toLocaleString() : '—'}
                          </Text>
                      </View>
                  ))
              )}
          </View>
      </View>
    </ScrollView>
  );
}
