import React from 'react'
import { graphql, Link } from 'gatsby'
import Image from 'gatsby-image'
import { ChevronLeft } from 'react-feather'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import PageHeader from '../components/PageHeader'
import Layout from '../components/Layout'
import ProductForm from '../components/ProductForm'
import PostCard from '../components/PostCard'
import ProductGalleryThumbnails from '../components/ProductGalleryThumbnails'

import './ProductPage.css'

const ProductPage = ({ data }) => {
    const product = data.shopifyProduct
    console.log(product)

    //find posts corresponding to current product
    const productBlogTagMap = {
      "ecommerce-platform-strategy-plan" : "digital commerce",
      "conversion-rate-optimization" : "conversion rate optimization",
      "shopify-help" : "Shopify",
      "gatsbyjs" : "gatsby",
      "paid-search-help" : "search"
    };
    const searchTag = productBlogTagMap[product.handle];
    console.log("******* searchTag = "+searchTag)
    console.log("******* product.handle = "+product.handle)
    const filterdPostEdges = [];
    const filterdProjectEdges = [];
    if(searchTag){
      //Filtering Posts as per the tag
      const postEdges = data.allPosts.edges;      
      postEdges.map((edge)=>{
        if(edge.node.frontmatter.tags) {
          edge.node.frontmatter.tags.map((tag)=>{
            if(tag && tag.toLowerCase().includes(searchTag.toLowerCase()))
              {
                filterdPostEdges.push(edge.node)
                return;
              }
          });        
        }
      });
      //console.log(filterdPostEdges)
      //Filtering Projects as per the tag
      const projectEdges = data.allProjects.edges;      
      projectEdges.map((edge)=>{
        if(edge.node.frontmatter.tags) {
          edge.node.frontmatter.tags.map((tag)=>{
            if(tag && tag.toLowerCase().includes(searchTag.toLowerCase()))
              {
                filterdProjectEdges.push(edge.node)
                return;
              }
          });        
        }
      });
      console.log(filterdProjectEdges)
    }

    const thisEdge = data.allServices.edges.find(edge => edge.node.id === product.id);
  
    const solutionEdge = data.allSolutions.edges.find(edge => edge.node.fileAbsolutePath.indexOf(product.handle)>=0)
    let solutionMetaTitle = "";
    let solutionMetaDescription = "";
    let solutionContent = null;
    if(solutionEdge){
      solutionMetaTitle = solutionEdge.node.frontmatter.meta_title;
      solutionMetaDescription = solutionEdge.node.frontmatter.meta_description;
      solutionContent = solutionEdge.node.html;
    }
    //console.log("**** solutionEdge = ",solutionEdge)

    return (
        <Layout title={product.title || false} description={solutionMetaDescription || product.description || false}>
            <article
                className="SingleService section light"
                itemScope
                itemType="http://schema.org/BlogPosting"
            >
                <div className="container skinny">
                    <Link className="SingleService--BackButton" to="/solutions/">
                        <ChevronLeft /> BACK
                    </Link>
                    <div className="SingleService--Content relative">

                        <ProductGalleryThumbnails productimages={product.images} />

                        {product.title && (
                            <h1 className="SingleService--Title" itemProp="title">
                                {product.title}
                            </h1>
                        )}

                        <div className="SingleService--InnerContent">
                            <ProductForm product={product} />
                            <Tabs>
                              <TabList>
                                <Tab>Description</Tab>
                                {solutionContent &&
                                  <Tab>Guide</Tab>
                                }
                                <Tab>Blog Posts</Tab>
                                <Tab>Projects</Tab>
                              </TabList>
                              <TabPanel>
                                <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
                              </TabPanel>
                              {solutionContent &&
                                <TabPanel>
                                  <div dangerouslySetInnerHTML={{__html:solutionContent}} />                                  
                                </TabPanel>
                              }
                              <TabPanel>
                                {!!filterdPostEdges.length && (
                                  <div className="ProductPostSection--Grid" style={{gridGap: "1rem"}}>
                                    {filterdPostEdges.map((post, index) => (
                                      <PostCard key={index}
                                        featuredImage={`../${post.frontmatter.featuredImage}`}
                                        localImage={post.frontmatter.localImage}
                                        title={post.frontmatter.title}
                                        excerpt={post.excerpt}
                                        date={post.frontmatter.date}
                                        slug={post.fields.slug}
                                      />
                                    ))}
                                  </div>
                                )}
                              </TabPanel>
                              <TabPanel>
                                {!!filterdProjectEdges.length && (
                                  <div className="ProductPostSection--Grid" style={{gridGap: "1rem"}}>
                                    {filterdProjectEdges.map((post, index) => (
                                      <PostCard key={index}
                                        featuredImage={`../${post.frontmatter.featuredImage}`}
                                        localImage={post.frontmatter.localImage}
                                        title={post.frontmatter.title}
                                        excerpt={post.frontmatter.excerpt}
                                        date={post.frontmatter.date}
                                        slug={post.fields.slug}
                                      />
                                    ))}
                                  </div>
                                )}
                              </TabPanel>
                            </Tabs>
                        </div>

                        <div className="SingleService--Pagination">
                            {thisEdge && thisEdge.previous && thisEdge.previous.handle && (
                                <Link
                                    className="SingleService--Pagination--Link prev"
                                    to={`/solution/${thisEdge.previous.handle}`}
                                >
                                    Previous Service
                                </Link>
                            )}
                            {thisEdge && thisEdge.next && thisEdge.next.handle && (
                                <Link
                                    className="SingleService--Pagination--Link next"
                                    to={`/solution/${thisEdge.next.handle}`}
                                >
                                    Next Service
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </article>
        </Layout >
    )
}

export default ProductPage

export const pageQuery = graphql`
  query($handle: String!) {
    shopifyProduct(handle: { eq: $handle }) {
      id
      title
      handle
      productType
      description
      descriptionHtml
      shopifyId
      options {
        id
        name
        values
      }
      variants {
        id
        title
        price
        availableForSale
        compareAtPrice
        shopifyId
        selectedOptions {
          name
          value
        }
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      images {
        originalSrc
        id
        localFile {
          childImageSharp {
            fluid(maxWidth: 910) {
              ...GatsbyImageSharpFluid_withWebp_tracedSVG
            }
          }
        }
      }
    }

    allPosts: allMarkdownRemark(
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
            tags
          }
        }
      }
    }
    
    allSolutions: allMarkdownRemark(filter: {fields: {contentType: {eq: "solutions"}}}) {
      edges {
        node {
          fileAbsolutePath
          html
          frontmatter {
            meta_title
            meta_description
          }
        }
      }
    }
    
    allProjects: allMarkdownRemark(filter: {fields: {contentType: {eq: "projects"}}}, sort: {order: DESC, fields: [frontmatter___date]}) {
    edges {
      node {
        fields {
          slug
        }
        frontmatter {
          title
          excerpt: client
          date(formatString: "MMMM YYYY")
          categories {
            category
          }
          featuredImage
          tags
        }
      }
    }
  }

    allServices: allShopifyProduct(sort: {fields: publishedAt, order: DESC}) {
      edges {
        node {
          id
        }
        next {
          title
          handle
        }
        previous {
          title
          handle
        }
      }
    }

  }
`
