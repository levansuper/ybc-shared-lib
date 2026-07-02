/**
 * Standard event envelope stamped onto every Kafka message as headers.
 *
 * The envelope is transported as Kafka message **headers** (additive) so the
 * domain payload in `value` stays byte-for-byte unchanged. Every field is a
 * string on the wire; `schemaVersion` is parsed back to a number on read.
 */
export interface EventEnvelope {
  /** Stable unique id for this event (uuid v4). */
  eventId: string;
  /** Producing service name, e.g. 'ybc-balance-api'. */
  source: string;
  /** ISO-8601 timestamp of when the event occurred. */
  occurredAt: string;
  /** Payload schema version for this topic. Starts at 1. */
  schemaVersion: number;
}

/** Kafka header key constants — lowercase, `x-event-*` prefixed. */
export const EVENT_HEADER_ID = 'x-event-id';
export const EVENT_HEADER_SOURCE = 'x-event-source';
export const EVENT_HEADER_OCCURRED_AT = 'x-event-occurred-at';
export const EVENT_HEADER_SCHEMA_VERSION = 'x-event-schema-version';

/**
 * Build the string-valued header map for an envelope. Header values are always
 * strings (KafkaJS accepts string | Buffer; we standardize on string).
 */
export function buildEnvelopeHeaders(env: EventEnvelope): Record<string, string> {
  return {
    [EVENT_HEADER_ID]: env.eventId,
    [EVENT_HEADER_SOURCE]: env.source,
    [EVENT_HEADER_OCCURRED_AT]: env.occurredAt,
    [EVENT_HEADER_SCHEMA_VERSION]: String(env.schemaVersion),
  };
}

/**
 * Read an envelope back out of consumed message headers. Tolerates missing
 * keys (legacy producers that stamped no envelope) — every field is optional
 * in the returned partial. `schemaVersion` is parsed back to a number when
 * present and numeric.
 */
export function readEnvelopeFromHeaders(
  headers: Record<string, string | undefined>,
): Partial<EventEnvelope> {
  const result: Partial<EventEnvelope> = {};

  const eventId = headers[EVENT_HEADER_ID];
  if (eventId !== undefined) result.eventId = eventId;

  const source = headers[EVENT_HEADER_SOURCE];
  if (source !== undefined) result.source = source;

  const occurredAt = headers[EVENT_HEADER_OCCURRED_AT];
  if (occurredAt !== undefined) result.occurredAt = occurredAt;

  const rawSchemaVersion = headers[EVENT_HEADER_SCHEMA_VERSION];
  if (rawSchemaVersion !== undefined) {
    const parsed = Number(rawSchemaVersion);
    if (!Number.isNaN(parsed)) result.schemaVersion = parsed;
  }

  return result;
}
