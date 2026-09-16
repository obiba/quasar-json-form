import type { DocExampleDef } from '../types'

const regions: Record<string, string[]> = {
  Canada: ['Ontario', 'Quebec', 'British Columbia'],
  France: ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes'],
  Switzerland: ['Zurich', 'Geneva', 'Bern'],
}

const cities: Record<string, string[]> = {
  Ontario: ['Toronto', 'Ottawa', 'Hamilton'],
  Quebec: ['Montreal', 'Quebec City', 'Laval'],
  'British Columbia': ['Vancouver', 'Victoria', 'Richmond'],
  'Île-de-France': ['Paris', 'Boulogne-Billancourt', 'Saint-Denis'],
  'Provence-Alpes-Côte d\'Azur': ['Marseille', 'Nice', 'Toulon'],
  'Auvergne-Rhône-Alpes': ['Lyon', 'Grenoble', 'Saint-Étienne'],
  Zurich: ['Zurich', 'Winterthur', 'Uster'],
  Geneva: ['Geneva', 'Carouge', 'Lancy'],
  Bern: ['Bern', 'Thun', 'Biel/Bienne'],
}

export default {
  schema: {
    type: 'object',
    properties: {
      country: { type: 'string', title: 'Country', enum: Object.keys(regions) },
      region: { type: 'string', title: 'Region', description: 'The values depend on the country', enum: [] as string[] },
      city: { type: 'string', title: 'City', description: 'The values depend on the region', enum: [] as string[] },
    },
  },
  data: {},
  // the region and city enums start empty, which AJV refuses to compile
  validationMode: 'NoValidation',
  onUpdate: (data, schema) => {
    const props = schema.properties as Record<string, { enum: string[] }>
    props.region!.enum = regions[data.country as string] ?? []
    if (!props.region!.enum.includes(data.region as string)) delete data.region
    props.city!.enum = cities[data.region as string] ?? []
    if (!props.city!.enum.includes(data.city as string)) delete data.city
  },
  code: `// <QJsonForm v-model="data" :schema="schema" validation-mode="NoValidation" @update:model-value="onUpdate" />
const regions = { Canada: ['Ontario', 'Quebec', 'British Columbia'], France: [...], Switzerland: [...] }
const cities = { Ontario: ['Toronto', 'Ottawa', 'Hamilton'], Quebec: [...], ... }

function onUpdate (newData) {
  const { region, city } = schema.properties
  region.enum = regions[newData.country] ?? []
  if (!region.enum.includes(newData.region)) delete newData.region
  city.enum = cities[newData.region] ?? []
  if (!city.enum.includes(newData.city)) delete newData.city
  data.value = newData
}`,
} satisfies DocExampleDef
