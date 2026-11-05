# Glossaire (draft)

Agreed terms for the French catalog. Extend this file when a term is decided, and keep the catalog
consistent with it. Status: **draft, pending native review.**

| English                    | French                                   | Notes                                              |
| -------------------------- | ---------------------------------------- | -------------------------------------------------- |
| accessible name            | nom accessible                           |                                                    |
| assistive technology       | technologie d’assistance                 | not "aide technique"                               |
| screen reader              | lecteur d’écran                          |                                                    |
| landmark (role)            | repère                                   | `region`, `navigation`… are role names, not words  |
| live region                | région dynamique                         | `aria-live` is kept verbatim                       |
| implicit role              | rôle implicite                           |                                                    |
| redundant                  | redondant                                |                                                    |
| presentational             | de présentation                          | `role="presentation"` / `none` verbatim            |
| accessibility tree         | arbre d’accessibilité                    |                                                    |
| focusable                  | focalisable                              |                                                    |
| keyboard-reachable         | accessible au clavier                    |                                                    |
| phrasing content           | contenu phrasé                           | HTML content category                              |
| content model              | modèle de contenu                        |                                                    |
| child / parent             | enfant / parent                          | element relationship                               |
| placeholder                | texte indicatif (placeholder)            | attribute name `placeholder` verbatim              |
| label                      | étiquette / `<label>`                    | element name verbatim                              |
| read-only                  | lecture seule (`readOnly`)               | attribute verbatim                                 |
| variant / dimension        | variante / dimension                     | Praxis Kit concepts                                |
| preset (`recipeKey`)       | préréglage                               | `recipeKey` verbatim                               |
| render function            | fonction de rendu                        |                                                    |

## Rules of thumb

- **Copy verbatim:** element names, attribute names and values, role names, ARIA properties, code in
  `fix`. They are identifiers, not words.
- UTF-8 everywhere: accented letters and typographic punctuation (`’`, `«`, `»`) are written as
  themselves. Only invisible characters are written as `\uXXXX` escapes in the JSON, so a diff shows
  them: the non-breaking space inside `« … »` is `\u00a0`. Use `« … »` for names of rules and types;
  code-like values keep straight quotes (`role="button"`).
- Prefer the polite impersonal ("Ajoutez…", "Envisagez…") over "vous devez".
- Plural: French `one` covers 0 and 1; `other` covers the rest.
