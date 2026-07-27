# 仿真视频电话 / Fake WeChat Video Call

> 一个用 React Native + Expo 制作的**纯 UI 仿真** Android App。打开即是「微信视频来电」全屏界面，用于拍摄「假装视频通话」的短视频素材。不含任何真实微信连接，纯前端模拟。

## 为什么做这个项目（想法）

很多开发者（码农）和朋友，其实不太敢、也不好意思直接对着镜头拍视频 —— 尤其是不少偏内向的「i 人」。想拍点素材发朋友圈 / 短视频，却总卡在「要不还是别拍了」这一步。

这个 App 就是为解决这个问题而做的：打开就是一段逼真的「微信视频来电」，你可以把它当作拍摄背景或素材，轻松录下「正在跟人视频通话」的画面。有了这个「正当理由」，镜头前的尴尬就少了，再也不用硬找话题、硬营业。

纯 UI 仿真，不涉及任何真实通话，仅供个人拍摄 / 学习使用。

## 功能特性

- 仿微信视频来电全屏界面：来电头像、昵称、接听 / 挂断按钮
- 摄像头实时预览（前置 / 后置切换）
- 录像与截图（基于 ffmpeg-kit）
- 完全离线运行，无需联网、无需登录

## 技术栈

- React Native 0.74
- Expo SDK 51
- TypeScript
- ffmpeg-kit-react-native 6.0.2（录像 / 截图）
- expo-camera / expo-av

## 安装使用

1. 在 Releases 下载 `app-debug.apk`
2. 传到 Android 手机，允许「安装未知来源应用」后安装
3. 打开 App 即可进入仿真视频来电界面开始拍摄

## 自行构建（开发者）

环境要求：Node 18+、JDK 17、Android SDK（API 34）、Android NDK 26

```bash
npm install
npx expo prebuild --platform android   # 生成 android/ 原生工程
# 在 android/app/build.gradle 的 react 块中添加：debuggableVariants = []
# （否则 debug 包不含 JS，打开会白屏）
cd android
./gradlew assembleDebug
```

产物：`android/app/build/outputs/apk/debug/app-debug.apk`

> 注：本项目已预生成 `android/` 目录，克隆后可直接 `cd android && ./gradlew assembleDebug`（需先 `npm install`）。

## 目录结构

- `App.tsx` / `index.ts` —— 应用入口与界面
- `assets/` —— 图标、启动图等资源
- `android/` —— 原生 Android 工程（已配置 minSdk 24、ffmpeg-kit 仓库）
- `app.json` —— Expo 配置

## 免责声明

本项目与腾讯微信无任何隶属或关联关系，仅为个人学习 / 短视频拍摄用途的 UI 仿真演示，**请勿用于欺诈、冒充他人或任何违法违规用途**。微信及相关标识归腾讯所有。

## License

MIT © beizhaiai-gif
