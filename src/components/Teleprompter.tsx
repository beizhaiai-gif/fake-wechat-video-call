import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

const { height: H } = Dimensions.get('window');

type Props = {
  visible: boolean;
  script: string;
  fontSize: number;
  speed: number; // px / 秒
  onClose: () => void;
  onScriptChange: (s: string) => void;
  onFontSizeChange: (n: number) => void;
  onSpeedChange: (n: number) => void;
};

export default function Teleprompter({
  visible,
  script,
  fontSize,
  speed,
  onClose,
  onScriptChange,
  onFontSizeChange,
  onSpeedChange,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [editing, setEditing] = useState(false);
  const translateY = useRef(new Animated.Value(H * 0.42)).current;
  const [textHeight, setTextHeight] = useState(0);

  useEffect(() => {
    if (!playing) return;
    translateY.setValue(H * 0.42);
    const distance = H * 0.42 + textHeight;
    const duration = Math.max(1500, (distance / speed) * 1000);
    const anim = Animated.timing(translateY, {
      toValue: -textHeight,
      duration,
      useNativeDriver: true,
    });
    anim.start(() => setPlaying(false));
  }, [playing, script, fontSize, speed, textHeight]);

  function restart() {
    setPlaying(false);
    setTimeout(() => setPlaying(true), 50);
  }

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* 滚动字幕舞台 */}
      <View style={styles.stage} pointerEvents="none">
        <Animated.View style={{ transform: [{ translateY: translateY }] }}>
          <Text
            style={[styles.scriptText, { fontSize }]}
            onLayout={(e) => setTextHeight(e.nativeEvent.layout.height)}
          >
            {script}
          </Text>
        </Animated.View>
      </View>

      {/* 控制条 */}
      <View style={styles.bar} pointerEvents="auto">
        {editing ? (
          <TextInput
            style={styles.input}
            multiline
            autoFocus
            value={script}
            onChangeText={onScriptChange}
            placeholder="可粘贴或输入口播台词…（长按可粘贴）"
            placeholderTextColor={theme.textSecondary}
          />
        ) : (
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.barText}>编辑台词</Text>
          </TouchableOpacity>
        )}

        <View style={styles.row}>
          <TouchableOpacity onPress={() => onFontSizeChange(Math.max(16, fontSize - 4))}>
            <Ionicons name="remove" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.barText}>字号 {fontSize}</Text>
          <TouchableOpacity onPress={() => onFontSizeChange(Math.min(48, fontSize + 4))}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity onPress={() => onSpeedChange(Math.max(10, speed - 10))}>
            <Ionicons name="remove" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.barText}>速度 {speed}</Text>
          <TouchableOpacity onPress={() => onSpeedChange(Math.min(120, speed + 10))}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.playBtn}
          onPress={() => (editing ? setEditing(false) : playing ? setPlaying(false) : restart())}
        >
          <Ionicons name={playing ? 'pause' : 'play'} size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
          <Text style={styles.doneText}>完成</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  stage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: H * 0.55,
    alignItems: 'center',
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
  },
  scriptText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 38,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bar: {
    position: 'absolute',
    top: H * 0.56,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15,15,18,0.88)',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#fff',
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barText: { color: '#fff', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  playBtn: {
    alignSelf: 'center',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.wechatGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtn: { alignSelf: 'center', paddingVertical: 6 },
  doneText: { color: theme.textSecondary, fontSize: 14 },
});
