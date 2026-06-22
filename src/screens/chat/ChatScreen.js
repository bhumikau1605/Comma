import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState } from '../../context/AppContext';
import { AppwriteService } from '../../services/appwrite';
import { C, R, S } from '../../theme';

const AVATAR_COLORS = ['#4A7C59', '#4A6FA5', '#9B4A7C', '#C0622F', '#5B5EA6', '#2E7D6B'];
function avatarColor(str) {
  let hash = 0;
  for (let i = 0; i < (str?.length ?? 0); i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function Avatar({ name, size = 30 }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(name) }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials(name)}</Text>
    </View>
  );
}

// Read ticks component
function ReadTick({ isRead }) {
  return (
    <Text style={[styles.tick, isRead && styles.tickRead]}>
      {isRead ? '✓✓' : '✓'}
    </Text>
  );
}

export default function ChatScreen({ route }) {
  const { listing, sellerName } = route.params;
  const { currentUser } = useAppState();
  const insets = useSafeAreaInsets();

  const myId = currentUser?.id ?? 'user1';
  const myName = currentUser?.name ?? 'You';
  const otherName = listing.isAnonymous ? 'Anonymous' : sellerName;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    const unsub = AppwriteService.subscribeMessages(listing.id, (msgs) => {
      setMessages(msgs);
      // Mark messages sent to me as read
      AppwriteService.markMessagesRead(listing.id, myId);
    });
    return unsub;
  }, [listing.id, myId]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setText('');
    setSending(true);
    try {
      await AppwriteService.sendMessage({
        listingId: listing.id,
        senderId: myId,
        senderName: myName,
        receiverId: listing.sellerId,
        text: trimmed,
      });
      const updated = await AppwriteService.fetchMessages(listing.id);
      setMessages(updated);
    } catch {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const renderItem = ({ item, index }) => {
    const isMe = item.sender_id === myId;
    const prev = messages[index - 1];
    const next = messages[index + 1];
    const isFirstInGroup = !prev || prev.sender_id !== item.sender_id;
    const isLastInGroup = !next || next.sender_id !== item.sender_id;
    const senderName = isMe ? myName : (item.sender_name || otherName);

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem, !isLastInGroup && { marginBottom: 2 }]}>
        {/* Avatar — left side for others, only on last bubble in group */}
        {!isMe && (
          <View style={styles.avatarSlot}>
            {isLastInGroup ? <Avatar name={senderName} size={28} /> : null}
          </View>
        )}

        <View style={[styles.bubbleWrap, isMe ? styles.bubbleWrapMe : styles.bubbleWrapThem]}>
          {/* Sender name — only first bubble in group, not me */}
          {isFirstInGroup && !isMe && (
            <Text style={styles.senderName}>{senderName}</Text>
          )}

          <View style={[
            styles.bubble,
            isMe ? styles.bubbleMe : styles.bubbleThem,
            isFirstInGroup && isMe && styles.bubbleMeFirst,
            isFirstInGroup && !isMe && styles.bubbleThemFirst,
          ]}>
            <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.text}</Text>
            <View style={styles.bubbleMeta}>
              <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                {formatTime(item.$createdAt)}
              </Text>
              {/* Read ticks — only on my messages */}
              {isMe && <ReadTick isRead={item.is_read === true} />}
            </View>
          </View>
        </View>

        {/* Spacer for my messages */}
        {isMe && <View style={styles.avatarSlot} />}
      </View>
    );
  };

  const kvOffset = Platform.OS === 'ios' ? 56 + insets.top : 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={kvOffset}
    >
      {/* Listing preview */}
      <View style={styles.listingPreview}>
        {listing.imageUrl ? (
          <Image source={{ uri: listing.imageUrl }} style={styles.previewImg} resizeMode="cover" />
        ) : (
          <View style={styles.previewIcon}><Text style={{ fontSize: 18 }}>🖼</Text></View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.previewTitle} numberOfLines={1}>{listing.title}</Text>
          <Text style={styles.previewPrice}>{listing.price === 0 ? 'Free' : `₹${Math.round(listing.price)}`}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: listing.status === 'active' ? C.green : C.muted }]} />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.$id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>👋</Text>
            <Text style={styles.emptyMsg}>Say hi to {otherName}!</Text>
            <Text style={styles.emptySub}>Ask about the item, negotiate, or make an offer</Text>
          </View>
        }
        renderItem={renderItem}
      />

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={C.muted}
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
          returnKeyType="send"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={send}
          disabled={!text.trim() || sending}
          activeOpacity={0.8}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  listingPreview: {
    flexDirection: 'row', alignItems: 'center',
    margin: 12, padding: 12,
    backgroundColor: C.card, borderRadius: R.lg, ...S.sm,
  },
  previewImg: { width: 44, height: 44, borderRadius: R.sm },
  previewIcon: { width: 44, height: 44, borderRadius: R.sm, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  previewTitle: { fontWeight: '700', fontSize: 13, color: C.primary },
  previewPrice: { color: C.green, fontSize: 13, fontWeight: '600', marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  messageList: { paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 4, flexGrow: 1 },
  emptyWrap: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyMsg: { fontSize: 16, fontWeight: '700', color: C.primary, textAlign: 'center' },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 6, lineHeight: 18 },

  // Message rows
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowThem: { justifyContent: 'flex-start' },
  avatarSlot: { width: 32, marginHorizontal: 4 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },

  // Bubbles
  bubbleWrap: { maxWidth: '72%' },
  bubbleWrapMe: { alignItems: 'flex-end' },
  bubbleWrapThem: { alignItems: 'flex-start' },
  senderName: { fontSize: 11, fontWeight: '700', color: C.muted, marginBottom: 3, marginLeft: 4 },
  bubble: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18 },
  bubbleMe: { backgroundColor: C.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: C.card, borderBottomLeftRadius: 4, ...S.sm },
  bubbleMeFirst: { borderTopRightRadius: 18 },
  bubbleThemFirst: { borderTopLeftRadius: 18 },
  bubbleText: { fontSize: 14, color: C.primary, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 },
  bubbleTime: { fontSize: 10, color: C.muted },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.55)' },

  // Read ticks
  tick: { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '600' },
  tickRead: { color: '#4FC3F7' }, // blue when read

  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingTop: 12,
    backgroundColor: C.card,
    borderTopWidth: 1, borderTopColor: C.border,
    gap: 10,
  },
  input: {
    flex: 1, backgroundColor: C.bg, borderRadius: R.lg,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: C.primary, maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: C.primary, width: 42, height: 42,
    borderRadius: 21, alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: { opacity: 0.35 },
  sendIcon: { color: '#fff', fontSize: 16 },
});
