import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { FFmpegKit } from 'ffmpeg-kit-react-native';
import { theme } from '../theme';
import Teleprompter from '../components/Teleprompter';
import BeautyOverlay from '../components/BeautyOverlay';
import { CounterpartPip, CounterpartFullscreen, CounterpartPicker, CounterpartSource, BUILTIN_MAP } from '../components/CounterpartPicker';

const { height: H } = Dimensions.get('window');

const DEFAULT_SCRIPT =
  '在这里输入你的口播台词，长按可粘贴。\n看着这里自然地说，就像在和好朋友视频通话。\n举着手机像在打视频电话，路人以为你在通话，其实在拍自己的口播素材。';

export default function CallScreen({ onHangup }: { onHangup?: () => void }) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false); // ffmpeg 合成中
  const [seconds, setSeconds] = useState(0);
  const [facing, setFacing] = useState<CameraType>('front');
  const [swap, setSwap] = useState(false); // 微信式：点小窗互换大小

  // 提词板
  const [teleprompterOn, setTeleprompterOn] = useState(false);
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [tpFontSize, setTpFontSize] = useState(28);
  const [tpSpeed, setTpSpeed] = useState(45);

  // 美颜（预览 + 进录制）
  const [beautyOn, setBeautyOn] = useState(false);
  const [whitening, setWhitening] = useState(0.5);
  const [smoothing, setSmoothing] = useState(0.5);

  // 对方画面
  const [pickerVisible, setPickerVisible] = useState(false);
  const [counterpart, setCounterpart] = useState<CounterpartSource>({ type: 'builtin', id: 'cn_male' });

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  async function ensurePerms() {
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) {
        Alert.alert('需要相机权限');
        return false;
      }
    }
    const ml = await MediaLibrary.requestPermissionsAsync();
    if (ml.status !== 'granted') {
      Alert.alert('需要相册权限', '用于将录制好的口播视频保存到相册');
      return false;
    }
    return true;
  }

  function localPath(uri: string) {
    return uri.startsWith('file://') ? uri.slice(7) : uri;
  }

  // 用 ffmpeg 把对方视频叠加为画中画 + 美颜滤镜，输出成片；swap=true 时对方全屏、自己为小窗
  async function composeWithPip(camUri: string, cpUri: string, white: number, smooth: number, swap: boolean) {
    const out = `${FileSystem.cacheDirectory}pip_${Date.now()}.mp4`;
    const bright = (white * 0.08).toFixed(3);
    const sat = (1 + white * 0.2).toFixed(3);
    const blur = smooth > 0.02 ? `,gblur=sigma=${(smooth * 1.5).toFixed(2)}` : '';
    const filter = swap
      ? `[1:v]scale=1080:1920[main];[0:v]eq=brightness=${bright}:saturation=${sat}${blur}[cam];[cam]scale=108:152[pip];[main][pip]overlay=W-w-16:90[out]`
      : `[0:v]eq=brightness=${bright}:saturation=${sat}${blur}[b];[1:v]scale=108:152[c];[b][c]overlay=W-w-16:90[pip]`;
    const outLabel = swap ? '[out]' : '[pip]';
    const cmd = `-y -i "${localPath(camUri)}" -stream_loop -1 -i "${localPath(cpUri)}" -filter_complex "${filter}" -map "${outLabel}" -map 0:a -c:a copy -shortest "${localPath(out)}"`;
    const session = await FFmpegKit.execute(cmd);
    const rc = await session.getReturnCode();
    const value = rc.isValueUndefined?.() ? -1 : rc.getValue();
    if (value !== 0) throw new Error('合成失败（画中画）');
    return out;
  }

  async function resolveCounterpartUri(src: CounterpartSource): Promise<string | null> {
    if (src.type === 'upload') return src.uri || null;
    if (src.type === 'builtin') {
      const m = BUILTIN_MAP[src.id];
      if (!m) return null;
      const asset = Asset.fromModule(m.src);
      await asset.downloadAsync();
      return asset.localUri || null;
    }
    return null;
  }

  async function startRecording() {
    if (recording || !cameraRef.current) return;
    const ok = await ensurePerms();
    if (!ok) return;
    setRecording(true);
    setProcessing(false);
    setSeconds(0);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 600, mute: false });
      let outUri = video.uri;

      const cpUri = await resolveCounterpartUri(counterpart);
      if (cpUri) {
        setProcessing(true);
        outUri = await composeWithPip(video.uri, cpUri, beautyOn ? whitening : 0, beautyOn ? smoothing : 0, swap);
      }
      await MediaLibrary.saveToLibraryAsync(outUri);
      Alert.alert('录制完成', cpUri ? '已保存到相册：含画中画的口播视频' : '已保存（未叠加对方画面）');
    } catch (e: any) {
      Alert.alert('录制失败', e?.message || '请重试');
    } finally {
      setRecording(false);
      setProcessing(false);
    }
  }

  function stopRecording() {
    if (!recording) return;
    cameraRef.current?.stopRecording?.();
  }

  function toggleSwap() {
    setSwap((s) => !s);
  }

  function handleHangup() {
    if (recording) {
      try {
        cameraRef.current?.stopRecording?.();
      } catch {
        /* ignore */
      }
    }
    onHangup?.();
  }

  async function handlePick(src: CounterpartSource) {
    if (src.type === 'upload') {
      try {
        const res = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
        if (!res.canceled && res.assets && res.assets.length > 0) {
          setCounterpart({ type: 'upload', uri: res.assets[0].uri });
        }
      } catch {
        Alert.alert('选择视频失败');
      }
    } else {
      setCounterpart(src);
    }
    setPickerVisible(false);
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.tip}>正在请求相机权限…</Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.tip}>需要相机权限才能使用</Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
          <Text style={styles.grantText}>授权</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {swap ? (
        <CounterpartFullscreen source={counterpart} />
      ) : (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} mirror={facing === 'front'} />
      )}

      {!swap && beautyOn && <BeautyOverlay whitening={whitening} smoothing={smoothing} />}

      <TouchableOpacity style={styles.pipWrap} onPress={toggleSwap} activeOpacity={0.9}>
        {swap ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} mirror={facing === 'front'} />
        ) : (
          <CounterpartPip source={counterpart} />
        )}
      </TouchableOpacity>

      <View style={styles.topBar}>
        <View style={styles.timerBox}>
          <Text style={styles.timer}>{`${mm}:${ss}`}</Text>
        </View>
        {recording && (
          <View style={styles.recIndicator}>
            <View style={styles.recDot} />
            <Text style={styles.recText}>REC</Text>
          </View>
        )}
        {processing && (
          <View style={styles.recIndicator}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.recText}>合成中</Text>
          </View>
        )}
      </View>

      <Teleprompter
        visible={teleprompterOn}
        script={script}
        fontSize={tpFontSize}
        speed={tpSpeed}
        onClose={() => setTeleprompterOn(false)}
        onScriptChange={setScript}
        onFontSizeChange={setTpFontSize}
        onSpeedChange={setTpSpeed}
      />

      {beautyOn && (
        <View style={styles.beautyPanel}>
          <SliderRow label="美白" value={whitening} onValue={setWhitening} />
          <SliderRow label="磨皮" value={smoothing} onValue={setSmoothing} />
        </View>
      )}

      <CounterpartPicker
        visible={pickerVisible}
        current={counterpart}
        onPick={handlePick}
        onClose={() => setPickerVisible(false)}
      />

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.ctrl, styles.hangup]} onPress={handleHangup}>
          <Ionicons name="call" size={24} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrl} onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}>
          <Ionicons name="camera-reverse" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrl} onPress={() => setPickerVisible(true)}>
          <Ionicons name="person-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.recBtn, recording && styles.recBtnActive]}
          onPress={recording ? stopRecording : startRecording}
          disabled={processing}
        >
          <View style={recording ? styles.recStopInner : styles.recInner} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctrl, teleprompterOn && styles.ctrlActive]} onPress={() => setTeleprompterOn((v) => !v)}>
          <Ionicons name="reader-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctrl, beautyOn && styles.ctrlActive]} onPress={() => setBeautyOn((v) => !v)}>
          <Ionicons name="sparkles" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SliderRow({ label, value, onValue }: { label: string; value: number; onValue: (n: number) => void }) {
  return (
    <View style={styles.sliderRow}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onValue(Math.max(0, +(value - 0.1).toFixed(2)))}>
        <Ionicons name="remove" size={18} color="#fff" />
      </TouchableOpacity>
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${value * 100}%` }]} />
      </View>
      <TouchableOpacity style={styles.stepBtn} onPress={() => onValue(Math.min(1, +(value + 0.1).toFixed(2)))}>
        <Ionicons name="add" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.black },
  center: { flex: 1, backgroundColor: theme.black, alignItems: 'center', justifyContent: 'center', gap: 12 },
  tip: { color: theme.textPrimary, fontSize: 14 },
  grantBtn: { backgroundColor: theme.wechatGreen, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  grantText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pipWrap: { position: 'absolute', top: 90, right: 16, width: 108, height: 152 },
  topBar: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  timerBox: { backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  timer: { color: theme.textPrimary, fontSize: 16, fontWeight: '600' },
  recIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.rejectRed },
  recText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  beautyPanel: {
    position: 'absolute',
    bottom: 96,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(20,20,22,0.82)',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sliderLabel: { color: theme.textPrimary, fontSize: 14, width: 40 },
  stepBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  sliderTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  sliderFill: { height: 6, backgroundColor: theme.beautyAccent },
  controls: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
  },
  ctrl: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  ctrlActive: { backgroundColor: theme.beautyAccent },
  hangup: { backgroundColor: theme.rejectRed },
  recBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  recBtnActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
  recInner: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.rejectRed },
  recStopInner: { width: 24, height: 24, borderRadius: 4, backgroundColor: theme.rejectRed },
});
