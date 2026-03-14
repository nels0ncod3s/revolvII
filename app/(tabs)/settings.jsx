import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../../Context/appContext';

/* ------------------ Reusable Item ------------------ */

function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  right,
  showArrow = true,
  theme, // Receive theme prop
}) {
  return (
    <TouchableOpacity 
      style={[styles.item, { borderBottomColor: theme.border }]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconBox, { backgroundColor: theme.iconBg }]}>
          <Ionicons name={icon} size={22} color="#6366f1" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitle, { color: theme.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.itemSubtitle, { color: theme.subText }]}>{subtitle}</Text>}
        </View>
      </View>

      {right ? right : showArrow && (
        <Ionicons name="chevron-forward" size={18} color={theme.subText} />
      )}
    </TouchableOpacity>
  );
}

/* ------------------ Screen ------------------ */

export default function Settings() {
  const router = useRouter();
  
  // Use Global State
  const { darkMode, setDarkMode, currency, updateCurrency, theme } = useApp();

  const selectLanguage = () =>
    Alert.alert('Language', 'Choose language', [
      { text: 'English', onPress: () => console.log('English selected') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const selectCurrency = () =>
    Alert.alert('Currency', 'Choose display currency', [
      { text: '₦ Nigerian Naira (NGN)', onPress: () => updateCurrency('NGN') },
      { text: '$ US Dollar (USD)', onPress: () => updateCurrency('USD') },
      { text: '£ Pound (GBP)', onPress: () => updateCurrency('GBP') },
      { text: '€ Euro (EUR)', onPress: () => updateCurrency('EUR') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
            <Text style={[styles.subtitle, { color: theme.subText }]}>Manage your preferences</Text>
          </View>

          {/* Profile */}
          <Section title="Profile" theme={theme}>
            <SettingsItem
              icon="person-outline"
              title="Edit profile"
              subtitle="Personal information"
              onPress={() => Alert.alert('Coming soon')}
              theme={theme}
            />
          </Section>

          {/* Preferences */}
          <Section title="Preferences" theme={theme}>
            <SettingsItem
              icon="moon-outline"
              title="Dark mode"
              subtitle={darkMode ? "On" : "Off"}
              theme={theme}
              right={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                  ios_backgroundColor="#e5e7eb"
                />
              }
              showArrow={false}
            />

            <SettingsItem
              icon="card-outline"
              title="Currency"
              subtitle={`${currency.symbol} ${currency.code}`}
              onPress={selectCurrency}
              theme={theme}
            />
            
             <SettingsItem
              icon="language-outline"
              title="Language"
              subtitle="English"
              onPress={selectLanguage}
              theme={theme}
            />
          </Section>

          {/* App Info & About */}
          <Section title="About App" theme={theme}>
             <SettingsItem
              icon="information-circle-outline"
              title="About Us"
              subtitle="Who we are & Socials"
              onPress={() => router.push('/about')}
              theme={theme}
            />

            <SettingsItem
              icon="shield-checkmark-outline"
              title="Privacy & security"
              onPress={() => Alert.alert('Coming soon')}
              theme={theme}
            />

            <SettingsItem
              icon="layers-outline"
              title="App version"
              subtitle="v1.0.2"
              showArrow={false}
              theme={theme}
            />
          </Section>

        </ScrollView>
      </SafeAreaView>
    </>
  );
}

/* ------------------ Section Wrapper ------------------ */

function Section({ title, children, theme }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: theme.card }]}>{children}</View>
    </View>
  );
}

/* ------------------ Styles ------------------ */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // Background color is handled inline via theme
  },
  container: {
    paddingBottom: 32,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    marginLeft: 20,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    // Shadow for generic look
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  item: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});