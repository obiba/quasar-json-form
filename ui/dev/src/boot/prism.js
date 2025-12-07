import { defineBoot } from '#q-app/wrappers';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css'; // or prism.css for default theme
import 'prismjs/components/prism-json'; // add language support as needed
import PrismDirective from 'src/directives/prism';

export default defineBoot(({ app }) => {
  app.directive('prism', PrismDirective);
  // Optional: add Prism globally (not required, but convenient)
  app.config.globalProperties.$prism = Prism;
});
