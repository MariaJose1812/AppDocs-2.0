import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { createPortal } from "react-dom";

const { width } = Dimensions.get("window");

export default function AlertModal({
  visible,
  title,
  message,
  buttons = [{ text: "Aceptar", onPress: () => {} }],
  onClose,
}) {
  const [isWeb, setIsWeb] = useState(false);
  useEffect(() => {
    setIsWeb(Platform.OS === "web");
  }, []);

  const modalContent = (
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.message}>{message}</Text>
        <View style={styles.buttonsRow}>
          {buttons.map((btn, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.button,
                btn.style === "cancel" && styles.cancelButton,
                btn.style === "danger" && styles.dangerButton,
              ]}
              onPress={() => {
                if (btn.onPress) btn.onPress();
                if (onClose) onClose();
              }}
            >
              <Text
                style={[
                  styles.buttonText,
                  btn.style === "cancel" && styles.cancelButtonText,
                ]}
              >
                {btn.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // Web: renderizar en el body usando portal
  if (isWeb && visible) {
    return createPortal(modalContent, document.body);
  }

  // Móvil: usar Modal nativo
  return (
    <Modal transparent visible={visible} animationType="fade">
      {modalContent}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  modalContainer: {
    width: width * 0.8,
    maxWidth: 320,
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#cbd5e1",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#0ea5e9",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#475569",
  },
  dangerButton: {
    backgroundColor: "#ef4444",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  cancelButtonText: {
    color: "#94a3b8",
  },
});
