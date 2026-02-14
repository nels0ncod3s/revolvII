// app/(tabs)/index.jsx
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AddSubSheet from "../../components/addSubscription";
import { useSubscriptions } from '../../Context/subscriptionContext'; // <--- Import Context

export default function Home() {
  const { subscriptions, totalSpend } = useSubscriptions(); // <--- Get real data
  const [greeting, setGreeting] = useState("Good Morning");
  const sheetRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // Card component for list items
  const renderSubscription = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
         <Text style={{fontSize: 20}}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardCycle}>{item.cycle}</Text>
      </View>
      <Text style={styles.cardPrice}>₦{item.amount.toLocaleString()}</Text>
    </View>
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <AddSubSheet ref={sheetRef} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.profileContainer}><Text style={styles.profileEmoji}>👤</Text></View>
              <View>
                <Text style={styles.greetingText}>{greeting}</Text>
                <Text style={styles.helloText}>User</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => sheetRef.current?.expand()}>
              <Ionicons name="add" size={28} color="#8e44ad" />
            </TouchableOpacity>
          </View>

          {/* Total Spend */}
          <View style={styles.totalContainer}>
            <View style={styles.nairaContainer}>
              <Text style={styles.nairaSymbol}>₦</Text>
              <Text style={styles.totalAmount}>{totalSpend.toLocaleString()}</Text>
            </View>
            <Text style={styles.totalLabel}>Total Monthly Spend</Text>
          </View>

          {/* Subscription List or Empty State */}
          {subscriptions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No subscriptions yet</Text>
              <Text style={styles.emptyDescription}>Tap the plus button above to add your first subscription.</Text>
            </View>
          ) : (
            <FlatList
              data={subscriptions}
              keyExtractor={(item) => item.id}
              renderItem={renderSubscription}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc", paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight },
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 20 },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  profileContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginRight: 12 },
  profileEmoji: { fontSize: 24 },
  helloText: { fontSize: 18, fontWeight: "800", color: "#111111" },
  greetingText: { fontSize: 14, color: "#64748b" },
  addButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#fdf4ff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#f0abfc" },
  
  totalContainer: { alignItems: "center", marginBottom: 30, marginTop: 10 },
  nairaContainer: { flexDirection: "row", alignItems: "center" },
  nairaSymbol: { fontSize: 24, fontWeight: "700", color: "#a855f7", marginRight: 4, marginTop: 8 },
  totalAmount: { fontSize: 42, fontWeight: "900", color: "#1e293b" },
  totalLabel: { fontSize: 14, color: "#64748b" },

  emptyState: { alignItems: "center", marginTop: 50 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#475569", marginTop: 15 },
  emptyDescription: { fontSize: 14, color: "#94a3b8", textAlign: "center", marginTop: 8 },

  // New Card Styles
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  cardCycle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  cardPrice: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
});