export interface GameSession {
  userId: string;
  startTime: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UserData {
  phoneNumber: string;
  name: string;
}

