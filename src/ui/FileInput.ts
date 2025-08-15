export class FileInput {
  private input: HTMLInputElement;
  public onFileSelected?: (file: File) => void;

  constructor() {
    this.input = this.createInput();
    document.body.appendChild(this.input);
  }

  private createInput(): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".vrm";
    input.style.position = "fixed";
    input.style.left = "0px";
    input.style.bottom = "0px";
    input.style.zIndex = "10";
    input.style.background = "white";
    input.style.borderRadius = "6px";
    input.style.padding = "6px";
    input.style.transform = "scale(2)";
    input.style.transformOrigin = "bottom left";

    input.addEventListener("change", (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && this.onFileSelected) {
        this.onFileSelected(file);
      }
    });

    return input;
  }

  public hide(): void {
    this.input.style.display = "none";
  }

  public dispose(): void {
    this.input.remove();
  }
}
