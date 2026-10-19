import type { StudioValues } from './schema';

const equal = (a: StudioValues, b: StudioValues) =>
  Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => a[key] === b[key]);

/** Session-local history of valid themes. A pointer gesture is one undo step. */
export class StudioHistory {
  private past: StudioValues[] = [];
  private future: StudioValues[] = [];
  private current: StudioValues;
  private gesture = false;
  private gestureRecorded = false;
  private lastKeys = '';
  private lastTime = -Infinity;

  constructor(initial: StudioValues, private limit = 100) { this.current = { ...initial }; }
  get status() { return { undo: this.past.length, redo: this.future.length }; }
  begin() { this.end(); this.gesture = true; }
  end() { this.gesture = false; this.gestureRecorded = false; this.lastKeys = ''; }

  record(next: StudioValues, time = Date.now(), atomic = false) {
    if (equal(this.current, next)) return false;
    const keys = Object.keys(next).filter(key => this.current[key] !== next[key]).sort().join('|');
    // Repeated keyboard nudges / color typing also form a single short edit.
    const merge = !atomic && (this.gesture ? this.gestureRecorded :
      keys === this.lastKeys && time - this.lastTime < 500);
    if (!merge) {
      this.past.push({ ...this.current });
      if (this.past.length > this.limit) this.past.shift();
    }
    this.current = { ...next };
    this.future = [];
    this.gestureRecorded = this.gesture;
    this.lastKeys = atomic ? '' : keys;
    this.lastTime = time;
    return true;
  }

  undo() {
    this.end();
    const previous = this.past.pop();
    if (!previous) return undefined;
    this.future.push({ ...this.current });
    this.current = previous;
    return { ...previous };
  }
  redo() {
    this.end();
    const next = this.future.pop();
    if (!next) return undefined;
    this.past.push({ ...this.current });
    this.current = next;
    return { ...next };
  }
}
