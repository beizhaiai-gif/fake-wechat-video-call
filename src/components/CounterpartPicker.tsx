import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { theme } from '../theme';

export type CounterpartSource =
  | { type: 'off' }
  | { type: 'builtin'; id: string }
  | { type: 'upload'; uri: string };

// 内置真实视频形象（AI 生成 / 真实人物视频，放 assets/counterparts）。
// 用 gen_counterparts 脚本（scripts/gen_counterparts.cjs）生成真实视频填充。
export const BUILTINS = [
  { id: 'cn_male', label: '中国 · 男', sub: '内置形象', src: require('../../assets/counterparts/cn_male.mp4') },
  { id: 'cn_female', label: '中国 · 女', sub: '内置形象', src: require('../../assets/counterparts/cn_female.mp4') },
  { id: 'foreign_male', label: '外国 · 男', sub: '内置形象', src: require('../../assets/counterparts/foreign_male.mp4') },
  { id: 'foreign_female', label: '外国 · 女', sub: '内置形象', src: require('../../assets/counterparts/foreign_female.mp4') },
];
export const BUILTIN_MAP: Record<string, (typeof BUILTINS)[number]> = Object.fromEntries(
  BUILTINS.map((b) => [b.id, b])
);

// 对方视频画中画小窗
export function CounterpartPip({ source }: { source: CounterpartSource }) {
  if (source.type === 'off') return null;
  const m = source.type === 'builtin' ? BUILTIN_MAP[source.id] : null;
  return (
    <View style={styles.pip}>
      {source.type === 'upload' ? (
        <Video
          style={StyleSheet.absoluteFill}
          source={{ uri: source.uri }}
          resizeMode="cover"
          isLooping
          shouldPlay
          volume={0}
          useNativeControls={false}
        />
      ) : m ? (
        <Video
          style={StyleSheet.absoluteFill}
          source={m.src}
          resizeMode="cover"
          isLooping
          shouldPlay
          volume={0}
          useNativeControls={false}
        />
      ) : null}
      <View style={styles.pipLabel}>
        <Text style={styles.pipLabelText}>{m ? m.label : '对方视频'}</Text>
      </View>
    </View>
  );
}

// 对方视频全屏（交换布局时用：自己小窗、对方全屏）
export function CounterpartFullscreen({ source }: { source: CounterpartSource }) {
  if (source.type === 'off') return null;
  const m = source.type === 'builtin' ? BUILTIN_MAP[source.id] : null;
  const videoSrc = source.type === 'upload' ? { uri: source.uri } : m ? m.src : null;
  if (!videoSrc) return null;
  return (
    <Video
      style={StyleSheet.absoluteFill}
      source={videoSrc}
      resizeMode="cover"
      isLooping
      shouldPlay
      volume={0}
      useNativeControls={false}
    />
  );
}

// 对方画面来源选择面板
export function CounterpartPicker({
  visible,
  onPick,
  onClose,
}: {
  visible: boolean;
  current: CounterpartSource;
  onPick: (s: CounterpartSource) => void;
  onClose: () => void;
}) {
  if (!visible) return null;
  const options: { key: string; label: string; icon: any; source: CounterpartSource }[] = [
    { key: 'off', label: '关闭对方画面', icon: 'close-circle', source: { type: 'off' } },
    ...BUILTINS.map((b) => ({
      key: b.id,
      label: b.label,
      icon: 'person',
      source: { type: 'builtin', id: b.id } as CounterpartSource,
    })),
    { key: 'upload', label: '上传本地视频', icon: 'cloud-upload', source: { type: 'upload', uri: '' } },
  ];
  return (
    <View style={styles.panelWrap}>
      <TouchableOpacity style={styles.mask} onPress={onClose} activeOpacity={1} />
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>对方画面（视频形式）</Text>
        {options.map((o) => (
          <TouchableOpacity key={o.key} style={styles.opt} onPress={() => onPick(o.source)}>
            <Ionicons name={o.icon} size={22} color="#fff" />
            <Text style={styles.optText}>{o.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.cancel} onPress={onClose}>
          <Text style={styles.cancelText}>取消</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pip: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: '#222',
  },
  pipLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 3,
  },
  pipLabelText: { color: '#fff', fontSize: 10, textAlign: 'center' },
  panelWrap: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  mask: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.panel,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12,
    paddingBottom: 36,
  },
  panelTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  optText: { color: '#fff', fontSize: 15 },
  cancel: {
    marginTop: 4,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  cancelText: { color: theme.textSecondary, fontSize: 15 },
});
