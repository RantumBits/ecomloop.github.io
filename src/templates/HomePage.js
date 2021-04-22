import React from 'react'
import { graphql } from 'gatsby'
import _ from 'lodash'
import PageHeader from '../components/PageHeader'
import PostSection from '../components/PostSection'
import Content from '../components/Content'
import Layout from '../components/Layout'
import Accordion from '../components/Accordion'

export const convertServicesToPostFormat = (services) => {
    let formattedServices = [];
    services.map( (service) => {
        let singleItem = {
            title: service.title,
            excerpt: _.truncate(service.description, {
                length: 140,
                omission: `…`,
            }),
            featuredImage: service.images[0].originalSrc,
            slug: "/solution/"+service.handle,
        }
        formattedServices.push(singleItem)
    });
    return formattedServices
}

// Export Template for use in CMS preview
export const HomePageTemplate = ({ title, subtitle, featuredImage, body, accordion, posts, services, projects }) => (
    <main className="Home">
        <PageHeader
            large
            title={title}
            subtitle={subtitle}
            backgroundImage={featuredImage}
        />

        <section className="section">
            <div className="container">
                <Content source={body} />
            </div>
        </section>


        {!!posts.length && (
            <section className="section">
                <div className="container">
                    <PostSection title="📝 latest blog posts" posts={posts} />

                </div>

            </section>
        )}

    {/*
        {!!services.length && convertServicesToPostFormat(services) && (
            <section className="section">
                <div className="container">
                    <PostSection title= "📈 digital commerce solutions for growth" posts={convertServicesToPostFormat(services)}/>
                </div>
            </section>
        )}
*/}



        {!!projects.length && (
            <section className="section">
                <div className="container">
                    <PostSection title="🗂️ recent projects" posts={projects} />
                </div>
            </section>
        )}
        <section className="section">
            <div className="container">
                <PostSection title="✨ client feedback"/>
                <Accordion title="Clients feedback" items={accordion} />
            </div>
        </section>





    </main>

)

// Export Default HomePage for front-end
const HomePage = ({ data: { page, posts, services, projects } }) => (
    <Layout meta={page.frontmatter.meta || false}>
        <HomePageTemplate
            {...page}
            {...page.frontmatter}
            body={page.html}
            posts={posts.edges.map(post => ({
                ...post.node,
                ...post.node.frontmatter,
                ...post.node.fields
            }))}
            services={services.edges.map(service => ({
                ...service.node
            }))}
            projects={projects.edges.map(project => ({
                ...project.node,
                ...project.node.frontmatter,
                ...project.node.fields
            }))}
        />
    </Layout>
)

export default HomePage

export const pageQuery = graphql`
  ## Query for HomePage data
  ## Use GraphiQL interface (http://localhost:8000/___graphql)
  ## $id is processed via gatsby-node.js
  ## query name must be unique to this file
  query HomePage($id: String!) {
    page: markdownRemark(id: { eq: $id }) {
      ...Meta
      html
      frontmatter {
        title
        subtitle
        featuredImage
        accordion {
          title
          content
        }
      }
    }

    posts: allMarkdownRemark(
      limit: 3
      filter: { fields: { contentType: { eq: "posts" } } }
      sort: { order: DESC, fields: [frontmatter___date] }
    ) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            title
            date(formatString: "dddd MMMM DD, YYYY")
            categories {
              category
            }
            featuredImage
            localImage {
                childImageSharp {
                    fluid (srcSetBreakpoints: [200, 400]) {
                        ...GatsbyImageSharpFluid
                    }
                }
            }
          }
        }
      }
    }

    services: allShopifyProduct(sort: {fields: publishedAt, order: DESC}, limit: 3) {
      edges {
        node {
            id
            title
            description
            images {
                originalSrc
            }
            handle
        }
      }
    }

    projects: allMarkdownRemark(
      limit: 3
      filter: { fields: { contentType: { eq: "projects" } } }
      sort: { order: DESC, fields: [frontmatter___date] }
    ) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            title
            client
            date(formatString: "MMMM YYYY")
            excerpt: client
            categories {
              category
            }
            featuredImage
          }
        }
      }
    }

  }
`
