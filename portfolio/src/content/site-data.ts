import type {SiteDefinition} from "@/template/site-contract";
export const siteDefinition: SiteDefinition = {
  "name": "Sergey Kruglov",
  "siteName": "Sergey Kruglov",
  "shortName": "Sergey Kruglov",
  "baseUrl": "https://skruglov.com",
  "language": "en",
  "defaultTitle": "Sergey Kruglov — Senior Product Designer",
  "defaultDescription": "Sergey Kruglov is a senior product designer helping founders turn complex technology into clear, practical digital products, from research and prototyping to launch and monetisation.",
  "titleSuffix": "Sergey Kruglov",
  "copyrightRangeLabel": "© 2026",
  "appearance": {
    "theme": "brightfutures",
    "tokens": {}
  },
  "features": {
    "splash": false,
    "contactForm": false,
    "searchIndexing": false
  },
  "header": {
    "navItems": [
      {
        "label": "Sergey Kruglov",
        "href": "/"
      },
      {
        "label": "Studio",
        "href": "/office/"
      },
      {
        "label": "Projects",
        "href": "/projects/"
      },
      {
        "label": "Contact",
        "href": "/contact/"
      }
    ]
  },
  "splash": {
    "phrases": [
      "Sergey Kruglov"
    ]
  },
  "brand": {
    "logo": {
      "src": "/images/logo.svg",
      "invertedSrc": "/images/logo-light.svg",
      "alt": "Sergey Kruglov",
      "width": 157,
      "height": 79
    }
  },
  "footer": {
    "logo": {
      "href": "/"
    },
    "aboutTitle": "Sergey Kruglov",
    "aboutBody": "I help founders turn early signals into clear, usable products - from product direction and UX to interface design, frontend, and AI-powered workflows.",
    "copyright": "© 2026 Sergey Kruglov"
  },
  "contact": {
    "companyName": "Sergey Kruglov",
    "email": "hello@skruglov.com",
    "telephone": "",
    "postalAddress": {
      "streetAddress": "",
      "postalCode": "",
      "addressLocality": "",
      "addressCountry": ""
    },
    "addressLines": [],
    "officeAddressLines": [
      "Sergey Kruglov"
    ],
    "contactLinks": [
      {
        "label": "Inquiries",
        "value": "hello@skruglov.com",
        "href": "mailto:hello@skruglov.com"
      }
    ],
    "socialLinks": [
      {
        "label": "LinkedIn",
        "href": "https://www.linkedin.com/in/kruglovse/",
        "value": "https://www.linkedin.com/in/kruglovse/"
      },
      {
        "label": "GitHub",
        "href": "https://github.com/anarchoenthusiast",
        "value": "https://github.com/anarchoenthusiast"
      }
    ]
  },
  "seo": {
    "locale": "en_US",
    "openGraphImage": {
      "url": "/project/covers/lalal-ai/cover-preview.png",
      "width": 1200,
      "height": 1200
    },
    "icons": {
      "icon": [
        {
          "url": "/images/logo.svg",
          "sizes": "any"
        }
      ],
      "apple": "/images/logo.svg"
    }
  }
};
