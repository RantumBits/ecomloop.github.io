import React, { Fragment } from 'react'
import _ from 'lodash'
import { Link, graphql } from 'gatsby'
import { ChevronLeft } from 'react-feather'
import PostSection from '../components/PostSection'
import PageHeader from '../components/PageHeader'
import Content from '../components/Content'
import Image from '../components/Image'
import Layout from '../components/Layout'
import { getRelatedNews } from '../components/RelatedNews'
import { getRelatedPosts } from '../components/RelatedPosts'
import moment from 'moment'
import './SinglePost.css'

export const NewsPostTemplate = ({
    author,
    comment,
    dateadded,
    excerpt,
    extractedkeywords,
    headerimage,
    highlight,
    highlight2,
    images,
    image,
    id,
    keywords,
    publishdate,
    relativepopularity,
    source,
    source2,
    tags,
    title,
    url,
    body,
    nextPostURL,
    articleid,
    prevPostURL,
    relatedNews,
    relatedPosts,
    categories = (extractedkeywords + "," + tags + "," + keywords).split(",")
}) => {
    //filter out null, and all tags beginning with *
    categories = _.filter(categories, tag => tag != "null" && !tag.startsWith("*"))
    console.log("********** relatedNews (in display) ", relatedNews)
    return (
        <main>
            <PageHeader title={title} backgroundImage={'https://source.unsplash.com/1600x900/?abstract.' + articleid} />
            <article
                className="SinglePost section light"
                itemScope
                itemType="http://schema.org/BlogPosting"
            >
                <div className="container skinny">
                    <Link className="SinglePost--BackButton" to="/news/">
                        <ChevronLeft /> BACK
                    </Link>
                    <div className="SinglePost--Content relative">
                        <div className="SinglePost--Meta">
                            Posted: {dateadded} <br />

                        </div>

                        {title && (
                            <h1 className="SinglePost--Title" itemProp="title">
                                {title}
                            </h1>
                        )}

                        {image && (
                            <div className="SinglePost--InnerContent">
                                <img src={image} title={title} width="100%" />
                            </div>
                        )}

                        <div className="SinglePost--InnerContent">
                            <Content source={comment} />
                        </div>

                        <div className="SinglePost--InnerContent">
                            {author && source &&
                                <div>From {author} at {source}</div>
                            }
                            {publishdate &&
                                <div>Originally published {publishdate}</div>
                            }
                        </div>

                        <div className="SinglePost--InnerContent">
                            <blockquote>{highlight}</blockquote>
                        </div>

                        <div className="SinglePost--InnerContent">
                            <blockquote>{highlight2}</blockquote>
                        </div>

                        <div className="SinglePost--Pagination">
                            <a href={url} target="_blank" className="Nav--CTA animated jello fadeInDown delay-2s">Read the original post &gt;</a>
                        </div>
                        <br />
                        {categories && categories.length > 0 && (
                            <Fragment>
                                <i>Tags:
                                {categories.map((cat, index) => (
                                    <span
                                        key={cat}
                                        className="SinglePost--Meta--Category"
                                    >
                                        <a href={`/news/?tag=${cat.trim()}`}>
                                            {cat.trim()}
                                        </a>
                                        {/* Add a comma on all but last category */}
                                        {index !== categories.length - 1 ? ',' : ''}
                                    </span>
                                ))}</i>
                            </Fragment>
                        )}
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
                <div className="container skinny">
                    {relatedNews && relatedNews.length > 0 &&
                        <h3 style={{ marginTop: "2rem" }}>Related News</h3>
                    }
                    <div className="PostSection">
                        <div className="PostSection--Grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                            {relatedNews && relatedNews.map(({ news }, index) => (
                                <Link key={index} to={`/news/${news.node.articleid}`} className="PostCard">
                                    <div className="PostCard--Image relative">
                                        <Image background src={'https://source.unsplash.com/1600x900/?abstract.' + news.node.articleid} alt={news.node.title} />
                                    </div>
                                    <div className="PostCard--Content">
                                        {news.node.title && <h3 className="PostCard--Title">{news.node.title}</h3>}
                                        {news.node.dateadded && <div className="PostCard--Category">{moment(new Date(news.node.dateadded)).format("dddd MMMM DD, YYYY")}</div>}
                                        {news.node.comment && <div className="PostCard--Excerpt">{news.node.comment}</div>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
                {!!relatedPosts.length && (
                    <article className="SinglePost section light" style={{ padding: "1px" }}>
                        <div className="container skinny">
                            <h3>Related Posts</h3>
                            <div className="SinglePost--Content relative" style={{ padding: "0" }}>
                                <PostSection posts={relatedPosts} />
                            </div>
                        </div>
                    </article>
                )}
            </article>
        </main>
    )
}

// Export Default NewsPost for front-end
const NewsPost = ({ data: { news, allNews, allPosts } }) => {
    let relatedNews = getRelatedNews(news, allNews.edges);
    relatedNews = relatedNews.slice(0, 2);
    const thisEdge = allNews.edges.find(edge => edge.node.id === news.id)    
    const allTags = (thisEdge.node.extractedkeywords||"") + "," + (thisEdge.node.keywords||"") + "," + (thisEdge.node.tag||"");
    const thisEdgeFormatted = {
        node : {
            ...thisEdge.node,
            frontmatter: {
                categories : "",
                tags : _.filter(allTags.split(","), tag => tag != "null" && !tag.startsWith("*"))
            },
        },
    }
    
    const relatedPosts = getRelatedPosts(thisEdgeFormatted, allPosts.edges);
    const relatedPostsFlat = relatedPosts.map(edge => ({
        ...edge.post.node,
        ...edge.post.node.frontmatter,
        ...edge.post.node.fields
    }))
    //fixing the image path issue
    relatedPostsFlat.forEach(item => item.featuredImage = "../" + item.featuredImage)

    return (
        <Layout
            description={news.highlight || false}
            title={news.title || false}
        >
            <NewsPostTemplate
                {...news}
                body={news.text}
                nextPostURL={_.get(news, 'next.id')}
                prevPostURL={_.get(news, 'previous.id')}
                relatedNews={relatedNews}
                relatedPosts={relatedPostsFlat}
            />
        </Layout>
    )
}

export default NewsPost

export const pageQuery = graphql`
  ## Query for NewsPost data
  ## Use GraphiQL interface (http://localhost:8000/___graphql)
  ## $id is processed via gatsby-node.js
  ## query name must be unique to this file
  query NewsPost($id: String!) {
    news: googleSheetListRow(id: { eq: $id }) {
      articleid
      author
      comment
      dateadded 
      excerpt
      extractedkeywords
      headerimage
      highlight
      highlight2
      image
      images
      id
      keywords
      publishdate
      relativepopularity
      source
      source2
      tags
      text
      title
      url
    }
    
    allNews : allGoogleSheetListRow (sort: {fields: dateadded, order: DESC}) {
      edges {
        node {
          articleid
          author
          comment
          dateadded
          excerpt
          extractedkeywords
          headerimage
          highlight
          highlight2
          images
          image
          id
          keywords
          publishdate
          relativepopularity
          source
          source2
          tags
          text
          title
          url
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
        }
      }
  }
`
