import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../styles';

export default function BottomNav({ tab, setTab }) {
  return (
    <View style={[tw`absolute bottom-0 left-0 right-0 w-full z-40 bg-white border-t border-slate-200 px-2 pb-6 pt-3 shadow-lg`, { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10 }]} >
      <View style={tw`flex-row items-center justify-between`}>
        {[
          { id: 'farm', label: 'Farm', icon: 'agriculture' },
          { id: 'market', label: 'Town', icon: 'storefront' },
          { id: 'factory', label: 'Recipes', icon: 'menu-book' },
          { id: 'upgrades', label: 'Upgrades', icon: 'trending-up' },
          { id: 'trucks', label: 'Trucks', icon: 'local-shipping' },
        ].map((item) => {
          const isActive = tab === item.id;

          let containerStyle = tw`flex items-center justify-center w-10 h-10 rounded-xl transition-all`;
          if (item.id === 'factory') {
            containerStyle = tw`items-center justify-center w-12 h-12 -mt-7 rounded-full bg-primary border-2 border-white shadow-lg shadow-primary/40`;
          } else if (isActive) {
            containerStyle = [containerStyle, tw`bg-primary` ];
          } else {
            containerStyle = [containerStyle, tw`bg-slate-100` ];
          }

          let labelStyle = tw`text-[10px] font-interBold mt-1 uppercase tracking-wider`;
          if (isActive) labelStyle = [labelStyle, tw`text-primary font-interBlack` ];
          else labelStyle = [labelStyle, tw`text-slate-400` ];

          const iconColor = (item.id === 'factory' || isActive) ? '#fff' : '#94a3b8';
          const iconSize = item.id === 'factory' ? 24 : 20;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => setTab(item.id)}
              style={tw`flex-1 items-center gap-1 active:scale-95`}
            >
              <View style={containerStyle}>
                <MaterialIcons name={item.icon} size={iconSize} color={iconColor} />
              </View>
              <Text style={labelStyle}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
