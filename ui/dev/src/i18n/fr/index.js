export default {
  json_form: 'Formulaire JSON',
  failed: 'Action échouée',
  success: 'Action réussie',
  close: 'Fermer',
  schema: 'Schéma',
  layout: 'Disposition',
  form: 'Formulaire',
  renderers: {
    string: {
      label: 'Entrée de Texte',
      description: 'Veuillez entrer une valeur de type texte',
    },
    boolean: {
      label: 'Bascule Booléenne',
      description: 'Veuillez basculer la valeur booléenne',
    },
    number: {
      label: 'Entrée Numérique',
      description: 'Veuillez entrer une valeur numérique',
    },
    integer: {
      label: 'Entrée Entière',
      description: 'Veuillez entrer une valeur entière',
    },
    rating: {
      label: 'Sélecteur de Note',
      description: 'Veuillez sélectionner une note',
    },
    date: {
      label: 'Sélecteur de Date',
      description: 'Veuillez sélectionner une date',
    },
    enum: {
      label: 'Sélecteur d\'Enumération',
      description: 'Veuillez sélectionner une valeur dans la liste',
      options: {
        one: 'Option Un',
        two: 'Option Deux',
        three: 'Option Trois',
      }
    },
  }
};
