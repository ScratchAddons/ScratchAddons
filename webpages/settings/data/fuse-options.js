export default {
  includeScore: true,
  location: 0,
  threshold: 0.35,
  distance: 200,
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
      name: "credits.name",
      weight: 0.2,
    },
    {
      name: "info.text",
      weight: 0.1,
    },
  ],
};
