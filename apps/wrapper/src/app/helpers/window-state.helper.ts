import { BrowserWindow, screen as electronScreen } from 'electron';


export interface Options {

  /** The height that should be returned if no file exists yet. Defaults to `600`. */
  defaultHeight?: number;

  /** The width that should be returned if no file exists yet. Defaults to `800`. */
  defaultWidth?: number;

  /** Should we automatically maximize the window, if it was last closed maximized. Defaults to `true`. */
  maximize?: boolean;

  load: () => State;
  save: (state: State) => void;
}

export interface State {
  displayBounds: {
    height: number;
    width: number;
  };
  /** The saved height of loaded state. `defaultHeight` if the state has not been saved yet. */
  height: number;
  /** `true` if the window state was saved while the window was maximized. `undefined` if the state has not been saved yet. */
  maximized: boolean;
  /** The saved width of loaded state. `defaultWidth` if the state has not been saved yet. */
  width: number;
  /** The saved x coordinate of the loaded state. `undefined` if the state has not been saved yet. */
  x: number;
  /** The saved y coordinate of the loaded state. `undefined` if the state has not been saved yet. */
  y: number;
}

const screen = electronScreen;

export class WindowStateKeeper {

  state: State;
  handlers: {
    close: () => void;
    closed: () => void;
    move: (event) => void;
    resize: (event) => void;
  };

  get x() {
    return this.state.x;
  }

  get y() {
    return this.state.y;
  }

  get width() {
    return this.state.width;
  }

  get height() {
    return this.state.height;
  }

  get displayBounds() {
    return this.state.displayBounds;
  }

  get isMaximized() {
    return this.state.maximized;
  }

  constructor(
    private winRef: BrowserWindow,
    private options: Options,
  ) {

    // load state
    this.state = options.load();
    if (!this.state) {
      this.resetStateToDefault();
    }

    // Check state validity
    this.validateState();

    // update browser window
    this.manage();
  }

  private isNormal(win) {
    return !win.isMaximized() && !win.isMinimized() && !win.isFullScreen();
  }

  private hasBounds() {
    return this.state &&
      Number.isInteger(this.state.x) &&
      Number.isInteger(this.state.y) &&
      Number.isInteger(this.state.width) && this.state.width > 0 &&
      Number.isInteger(this.state.height) && this.state.height > 0;
  }

  public resetStateToDefault() {
    const displayBounds = screen.getPrimaryDisplay().bounds;
    this.state = {
      width: this.options.defaultWidth || this.winRef.getMinimumSize()[0] || 800,
      height: this.options.defaultHeight || this.winRef.getMinimumSize()[1] || 600,
      displayBounds,
      maximized: this.options.maximize || false,
      x: (displayBounds.width - (this.options.defaultWidth || 800)) / 2,
      y: (displayBounds.height - (this.options.defaultHeight || 600)) / 2,
    };
  }

  private windowWithinBounds(bounds) {
    return (
      this.state.x >= bounds.x &&
      this.state.y >= bounds.y &&
      this.state.x + this.state.width <= bounds.x + bounds.width &&
      this.state.y + this.state.height <= bounds.y + bounds.height
    );
  }

  private ensureWindowVisibleOnSomeDisplay() {
    const visible = screen.getAllDisplays().some(display => {
      return this.windowWithinBounds(display.bounds);
    });

    if (!visible) {
      // Window is partially or fully not visible now.
      // Reset it to safe defaults.
      return this.resetStateToDefault();
    }
  }

  validateState() {
    const isValid = this.state && (this.hasBounds() || this.state.maximized);
    if (!isValid) {
      this.resetStateToDefault();
      return;
    }

    if (this.hasBounds() && this.state.displayBounds) {
      this.ensureWindowVisibleOnSomeDisplay();
    }
  }

  private updateState(win?) {
    // Don't throw an error when window was closed
    win = win ?? this.winRef;

    try {
      const winBounds = win.getBounds();
      if (this.isNormal(win)) {
        this.state.x = winBounds.x;
        this.state.y = winBounds.y;
        this.state.width = winBounds.width;
        this.state.height = winBounds.height;
      }
      this.state.maximized = win.isMaximized();
      this.state.displayBounds = screen.getDisplayMatching(winBounds).bounds;
    } catch (err) {
      // ignore
    }
  }

  saveState() {
    this.options.save(this.state);
  }

  private stateChangeHandler(event) {
    this.updateState(event.sender);
  }

  private closeHandler() {
    this.updateState();
  }

  private closedHandler() {
    // Unregister listeners and save state
    this.unmanage();
    this.saveState();
  }

  private manage() {
    if (this.state) {
      if (this.options.maximize && this.state.maximized) {
        this.winRef.maximize();
      }
      this.winRef.setPosition(this.x, this.y, false);
      this.winRef.setSize(this.width, this.height, false);
    }
    this.handlers = {
      resize: (event) => this.stateChangeHandler(event),
      move: (event) => this.stateChangeHandler(event),
      close: () => this.closeHandler(),
      closed: () => this.closedHandler(),
    };
    this.winRef.on('resize', this.handlers.resize);
    this.winRef.on('move', this.handlers.move);
    this.winRef.on('close', this.handlers.close);
    this.winRef.on('closed', this.handlers.closed);
  }

  private unmanage() {
    if (this.winRef) {
      this.winRef.removeListener('resize', this.handlers.resize);
      this.winRef.removeListener('move', this.handlers.move);
      this.winRef.removeListener('close', this.handlers.close);
      this.winRef.removeListener('closed', this.handlers.closed);
      this.winRef = null;
    }
  }

}
