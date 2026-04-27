// Shared photo-picker helper. Pulls a square image from the photo
// library, requests permission, returns the URI or null on cancel.
//
// SDK 54 deprecated `MediaTypeOptions.Images` in favor of the array
// form `["images"]`. Using the new shape with a fallback so we work
// across SDKs.
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

function imageMediaTypes() {
  // SDK 54+ form
  if (ImagePicker.MediaType?.Images) return [ImagePicker.MediaType.Images];
  // SDK 53 array form
  if (typeof ImagePicker.MediaTypeOptions === "undefined") return ["images"];
  // Legacy enum
  return ImagePicker.MediaTypeOptions.Images;
}

export async function pickPetPhoto() {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photo access needed", "Allow photo access in Settings to add a picture of your pet.");
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: imageMediaTypes(),
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return null;
    return result.assets[0].uri;
  } catch (e) {
    Alert.alert("Couldn't pick photo", e?.message || "Try again, or check photo permissions in Settings.");
    return null;
  }
}
