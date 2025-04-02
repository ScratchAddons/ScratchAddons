export default {
  includeScore: true,
  threshold: 0.35,
  ignoreLocation: true,
  useExtendedSearch: true,
  keys: [
    {
      name: "name",
      weight: 1,
    },
    {
      name: "_addonId",
      weight: 1,
    },
    {
      name: "description",
      weight: 0.5,
    },
    {
      name: "_english.name",
      weight: 0.8,
    },
    {
      name: "_english.description",
      weight: 0.3,
    },
    {
      name: "settings.name",
      weight: 0.4,
    },
    {
      name: "credits.name",
      weight: 0.2,
    },
    {
      name: "info.text",
      weight: 0.1,
    },
    {
      name: "settings.potentialValues.name",
      weight: 0.1,
    },
    {
      name: "presets.name",
      weight: 0.1,
    },
  ],
};
