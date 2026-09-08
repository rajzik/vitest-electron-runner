import './style.css';
import { mountEditor } from './editor';
const dispose = await mountEditor(document, window.notes);
if (import.meta.hot) import.meta.hot.dispose(dispose);
