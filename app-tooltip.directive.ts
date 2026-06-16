import { Directive, ElementRef, Input, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appCustomTooltip]',
  standalone: true
})
export class CustomTooltipDirective {
  @Input('appCustomTooltip') tooltipContent = '';
  private tooltipElement: HTMLElement | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter') onMouseEnter() {
    this.tooltipElement = this.renderer.createElement('div');
    this.tooltipElement!.innerHTML = this.tooltipContent;
    this.renderer.addClass(this.tooltipElement, 'my-custom-tooltip');
    this.renderer.appendChild(document.body, this.tooltipElement);
    
    const { top, left, width } = this.el.nativeElement.getBoundingClientRect();
    this.renderer.setStyle(this.tooltipElement, 'top', `${top - 40}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left + width / 2}px`);
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = null;
    }
  }
}