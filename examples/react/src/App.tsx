import { useState } from 'react';

type Task = { id: string; title: string; done: boolean };
type Filter = 'All' | 'Open' | 'Done';
const filters: Filter[] = ['All', 'Open', 'Done'];

export function App() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 'brief', title: 'Review the project brief', done: true },
    { id: 'sketch', title: 'Sketch the onboarding flow', done: false },
    { id: 'feedback', title: 'Collect feedback from the team', done: false },
  ]);
  const [title, setTitle] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const remaining = tasks.filter((task) => !task.done).length;
  const visible = tasks.filter((task) => filter === 'All' || task.done === (filter === 'Done'));

  return (
    <main>
      <header>
        <p className="eyebrow">Studio / Project planner</p>
        <h1>
          A little progress,
          <br />
          every day.
        </h1>
        <p>Keep the next steps in sight. Make room for the work that matters.</p>
      </header>
      <section aria-label="Task board" className="panel">
        <div className="section-heading">
          <h2>This week's work</h2>
          <p role="status">
            {remaining} {remaining === 1 ? 'task' : 'tasks'} remaining
          </p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = title.trim();
            if (!trimmed) return;
            setTasks((current) => [
              ...current,
              { id: crypto.randomUUID(), title: trimmed, done: false },
            ]);
            setTitle('');
          }}
        >
          <label className="grow">
            New task
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What needs to happen next?"
              maxLength={120}
            />
          </label>
          <button type="submit" disabled={!title.trim()}>
            Add task
          </button>
        </form>
        <nav aria-label="Filter tasks" className="filters">
          {filters.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {value}
            </button>
          ))}
        </nav>
        <ul className="items">
          {visible.map((task) => (
            <li key={task.id}>
              <label className="task-label">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() =>
                    setTasks((current) =>
                      current.map((item) =>
                        item.id === task.id ? { ...item, done: !item.done } : item,
                      ),
                    )
                  }
                />
                <span className={task.done ? 'completed' : ''}>{task.title}</span>
              </label>
              <button
                className="quiet"
                type="button"
                aria-label={`Delete ${task.title}`}
                onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
        {visible.length === 0 ? (
          <p className="empty">
            No {filter === 'All' ? '' : filter.toLowerCase() + ' '}tasks. A clean slate.
          </p>
        ) : null}
      </section>
      <footer>Changes stay in this session. Refresh to start again.</footer>
    </main>
  );
}
