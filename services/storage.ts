
export const storage = {
  save: (key: string, data: any) => {
    try {
      localStorage.setItem(`ventus_${key}`, JSON.stringify(data));
    } catch (e) {
      console.error('Save failed', e);
    }
  },
  load: <T,>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(`ventus_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Load failed', e);
      return defaultValue;
    }
  }
};
