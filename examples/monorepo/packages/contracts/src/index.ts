export interface NotesApi {
  load(): Promise<string>;
  save(text: string): Promise<void>;
}
