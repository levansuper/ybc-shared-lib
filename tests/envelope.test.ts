import { describe, it, expect } from 'vitest';
import {
  buildEnvelopeHeaders,
  readEnvelopeFromHeaders,
  EVENT_HEADER_ID,
  EVENT_HEADER_SOURCE,
  EVENT_HEADER_OCCURRED_AT,
  EVENT_HEADER_SCHEMA_VERSION,
  type EventEnvelope,
} from '../src/envelope';

describe('envelope helpers', () => {
  const env: EventEnvelope = {
    eventId: 'evt-123',
    source: 'ybc-balance-api',
    occurredAt: '2026-07-01T12:00:00.000Z',
    schemaVersion: 1,
  };

  describe('buildEnvelopeHeaders', () => {
    it('should stamp every field as a string-valued header', () => {
      const headers = buildEnvelopeHeaders(env);
      expect(headers).toEqual({
        [EVENT_HEADER_ID]: 'evt-123',
        [EVENT_HEADER_SOURCE]: 'ybc-balance-api',
        [EVENT_HEADER_OCCURRED_AT]: '2026-07-01T12:00:00.000Z',
        [EVENT_HEADER_SCHEMA_VERSION]: '1',
      });
    });

    it('should stringify schemaVersion', () => {
      const headers = buildEnvelopeHeaders({ ...env, schemaVersion: 42 });
      expect(headers[EVENT_HEADER_SCHEMA_VERSION]).toBe('42');
      expect(typeof headers[EVENT_HEADER_SCHEMA_VERSION]).toBe('string');
    });
  });

  describe('readEnvelopeFromHeaders', () => {
    it('should round-trip build → read to equal fields', () => {
      const headers = buildEnvelopeHeaders(env);
      const parsed = readEnvelopeFromHeaders(headers);
      expect(parsed).toEqual(env);
    });

    it('should parse schemaVersion back to a number', () => {
      const parsed = readEnvelopeFromHeaders(buildEnvelopeHeaders(env));
      expect(parsed.schemaVersion).toBe(1);
      expect(typeof parsed.schemaVersion).toBe('number');
    });

    it('should return an empty partial for absent headers (legacy producer)', () => {
      const parsed = readEnvelopeFromHeaders({});
      expect(parsed).toEqual({});
      expect(parsed.eventId).toBeUndefined();
      expect(parsed.source).toBeUndefined();
      expect(parsed.occurredAt).toBeUndefined();
      expect(parsed.schemaVersion).toBeUndefined();
    });

    it('should tolerate a partial header set', () => {
      const parsed = readEnvelopeFromHeaders({
        [EVENT_HEADER_ID]: 'evt-x',
        [EVENT_HEADER_SOURCE]: undefined,
        [EVENT_HEADER_OCCURRED_AT]: '2026-01-01T00:00:00.000Z',
      });
      expect(parsed.eventId).toBe('evt-x');
      expect(parsed.source).toBeUndefined();
      expect(parsed.occurredAt).toBe('2026-01-01T00:00:00.000Z');
      expect(parsed.schemaVersion).toBeUndefined();
    });

    it('should ignore a non-numeric schemaVersion header', () => {
      const parsed = readEnvelopeFromHeaders({
        [EVENT_HEADER_SCHEMA_VERSION]: 'not-a-number',
      });
      expect(parsed.schemaVersion).toBeUndefined();
    });
  });
});
