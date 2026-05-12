import type { ParsedTransaction } from '@/lib/engine/types';

export interface ExchangeParser {
  readonly id: string;
  readonly name: string;
  readonly extensions: readonly string[];
  canParse(filename: string, sample: string): boolean;
  parse(file: File): Promise<ParsedTransaction[]>;
}

export class UnsupportedFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedFileError';
  }
}

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ParseError';
  }
}
