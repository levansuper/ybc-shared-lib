import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from '../src/event-emitter';
import { SdkProducer } from '../src/producer';
import { MemberEvent, type LoginData } from '../src/types';
import {
  EVENT_HEADER_ID,
  EVENT_HEADER_SOURCE,
  EVENT_HEADER_OCCURRED_AT,
  EVENT_HEADER_SCHEMA_VERSION,
} from '../src/envelope';
import type { Logger } from '../src/logger';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function createMockSdkProducer() {
  return {
    send: vi.fn().mockResolvedValue(undefined),
  } as unknown as SdkProducer & { send: ReturnType<typeof vi.fn> };
}

const LOGIN: LoginData = { memberId: 'u1', ip: '10.0.0.1', clientId: 'casino-1' };

describe('EventEmitter', () => {
  let producer: SdkProducer & { send: ReturnType<typeof vi.fn> };
  let emitter: EventEmitter;

  beforeEach(() => {
    producer = createMockSdkProducer();
    emitter = new EventEmitter(producer, 'ybc-auth-api');
  });

  it('should call producer.send with the value unchanged', async () => {
    await emitter.emit(MemberEvent.Login, LOGIN, { key: 'u1' });

    expect(producer.send).toHaveBeenCalledOnce();
    const [topic, message] = producer.send.mock.calls[0];
    expect(topic).toBe(MemberEvent.Login);
    expect(message.value).toEqual(LOGIN);
    expect(message.key).toBe('u1');
  });

  it('should stamp the standard envelope headers', async () => {
    await emitter.emit(MemberEvent.Login, LOGIN);

    const { headers } = producer.send.mock.calls[0][1];
    expect(headers[EVENT_HEADER_ID]).toMatch(UUID_RE);
    expect(headers[EVENT_HEADER_SOURCE]).toBe('ybc-auth-api');
    expect(headers[EVENT_HEADER_OCCURRED_AT]).toMatch(ISO_RE);
    expect(headers[EVENT_HEADER_SCHEMA_VERSION]).toBe('1');
  });

  it('should generate a fresh eventId per emit', async () => {
    await emitter.emit(MemberEvent.Login, LOGIN);
    await emitter.emit(MemberEvent.Login, LOGIN);

    const id1 = producer.send.mock.calls[0][1].headers[EVENT_HEADER_ID];
    const id2 = producer.send.mock.calls[1][1].headers[EVENT_HEADER_ID];
    expect(id1).not.toBe(id2);
  });

  it('should let occurredAt and schemaVersion overrides win', async () => {
    await emitter.emit(MemberEvent.Login, LOGIN, {
      occurredAt: '2020-01-01T00:00:00.000Z',
      schemaVersion: 7,
    });

    const { headers } = producer.send.mock.calls[0][1];
    expect(headers[EVENT_HEADER_OCCURRED_AT]).toBe('2020-01-01T00:00:00.000Z');
    expect(headers[EVENT_HEADER_SCHEMA_VERSION]).toBe('7');
  });

  it('should merge custom headers on top of the envelope', async () => {
    await emitter.emit(MemberEvent.Login, LOGIN, { headers: { 'x-trace-id': 'abc' } });

    const { headers } = producer.send.mock.calls[0][1];
    expect(headers['x-trace-id']).toBe('abc');
    expect(headers[EVENT_HEADER_SOURCE]).toBe('ybc-auth-api');
  });

  it('should be best-effort: resolve (not throw) and log when send rejects', async () => {
    const logger: Logger = { error: vi.fn(), info: vi.fn(), debug: vi.fn() };
    const failing = createMockSdkProducer();
    failing.send.mockRejectedValueOnce(new Error('broker down'));
    const e = new EventEmitter(failing, 'ybc-auth-api', logger);

    await expect(e.emit(MemberEvent.Login, LOGIN)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to emit event',
      expect.objectContaining({ topic: MemberEvent.Login, source: 'ybc-auth-api', error: 'broker down' }),
    );
  });
});
