import React from 'react';
import { View } from 'react-native';

const rawSafeAreaContext = require('react-native-safe-area-context');
const SafeAreaContext = rawSafeAreaContext?.default ?? rawSafeAreaContext;

const RealSafeAreaProvider = SafeAreaContext.SafeAreaProvider;
const RealSafeAreaView = SafeAreaContext.SafeAreaView;
const RealUseSafeAreaInsets = SafeAreaContext.useSafeAreaInsets;

const useSafeAreaInsets = typeof RealUseSafeAreaInsets === 'function'
  ? RealUseSafeAreaInsets
  : () => ({ top: 0, bottom: 0, left: 0, right: 0 });

const SafeAreaViewFallback = ({ style, children, ...props }) => (
  <View style={style} {...props}>
    {children}
  </View>
);

const SafeAreaProvider = typeof RealSafeAreaProvider === 'function'
  ? RealSafeAreaProvider
  : (({ children }) => <>{children}</>);
const SafeAreaView = typeof RealSafeAreaView === 'function'
  ? RealSafeAreaView
  : SafeAreaViewFallback;

export { SafeAreaProvider, useSafeAreaInsets, SafeAreaView };
