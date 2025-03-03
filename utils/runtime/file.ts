export type Handle = {
  name: string;
  read(path: string): Promise<ArrayBuffer | null>;
  write(path: string, data: ArrayBuffer): Promise<boolean>;
};

export const fromDirectoryHandle = async (
  handle: FileSystemDirectoryHandle,
): Promise<Handle> => {
  return {
    name: handle.name,
    async read(path: string): Promise<ArrayBuffer | null> {
      try {
        const fileHandle = await handle.getFileHandle(path);
        const file = await fileHandle.getFile();
        return await file.arrayBuffer();
      } catch (e) {
        return null;
      }
    },
    async write(path: string, data: ArrayBuffer): Promise<boolean> {
      try {
        const fileHandle = await handle.getFileHandle(path, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(data);
        await writable.close();
        return true;
      } catch (e) {
        return false;
      }
    },
  };
};
