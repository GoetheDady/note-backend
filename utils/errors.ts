export class ValidationError extends Error {
  status: number;
  
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

export class AuthError extends Error {
  status: number;
  
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
    this.status = 401;
  }
}
