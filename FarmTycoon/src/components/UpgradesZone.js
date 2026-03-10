import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import tw from '../styles';
import gameStore from '../gameEngine';
import { FARM_UPGRADES, STAFF_ROLES } from '../constants';

export default function UpgradesZone({ gameState }) {
    const [tab, setTab] = useState('upgrades'); // 'upgrades' | 'staff'

    return (
        <View style={tw`flex-1 bg-backgroundLight`}>
      <View style={tw`flex-row border-b border-primary/10 pt-24 bg-white z-10`}>
        <TouchableOpacity style={tw`flex-1 py-3 border-b-4 ${tab === 'upgrades' ? 'border-primary' : 'border-transparent'} items-center`} onPress={() => setTab('upgrades')}>
          <Text style={tw`text-sm font-bold ${tab === 'upgrades' ? 'text-primary' : 'text-slate-500'}`}>Upgrades</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tw`flex-1 py-3 border-b-4 ${tab === 'staff' ? 'border-primary' : 'border-transparent'} items-center`} onPress={() => setTab('staff')}>
          <Text style={tw`text-sm font-bold ${tab === 'staff' ? 'text-primary' : 'text-slate-500'}`}>Staff</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={tw`pb-32`}>
        {tab === 'upgrades' && <UpgradesTab gameState={gameState} />}
        {tab === 'staff' && <StaffTab gameState={gameState} />}
      </ScrollView>
    </View>
  );
}

function UpgradesTab({ gameState }) {
  return (
    <View style={tw`p-4 flex-col gap-3`}>
      {FARM_UPGRADES.map((u) => {
        const count = gameState.upgrades[u.id] || 0;
        const cost = Math.floor(u.cost * Math.pow(1.6, count));
        const maxed = count >= u.max;
        const pct = Math.min(100, (count / u.max) * 100);
        const canAfford = !maxed && gameState.cash >= cost;

        return (
          <View key={u.id} style={tw`bg-white rounded-2xl p-4 border border-slate-200 shadow-sm overflow-hidden`}>
            {maxed && (
              <View style={tw`absolute top-[-10px] right-[-30px] w-24 h-24 overflow-hidden z-0`}>
                <View style={tw`bg-primary w-[200%] items-center justify-center absolute -right-6 top-8 rotate-45 shadow-md`}>
                   <Text style={tw`text-[8px] font-bold text-white`}>MAX</Text>
                </View>
              </View>
            )}

            <View style={tw`flex-row gap-4 z-10`}>
              <View style={tw`w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 items-center justify-center flex-shrink-0`}>
                <Text style={tw`text-2xl`}>{u.icon}</Text>
              </View>

              <View style={tw`flex-1`}>
                <View style={tw`flex-row justify-between items-start`}>
                  <View>
                    <Text style={tw`text-sm font-bold text-slate-800`}>{u.name}</Text>
                    <Text style={tw`text-xs text-slate-500 mt-0.5`}>{u.desc}</Text>
                  </View>
                </View>

                <View style={tw`mt-3 flex-row items-center gap-3`}>
                  <View style={tw`flex-1`}>
                    <View style={tw`flex-row justify-between mb-1`}>
                      <Text style={tw`text-[10px] font-bold text-slate-500 uppercase tracking-wider`}>Level {count}</Text>
                      <Text style={tw`text-[10px] font-bold text-slate-500 uppercase tracking-wider`}>Max {u.max}</Text>
                    </View>
                    <View style={tw`h-1.5 w-full bg-slate-100 rounded-full overflow-hidden`}>
                      <View style={[tw`h-full bg-primary rounded-full`, { width: `${pct}%` }]} />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={tw`mt-4 pt-3 border-t border-slate-100 flex-row justify-between items-center z-10`}>
              <View style={tw`flex-row items-center gap-1.5`}>
                {!maxed ? (
                   <>
                      <Text style={tw`text-[16px] text-green-500`}>💵</Text>
                      <Text style={tw`text-slate-700 font-black text-sm`}>$\{(cost).toLocaleString()}</Text>
                   </>
                ) : <Text style={tw`text-xs uppercase tracking-wider text-slate-400 font-black`}>Fully Upgraded</Text>}
              </View>
              <TouchableOpacity
                disabled={maxed || !canAfford}
                onPress={() => gameStore.buyFarmUpgrade(u.id)}
                style={tw`px-4 py-1.5 ${canAfford ? 'bg-slate-900 shadow-md' : 'bg-slate-100'} rounded-lg items-center`}
              >
                <Text style={tw`text-xs font-bold ${canAfford ? 'text-white' : 'text-slate-400'}`}>{maxed ? 'Maxed' : 'Upgrade'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function StaffTab({ gameState }) {
  const avgMorale = gameState.staff.length ? Math.round(gameState.staff.reduce((a, s) => a + (s.morale || 100), 0) / gameState.staff.length) : 100;

  return (
    <View style={tw`p-4`}>
      <View style={tw`bg-indigo-500 rounded-2xl p-4 mb-6 shadow-lg`}>
        <View style={tw`flex-row justify-between items-end mb-2`}>
          <View>
            <Text style={tw`text-sm font-bold text-white opacity-90`}>Team Morale</Text>
            <Text style={tw`text-[10px] text-white opacity-75 font-bold uppercase tracking-wider mt-0.5`}>High morale = Better bonuses</Text>
          </View>
          <Text style={tw`text-2xl font-black text-white`}>{avgMorale}%</Text>
        </View>
        <View style={tw`h-2 w-full bg-black/20 rounded-full overflow-hidden mt-2`}>
          <View style={[tw`h-full bg-white/90 rounded-full`, { width: `${avgMorale}%` }]} />
        </View>
      </View>

      {/* Available Hirings */}
      <View style={tw`flex-row justify-between items-end mb-3 px-1`}>
        <View>
          <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-wider`}>Your Team ({gameState.staff.length}/{gameState.maxStaff})</Text>
          <Text style={tw`text-xs font-bold text-slate-800 mt-0.5`}>${gameStore._getPayroll(gameState)}/day total payroll</Text>
        </View>
      </View>

      <View style={tw`flex-col gap-3 pb-8`}>
        {/* Render Available Roles */}
        {STAFF_ROLES.map(r => {
           const hired = gameState.staff.some(s => s.id === r.id);
           const hireCost = r.salary * 7;
           const canAfford = gameState.cash >= hireCost;
           const full = gameState.staff.length >= gameState.maxStaff;

           if (hired) return null; // Only show unhired

           return (
               <View key={r.id} style={tw`bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-sm flex-col gap-3`}>
                   <View style={tw`items-start flex-row gap-4`}>
                       <View style={tw`w-12 h-12 bg-white rounded-xl items-center justify-center flex-shrink-0`}>
                           <Text style={tw`text-3xl`}>{r.icon}</Text>
                       </View>
                       <View style={tw`flex-1`}>
                           <Text style={tw`text-sm font-bold text-slate-800 capitalize mb-1`}>{r.name}</Text>
                           <Text style={tw`text-[10px] text-primary font-bold uppercase tracking-wider mb-1`}>{r.bonus}</Text>
                           <Text style={tw`text-[9px] text-slate-400 capitalize`}>Salary: ${r.salary}/day</Text>
                       </View>
                   </View>
                   <TouchableOpacity
                     disabled={!canAfford || full}
                     onPress={() => gameStore.hireStaff(r.id)}
                     style={tw`w-full py-1.5 ${canAfford && !full ? 'bg-slate-900 shadow-md' : 'bg-slate-100'} rounded-lg items-center`}
                   >
                     <Text style={tw`text-xs font-bold ${canAfford && !full ? 'text-white' : 'text-slate-400'}`}>
                       {full ? 'No Empty Desks' : `Hire for $${hireCost} (1wk pay)`}
                     </Text>
                   </TouchableOpacity>
               </View>
           );
        })}

        {/* Render Hired Staff */}
        {gameState.staff.length > 0 && <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-wider mt-4 px-1`}>Active Roster</Text>}
        {gameState.staff.map(s => (
            <View key={s.id} style={tw`bg-white rounded-2xl p-4 border border-slate-200 shadow-sm`}>
                <View style={tw`flex-row items-center gap-4`}>
                    <View style={tw`w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center`}>
                        <Text style={tw`text-3xl`}>{s.icon}</Text>
                    </View>
                    <View style={tw`flex-1`}>
                        <Text style={tw`text-sm font-bold text-slate-800 capitalize`}>{s.name}</Text>
                        <Text style={tw`text-[9px] font-bold text-primary uppercase tracking-wider mt-0.5`}>{s.bonus}</Text>
                        <Text style={tw`text-[10px] font-black text-slate-500 mt-1`}>${s.salary}/day</Text>
                    </View>
                    <TouchableOpacity style={tw`w-8 h-8 bg-red-50 rounded-full items-center justify-center border border-red-200`} onPress={() => gameStore.fireStaff(s.id)}>
                        <Text style={tw`text-[12px]`}>❌</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={tw`mt-3 bg-slate-50 border border-slate-100 rounded-lg p-2`}>
                    <View style={tw`flex-row justify-between items-center mb-1`}>
                        <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>Morale</Text>
                        <Text style={tw`text-[9px] font-bold ${s.morale > 70 ? 'text-green-500' : 'text-amber-500'}`}>{s.morale || 100}%</Text>
                    </View>
                    <View style={tw`h-1 w-full bg-slate-200 rounded-full overflow-hidden`}>
                        <View style={[tw`h-full ${s.morale > 70 ? 'bg-green-500' : 'bg-amber-500'} rounded-full`, { width: `${s.morale || 100}%` }]} />
                    </View>
                </View>
            </View>
        ))}

      </View>
    </View>
  );
}
