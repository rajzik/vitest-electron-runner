import { mountApp } from './app';
import '../../shared/style.css';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root container');
const dispose = mountApp(container);
if (import.meta.hot) import.meta.hot.dispose(dispose);
