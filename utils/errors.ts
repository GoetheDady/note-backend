export class ValidationError extends Error {
  status: number;
  
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}
