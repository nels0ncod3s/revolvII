import React, { useState } from 'react';
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

/* ------------------ Reusable Item ------------------ */

function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  right,
  showArrow = true,
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemLeft}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={22} color="#6366f1" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{title}</Text>
          {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
        </View>
      </View>

      {right ? right : showArrow && (
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      )}
    </TouchableOpacity>
  );
}

/* ------------------ Screen ------------------ */

export default function Settings() {
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('English');
  const [currency, setCurrency] = useState('₦ Nigerian Naira');

  const signOut = () =>
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => router.replace('/onboarding') },
    ]);

  const selectLanguage = () =>
    Alert.alert('Language', 'Choose language', [
      { text: 'English', onPress: () => setLanguage('English') },
      { text: 'Yoruba', onPress: () => setLanguage('Yoruba') },
      { text: 'Igbo', onPress: () => setLanguage('Igbo') },
      { text: 'Hausa', onPress: () => setLanguage('Hausa') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const selectCurrency = () =>
    Alert.alert('Currency', 'Choose currency', [
      { text: '₦ Nigerian Naira', onPress: () => setCurrency('₦ Nigerian Naira') },
      { text: '$ US Dollar', onPress: () => setCurrency('$ US Dollar') },
      { text: '€ Euro', onPress: () => setCurrency('€ Euro') },
      { text: '£ Pound', onPress: () => setCurrency('£ Pound') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Manage your preferences</Text>
          </View>

          {/* Profile */}
          <Section title="Profile">
            <SettingsItem
              icon="person-outline"
              title="Edit profile"
              subtitle="Personal information"
              onPress={() => Alert.alert('Coming soon')}
            />
          </Section>

          {/* Preferences */}
          <Section title="Preferences">
            <SettingsItem
              icon="moon-outline"
              title="Dark mode"
              subtitle="Reduce eye strain"
              right={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                />
              }
              showArrow={false}
            />

            <SettingsItem
              icon="language-outline"
              title="Language"
              subtitle={language}
              onPress={selectLanguage}
            />

            <SettingsItem
              icon="card-outline"
              title="Currency"
              subtitle={currency}
              onPress={selectCurrency}
            />
          </Section>

          {/* App */}
          <Section title="App">
            <SettingsItem
              icon="notifications-outline"
              title="Notifications"
              onPress={() => Alert.alert('Coming soon')}
            />

            <SettingsItem
              icon="shield-checkmark-outline"
              title="Privacy & security"
              onPress={() => Alert.alert('Coming soon')}
            />

            <SettingsItem
              icon="help-circle-outline"
              title="Help & support"
              onPress={() => Alert.alert('Coming soon')}
            />
          </Section>

          {/* About */}
          <Section title="About">
            <SettingsItem
              icon="information-circle-outline"
              title="App version"
              subtitle="v1.0.0"
              showArrow={false}
            />

            <SettingsItem
              icon="document-text-outline"
              title="Terms & Privacy"
              onPress={() => Alert.alert('Coming soon')}
            />
          </Section>

          {/* Sign out */}
          <TouchableOpacity style={styles.logout} onPress={signOut}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </>
  );
}

/* ------------------ Section Wrapper ------------------ */

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

/* ------------------ Styles ------------------ */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    color: '#64748b',
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
    color: '#0f172a',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  item: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  logout: {
    marginTop: 40,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  },
});
