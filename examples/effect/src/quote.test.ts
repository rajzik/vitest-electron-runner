import { Effect, Either, Layer } from 'effect';
import { expect, test } from 'vite-plus/test';
import { Inventory, quoteOrder } from './quote';

const inventory = Layer.succeed(Inventory, { available: 20, unitPriceCents: 1000 });
const run = (input: unknown) =>
  Effect.runPromise(quoteOrder(input).pipe(Effect.provide(inventory)));

test('uses the supplied inventory and waives standard shipping at exactly €50', async () => {
  expect(await run({ quantity: '4', delivery: 'standard' })).toEqual({
    quantity: 4,
    subtotalCents: 4000,
    shippingCents: 400,
    totalCents: 4400,
  });
  expect(await run({ quantity: '5', delivery: 'standard' })).toEqual({
    quantity: 5,
    subtotalCents: 5000,
    shippingCents: 0,
    totalCents: 5000,
  });
  expect(await run({ quantity: '5', delivery: 'express' })).toEqual({
    quantity: 5,
    subtotalCents: 5000,
    shippingCents: 900,
    totalCents: 5900,
  });
});

test('preserves typed stock and schema failures', async () => {
  const result = await Effect.runPromise(
    quoteOrder({ quantity: '21', delivery: 'standard' }).pipe(
      Effect.provide(inventory),
      Effect.either,
    ),
  );
  expect(Either.isLeft(result)).toBe(true);
  if (Either.isLeft(result))
    expect(result.left).toMatchObject({ _tag: 'OutOfStock', available: 20 });
  const invalid = await Effect.runPromise(
    quoteOrder({ quantity: '1', delivery: 'teleport' }).pipe(
      Effect.provide(inventory),
      Effect.either,
    ),
  );
  expect(Either.isLeft(invalid)).toBe(true);
  if (Either.isLeft(invalid)) expect(invalid.left._tag).toBe('ParseError');
});
