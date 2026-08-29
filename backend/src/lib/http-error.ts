export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    message: string,
    public readonly campos?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
