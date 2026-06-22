import React from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from './src/utils/safeArea';
import { ThemeProvider, useTheme } from './src/ThemeContext';

import { AppProvider } from './src/context/AppContext';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import CommunitySelectScreen from './src/screens/community/CommunitySelectScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import ListingDetailScreen from './src/screens/listing/ListingDetailScreen';
import CreateListingScreen from './src/screens/listing/CreateListingScreen'; 
import ChatScreen from './src/screens/chat/ChatScreen';
import InboxScreen from './src/screens/chat/InboxScreen';
import WishlistScreen from './src/screens/wishlist/WishlistScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import SellerProfileScreen from './src/screens/seller/SellerProfileScreen';
import EditListingScreen from './src/screens/listing/EditListingScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import TransactionHistoryScreen from './src/screens/profile/TransactionHistoryScreen';
import LeaderboardScreen from './src/screens/community/LeaderboardScreen';
import ReviewsScreen from './src/screens/seller/ReviewsScreen';
import BadgesScreen from './src/screens/profile/BadgesScreen';
import SettingsScreen from './src/screens/profile/SettingsScreen';
import BarcodeScannerScreen from './src/screens/listing/BarcodeScannerScreen';
import OffersScreen from './src/screens/chat/OffersScreen';
import SpinWheelScreen from './src/screens/profile/SpinWheelScreen';
import TemplatesScreen from './src/screens/listing/TemplatesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home:    { active: '⊞', inactive: '⊟' },
  Saved:   { active: '♥', inactive: '♡' },
  Inbox:   { active: '💬', inactive: '💬' },
  Profile: { active: '👤', inactive: '👤' },
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { C, isDark } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopWidth: 1,
          borderTopColor: C.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarIcon: ({ focused }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.3, color: C.primary }}>
                {focused ? icons.active : icons.inactive}
              </Text>
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.green, marginTop: 3 }} />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Saved" component={WishlistScreen} />
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { C } = useTheme();
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: C.bg },
          headerTintColor: C.primary,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700', fontSize: 17, color: C.primary },
          contentStyle: { backgroundColor: C.bg },
          animation: 'ios_from_right',
          animationDuration: 320,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          customAnimationOnGesture: true,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CommunitySelect" component={CommunitySelectScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: '' }} />
        <Stack.Screen name="CreateListing" component={CreateListingScreen} options={{ title: 'New Listing' }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params?.sellerName ?? 'Chat' })} />
        <Stack.Screen name="SellerProfile" component={SellerProfileScreen} options={{ title: '' }} />
        <Stack.Screen name="EditListing" component={EditListingScreen} options={{ title: 'Edit Listing' }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} options={{ title: 'Transaction History' }} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Leaderboard' }} />
        <Stack.Screen name="Reviews" component={ReviewsScreen} options={({ route }) => ({ title: `${route.params?.sellerName ?? 'Seller'} Reviews` })} />
        <Stack.Screen name="Badges" component={BadgesScreen} options={{ title: 'My Badges' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Offers" component={OffersScreen} options={{ title: 'My Offers' }} />
        <Stack.Screen name="SpinWheel" component={SpinWheelScreen} options={{ title: '🎡 Spin the Wheel', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Templates" component={TemplatesScreen} options={{ title: 'My Templates', animation: 'slide_from_bottom' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppProvider>
          <AppNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
