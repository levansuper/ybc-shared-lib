import { describe, it, expect, vi } from 'vitest';
import { AuditEvent } from '../src/types';
import type { AuditActionData, TopicDataMap } from '../src/types';
import { EventEmitter } from '../src/event-emitter';
import { SdkProducer } from '../src/producer';
import { EVENT_HEADER_SOURCE } from '../src/envelope';

describe('AuditEvent', () => {
  it('has the canonical topic string', () => {
    expect(AuditEvent.Action).toBe('audit-event.action');
  });

  it('maps to AuditActionData in TopicDataMap (compile-time)', () => {
    // Type-level assertion: this line only compiles if the mapping holds.
    const sample: TopicDataMap[AuditEvent.Action] = {
      action: 'role.created',
      entityType: 'role',
      entityId: 'r1',
      actorType: 'admin',
      actorId: 'u1',
      actorName: 'alice',
      clientId: 'client-1',
      summary: 'created role Support',
      changed: { name: { to: 'Support' } },
    };
    expect(sample.action).toBe('role.created');
  });

  it('emits through EventEmitter with the audit topic and unchanged value', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const producer = { send } as unknown as SdkProducer;
    const emitter = new EventEmitter(producer, 'ybc-auth-api');

    const data: AuditActionData = {
      action: 'casino.suspended',
      entityType: 'casino',
      entityId: 'c9',
      actorType: 'admin',
      actorId: 'u1',
      actorName: 'alice',
      clientId: 'c9',
      summary: 'suspended casino acme',
    };

    await emitter.emit(AuditEvent.Action, data, { key: data.entityId });

    expect(send).toHaveBeenCalledOnce();
    const [topic, message] = send.mock.calls[0];
    expect(topic).toBe(AuditEvent.Action);
    expect(message.value).toEqual(data);
    expect(message.headers[EVENT_HEADER_SOURCE]).toBe('ybc-auth-api');
  });
});
