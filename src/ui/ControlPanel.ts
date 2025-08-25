import { SpotlightSystem } from "../lighting/SpotlightSystem";
import { SpotlightUniforms, StageConfig } from "../world/config/StageConfig";

export class ControlPanel {
  private element: HTMLElement;
  private isVisible: boolean = false;
  private tapCount: number = 0;
  private lastTapTime: number = 0;
  private readonly TRIPLE_TAP_THRESHOLD = 500; // milliseconds

  private spotlightSystem: SpotlightSystem | null = null;

  constructor() {
    this.createElement();
    this.setupEventListeners();
  }

  public setSpotlightSystem(spotlightSystem: SpotlightSystem): void {
    this.spotlightSystem = spotlightSystem;
  }

  private createElement(): void {
    this.element = document.createElement('div');
    this.element.id = 'control-panel';
    this.element.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 20px;
      border-radius: 8px;
      border: 2px solid #00ccff;
      box-shadow: 0 4px 20px rgba(0, 204, 255, 0.3);
      font-family: 'Arial', sans-serif;
      display: none;
      z-index: 1000;
      min-width: 300px;
      backdrop-filter: blur(10px);
    `;

    // Get current config values
    const sideVertical = StageConfig.SPOTLIGHT.singleBeam.verticalGain;
    const sideHorizontal = StageConfig.SPOTLIGHT.singleBeam.horizontalGain;
    const ceilingVertical = StageConfig.SPOTLIGHT.audienceTier.singleBeam.verticalGain;
    const ceilingHorizontal = StageConfig.SPOTLIGHT.audienceTier.singleBeam.horizontalGain;
    const ceilingEnabled = StageConfig.SPOTLIGHT.audienceTier.enabled;

    this.element.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #00ccff;">サイドステージライト</h3>
        <div style="margin-bottom: 10px;">
          <label style="display: flex; align-items: center; margin-bottom: 5px;">
            <input type="checkbox" id="sideStageEnabled" checked style="margin-right: 8px;">
            表示する
          </label>
        </div>
        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px;">縦方向強さ</label>
          <input type="range" id="sideStageVertical" min="0" max="2" step="0.1" value="${sideVertical}"
                 style="width: 100%; accent-color: #00ccff;">
          <span id="sideStageVerticalValue" style="color: #00ccff;">${sideVertical}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px;">横方向強さ</label>
          <input type="range" id="sideStageHorizontal" min="0" max="2" step="0.1" value="${sideHorizontal}"
                 style="width: 100%; accent-color: #00ccff;">
          <span id="sideStageHorizontalValue" style="color: #00ccff;">${sideHorizontal}</span>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #00ccff;">天井ライト</h3>
        <div style="margin-bottom: 10px;">
          <label style="display: flex; align-items: center; margin-bottom: 5px;">
            <input type="checkbox" id="ceilingEnabled" ${ceilingEnabled ? 'checked' : ''} style="margin-right: 8px;">
            表示する
          </label>
        </div>
        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px;">縦方向強さ</label>
          <input type="range" id="ceilingVertical" min="0" max="2" step="0.1" value="${ceilingVertical}"
                 style="width: 100%; accent-color: #00ccff;">
          <span id="ceilingVerticalValue" style="color: #00ccff;">${ceilingVertical}</span>
        </div>
        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px;">横方向強さ</label>
          <input type="range" id="ceilingHorizontal" min="0" max="2" step="0.1" value="${ceilingHorizontal}"
                 style="width: 100%; accent-color: #00ccff;">
          <span id="ceilingHorizontalValue" style="color: #00ccff;">${ceilingHorizontal}</span>
        </div>
      </div>

      <button id="closePanel" style="
        width: 100%;
        padding: 10px;
        background: #00ccff;
        color: black;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        margin-bottom: 10px;
      ">とじる</button>

      <div style="
        font-size: 12px;
        color: #888;
        text-align: center;
        line-height: 1.4;
      ">
        3回タップでパネルを再表示
      </div>
    `;

    document.body.appendChild(this.element);
    this.setupControlEventListeners();
  }

  private setupEventListeners(): void {
    // Triple-tap detection
    document.addEventListener('click', () => {
      const currentTime = Date.now();

      if (currentTime - this.lastTapTime < this.TRIPLE_TAP_THRESHOLD) {
        this.tapCount++;
      } else {
        this.tapCount = 1;
      }

      this.lastTapTime = currentTime;

      if (this.tapCount === 3) {
        this.toggle();
        this.tapCount = 0;
      }
    });

    // Escape key to close panel
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  private setupControlEventListeners(): void {
    // Close button
    const closeButton = this.element.querySelector('#closePanel') as HTMLButtonElement;
    closeButton?.addEventListener('click', () => this.hide());

    // Side stage controls
    const sideStageEnabled = this.element.querySelector('#sideStageEnabled') as HTMLInputElement;
    const sideStageVertical = this.element.querySelector('#sideStageVertical') as HTMLInputElement;
    const sideStageHorizontal = this.element.querySelector('#sideStageHorizontal') as HTMLInputElement;
    const sideStageVerticalValue = this.element.querySelector('#sideStageVerticalValue') as HTMLSpanElement;
    const sideStageHorizontalValue = this.element.querySelector('#sideStageHorizontalValue') as HTMLSpanElement;

    sideStageEnabled?.addEventListener('change', () => {
      this.updateSpotlights();
    });

    sideStageVertical?.addEventListener('input', () => {
      const value = parseFloat(sideStageVertical.value);
      sideStageVerticalValue.textContent = value.toString();
      this.updateSpotlights();
    });

    sideStageHorizontal?.addEventListener('input', () => {
      const value = parseFloat(sideStageHorizontal.value);
      sideStageHorizontalValue.textContent = value.toString();
      this.updateSpotlights();
    });

    // Ceiling controls
    const ceilingEnabled = this.element.querySelector('#ceilingEnabled') as HTMLInputElement;
    const ceilingVertical = this.element.querySelector('#ceilingVertical') as HTMLInputElement;
    const ceilingHorizontal = this.element.querySelector('#ceilingHorizontal') as HTMLInputElement;
    const ceilingVerticalValue = this.element.querySelector('#ceilingVerticalValue') as HTMLSpanElement;
    const ceilingHorizontalValue = this.element.querySelector('#ceilingHorizontalValue') as HTMLSpanElement;

    ceilingEnabled?.addEventListener('change', () => {
      this.updateSpotlights();
    });

    ceilingVertical?.addEventListener('input', () => {
      const value = parseFloat(ceilingVertical.value);
      ceilingVerticalValue.textContent = value.toString();
      this.updateSpotlights();
    });

    ceilingHorizontal?.addEventListener('input', () => {
      const value = parseFloat(ceilingHorizontal.value);
      ceilingHorizontalValue.textContent = value.toString();
      this.updateSpotlights();
    });
  }

  private updateSpotlights(): void {
    if (!this.spotlightSystem) return;

    // Get current values from DOM elements
    const sideStageEnabled = (this.element.querySelector('#sideStageEnabled') as HTMLInputElement)?.checked || false;
    const sideStageVertical = parseFloat((this.element.querySelector('#sideStageVertical') as HTMLInputElement)?.value || '0');
    const sideStageHorizontal = parseFloat((this.element.querySelector('#sideStageHorizontal') as HTMLInputElement)?.value || '0');

    const ceilingEnabled = (this.element.querySelector('#ceilingEnabled') as HTMLInputElement)?.checked || false;
    const ceilingVertical = parseFloat((this.element.querySelector('#ceilingVertical') as HTMLInputElement)?.value || '0');
    const ceilingHorizontal = parseFloat((this.element.querySelector('#ceilingHorizontal') as HTMLInputElement)?.value || '0');

    // Update side stage lights
    const sideUniforms: Partial<SpotlightUniforms> = {
      uVerticalGain: sideStageEnabled ? sideStageVertical : 0,
      uHorizontalGain: sideStageEnabled ? sideStageHorizontal : 0
    };

    this.spotlightSystem.updateSideStageMaterialUniforms(sideUniforms);

    // Update ceiling lights (audience tier)
    const ceilingUniforms: Partial<SpotlightUniforms> = {
      uVerticalGain: ceilingEnabled ? ceilingVertical : 0,
      uHorizontalGain: ceilingEnabled ? ceilingHorizontal : 0
    };

    this.spotlightSystem.updateCeilingMaterialUniforms(ceilingUniforms);
  }

  public show(): void {
    this.isVisible = true;
    this.element.style.display = 'block';
  }

  public hide(): void {
    this.isVisible = false;
    this.element.style.display = 'none';
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public dispose(): void {
    this.element.remove();
  }
}
