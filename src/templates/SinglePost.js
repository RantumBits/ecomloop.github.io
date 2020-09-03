import React, { Fragment } from 'react'
import _get from 'lodash/get'
import { Link, graphql } from 'gatsby'
import { ChevronLeft } from 'react-feather'
import PostSection from '../components/PostSection'
import PageHeader from '../components/PageHeader'
import Content from '../components/Content'
import Layout from '../components/Layout'
import {getRelatedPosts} from '../components/RelatedPosts'
import './SinglePost.css'

export const SinglePostTemplate = ({
    title,
    featuredImage,
    localImage,
    date,
    body,
    nextPostURL,
    prevPostURL,
    categories = []
}) => {
    let pageFeaturedImage = featuredImage.startsWith('http')?featuredImage:('../'+featuredImage);
    if(localImage && localImage.childImageSharp) pageFeaturedImage = localImage.childImageSharp.fluid.src;
    return (
        <main>
            <PageHeader
                backgroundImage={pageFeaturedImage}
            />
            <article
                className="SinglePost section light"
                itemScope
                itemType="http://schema.org/BlogPosting"
            >
                <div className="container skinny">
                    <Link className="SinglePost--BackButton" to="/blog/">
                        <ChevronLeft /> BACK
                    </Link>
                    <div className="SinglePost--Content relative">
                        <div className="SinglePost--Meta">
                            {date}
                            {categories && (
                                <Fragment>
                                    <span> |</span>
                                    {categories.map((cat, index) => (
                                        <span
                                            key={cat.category}
                                            className="SinglePost--Meta--Category"
                                        >
                                            {cat.category}
                                            {/* Add a comma on all but last category */}
                                            {index !== categories.length - 1 ? ',' : ''}
                                        </span>
                                    ))}
                                </Fragment>
                            )}
                        </div>

                        {title && (
                            <h1 className="SinglePost--Title" itemProp="title">
                                {title}
                            </h1>
                        )}

                        <div className="SinglePost--InnerContent">
                            <Content source={body} />
                        </div>

                        <div className="SinglePost--Pagination">
                            {prevPostURL && (
                                <Link
                                    className="SinglePost--Pagination--Link prev"
                                    to={prevPostURL}
                                >
                                    Previous Post
                                </Link>
                            )}
                            {nextPostURL && (
                                <Link
                                    className="SinglePost--Pagination--Link next"
                                    to={nextPostURL}
                                >
                                    Next Post
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </article>
        </main>
    )
}

// Export Default SinglePost for front-end
const SinglePost = ({ data: { post, allPosts } }) => {
    const thisEdge = allPosts.edges.find(edge => edge.node.id === post.id)    
    console.log("**********")
    console.log(post)
    const relatedPosts = getRelatedPosts(thisEdge, allPosts.edges);
    console.log(relatedPosts)
    const relatedPostsFlat = relatedPosts.map(edge => ({
        ...edge.post.node,
        ...edge.post.node.frontmatter,
        ...edge.post.node.fields
    }))
    //fixing the image path issue
    relatedPostsFlat.forEach(item => item.featuredImage = "../"+item.featuredImage)
    
    return (
        <Layout
            meta={post.frontmatter.meta || false}
            description={post.excerpt || false}
            title={post.frontmatter.title || false}
        >
            <SinglePostTemplate
                {...post}
                {...post.frontmatter}
                body={post.html}
                nextPostURL={_get(thisEdge, 'next.fields.slug')}
                prevPostURL={_get(thisEdge, 'previous.fields.slug')}
            />
            
            {!!relatedPostsFlat.length && (
                <article className="SinglePost section light" style={{padding: "1px"}}>
                    <div className="container skinny">
                        <h3>Related Posts</h3>
                        <div className="SinglePost--Content relative" style={{padding: "0"}}>
                            <PostSection posts={relatedPostsFlat} />
                        </div>
                    </div>
                </article>
            )}
        </Layout>
    )
}

export default SinglePost

export const pageQuery = graphql`
  ## Query for SinglePost data
  ## Use GraphiQL interface (http://localhost:8000/___graphql)
  ## $id is processed via gatsby-node.js
  ## query name must be unique to this file
  query SinglePost($id: String!) {
    post: markdownRemark(id: { eq: $id }) {
      ...Meta
      html
      excerpt
      id
      frontmatter {
        title
        template
        subtitle
        featuredImage
        localImage {
            childImageSharp {
                fluid (srcSetBreakpoints: [200, 400]) {
                    ...GatsbyImageSharpFluid
                }
            }
        }
        date(formatString: "dddd MMMM DD, YYYY")
        categories {
          category
        }
      }
    }

    allPosts: allMarkdownRemark(
      filter: { fields: { contentType: { eq: "posts" } } }
      sort: { order: DESC, fields: [frontmatter___date] }
    ) {
      edges {
        node {
          id          
          excerpt
          fields {
            slug
          }
          frontmatter {
            title
            featuredImage
            localImage {
                childImageSharp {
                    fluid (srcSetBreakpoints: [200, 400]) {
                        ...GatsbyImageSharpFluid
                    }
                }
            }
            date(formatString: "dddd MMMM DD, YYYY")
            categories {
              category
            }
            tags
          }
        }
        next {
          fields {
            slug
          }
          frontmatter {
            title
          }
        }
        previous {
          fields {
            slug
          }
          frontmatter {
            title
          }
        }
      }
    }
  }
`
