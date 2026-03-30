const publishingConfig = {
  siteTitle: "Immersive SoCal Guide",
  siteDescription:
    "A public guide to standout restaurants, activities, nature spots, hikes, unique playgrounds, and special events across Southern California.",
  siteBaseUrl: "pharophy.github.io/oc-recommendations",
  sections: [
    {
      id: "restaurants",
      title: "Restaurants",
      source: "Restaurants",
      output: "restaurants",
      type: "restaurants",
      description:
        "Immersive restaurants, bars, dinner shows, and themed dining-adjacent experiences across Orange County, Los Angeles, Temecula, and San Diego.",
    },
    {
      id: "activities",
      title: "Activities",
      source: "Activities",
      output: "activities",
      type: "generic",
      description:
        "Unique activities, immersive attractions, unusual date ideas, and standout things to do across Orange County and nearby Southern California.",
    },
    {
      id: "nature",
      title: "Nature",
      source: "Nature",
      output: "nature",
      type: "generic",
      description:
        "Scenic nature spots, hikes, overlooks, gardens, beaches, and other outdoor standouts across Orange County and nearby Southern California.",
    },
    {
      id: "playgrounds",
      title: "Playgrounds",
      source: "Playgrounds",
      output: "playgrounds",
      type: "generic",
      description:
        "Unique playgrounds, destination parks, imaginative play spaces, and standout family outdoor play spots across Orange County and nearby Southern California.",
    },
    {
      id: "events",
      title: "Events",
      source: "Events",
      output: "events",
      type: "generic",
      description:
        "Special events, festivals, seasonal happenings, markets, and limited-time experiences across Orange County and nearby Southern California.",
    },
  ],
}

export default publishingConfig
