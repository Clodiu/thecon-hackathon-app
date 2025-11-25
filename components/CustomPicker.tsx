import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PickerItem {
  label: string;
  value: any;
}

interface CustomPickerProps {
  items: PickerItem[];
  selectedValue: any;
  onValueChange: (value: any) => void;
  theme: any;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export default function CustomPicker({
  items,
  selectedValue,
  onValueChange,
  theme,
  iconName,
}: CustomPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedLabel = items.find(item => item.value === selectedValue)?.label;

  const handleSelect = (value: any) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.pickerButton, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => setModalVisible(true)}
      >
        {iconName && <Ionicons name={iconName} size={20} color={theme.subtext} style={styles.icon} />}
        <Text style={[styles.pickerButtonText, { color: theme.text }]}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={20} color={theme.subtext} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <SafeAreaView>
              <FlatList
                data={items}
                keyExtractor={item => item.value.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.option, { borderBottomColor: theme.border }]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text style={[styles.optionText, { color: theme.text }]}>{item.label}</Text>
                    {selectedValue === item.value && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.tint} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </SafeAreaView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  option: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 18,
  },
});