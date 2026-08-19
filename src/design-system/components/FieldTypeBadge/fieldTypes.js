/**
 * Mapping de Ploomes Field Types (Fields@Types).
 *
 * IDs e nomes seguem a referência interna do CRM Ploomes.
 * `category` agrupa para colorização semântica do badge.
 */
export const FIELD_TYPES = {
  1:  { name: 'Texto',          icon: 'pi pi-align-left',    category: 'text'    },
  2:  { name: 'Multilinha',     icon: 'pi pi-align-justify', category: 'text'    },
  3:  { name: 'Data',           icon: 'pi pi-calendar',      category: 'date'    },
  4:  { name: 'Inteiro',        icon: 'pi pi-hashtag',       category: 'number'  },
  5:  { name: 'Moeda',          icon: 'pi pi-dollar',        category: 'number'  },
  6:  { name: 'Decimal',        icon: 'pi pi-percentage',    category: 'number'  },
  7:  { name: 'Lista',          icon: 'pi pi-list',          category: 'select'  },
  8:  { name: 'Multilista',     icon: 'pi pi-th-large',      category: 'select'  },
  9:  { name: 'Email',          icon: 'pi pi-envelope',      category: 'contact' },
  10: { name: 'Telefone',       icon: 'pi pi-phone',         category: 'contact' },
  11: { name: 'URL',            icon: 'pi pi-link',          category: 'contact' },
  12: { name: 'Booleano',       icon: 'pi pi-check-square',  category: 'boolean' },
  13: { name: 'Contato',        icon: 'pi pi-user',          category: 'relation'},
  14: { name: 'Negócio',        icon: 'pi pi-briefcase',     category: 'relation'},
  15: { name: 'Produto',        icon: 'pi pi-shopping-bag',  category: 'relation'},
  16: { name: 'Usuário',        icon: 'pi pi-user',          category: 'relation'},
  17: { name: 'Equipe',         icon: 'pi pi-users',         category: 'relation'},
  18: { name: 'Arquivo',        icon: 'pi pi-file',          category: 'file'    },
  19: { name: 'Imagem',         icon: 'pi pi-image',         category: 'file'    },
  20: { name: 'Documento',      icon: 'pi pi-id-card',       category: 'contact' },
  21: { name: 'Fórmula',        icon: 'pi pi-bolt',          category: 'computed'},
  22: { name: 'Geolocalização', icon: 'pi pi-map-marker',    category: 'contact' },
  23: { name: 'Cor',            icon: 'pi pi-palette',       category: 'meta'    },
};

/** Mapeia categoria → variant do Badge para colorização. */
export const CATEGORY_VARIANT = {
  text:     'neutral',
  date:     'info',
  number:   'primary',
  select:   'primary',
  contact:  'info',
  boolean:  'success',
  relation: 'warning',
  file:     'neutral',
  computed: 'warning',
  meta:     'neutral',
};

export function getFieldType(id) {
  return FIELD_TYPES[id] ?? { name: `Tipo ${id}`, icon: 'pi pi-question-circle', category: 'meta' };
}
