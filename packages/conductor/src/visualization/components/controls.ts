import { EventEmitter } from "events";
import { VisualizationControls } from "@/types/interfaces/visualization";

export interface ControlsComponentOptions {
  container: HTMLElement;
  controls: VisualizationControls;
  theme?: "light" | "dark";
}

export class ControlsComponent extends EventEmitter {
  private container: HTMLElement;
  private options: Required<ControlsComponentOptions>;
  private controlElements: Map<string, HTMLElement> = new Map();

  constructor(options: ControlsComponentOptions) {
    super();
    this.container = options.container;
    this.options = {
      theme: "light",
      ...options,
    };
    this.initializeControls();
  }

  private initializeControls() {
    const controlsContainer = document.createElement("div");
    controlsContainer.className = "graph-controls";
    this.applyControlsStyles(controlsContainer);

    if (this.options.controls.zoom) {
      this.addZoomControls(controlsContainer);
    }

    if (this.options.controls.fit) {
      this.addFitControl(controlsContainer);
    }

    if (this.options.controls.pause) {
      this.addPauseControl(controlsContainer);
    }

    if (this.options.controls.expand) {
      this.addExpandControl(controlsContainer);
    }

    this.container.appendChild(controlsContainer);
  }

  private applyControlsStyles(container: HTMLElement) {
    Object.assign(container.style, {
      position: "absolute",
      bottom: "20px",
      right: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      background: this.options.theme === "light" ? "#ffffff" : "#2d3436",
      padding: "10px",
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      zIndex: "1000",
    });
  }

  private createButton(icon: string, tooltip: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.innerHTML = icon;
    button.title = tooltip;

    Object.assign(button.style, {
      border: "none",
      background: "transparent",
      color: this.options.theme === "light" ? "#2d3436" : "#ffffff",
      padding: "8px",
      cursor: "pointer",
      borderRadius: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background-color 0.2s",
    });

    button.addEventListener("mouseover", () => {
      button.style.backgroundColor =
        this.options.theme === "light"
          ? "rgba(0,0,0,0.05)"
          : "rgba(255,255,255,0.1)";
    });

    button.addEventListener("mouseout", () => {
      button.style.backgroundColor = "transparent";
    });

    return button;
  }

  private addZoomControls(container: HTMLElement) {
    const zoomIn = this.createButton("+", "Zoom In");
    const zoomOut = this.createButton("-", "Zoom Out");

    zoomIn.addEventListener("click", () => this.emit("zoom", 1.2));
    zoomOut.addEventListener("click", () => this.emit("zoom", 0.8));

    container.appendChild(zoomIn);
    container.appendChild(zoomOut);

    this.controlElements.set("zoomIn", zoomIn);
    this.controlElements.set("zoomOut", zoomOut);
  }

  private addFitControl(container: HTMLElement) {
    const fit = this.createButton("⊡", "Fit to View");
    fit.addEventListener("click", () => this.emit("fit"));
    container.appendChild(fit);
    this.controlElements.set("fit", fit);
  }

  private addPauseControl(container: HTMLElement) {
    const pause = this.createButton("⏸", "Pause Layout");
    let isPaused = false;

    pause.addEventListener("click", () => {
      isPaused = !isPaused;
      pause.innerHTML = isPaused ? "▶" : "⏸";
      pause.title = isPaused ? "Resume Layout" : "Pause Layout";
      this.emit("pause", isPaused);
    });

    container.appendChild(pause);
    this.controlElements.set("pause", pause);
  }

  private addExpandControl(container: HTMLElement) {
    const expand = this.createButton("↔", "Expand All");
    let isExpanded = false;

    expand.addEventListener("click", () => {
      isExpanded = !isExpanded;
      expand.innerHTML = isExpanded ? "↕" : "↔";
      expand.title = isExpanded ? "Collapse All" : "Expand All";
      this.emit("expand", isExpanded);
    });

    container.appendChild(expand);
    this.controlElements.set("expand", expand);
  }

  public setEnabled(control: string, enabled: boolean) {
    const element = this.controlElements.get(control);
    if (element) {
      element.style.opacity = enabled ? "1" : "0.5";
      element.style.pointerEvents = enabled ? "auto" : "none";
    }
  }

  public dispose() {
    this.controlElements.forEach((element) => element.remove());
    this.controlElements.clear();
    this.removeAllListeners();
  }
}
