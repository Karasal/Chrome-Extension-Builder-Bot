
export interface ExtensionFile {
  name: string;
  language: string;
  content: string;
  description: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ExtensionProject {
  extensionName: string;
  summary: string;
  guideSteps: string[];
  files: ExtensionFile[];
}
