import { randomUUID } from 'crypto';
import { SdkProducer } from './producer';
import { Topic, TopicDataMap } from './types';
import { Logger, noopLogger } from './logger';
import { buildEnvelopeHeaders, EventEnvelope } from './envelope';

/** Per-emit overrides for the standard envelope. */
export interface EmitOptions {
  /** Partition key. */
  key?: string;
  /** Override the ISO occurredAt timestamp (default: now). */
  occurredAt?: string;
  /** Override the payload schema version (default: 1). */
  schemaVersion?: number;
  /** Extra custom headers merged on top of the envelope headers. */
  headers?: Record<string, string>;
}

/**
 * The one typed way to emit a Kafka audit event.
 *
 * Wraps {@link SdkProducer} and stamps a uniform {@link EventEnvelope}
 * (`eventId`, `source`, `occurredAt`, `schemaVersion`) onto each message as
 * Kafka **headers** — the domain `value` passes through unchanged so existing
 * value-only consumers keep working. Delivery is best-effort: send errors are
 * logged and swallowed, never thrown to the caller (mirrors the "don't fail
 * the job" semantics of the existing producer wrappers).
 */
export class EventEmitter {
  private readonly producer: SdkProducer;
  private readonly source: string;
  private readonly logger: Logger;

  constructor(producer: SdkProducer, source: string, logger?: Logger) {
    this.producer = producer;
    this.source = source;
    this.logger = logger ?? noopLogger;
  }

  async emit<T extends Topic>(topic: T, value: TopicDataMap[T], opts?: EmitOptions): Promise<void> {
    const envelope: EventEnvelope = {
      eventId: randomUUID(),
      source: this.source,
      occurredAt: opts?.occurredAt ?? new Date().toISOString(),
      schemaVersion: opts?.schemaVersion ?? 1,
    };

    const headers = { ...buildEnvelopeHeaders(envelope), ...opts?.headers };

    try {
      await this.producer.send(topic, { key: opts?.key, value, headers });
    } catch (error) {
      // Best-effort: emission never fails the caller's work.
      this.logger.error('Failed to emit event', {
        topic,
        source: this.source,
        eventId: envelope.eventId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
