import { createMemo, createSignal, For, Show } from 'solid-js';

const categories = ['Food', 'Travel', 'Stay'] as const;
type Category = (typeof categories)[number];
type Expense = { id: string; description: string; cents: number; category: Category };
const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(cents / 100);

export function App() {
  const [expenses, setExpenses] = createSignal<Expense[]>([
    { id: 'train', description: 'Train to Copenhagen', cents: 4800, category: 'Travel' },
    { id: 'lunch', description: 'Lunch at the market', cents: 1850, category: 'Food' },
  ]);
  const [description, setDescription] = createSignal('');
  const [amount, setAmount] = createSignal('');
  const [category, setCategory] = createSignal<Category>('Food');
  const [filter, setFilter] = createSignal<Category | 'All'>('All');
  const visible = createMemo(() =>
    expenses().filter((expense) => filter() === 'All' || expense.category === filter()),
  );
  const total = createMemo(() => visible().reduce((sum, expense) => sum + expense.cents, 0));
  const valid = () =>
    description().trim().length > 0 &&
    /^\d+(\.\d{1,2})?$/.test(amount()) &&
    Number(amount()) > 0 &&
    Number(amount()) <= 100000;

  return (
    <main>
      <header>
        <p class="eyebrow">Travel journal / Copenhagen</p>
        <h1>
          Good trips.
          <br />
          Clear expenses.
        </h1>
        <p>A shared record of the small things that add up.</p>
      </header>
      <section class="panel" aria-label="Expense tracker">
        <div class="section-heading">
          <h2>Trip expenses</h2>
          <p role="status">
            {money(total())} · {visible().length} {visible().length === 1 ? 'expense' : 'expenses'}
          </p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!valid()) return;
            setExpenses((current) => [
              ...current,
              {
                id: crypto.randomUUID(),
                description: description().trim(),
                cents: Math.round(Number(amount()) * 100),
                category: category(),
              },
            ]);
            setDescription('');
            setAmount('');
          }}
        >
          <label class="grow">
            Description
            <input
              value={description()}
              onInput={(event) => setDescription(event.currentTarget.value)}
              placeholder="Coffee by the canal"
              maxLength={120}
            />
          </label>
          <label>
            Amount (EUR)
            <input
              class="amount"
              type="number"
              min="0.01"
              max="100000"
              step="0.01"
              value={amount()}
              onInput={(event) => setAmount(event.currentTarget.value)}
              placeholder="0.00"
            />
          </label>
          <label>
            Category
            <select
              value={category()}
              onChange={(event) => {
                const selected = categories.find((value) => value === event.currentTarget.value);
                if (selected) setCategory(selected);
              }}
            >
              <For each={categories}>{(value) => <option>{value}</option>}</For>
            </select>
          </label>
          <button type="submit" disabled={!valid()}>
            Add expense
          </button>
        </form>
        <nav class="filters" aria-label="Filter expenses">
          <button type="button" aria-pressed={filter() === 'All'} onClick={() => setFilter('All')}>
            All
          </button>
          <For each={categories}>
            {(value) => (
              <button
                type="button"
                aria-pressed={filter() === value}
                onClick={() => setFilter(value)}
              >
                {value}
              </button>
            )}
          </For>
        </nav>
        <ul class="items">
          <For each={visible()}>
            {(expense) => (
              <li>
                <div class="grow">
                  <strong>{expense.description}</strong>
                  <small>{expense.category}</small>
                </div>
                <span class="money">{money(expense.cents)}</span>
                <button
                  class="quiet"
                  type="button"
                  aria-label={`Delete ${expense.description}`}
                  onClick={() =>
                    setExpenses((current) => current.filter((item) => item.id !== expense.id))
                  }
                >
                  Delete
                </button>
              </li>
            )}
          </For>
        </ul>
        <Show when={visible().length === 0}>
          <p class="empty">No expenses in this category yet.</p>
        </Show>
      </section>
      <footer>Amounts are in euros. Changes reset when you refresh.</footer>
    </main>
  );
}
