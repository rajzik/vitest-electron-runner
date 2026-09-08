import { Effect } from 'effect';
import { DemoInventory, formatMoney, quoteOrder } from './quote';

export function mountApp(container: HTMLElement) {
  container.innerHTML = `
    <main>
      <header><p class="eyebrow">Field notes / Small-batch stationery</p><h1>Room for<br />your next idea.</h1><p>Thread-bound notebooks for sketches, lists, and everyday observations.</p></header>
      <section class="panel" aria-label="Order quote">
        <div class="section-heading"><h2>The everyday notebook</h2><p>€12.00 each</p></div>
        <p>Dot grid · Recycled paper · 8 available</p>
        <form novalidate>
          <label>Quantity<input name="quantity" type="number" min="1" max="100" step="1" value="1" required aria-describedby="quantity-help" /></label>
          <label class="grow">Delivery<select name="delivery"><option value="standard">Standard · €4, free at €50+</option><option value="express">Express · €9</option></select></label>
          <button type="submit">Calculate quote</button>
        </form>
        <p id="quantity-help" class="hint">Enter a whole number from 1 to 100. We'll check stock before quoting.</p>
        <div role="alert"></div>
        <div role="status" class="quote"><p>Choose your quantity and delivery to see a quote.</p></div>
      </section>
      <footer>Demo inventory. Calculating a quote does not place an order.</footer>
    </main>`;
  const form = container.querySelector('form');
  const button = container.querySelector('button');
  const status = container.querySelector('[role="status"]');
  const alert = container.querySelector('[role="alert"]');
  if (!form || !button || !status || !alert) throw new Error('Missing order form elements');

  const controller = new AbortController();
  form.addEventListener(
    'submit',
    (event) => {
      event.preventDefault();
      if (button.disabled) return;
      const data = new FormData(form);
      button.disabled = true;
      button.textContent = 'Calculating…';
      alert.textContent = '';
      status.textContent = '';
      const program = quoteOrder({
        quantity: data.get('quantity'),
        delivery: data.get('delivery'),
      }).pipe(
        Effect.provide(DemoInventory),
        Effect.match({
          onFailure: (error) => {
            alert.textContent =
              error._tag === 'OutOfStock'
                ? `Only ${error.available} notebooks are available. Try a smaller quantity.`
                : 'Enter a whole quantity from 1 to 100 and choose a delivery method.';
          },
          onSuccess: (quote) => {
            status.innerHTML = `<dl>
            <div><dt>Notebooks (${quote.quantity})</dt><dd>${formatMoney(quote.subtotalCents)}</dd></div>
            <div><dt>Delivery</dt><dd>${formatMoney(quote.shippingCents)}</dd></div>
            <div class="total"><dt>Total</dt><dd>${formatMoney(quote.totalCents)}</dd></div>
          </dl>`;
          },
        }),
        Effect.ensuring(
          Effect.sync(() => {
            button.disabled = false;
            button.textContent = 'Calculate quote';
          }),
        ),
      );
      void Effect.runPromise(program, { signal: controller.signal }).catch(() => {
        if (!controller.signal.aborted)
          alert.textContent = 'Unable to calculate a quote. Please try again.';
      });
    },
    { signal: controller.signal },
  );

  return () => {
    controller.abort();
    container.replaceChildren();
  };
}
