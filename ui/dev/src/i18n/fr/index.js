export default {
  json_form: 'Formulaire JSON',
  failed: 'Action échouée',
  success: 'Action réussie',
  close: 'Fermer',
  schema: 'Schéma',
  layout: 'Disposition',
  form: 'Formulaire',
  renderers: {
    label: {
      text: 'Ceci est une étiquette avec support **Markdown**',
    },
    section: {
      label: 'Section',
      description: 'Une **section** pour annoncer des champs',
    },
    string: {
      label: 'Entrée de Texte',
      description: 'Veuillez entrer une valeur de type texte',
    },
    password: {
      label: 'Entrée de Mot de Passe',
      description: 'Veuillez entrer une valeur de mot de passe',
    },
    multiLineString: {
      label: 'Multi-line String Input',
      description: 'Please enter a multi-line string value',
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
      number_must_be_even: 'Le nombre doit être pair',
    },
    rating: {
      label: 'Sélecteur de Note',
      description: 'Veuillez sélectionner une note',
    },
    date: {
      label: 'Sélecteur de Date',
      description: 'Veuillez sélectionner une date',
    },
    time: {
      label: 'Sélecteur d\'Heure',
      description: 'Veuillez sélectionner une heure',
    },
    fulltime: {
      label: 'Sélecteur de Temps Complet',
      description: 'Veuillez sélectionner une valeur de temps complet',
    },
    datetime: {
      label: 'Sélecteur DateHeure',
      description: 'Veuillez sélectionner une date et une heure',
    },
    datefulltime: {
      label: 'Sélecteur DateTemps Complet',
      description: 'Veuillez sélectionner une date et une valeur de temps complet',
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
    oneOfEnum: {
      label: 'Sélecteur d\'Enumération avec Étiquette',
      description: 'Veuillez sélectionner une valeur dans la liste avec des étiquettes personnalisées',
    },
    radios: {
      label: 'Sélecteur Radio',
      description: 'Veuillez sélectionner une valeur dans la liste',
    },
    oneOfRadios: {
      label: 'Sélecteur Radio avec Étiquette',
      description: 'Veuillez sélectionner une valeur dans la liste avec des étiquettes personnalisées',
    },
    multiEnum: {
      label: 'Sélecteur d\'Enumérations Multiples',
      description: 'Veuillez sélectionner une ou deux valeurs dans la liste',
    },
    oneOfMultiEnum: {
      label: 'Sélecteur d\'Enumérations Multiples avec Étiquette',
      description: 'Veuillez sélectionner une ou deux valeurs dans la liste avec des étiquettes personnalisées',
    },
    checkboxes: {
      label: 'Sélecteur de Cases à Cocher',
      description: 'Veuillez sélectionner une ou plusieurs valeurs dans la liste',
    },
    toggles: {
      label: 'Sélecteur de Bascule',
      description: 'Veuillez sélectionner une ou plusieurs valeurs dans la liste',
    },
  }
};
