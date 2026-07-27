import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CallScreen from './src/screens/CallScreen';
import { theme } from './src/theme';

export default function App() {
  const [inCall, setInCall] = useState(false);

  if (!inCall) {
    return (
      <View style={styles.home}>
        <StatusBar barStyle="light-content" />
        <View style={styles.logoCircle}>
          <Ionicons name="videocam" size={56} color={theme.wechatGreen} />
        </View>
        <Text style={styles.title}>仿真视频电话</Text>
        <Text style={styles.sub}>拍「假装视频通话」短视频素材</Text>
        <TouchableOpacity style={styles.startBtn} onPress={() => setInCall(true)}>
          <Ionicons name="call" size={22} color="#fff" />
          <Text style={styles.startText}>模拟来电</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>纯仿真 · 不连真实微信 · 不上架</Text>
      </View>
    );
  }

  return <CallScreen onHangup={() => setInCall(false)} />;
}

const styles = StyleSheet.create({
  home: {
    flex: 1,
    backgroundColor: theme.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(7,193,96,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { color: theme.textPrimary, fontSize: 26, fontWeight: '800' },
  sub: { color: theme.textSecondary, fontSize: 14, marginBottom: 18 },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.wechatGreen,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 30,
  },
  startText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  hint: { color: theme.textSecondary, fontSize: 12, marginTop: 10 },
});
