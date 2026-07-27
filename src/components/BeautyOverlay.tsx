import React from 'react';
import { View, StyleSheet } from 'react-native';

// 预览级美颜叠加：在原相机预览之上盖半透明层，模拟「美白 / 磨皮」观感，
// 让用户在录制前就能看到美颜效果。
//
// 注意：真正进入成片的美颜由 CallScreen 的 ffmpeg 合成负责——
// 录制完自己画面后，用 ffmpeg 的 eq(亮度/饱和度≈美白) + gblur(≈磨皮) 滤镜处理，
// 与这里的预览参数保持一致，所以「所见即所得」。成片同时叠加对方视频画中画。
export default function BeautyOverlay({ whitening, smoothing }: { whitening: number; smoothing: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', zIndex: 1 }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(255,255,255,${whitening * 0.35})` }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(255,236,224,${smoothing * 0.22})` }]} />
    </View>
  );
}
