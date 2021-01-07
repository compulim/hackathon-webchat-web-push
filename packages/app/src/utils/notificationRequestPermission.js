export default async function requestPermission() {
  const result = await new Promise(async (resolve, reject) => {
    try {
      const result = await window.Notification.requestPermission(resolve);

      resolve(result);
    } catch (err) {
      reject(err);
    }
  });

  if (result !== 'granted') {
    throw new Error('not granted');
  }
}
