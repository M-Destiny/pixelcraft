import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ShortcutCategory {
  title: string;
  shortcuts: { keys: string; action: string }[];
}

@Component({
  selector: 'app-help-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (show()) {
      <div class="help-modal-overlay" (click)="close()">
        <div class="help-modal" (click)="$event.stopPropagation()">
          <h2>⌨️ Keyboard Shortcuts</h2>
          @for (cat of categories; track cat.title) {
            <table>
              <thead>
                <tr>
                  <th>Shortcut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (sc of cat.shortcuts; track sc.action) {
                  <tr>
                    <td><kbd>{{ sc.keys }}</kbd></td>
                    <td>{{ sc.action }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
          <button class="close-btn" (click)="close()">Got it!</button>
        </div>
      </div>
    }
  `,
})
export class HelpModalComponent {
  show = signal(false);

  categories: ShortcutCategory[] = [
    {
      title: 'Tools',
      shortcuts: [
        { keys: 'P', action: 'Pencil tool' },
        { keys: 'E', action: 'Eraser tool' },
        { keys: 'F', action: 'Fill (bucket) tool' },
        { keys: 'I', action: 'Eyedropper (pick color)' },
        { keys: 'S', action: 'Selection tool' },
        { keys: 'H', action: 'Pan/hand tool' },
        { keys: 'R', action: 'Rectangle tool (hollow) — Alt+drag = filled' },
      ],
    },
    {
      title: 'Brush & View',
      shortcuts: [
        { keys: 'B', action: 'Cycle brush size: 1 → 3 → 5 px' },
        { keys: 'Z', action: 'Zoom in' },
        { keys: 'X', action: 'Zoom out' },
        { keys: 'Ctrl+0', action: 'Reset zoom to 100%' },
        { keys: 'G', action: 'Toggle grid overlay' },
        { keys: 'Space', action: 'Temporary pan tool (hold)' },
        { keys: 'Escape', action: 'Deselect / cancel' },
        { keys: 'Delete', action: 'Clear active layer (or delete selection)' },
      ],
    },
    {
      title: 'History & Files',
      shortcuts: [
        { keys: 'Ctrl+Z', action: 'Undo' },
        { keys: 'Ctrl+Shift+Z / Ctrl+Y', action: 'Redo' },
        { keys: 'Ctrl+S', action: 'Save project as JSON' },
        { keys: 'Ctrl+O', action: 'Load project from JSON' },
        { keys: 'Ctrl+R', action: 'Resize canvas' },
      ],
    },
    {
      title: 'Selection & Clipboard',
      shortcuts: [
        { keys: 'Ctrl+C', action: 'Copy selection' },
        { keys: 'Ctrl+X', action: 'Cut selection' },
        { keys: 'Ctrl+V', action: 'Paste selection' },
        { keys: 'Arrow keys', action: 'Move selection by 1px' },
        { keys: 'M', action: 'Flip selection horizontally' },
        { keys: 'Shift+M', action: 'Flip selection vertically' },
      ],
    },
    {
      title: 'Drawing Modifiers',
      shortcuts: [
        { keys: 'Shift + Pencil/Eraser', action: 'Straight line from anchor' },
        { keys: 'Shift + Rectangle', action: 'Constrain to square' },
        { keys: 'Alt + Rectangle', action: 'Filled rectangle' },
      ],
    },
  ];

  open() {
    this.show.set(true);
  }

  close() {
    this.show.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.key === '?' && e.shiftKey) {
      this.open();
    }
    if (e.key === 'Escape' && this.show()) {
      this.close();
    }
  }
}