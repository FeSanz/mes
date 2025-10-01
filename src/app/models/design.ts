export function  ToggleMenu() {
  const SIZE_TO_MEDIA: any = {
    'xs': '(min-width: 0px)',
    'sm': '(min-width: 576px)',
    'md': '(min-width: 768px)',
    'lg': '(min-width: 992px)',
    'xl': '(min-width: 1200px)'
  };
  const splitPane: any = document.querySelector('ion-split-pane') as HTMLIonSplitPaneElement;
  if (!splitPane) return;

  const media = SIZE_TO_MEDIA[splitPane.when] || splitPane.when;

  if (window.matchMedia(media).matches) {
    splitPane.classList.toggle('split-pane-visible');
  }
}
