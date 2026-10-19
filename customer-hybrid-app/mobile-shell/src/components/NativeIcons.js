import React from 'react';
import Svg, { Path, Circle, Line, Rect, G, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

export const MapPinSvgIcon = ({ size = 16, color = "#FFA64C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

export const ChevronDownSvgIcon = ({ size = 14, color = "#FFFFFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m6 9 6 6 6-6" />
  </Svg>
);

export const SettingsSvgIcon = ({ size = 13, color = "#FFFFFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </Svg>
);

export const StoreSvgIcon = ({ size = 17, color = "#FFA64C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
    <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <Path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <Path d="M2 7h20" />
  </Svg>
);

export const BoxSvgIcon = ({ size = 17, color = "#94A3B8" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <Path d="m3.3 7 8.7 5 8.7-5" />
    <Path d="M12 22V12" />
  </Svg>
);

export const SearchSvgIcon = ({ size = 16, color = "#64748B" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" />
    <Path d="m21 21-4.3-4.3" />
  </Svg>
);

export const MicSvgIcon = ({ size = 16, color = "#FFA64C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <Line x1="12" y1="19" x2="12" y2="22" />
  </Svg>
);

// "pay" wallet: shaded wallet with "pay" on its stitched face, a raised clasp, and a card and gold
// ₹ coin peeking out of the top. Wider than tall (40x32 viewBox); `width` sets the size.
export const WalletSvgIcon = ({ width = 44, color = "#0E8A42" }) => (
  <Svg width={width} height={(width * 32) / 40} viewBox="0 0 40 32">
    <Defs>
      {/* Shine at the top, shadow at the bottom, laid over the section colour */}
      <LinearGradient id="payWalletShade" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.28" />
        <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0" />
        <Stop offset="1" stopColor="#000000" stopOpacity="0.22" />
      </LinearGradient>
      <LinearGradient id="payWalletCoin" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#FFE58A" />
        <Stop offset="1" stopColor="#F2B705" />
      </LinearGradient>
    </Defs>
    {/* Back wall */}
    <Rect x="3" y="8" width="34" height="10" rx="4" fill={color} opacity="0.55" />
    {/* Card */}
    <G transform="rotate(-10 14 9)">
      <Rect x="6" y="4" width="16" height="10" rx="2" fill="#FFFFFF" />
      <Rect x="6" y="6.4" width="16" height="2" fill={color} opacity="0.35" />
    </G>
    {/* Coin */}
    <Circle cx="29" cy="7.5" r="5.6" fill="url(#payWalletCoin)" stroke="#D99A00" strokeWidth="1" />
    <Circle cx="29" cy="7.5" r="4.1" fill="none" stroke="#E0A400" strokeWidth="0.6" />
    <SvgText x="29" y="10.1" fontSize="7.2" fontWeight="bold" fill="#8A5A00" textAnchor="middle">₹</SvgText>
    {/* Body */}
    <Rect x="1" y="11" width="38" height="20" rx="5" fill={color} />
    <Rect x="1" y="11" width="38" height="20" rx="5" fill="url(#payWalletShade)" />
    <Rect x="3" y="13" width="34" height="16" rx="3.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="0.8" strokeDasharray="1.6 1.4" />
    {/* App font (loaded in App.js); no fontWeight, Android can't pair it with a custom family */}
    <SvgText x="15" y="24.6" fontSize="12.5" fontFamily="PlusJakartaSans-ExtraBold" letterSpacing="-0.2" fill="#FFFFFF" textAnchor="middle">pay</SvgText>
    {/* Clasp */}
    <Rect x="27" y="15.5" width="12" height="11" rx="3.5" fill="#000000" opacity="0.15" />
    <Rect x="27" y="15" width="12" height="10.5" rx="3.5" fill="#FFFFFF" />
    <Circle cx="31.5" cy="20.25" r="2.1" fill={color} />
    <Circle cx="30.9" cy="19.6" r="0.6" fill="#FFFFFF" opacity="0.7" />
  </Svg>
);

export const SlidersSvgIcon =({ size = 13, color = "#FFFFFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="4" y1="21" x2="4" y2="14" />
    <Line x1="4" y1="10" x2="4" y2="3" />
    <Line x1="12" y1="21" x2="12" y2="12" />
    <Line x1="12" y1="8" x2="12" y2="3" />
    <Line x1="20" y1="21" x2="20" y2="16" />
    <Line x1="20" y1="12" x2="20" y2="3" />
    <Line x1="1" y1="14" x2="7" y2="14" />
    <Line x1="9" y1="8" x2="15" y2="8" />
    <Line x1="17" y1="16" x2="23" y2="16" />
  </Svg>
);
