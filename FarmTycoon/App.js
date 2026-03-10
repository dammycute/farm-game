import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import tw from './src/styles';
import { useGameState } from './src/useGameState';

import Header from './src/components/Header';
import BottomNav from './src/components/BottomNav';
import FarmZone from './src/components/FarmZone';
import MarketZone from './src/components/MarketZone';
import FactoryZone from './src/components/FactoryZone';
import UpgradesZone from './src/components/UpgradesZone';
import TrucksZone from './src/components/TrucksZone';
import FinanceZone from './src/components/FinanceZone';
import { ToastRenderer, FloatRenderer, LevelCompleteModal } from './src/components/OverlayKit';

export default function App() {
  const gameState = useGameState();
  const [tab, setTab] = useState('farm');

  return (
    <View style={tw`flex-1 bg-slate-100 items-center`}>
      <StatusBar style="auto" />
      <View style={tw`flex-1 w-full max-w-md bg-white shadow-2xl relative overflow-hidden`}>
        <Header gameState={gameState} setTab={setTab} />

        <View style={tw`flex-1 bg-backgroundLight relative`}>
          {tab === 'farm' && <FarmZone gameState={gameState} />}
          {tab === 'market' && <MarketZone gameState={gameState} />}
          {tab === 'factory' && <FactoryZone gameState={gameState} />}
          {tab === 'upgrades' && <UpgradesZone gameState={gameState} />}
          {tab === 'trucks' && <TrucksZone gameState={gameState} />}
          {tab === 'finance' && <FinanceZone gameState={gameState} />}

          <FloatRenderer floaters={gameState.floaters} />
          <ToastRenderer toasts={gameState.toasts} />
          <LevelCompleteModal visible={gameState.levelCompletePopup} />
        </View>

        <BottomNav tab={tab} setTab={setTab} />
      </View>
    </View>
  );
}
