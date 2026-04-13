// src/styles/index.js
import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#185FA5',
  primaryBg: '#E6F1FB',
  primaryText: '#0C447C',
  success: '#3B6D11',
  successBg: '#EAF3DE',
  warning: '#854F0B',
  warningBg: '#FAEEDA',
  danger: '#A32D2D',
  dangerBg: '#FCEBEB',
  bg: '#F5F5F0',
  surface: '#FFFFFF',
  border: '#E8E6DF',
  text: '#1A1A18',
  text2: '#6B6B66',
  text3: '#9B9B96',
};

export const s = StyleSheet.create({
  // Layout
  flex1: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: 16 },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 12 },

  // Header
  header: {
    backgroundColor: colors.primary,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // Text
  label: { fontSize: 12, color: colors.text2, marginBottom: 3 },
  value: { fontSize: 14, fontWeight: '500', color: colors.text },
  muted: { fontSize: 13, color: colors.text2 },
  small: { fontSize: 12, color: colors.text3 },

  // Row
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },

  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    fontSize: 11,
    fontWeight: '600',
    overflow: 'hidden',
  },

  // Buttons
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  btnText: { fontSize: 14, fontWeight: '500', color: colors.text },
  btnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  btnPrimaryText: { color: '#fff' },
  btnSuccess: { backgroundColor: colors.successBg, borderColor: '#C0DD97' },
  btnSuccessText: { color: colors.success },
  btnDanger: { backgroundColor: colors.dangerBg, borderColor: '#F7C1C1' },
  btnDangerText: { color: colors.danger },

  // Input
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },

  // Timeline
  tlContainer: { paddingVertical: 4 },
  tlItem: { flexDirection: 'row', gap: 12, paddingVertical: 8, alignItems: 'flex-start' },
  tlDot: { width: 12, height: 12, borderRadius: 6, marginTop: 3, flexShrink: 0 },
  tlLine: { width: 1, height: 24, backgroundColor: colors.border, marginLeft: 5.5 },
  tlTitle: { fontSize: 13, fontWeight: '500', color: colors.text },
  tlSub: { fontSize: 11, color: colors.text3, marginTop: 1 },

  // Nota tag
  notaTag: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  notaTagText: { fontSize: 12, fontWeight: '500', color: colors.primaryText },

  // Map
  map: { height: 180, borderRadius: 8, overflow: 'hidden', marginTop: 8 },

  // Proof upload area
  uploadArea: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  uploadTitle: { fontSize: 14, fontWeight: '500', color: colors.text, marginTop: 8 },
  uploadSub: { fontSize: 12, color: colors.text2, marginTop: 4 },
});
