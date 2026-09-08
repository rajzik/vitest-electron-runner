import { Context, Data, Effect, Layer, Schema } from 'effect';

const Order = Schema.Struct({
  quantity: Schema.NumberFromString.pipe(Schema.int(), Schema.between(1, 100)),
  delivery: Schema.Literal('standard', 'express'),
});

export class Inventory extends Context.Tag('Inventory')<
  Inventory,
  { readonly available: number; readonly unitPriceCents: number }
>() {}

export const DemoInventory = Layer.succeed(Inventory, { available: 8, unitPriceCents: 1200 });

export class OutOfStock extends Data.TaggedError('OutOfStock')<{
  readonly available: number;
}> {}

export function quoteOrder(input: unknown) {
  return Effect.gen(function* () {
    const order = yield* Schema.decodeUnknown(Order)(input);
    const inventory = yield* Inventory;
    if (order.quantity > inventory.available) {
      return yield* new OutOfStock({ available: inventory.available });
    }
    const subtotalCents = order.quantity * inventory.unitPriceCents;
    const shippingCents = order.delivery === 'express' ? 900 : subtotalCents >= 5000 ? 0 : 400;
    return {
      quantity: order.quantity,
      subtotalCents,
      shippingCents,
      totalCents: subtotalCents + shippingCents,
    };
  });
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}
