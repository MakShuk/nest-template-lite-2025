export interface CreateLoggerOptions {
  category: string;
  context?: string;
}

export interface RequestContext {
  correlationId: string;
  requestId?: string | undefined;
}
