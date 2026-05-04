// Shared photo-picker helper. Pulls a square image from the photo
// library, copies it into the app's documentDirectory immediately
// (so the URI survives app reinstalls — picker temp/cache locations
// get wiped on update), and returns the persistent URI.
//
// SDK 54 deprecated `MediaTypeOptions.Images` in favor of the array
// form `["images"]`. Using the new shape with a fallback so we work
// across SDKs.
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Alert } from "react-native";

function imageMediaTypes() {
  // SDK 54+ form
  if (ImagePicker.MediaType?.Images) return [ImagePicker.MediaType.Images];
  // SDK 53 array form
  if (typeof ImagePicker.MediaTypeOptions === "undefined") return ["images"];
  // Legacy enum
  return ImagePicker.MediaTypeOptions.Images;
}

// Copy a picked image into a stable location under documentDirectory.
// iOS clears /tmp and parts of the app's caches on reinstall; only
// documentDirectory survives. Returns the new URI.
export async function persistPhotoForPet(srcUri, petId) {
  if (!srcUri) return null;
  const safeId = (petId || "unsorted").replace(/[^a-zA-Z0-9_-]/g, "_");
  const dir = `${FileSystem.documentDirectory}pets/${safeId}/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  // Pull a sensible extension off the source URI (jpg/jpeg/png/heic).
  const cleanSrc = srcUri.split("?")[0].split("#")[0];
  const m = cleanSrc.match(/\.([a-zA-Z0-9]{1,5})$/);
  const ext = (m?.[1] || "jpg").toLowerCase();
  const dst = `${dir}${Date.now()}.${ext}`;
  await FileSystem.copyAsync({ from: srcUri, to: dst });
  return dst;
}

export async function pickPetPhoto({ petId } = {}) {
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
    const tempUri = result.assets[0].uri;
    // Stage to documentDirectory immediately so the URI survives app
    // reinstalls. If we don't have a petId yet (first-run onboarding),
    // park the file under "unsorted/" — the caller can move it once
    // the pet is created if it wants tighter scoping.
    return await persistPhotoForPet(tempUri, petId);
  } catch (e) {
    Alert.alert("Couldn't pick photo", e?.message || "Try again, or check photo permissions in Settings.");
    return null;
  }
}
