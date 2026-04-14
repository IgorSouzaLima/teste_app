import Constants from 'expo-constants';

function getCloudinaryConfig() {
  const extra =
    Constants.expoConfig?.extra ||
    Constants.manifest?.extra ||
    Constants.manifest2?.extra?.expoClient?.extra ||
    {};

  return extra.cloudinary || {};
}

export function getCloudinaryMissingConfig() {
  const config = getCloudinaryConfig();
  const missing = [];

  if (!config.cloudName || config.cloudName === 'SEU_CLOUD_NAME') {
    missing.push('cloud_name');
  }

  if (!config.uploadPreset || config.uploadPreset === 'SEU_UPLOAD_PRESET') {
    missing.push('upload_preset');
  }

  return missing;
}

export async function uploadComprovanteParaCloudinary(asset, viagemId) {
  const config = getCloudinaryConfig();
  const missing = getCloudinaryMissingConfig();

  if (missing.length > 0) {
    throw new Error(`Configure o Cloudinary no app antes de enviar comprovantes: ${missing.join(', ')}`);
  }

  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    type: asset.mimeType || 'image/jpeg',
    name: asset.fileName || `comprovante-${Date.now()}.jpg`,
  });
  formData.append('upload_preset', config.uploadPreset);
  formData.append('folder', `comprovantes/${viagemId}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.secure_url) {
    const detail =
      data?.error?.message ||
      data?.message ||
      'Nao foi possivel enviar a imagem ao Cloudinary.';
    throw new Error(detail);
  }

  return {
    fotoUrl: data.secure_url,
    fotoPublicId: data.public_id,
    bytes: data.bytes || null,
    width: data.width || null,
    height: data.height || null,
    format: data.format || null,
  };
}
