export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Scene {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  description?: string;
  tags?: string[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  sceneId?: string;
  userId: string;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  content: string;
  changelog?: string;
  createdAt: Date;
}

export interface FunctionTemplate {
  id: string;
  name: string;
  code: string;
  description?: string;
  language: string;
  category?: string;
  tags?: string[];
  params?: FunctionParam[];
  returnType?: string;
  examples?: FunctionExample[];
  sceneId?: string;
  userId: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FunctionParam {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
}

export interface FunctionExample {
  title: string;
  code: string;
  description?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateSceneRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface CreatePromptRequest {
  title: string;
  content: string;
  description?: string;
  tags?: string[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  sceneId?: string;
  isPublic?: boolean;
}

export interface TestPromptRequest {
  promptId: string;
  model: string;
  input: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CreateFunctionTemplateRequest {
  name: string;
  code: string;
  description?: string;
  language?: string;
  category?: string;
  tags?: string[];
  params?: FunctionParam[];
  returnType?: string;
  examples?: FunctionExample[];
  sceneId?: string;
  isPublic?: boolean;
}

export interface UpdateFunctionTemplateRequest extends Partial<CreateFunctionTemplateRequest> {
  id: string;
}
