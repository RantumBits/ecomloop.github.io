const postcssPresetEnv = require('postcss-preset-env')
const path = require('path')

require('dotenv').config({
  path: `.env.${process.env.NODE_ENV}`
})

module.exports = {
  flags: { QUERY_ON_DEMAND: true,  FAST_DEV: true },
  siteMetadata: {
    title: 'ecomloop',
    description: 'ecommerce agency helping uncommon businesses grow via digital commerce. development + marketing + data analytics + conversion rate optimization partners for growth. Get started today with ecommerce agency services from ecomloop, based in Burlingame, California.',
    siteUrl: 'https://ecomloop.com'
  },
  plugins: [
    'gatsby-plugin-react-helmet',
    {
    resolve: '@fs/gatsby-plugin-drive',
    options: {
      folderId: '1xSLqG_faTddDwktmKdgD8-lxRcvgiIWT',
      keyFile: `${__dirname}/client_secret_02.json`,
      destination: `${__dirname}/content/posts`,
      exportGDocs: false,
      exportMimeType: ''
      }
    },
    {
      resolve: 'gatsby-plugin-klaviyo',
      options: {
        klaviyoKey: 'V5u3f5',
        enableDuringDevelop: true, // Optional. Disables Klaviyo when running Gatsby dev server. Defaults to true.
      },
    },
    'gatsby-plugin-react-helmet',
    {
    resolve: '@fs/gatsby-plugin-drive',
    options: {
      folderId: '1ZUcbDFOxg7UEjyy0f-xmqf7ZGgUkM4rE',
      keyFile: `${__dirname}/client_secret_02.json`,
      destination: `${__dirname}/static/images`,
      exportGDocs: false,
      exportMimeType: ''
      }
    },
    {
    resolve: 'gatsby-plugin-tidio-chat',
    options: {
      tidioKey: 'p5v7251q0mhsqtqw1sd8v3wcftqbawjv',
      enableDuringDevelop: true, // Optional. Disables Tidio chat widget when running Gatsby dev server. Defaults to true.
    },
  },
    'gatsby-transformer-yaml',
    {
      resolve: `gatsby-source-shopify`,
      options: {
        // The domain name of your Shopify shop. This is required.
        // Example: 'gatsby-source-shopify-test-shop' if your Shopify address is
        // 'gatsby-source-shopify-test-shop.myshopify.com'.
        shopName: process.env.SHOP_NAME,

        // An API access token to your Shopify shop. This is required.
        // You can generate an access token in the "Manage private apps" section
        // of your shop's Apps settings. In the Storefront API section, be sure
        // to select "Allow this app to access your storefront data using the
        // Storefront API".
        // See: https://help.shopify.com/api/custom-storefronts/storefront-api/getting-started#authentication
        accessToken: process.env.SHOPIFY_ACCESS_TOKEN,

        // Set verbose to true to display a verbose output on `npm run develop`
        // or `npm run build`. This prints which nodes are being fetched and how
        // much time was required to fetch and process the data.
        // Defaults to true.
        verbose: true,
        enableWebp: false,
      },
    },/*
    {
    resolve: 'gatsby-source-google-sheets',
    options: {
        spreadsheetId: '1D-lpUeNB_6DVz8_2IO33lnc74qw6iwdogt6_xYr9gXg',
        worksheetTitle: 'list',
        credentials: require(`${__dirname}/client_secret.json`,),

      }

    },*/
    {
      resolve: `gatsby-plugin-feed`,
      options: {
        query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({ query: { site, allMarkdownRemark } }) => {
              return allMarkdownRemark.edges.map(edge => {
                return Object.assign({}, edge.node.frontmatter, {
                  description: edge.node.excerpt,
                  date: edge.node.frontmatter.date,
                  url: site.siteMetadata.siteUrl + edge.node.fields.slug,
                  guid: site.siteMetadata.siteUrl + edge.node.fields.slug,
                })
              })
            },
            query: `
              {
                allMarkdownRemark(
                  filter: { fields: { contentType: { eq: "posts" } } }
                  sort: { order: DESC, fields: [frontmatter___date] },
                ) {
                  edges {
                    node {
                      excerpt
                      html
                      fields { slug }
                      frontmatter {
                        title
                        date(formatString: "dddd MMMM DD, YYYY")
                      }
                    }
                  }
                }
              }
            `,
            output: "/rss.xml",
            title: "Ecomloop Site's RSS Feed",
          },
        ],
      },
    },
    {
      resolve: 'gatsby-plugin-offline',
      options: {
        runtimeCaching: [
          {
            // Use cacheFirst since these don't need to be revalidated (same RegExp
            // and same reason as above)
            urlPattern: /(\.js$|\.css$|static\/)/,
            handler: `cacheFirst`
          },
          {
            // Add runtime caching of various other page resources
            urlPattern: /^https?:.*\.(png|jpg|jpeg|webp|svg|gif|tiff|js|woff|woff2|json|css)$/,
            handler: `staleWhileRevalidate`
          },
          {
            // uploadcare
            urlPattern: /^https:\/\/ucarecdn.com\/[-a-zA-Z0-9@:%_\+.~#?&//=]*?\/10x\//,
            handler: `staleWhileRevalidate`
          }
        ],
        skipWaiting: true,
        clientsClaim: true
      }
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: 'ecomloop',
        short_name: 'ecomloop',
        start_url: '/',
        background_color: '#00C2BD',
        theme_color: '#00C2BD',
        // Enables "Add to Homescreen" prompt and disables browser UI (including back button)
        // see https://developers.google.com/web/fundamentals/web-app-manifest/#display
        display: 'standalone',
        icon: `${__dirname}/static/images/logo.svg` // This path is relative to the root of the site.
      }
    },

    // Add static assets before markdown files
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        path: `${__dirname}/static/images`,
        name: 'images'
      }
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        path: `${__dirname}/static/media`,
        name: 'media'
      }
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        path: `${__dirname}/content`,
        name: 'pages'
      }
    },



    // images
    'gatsby-plugin-sharp',
    'gatsby-transformer-sharp',
    'gatsby-plugin-netlify-cms-paths',
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        plugins: [
          // gatsby-remark-relative-images must
          // go before gatsby-remark-images
          'gatsby-remark-relative-images',
          {
            resolve: 'gatsby-remark-images',
            options: {
              maxWidth: 800,
              linkImagesToOriginal: false
            }
          },
          `gatsby-remark-responsive-iframe`
        ]
      }
    },

    // css (replace with gatsby-plugin-sass for v2)
    {
      resolve: `gatsby-plugin-sass`,
      options: {
        postCssPlugins: [
          postcssPresetEnv({
            browsers: '> 0.5%, last 2 versions, ie 11'
          })
        ]
      }
    },
    {
      resolve: `gatsby-plugin-postcss`,
      options: {
        postCssPlugins: [
          require(`postcss-preset-env`)({
            browsers: '> 0.5%, last 2 versions, ie 11'
          })
        ]
      }
    },
    {
      resolve: 'gatsby-plugin-nprogress',
      options: {
        // Setting a color is optional.
        color: 'white',
        // Disable the loading spinner.
        showSpinner: false
      }
    },
    'gatsby-plugin-sitemap',
    {
      resolve: 'gatsby-plugin-netlify-cms',
      options: {
        modulePath: `${__dirname}/src/cms/cms.js`,
        stylesPath: `${__dirname}/src/cms/admin.css`,
        enableIdentityWidget: true
      }
    },
    'gatsby-plugin-netlify' // make sure to keep it last in the array
  ]
}
