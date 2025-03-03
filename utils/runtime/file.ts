export type File = {
  name: string;
  read(path: string): Promise<ArrayBuffer | null>;
  write(path: string, data: ArrayBuffer): Promise<boolean>;
};
