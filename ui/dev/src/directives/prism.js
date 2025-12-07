import Prism from 'prismjs';

export default {
  mounted(el) {
    Prism.highlightElement(el);
  },
  updated(el) {
    Prism.highlightElement(el);
  },
};
